# dashboard-lifecycle-actions — implementation audit

## Phase 1 — Dashboard plumbing: providers + URL helper

**Files changed**

- `src/lib/publishedUrl.ts` (new)
- `src/components/dashboard/ProjectGridCard.tsx`
- `src/components/dashboard/ProjectCardMenu.tsx`
- `src/app/dashboard/layout.tsx`
- `docs/task/dashboard-lifecycle-actions.audit.md` (new — this file)

### What changed, per file

**`src/lib/publishedUrl.ts` (new)** — DD8. Plain module, no `'use client'`, no DOM/hooks;
imported from both a client component (`ProjectCardMenu`) and a component reachable from the
server tree. Exports `publishedHost(slug)` → `{slug}.lessgo.site` and
`publishedUrl(slug, path = '/')` → `https://{slug}.lessgo.site{path}` (path normalised to a
leading slash).

**`src/components/dashboard/ProjectGridCard.tsx`** — the card sub-line `domain` label (was
`lessgo.ai/p/${project.slug}`, the internal SSR path) now uses `publishedHost(project.slug)`.
Draft/no-slug still renders the em-dash. No other change.

**`src/components/dashboard/ProjectCardMenu.tsx`** — "Visit site" now opens
`publishedUrl(project.slug)` instead of `/p/${project.slug}`. PostHog `project_preview_clicked`
untouched: same single call site, same properties, still fires before the guard. Menu item
disabled states untouched (un-greying is phase 5/6). `@/components/ui/dropdown-menu` NOT edited.

**`src/app/dashboard/layout.tsx`** — DD6. The layout existed (S1 shell), so no thin client
wrapper was needed. `<ToastProvider>` wraps the `.app-chrome` shell; `<DialogHost />` mounts
inside `.app-chrome` as a sibling of the `<main>` scroll container. Layout stays a server
component (both imports are `'use client'`; Next inserts the boundary). Comment block records
why the mount is load-bearing (silent `window.confirm` fallback without it).

### Decisions

1. **ToastProvider source = `@/components/ui/toast`, NOT the edit-page-local one.** The task
   pointed at `src/app/edit/[token]/page.tsx:8-9` as the mount *pattern*, and that page imports
   `./components/ui/ToastProvider`. Two providers exist and `src/components/ui/README.md:122` +
   `toast.tsx:16-18` both explicitly rule "do not import" the edit-page-local one from outside
   the editor. Took the app-chrome provider (`@/components/ui/toast`) — the ui-foundation one,
   app-* tokened, built for this shell. In-scope ambiguity, conservative pick; no file outside
   the list touched either way. **Consumers in later phases must use its `useToast()` hook API
   (`toast(msg, { variant })`), not the editor's global `showToast()` singleton.**
2. **`publishedHost` delegates to the existing `publishedSubdomainHost` (`@/lib/domains/hosts`)**
   rather than re-hard-coding `lessgo.site`. Single source of truth, and it keeps the
   `LESSGO_PUBLISH_HOST` env override honoured. DD8's stated output shape is unchanged.
   `hosts.ts` is imported only, never edited.
3. **Added `'noopener'` to the `window.open` in "Visit site."** It is now a cross-origin open
   (`lessgo.site` from the app host), where it previously was same-origin — the opened tab would
   otherwise get a live `window.opener` handle back into the dashboard. One-word hardening at a
   line the phase already required changing.

### Deviations from the plan

- None on scope. Decision 1 is a plan-vs-codebase-ruling reconciliation (recorded above);
  decisions 2 and 3 are implementation choices within the phase's files.
- DD5 honoured: `ConfirmDialog.tsx` NOT restyled, not touched at all.
- DD8's deferred literals (`SlugModal.tsx:39,:119`, `domain/LiveStep.tsx:64`) left alone.
  Note for phase 7's follow-up list: they live at `src/components/SlugModal.tsx` and
  `src/components/domain/LiveStep.tsx` — **not** under `src/components/dashboard/`.

### Surprises

- Fresh-worktree tsc false positive behaved exactly as the plan warned: one `npm run build`
  generated `next-env.d.ts` and tsc went clean. Not "fixed", no asset added.
- The plan's assumption "`src/app/dashboard/layout.tsx` exists (S1 shell)" holds — it is a
  server component doing Clerk + plan reads, with a documented read-only invariant that this
  phase does not disturb.

### Verification

`npm run build` — green (needed once for `next-env.d.ts`; also confirms the client/server
boundary of the new layout imports is legal).

`npx tsc --noEmit`:
```
TSC_EXIT=0
```
(no output, no errors — including no `src/app/page.tsx` founder.jpg error post-build)

`npm run test:run`:
```
 Test Files  194 passed | 1 skipped (195)
      Tests  3343 passed | 18 skipped (3361)
   Duration  60.26s
```

Manual dev pass (dashboard card label / Visit site / `confirmDialog()` renders the dialog rather
than `window.confirm`) NOT performed — no dev server run in this phase; left for the phase-5
manual pass where the dialog has a real caller.

### Open risks

- **`DialogHost`'s host singleton is module-global** (`enqueueRequest`, ConfirmDialog.tsx:40).
  If a dashboard route ever nests a second `DialogHost` (e.g. an editor surface embedded under
  `/dashboard/*`), the last one mounted wins and the other's queue goes dead. Only one is
  mounted today; worth a look if a later phase mounts editor chrome inside the dashboard shell.
- **Toast provider duality persists** — the editor tree and the dashboard tree now use different
  toast systems. Fine (disjoint trees), but a shared component calling the wrong one would
  no-op silently. Unifying them is explicitly a consuming-spec job per `toast.tsx:16-18`.
- `publishedUrl` does not consider a live custom domain (documented in the module header).
  Correct for this phase's two call sites — a custom-domain page is still reachable at its
  subdomain — but a future "canonical URL" surface should use `resolvePublishedHost` instead.

---

# Phase 2 — Publish-state serving predicate (SSR 404 + `isPublished` re-point)

**Files changed**
- `src/lib/publishState.ts` (new)
- `src/lib/publishState.test.ts` (new)
- `src/app/p/[slug]/page.tsx`
- `src/app/p/[slug]/[...subpath]/page.tsx`
- `src/app/p/[slug]/privacy/page.tsx`
- `src/lib/blog/ssr.tsx`
- `src/lib/seo/resolvePublishedHost.ts`
- `src/app/api/publish/route.ts` (count predicate only)
- `src/lib/blog/publishBlogPost.ts` (loadContext predicate only)
- `src/lib/blog/__tests__/publishBlogPost.test.ts`
- `docs/task/dashboard-lifecycle-actions.audit.md` (this section)

## Per file

**`src/lib/publishState.ts` (new).** Plain module, no `'use client'` (imported by server
components). `isServingPublishState(state)` → `false` for exactly `'draft'` and
`'unpublishing'`; `true` for everything else. Fail-open by construction: the non-serving set is
an explicit allowlist-of-denials, so `'published'`/`'publishing'`/`'failed'`/null/undefined/
unknown all serve. Doc comment spells out WHY `'publishing'` must serve (re-publish goes
`published → publishing → published`; 404ing there = live-page regression) and why `'failed'`
serves (failed re-publish leaves the prior version live). Also exports
`OCCUPIES_PUBLISH_SLOT_DOC` as the canonical doc string for the slot predicate
(`publishState !== 'draft'`) — the predicate itself is expressed inline as Prisma `where` at
call sites, since Prisma filters aren't composable from a JS boolean fn.

**`src/lib/publishState.test.ts` (new).** 8 cases covering every state: published, publishing,
failed (serve); draft, unpublishing (404); null/undefined/empty and unknown/`'DRAFT'`
(fail-open serve — case-sensitivity asserted deliberately).

**`src/app/p/[slug]/page.tsx`.** BOTH exports gated. `generateMetadata` (:19 lookup) adds
`publishState` to the select → non-serving returns `{}`. Page (:71 lookup) adds `publishState`
→ non-serving returns `notFound()`. No other select/query changes.

**`src/app/p/[slug]/[...subpath]/page.tsx`.** Same treatment on both exports; the page's
existing `!page || !page.content` guard extended with the predicate.

**`src/app/p/[slug]/privacy/page.tsx`.** Both exports. `generateMetadata` previously tolerated a
missing row (generic 'Privacy Policy' title); kept that behavior for `!page` and only returns
`{}` when a row exists AND is non-serving — narrowest change, no new 404 for missing rows.

**`src/lib/blog/ssr.tsx`.** `loadBlogSsr()` — the single choke point for `/p/[slug]/blog` and
`/p/[slug]/blog/[postSlug]`. Full-row `findUnique` (no select), so `publishState` was already
loaded; added a separate `return null` line for the predicate. Callers already map null → 404.

**`src/lib/seo/resolvePublishedHost.ts`.** `SELECT.isPublished` → `publishState`; `:41`
predicate → `isServingPublishState(page.publishState)`. Per DD0b nuance, sitemap/robots/rss now
follow the serving predicate, so `'publishing'`/`'failed'` pages can appear in a sitemap —
accepted (the page IS reachable), not a defect.

**`src/app/api/publish/route.ts`.** ONE line: limit count `where` → `{ userId, publishState: {
not: 'draft' } }`. Nothing else in the file touched. Business-rule change per DD0b item 2
(limit loosens — `isPublished` was `@default(true)` on every row incl. drafts) → Gate A.

**`src/lib/blog/publishBlogPost.ts`.** ONE predicate: `loadContext`'s `findFirst` →
`publishState: 'published'` (strict, not the serving predicate — blog publish requires a live
site). Nothing else touched.

**`src/lib/blog/__tests__/publishBlogPost.test.ts`.** Fixture `PAGE.isPublished: true` →
`publishState: 'published'`. Fixture-shape only; the `db.publishedPage.findFirst` mock ignores
the `where`, so no assertion changes were needed.

## `isPublished` grep findings (repo-wide, DD0b step 4)

9 non-doc hits. Verdicts:
- `prisma/schema.prisma:161` + `prisma/migrations/20250522204925_init/migration.sql:44` — the
  field definition. LEFT (no migration, deprecated-in-place per DD0b).
- `src/types/core/content.ts:325` — `PageMetadata` interface. **Unrelated entity** (verified:
  sits in a `PageMetadata` block with `keywords`/`ogImage`/`language`). LEFT.
- `src/schemas/validation.ts:234` — the zod schema for that same `PageMetadata`
  (`isPublished: z.boolean().default(false)`). **Unrelated entity.** LEFT.
- The remaining 4 (`resolvePublishedHost.ts:13,:41`, `publish/route.ts:229`,
  `publishBlogPost.ts:78`) + the test fixture — all re-pointed above.

**Conclusion: no `PublishedPage.isPublished` readers remain anywhere in the repo.** The field
now has neither a writer nor a reader; it survives as a schema-level `@default(true)` column.

## Deviations from the plan

None material. Two in-scope judgment calls, both taken conservatively:
1. Privacy `generateMetadata` gates only when a row exists and is non-serving (see above) —
   preserves the existing missing-row behavior rather than widening the change.
2. `OCCUPIES_PUBLISH_SLOT` is exported as a doc constant, not a function — a Prisma `where`
   can't be derived from a boolean predicate, and the plan only calls for a "predicate doc".

## Verification

- `npx tsc --noEmit` — **green** (no output).
- `npm run test:run` — **green**: `Test Files 195 passed | 1 skipped (196)`,
  `Tests 3350 passed | 18 skipped (3368)`. Includes the new 8-case predicate test and the
  updated blog fixture.
- Manual dev verification (existing page still serves; hand-set `draft` row 404s) NOT run —
  requires a dev DB row; deferred to the phase-2 plan's manual step / Gate A.

## Open risks

- **Live-site blast radius:** these are the published-serving paths. Mitigated by fail-open
  (null/unknown → serve) and by `'publishing'`/`'failed'` serving, so no currently-published
  page's behavior changes. Any legacy dev row that is live-but-`'draft'` will now 404 — intended
  per the plan (prod was wiped 2026-06-16).
- **Limit loosening** (`publish/route.ts:229`) is a real billing-adjacent semantics change —
  needs the founder ack at Gate A, as DD0b item 2 requires.
- `/api/og/[slug]` remains ungated (DD0 accepted gap) — an unpublished page still yields an OG
  image with title/description. Follow-up for phase 7 docs.
- ISR (`revalidate = 3600`) means a cached render of a now-unpublished page survives up to an
  hour until phase 3's `revalidatePath()` lands. Expected — this phase is the origin-truth half.

**Working-tree note:** `git status` also shows `docs/task/dashboard-lifecycle-actions.plan.md`
(the orchestrator's uncommitted progress-log line for phase 1) and
`src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` (empty diff —
CRLF-only churn from the test run). Neither was touched by this phase.

---

# Phase 3 — Teardown library (server-only core)

## Files changed

- `src/lib/staticExport/teardown.ts` (new)
- `src/lib/staticExport/teardown.test.ts` (new)
- `docs/task/dashboard-lifecycle-actions.audit.md` (this section)

`src/app/api/blob-proxy/route.ts` was **NOT touched** — see the DD1c finding below.

## DD1c investigation (step 1) — RESULT: no real purge mechanism exists

Checked, in order:

1. **Vercel purge/invalidate REST API with the token we already hold.** The app's only Vercel
   API credentials are `VERCEL_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID`, read in
   `src/lib/vercel/domains.ts:4-8` and used solely against the **Domains** endpoints
   (`https://api.vercel.com` projects/domains, `getDomainConfig`). Vercel exposes no public,
   documented per-URL/per-path Edge-Network purge endpoint — cache invalidation is
   dashboard/CLI "Purge Everything" (project-wide, not per-URL, and not something an unpublish
   should ever fire) or Next.js-level `revalidatePath`/`revalidateTag`. Per the plan's explicit
   instruction I did **not** invent or assume an endpoint.
2. **`cacheTag` + `revalidateTag` on the blob-proxy handler.** Two independent blockers:
   (a) `cacheTag` is a Next 15 `'use cache'` API — this repo is `next@^14.2.28`
   (`package.json:66`), so it does not exist here; (b) `src/app/api/blob-proxy/route.ts:4` is
   `runtime = 'edge'` and fully dynamic, so its response is not in Next's Full Route Cache — the
   `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` at :74 is honored
   directly by Vercel's Edge Network, which carries no tag association for `revalidateTag` to
   act on. `revalidateTag` would be a silent no-op for this response.

**Conclusion: EMPTY, exactly as the plan-review predicted.** Step 3c is therefore *skipped* (no
call, no Sentry `cdn_purge` warning path, no `blob-proxy/route.ts` edit — the file is untouched,
`Cache-Control` byte-identical). DD1c(2) carries it: the origin 404s immediately (phase 2's DD0
predicate + KV deletion), the edge can replay a cached copy for ~1h, and the SWR revalidation
then hits the missing KV route → origin 404 → cache self-corrects. The finding is recorded at
the top of `teardown.ts` so nobody re-litigates it, and phase 5's honest-window UI copy + Gate
A's cache-busting verification method are now **required**, not optional.

## `src/lib/staticExport/teardown.ts`

`teardownPublishedPage(pageId, { mode })` — DD1 order exactly:

1. **Guard (D1):** `customDomain !== null` regardless of `customDomainStatus` → returns
   `{ status: 'blocked', reason: 'custom_domain' }` with zero writes. A missing page row also
   short-circuits to `done` (idempotent retry after the caller's delete transaction).
2. **Marker:** `publishState: 'unpublishing'` (skipped if already set, so a retry doesn't churn).
3. **KV (DD2):** hosts = `publishSubdomainHosts(slug)` (custom domain guaranteed absent).
   Paths = union of `metadata.blobs[].path` across **ALL** versions (a legacy blobKey-only
   version contributes `/`) + `/blog` (when an index blob or any published post exists) +
   `/blog/{slug}` per published post. Non-root keys → `deleteRoutes(host × path)`, THEN
   `removeRoutes(hosts)` for the root trio — the root-only trap the review flagged.
   3b. `revalidatePath` for `/p/{slug}`, `/p/{slug}/privacy` and every non-root path.
   3c. CDN purge intentionally absent (above).
4. **Blobs (DD3/DD2b), strict:** own `publishedPageVersion.findMany` → `metadata.blobs[].blobKey`
   with `version.blobKey` legacy fallback → `del()` each; then blog post blobs + `blogIndex.blobKey`
   enumerated directly. Then `currentVersionId: null` **before** `publishedPageVersion.deleteMany`
   (the `"CurrentVersion"` relation has no explicit `onDelete`).
5. **Finalize:** `mode:'delete'` returns after step 4 (caller runs DD11). `mode:'unpublish'` does
   blog demote → `Project.status:'draft'` → `PublishedPage` LAST
   (`publishState:'draft'`, `publishError:null`, `blogIndex: Prisma.DbNull`; `isPublished` and
   `lastPublishAt` untouched per DD0b/DD4).

Typed union: `blocked` / `retryable_failure` (with `step`) / `done`. Every failure path fires
`Sentry.captureMessage('teardown_incomplete', { level:'error', extra:{ pageId, slug, step, mode } })`.
Invariant held structurally: the only write of `'draft'` is the last statement of the last step.

Traps avoided, as instructed: `versionCleanup.ts` untouched; no `unpublishBlogPost` loop (it
uploads a fresh index blob per non-last post); nothing modeled on `publish/route.ts:520-528`.

## `src/lib/staticExport/teardown.test.ts` — 18 tests

Guard (blocked incl. `pending_dns`, zero writes; missing row no-op) · route enumeration (both
hosts × `/about` from a *dropped older version* + `/pricing` + `/nl` locale + `/blog` +
`/blog/{slug}`, root never in `deleteRoutes`, `removeRoutes` gets the host trio; blog-index-only;
no-blog site; legacy-only version) · `revalidatePath` set · blob deletion (all versions incl.
legacy fallback + blog post/index blobs) · `currentVersionId` nulled before version-row delete ·
**B3 upload guard** (`uploadStaticSite` / `generateStaticHTML` / `unpublishBlogPost` /
`syncBlogAfterSitePublish` mocked and asserted never called, while blog blobs are still deleted)
· ordering (marker → KV → blob → `draft` last) · unpublish finalize contents (asserts
`isPublished`/`lastPublishAt` are NOT in the write) · delete mode stops before finalize · KV
failure / mid-blob failure / db-finalize failure → `retryable_failure`, stays `'unpublishing'`,
Sentry captured · retry on a stuck `'unpublishing'` row completes.

## Deviations from the plan

- **DD1 3c dropped** (not a deviation in substance — the plan makes it conditional on step 1
  finding a mechanism; none exists). Consequently the planned "CDN-purge failure does not fail
  the teardown" unit test is **not applicable** and is absent; the plan already scoped it "only
  if a purge mechanism was adopted".
- **`revalidatePath` treated as strict** (its own `step: 'revalidate'` retryable failure) rather
  than best-effort. Conservative reading of DD1 ("failure at step 3/4 → retryable"): 3b is part
  of step 3 and the plan marks only 3c best-effort. Retry is safe (idempotent).
- **`/blog` key included when `blogIndex` is set even with zero published posts** (plan says
  "per published BlogPost"). Conservative: catches a stranded index route; deletes are idempotent.
- **No `$transaction` around the DB finalize** — kept as ordered sequential writes so
  `PublishedPage → 'draft'` is provably the last write; a partial finalize is retry-safe and
  leaves `'unpublishing'`, which is the honest state.

## Test results

- `npx tsc --noEmit` — green (the plan's noted `founder.jpg`/`next-env.d.ts` false error did not
  reproduce; no build needed).
- `npm run test:run` — **196 passed | 1 skipped (197 files), 3368 passed | 18 skipped**. New file:
  18/18. No existing test touched; publish-path tests green.

## Open risks

- **DD1c is now load-bearing on phase 5 + Gate A.** With no purge, the ~1h edge window is the
  product behavior. If phase 5 omits the honest confirm/toast copy, the AC "unpublish stops
  serving" is user-visibly false for up to an hour. Flagged loudly.
- **`revalidatePath` requires a request/render context** — teardown must be called from a route
  handler (phase 4 does). Called from a script/cron it would throw → `retryable_failure`
  `step:'revalidate'` after KV deletion, i.e. a stuck `'unpublishing'` page. Not reachable today.
- **Blob `del()` failure semantics unverified against the live SDK** — assumed idempotent (a
  no-op on an already-deleted key), which is what makes retry converge; matches `versionCleanup`'s
  existing assumption. Gate A's admin KV/blob check is the real proof.
- `mode:'delete'` leaves the row at `'unpublishing'` between teardown and the caller's DD11
  transaction. Benign (`PublishedPage.projectId` has no `@relation`, nothing FK-blocks) and
  already non-serving, but a crash in that window leaves an `'unpublishing'` row whose only
  recovery is re-running Delete — acceptable, and phase 5 keeps Delete available for it.
- Blog demote is *not* reversed by a later site re-publish (DD2b, by design) — Gate A talking point.

**Working-tree note (phase 3):** unchanged from above — `plan.md` (orchestrator progress log) and
the CRLF-only `uiFoundationIsolation.test.tsx.snap` churn are not from this phase.

---

## Phase 4 — API routes: unpublish + delete (+ honest e2e)

**Files changed**

- `src/app/api/projects/[tokenId]/unpublish/route.ts` (new)
- `src/app/api/projects/[tokenId]/route.ts` (DELETE added; GET untouched)
- `src/lib/staticExport/teardown.ts` (3 folded phase-3 review fixes only)
- `src/lib/staticExport/teardown.test.ts` (dangling-projectId + honest-label tests)
- `e2e/dashboard-lifecycle.spec.ts` (new)
- `e2e/helpers/seedDraft.ts` (`publishSeed` helper; `seedDraft` now returns finalContent)
- `docs/task/dashboard-lifecycle-actions.audit.md` (this section)

### `src/app/api/projects/[tokenId]/unpublish/route.ts` (new)

`POST` → `auth()`/401 → `assertProjectOwner(..., { action: 'projects.unpublish',
claimIfOrphan: true })` with **status passthrough** (canonical `[tokenId]/route.ts:23-30`
pattern; the `published-slug` hand-rolled admin-all widening is NOT copied) → project lookup →
`PublishedPage` by `projectId`. No page / `publishState === 'draft'` → **idempotent 200
`{ ok: true, unpublished: false }`** (a double-click must not 404). Else
`teardownPublishedPage(pageId, { mode: 'unpublish' })`: `blocked` → 409
`{ code: 'custom_domain_attached', error: 'Remove the custom domain first' }`;
`retryable_failure` → 500 `{ code: 'teardown_incomplete', step }`; `done` → 200.
`runtime = 'nodejs'` + `dynamic = 'force-dynamic'` (teardown touches Blob/KV/Postgres).

### `src/app/api/projects/[tokenId]/route.ts` (DELETE added)

Identical authz ladder with `action: 'projects.delete'`. Published (`publishState !== 'draft'`)
→ `teardownPublishedPage(pageId, { mode: 'delete' })` with the same 409/500 mapping; draft →
teardown skipped (no KV/blobs left) → straight to the **DD11 `$transaction`**: `PublishedPage`
→ `Project` → `Token` LAST (`Project.tokenId` FKs `Token.value`). Cascades left implicit per
DD11; the comment names `Testimonial` (`SetNull`, rows survive with `projectId: null`) and the
retained slug-keyed `FormSubmission`/`PageAnalytics`. **GET not touched** (no file-level
`runtime` export added, precisely so GET's behavior is unchanged; the route default is already
`nodejs`).

### D2 (step 3) — admin override, one-line flip

Both routes carry the **same** comment block + the same commented line immediately after the
`!access.ok` check, so strict owner-only is one uncomment in each file:
`if (access.adminOverride) return NextResponse.json({ error: 'Access denied' }, { status: 403 });`
Each comment cross-references the other file ("flip BOTH together"). Founder decides at Gate A.

### `src/lib/staticExport/teardown.ts` — the 3 folded phase-3 review fixes (nothing else)

1. **Wedge fix (was :249):** `prisma.project.update` → `prisma.project.updateMany`. `update`
   throws P2025 on a dangling `PublishedPage.projectId` (the FK is intentionally absent, DD11)
   → `db_finalize` retryable → and every retry re-ran the same failing statement, wedging the
   row at `'unpublishing'` forever. `updateMany` matches zero rows and converges.
2. **Honest step labels (was :122, :145):** `TeardownStep` gained `'marker' | 'db_read'`. The
   marker-write failure now reports `step: 'marker'` at **`level: 'warning'`** (nothing was
   touched ⇒ not an incomplete teardown, just a failed attempt); the enumeration-read failure
   reports `step: 'db_read'` and stays at `'error'` (the marker IS written by then, so the row
   is parked non-serving with KV/blobs alive = genuinely incomplete). `fail()` took an optional
   `level` param to express this.
3. **`import 'server-only'`** added at the top, matching `renderPublishedExport.ts:1`.

### `src/lib/staticExport/teardown.test.ts`

`project.update` mock → `updateMany` throughout. New: **dangling-projectId** test
(`updateMany` → `{ count: 0 }` ⇒ still finalizes to `'draft'`, no Sentry, no wedge) and two
label tests (`'marker'` @ warning with zero KV/blob calls; `'db_read'` @ error with the marker
written). Added `vi.mock('server-only', () => ({}))` — vitest runs jsdom (client condition), so
the real guard module throws on import; stubbing it in the test file avoided touching
`vitest.config.ts` (out of scope). 21/21 pass.

### `e2e/dashboard-lifecycle.spec.ts` (new) + `e2e/helpers/seedDraft.ts`

Six cases: (a) unauthenticated → **404** both routes (cookie-less `request.newContext`) —
corrected in the review-fix pass below; the routes' own 401 is unreachable for an anonymous API
caller and is NOT covered; (a2) demo token → 404 both routes + demo project survives;
(b) non-owner token → 403 both routes + project survives; (c) unpublish published seed → 200,
`/p/{slug}` 404, project GET `status: 'draft'`, PublishedPage row + slug KEPT (DD12), second
unpublish = 200 no-op, re-publish → serves again on the same slug; (d) DELETE published → 200,
project GET 404, `/p/{slug}` 404, all three rows gone; (e) custom domain (status
`pending_dns`, per D1) → 409 `custom_domain_attached` on BOTH routes, `/p/{slug}` STILL serves,
no `'unpublishing'` marker written, project intact, then domain removed → unpublish 200.

The spec's header states the honest scope in-file: it does **not** assert `{slug}.lessgo.site`
going down (host-based middleware+KV routing isn't reproducible on localhost; the DD1c CDN
layer doesn't exist locally at all) and does not assert real KV/blob deletion (absent locally —
covered by the mocked unit tests + Gate A on a deployed host).

`seedDraft()` now **returns** the assembled finalContent (additive; existing caller ignores it)
and a new `publishSeed()` publishes it through the real `/api/publish`. Direct `PrismaClient`
use is confined to the spec, only for what no API can do locally (plant a custom domain;
fabricate a foreign-owned project).

### Deviations

- **`teardown.test.ts` `vi.mock('server-only')`** instead of a vitest config alias — in-scope
  conservative choice; `vitest.config.ts` is not in Files touched.
- **`publishSeed` / `seedDraft` return value** — the plan allowed `seedDraft.ts` edits "only if
  seeding needs a published variant helper". It does (cases c/d/e need a PUBLISHED project and
  driving the publish UI five times would be slow and flaky).
- The spec's custom-domain and foreign-owner setup uses Prisma directly (see above); the
  helper file's "no app modules in the Playwright runner" rule is respected (`@prisma/client`
  is a package, not an app module, and lives in the spec, not the helper).

### STOPPED / out of scope — needs an orchestrator decision

**`playwright.config.ts` is NOT in this phase's Files-touched list, and the new spec cannot run
without it.** The config's `authed` project lists specs explicitly and warns in-file: "a spec
only runs if it is listed HERE — an unregistered spec silently matches no project and gives
false confidence." Verified: `npx playwright test --list | grep lifecycle` → **no matches**.
The one-line fix is adding `/dashboard-lifecycle\.spec\.ts/` to the `authed` project's
`testMatch`. NOT done (would edit a file outside the list). Until then the spec is dead code.

### Test results

- `npx tsc --noEmit` — **green** (no output; the plan's noted `page.tsx` false error did not
  reproduce). `e2e/` is excluded from tsconfig, so the new spec was typechecked separately with
  an equivalent standalone `tsc` invocation — also clean.
- `npm run test:run` — **green: 196 files passed / 1 skipped; 3371 tests passed / 18 skipped.**
- `npm run test:e2e` — **NOT RUN. No pass is claimed.** Two independent blockers: (1) the spec
  is unregistered (above), so it matches no project; (2) the run aborted in this environment —
  `Process from config.webServer exited early` after ports 3000-3004 were all in use (other
  worktrees/sessions). The e2e spec is therefore **unverified** — it has never executed.

### Open risks

- **The e2e spec has never run.** Beyond registration, first execution may need fixes (Clerk
  session refresh timing, publish timeouts in local dev where Blob/KV run to their timeouts).
  Treat it as unproven until a green run exists.
- Local dev publishes land in `publishState: 'failed'` (Blob/KV absent), not `'published'`.
  Both are serving states, so the assertions hold either way — but the spec exercises the
  `'failed'` → teardown path locally, and the `'published'` → teardown path only at Gate A.
- The delete `$transaction` runs AFTER teardown, outside it (unavoidable: Blob/KV aren't
  transactional). A crash in that window leaves external state gone + rows present; recovery is
  re-running Delete (idempotent). Same window as recorded in phase 3.
- 500 `teardown_incomplete` is retry-safe but the route surfaces no retry affordance beyond the
  user clicking again — phase 5 owns the toast copy.

**Working-tree note (phase 4):** `plan.md` (orchestrator progress log) shows as modified — not
from this phase.

---

## phase 4 — review fixes

**Files changed**

- `src/app/api/projects/[tokenId]/route.ts`
- `src/app/api/projects/[tokenId]/unpublish/route.ts`
- `e2e/dashboard-lifecycle.spec.ts`
- `docs/task/dashboard-lifecycle-actions.audit.md`

### BLOCKER 1 — destructive routes accepted the demo token (security hole)

`assertProjectOwner` short-circuits `lessgodemomockdata` to `ok: true` for ANY caller BEFORE any
ownership check (`src/lib/security.ts:63-65`), and a real shared/un-owned `Project` row exists for
it (`/api/saveDraft`). Both handlers checked only `!access.ok` → any signed-in user could
`DELETE /api/projects/lessgodemomockdata` and destroy the shared demo (`PublishedPage → Project →
Token`; the Token delete is unrecoverable by re-saving). Unpublish was the same shape.

Fix: one `if (access.isDemo) → 404 'Project not found'` guard per route, immediately after the
`!access.ok` check, mirroring the codebase convention in `src/lib/blog/access.ts:21` (404 not 403 —
don't reveal the row exists). Each carries a comment explaining WHY (the short-circuit). Covered by
new e2e case (a2), which also asserts the demo row SURVIVES — conditional on the row existing in
the local DB, since a missing row would 404 via the not-found branch and give a false green (stated
in-spec).

### BLOCKER 2 — e2e asserted a status the platform cannot return

The "unauthenticated → 401" case would have gotten 404: `/api/projects/*` isn't in
`isPublicRoute`, the matcher covers `/(api|trpc)(.*)`, and `auth.protect()` runs first
(`src/middleware.ts:251-253`); for an `APIRequestContext` request Clerk's `handleUnauthenticated()`
→ `isPageRequest()` false → `notFound()` → 404. The routes' 401 is defense-in-depth the middleware
pre-empts.

Fix: assert **404** (strict — deliberately NOT weakened to "any non-200", which would hide a real
regression), with an in-test comment naming middleware `protect()` as the first gate and the route
401 as defense-in-depth. The spec file header and the audit's "(a) unauthenticated → 401" line are
both corrected so neither claims coverage that doesn't exist; the header now records the routes'
401 branch under "what this does NOT cover".

### Folded in (reviewer non-blocking) — DELETE skipped the D1 guard for a draft row

`if (page && page.publishState !== 'draft')` skipped teardown for a draft row, and teardown owns
the D1 custom-domain guard → the guard was skipped too. `domains/add` does not require a serving
state, so a draft row CAN hold a `customDomain` (attach a domain after an unpublish) → delete
dropped the row with no 409, orphaning the Vercel registration + KV keys. Fix: `customDomain` added
to the route's `findFirst` select and an explicit 409 guard keyed on `page.customDomain !== null`
placed BEFORE the teardown branch — D1's predicate, state-independent, full stop. Teardown itself
is still skipped for a draft row (only the guard moved); teardown's own `blocked` branch is kept as
defense-in-depth.

### Deviations

None. All edits confined to the Files-touched list. No demo-token unit assertion was added to
`src/lib/staticExport/teardown.test.ts` — the guard lives in the route handlers, not teardown, so
the e2e case is the honest home for it; that file was left untouched.

### Test results

- `npx tsc --noEmit` — **green** (no output).
- `npm run test:run` — **green: 196 files passed / 1 skipped; 3371 tests passed / 18 skipped.**
- `npm run test:e2e` — **NOT RUN by this pass** (an e2e run was in flight on port 3011; running it
  would collide). The orchestrator runs the suite.

**Orchestrator correction (supersedes the STOPPED note above):** the spec IS now registered —
`playwright.config.ts:65` lists `/dashboard-lifecycle\.spec\.ts/` in the `authed` project's
`testMatch` (the orchestrator added it; the implementer correctly refused to, being out of its
Files-touched list). `npx playwright test --list` discovers all cases.

The orchestrator also fixed a **pre-existing config defect** in the same file: `webServer.command`
was a bare `npm run dev` with no port, so the documented `E2E_PORT` toggle only moved the URL
Playwright *waited on* while `next dev` still grabbed 3000 (or the next free port — someone else's
worktree server) → guaranteed `webServer` timeout whenever a sibling worktree is running. Fixed by
passing `PORT: String(PORT)` into `webServer.env` (`next dev` reads `PORT`).

**The spec HAS now executed.** Its first-ever run empirically confirmed the review's blocker 2
(`Expected: 401, Received: 404` — Clerk middleware `auth.protect()` pre-empts the route's 401),
which is what drove the fix above.

### Open risks

- The demo-token e2e case only distinguishes the guard from the not-found branch when the demo
  project is seeded in the target DB. The guard itself is unconditional in code.
- All phase-4 open risks above still stand (the spec has never run; local publishes land in
  `'failed'`; the post-teardown `$transaction` window).

---

# Phase 5 — Dashboard wiring slice 1: Unpublish + Delete live

## Files changed

- `src/app/dashboard/page.tsx`
- `src/components/dashboard/ProjectGridCard.tsx`
- `src/components/dashboard/ProjectCardMenu.tsx`
- `e2e/dashboard-lifecycle.spec.ts`
- `docs/task/dashboard-lifecycle-actions.audit.md` (this section)

`@/components/ui/dropdown-menu` NOT touched (hard ruling) — popover/disabled styling stays at
the call site via `className`/`title`. `ConfirmDialog.tsx` NOT touched (DD5).

## The DD1c copy shipped (VERBATIM — founder reviews this at Gate A)

Constants live in `ProjectCardMenu.tsx` (`CACHED_COPY_SENTENCE`, `UNPUBLISHED_TOAST`) under a
comment explaining WHY they are load-bearing, so a future reword can't silently drop the only
honest signal about the ~1h edge window.

1. **Unpublish confirm dialog** — title `Unpublish this site?`, body:
   > “{name}” will be taken off the web. Your page stops being served immediately, but visitors may see a cached copy for up to an hour. You can publish it again later — the address stays reserved.
   Confirm button: `Unpublish`.
2. **Unpublish success toast:**
   > Unpublished. The cached copy can take up to an hour to clear.
3. **Delete confirm dialog (published project)** — title `Delete this project?`, body:
   > “{name}” will be permanently deleted, and its live page taken down with it. Your page stops being served immediately, but visitors may see a cached copy for up to an hour. This can't be undone.
4. **Delete confirm dialog (draft project):**
   > “{name}” will be permanently deleted. This can't be undone.
5. **Delete success toast:** `Project deleted.`
6. **Error toasts:** 409 → `Remove the custom domain first` (same string as the pre-disable
   tooltip, one constant); 500 `teardown_incomplete` → `Take-down didn't finish. Please try
   again.` (retryable, says so); other non-OK → server `error` or `Something went wrong. Please
   try again.`; network throw → `Couldn't reach the server. Please try again.`

No jargon anywhere: "s-maxage" / "SWR" / "CDN" / "edge" appear in code comments only, never in
user-visible strings.

## What changed, per file

**`src/app/dashboard/page.tsx`**
- `publishState` + `customDomain` added to the `publishedPage` select in **BOTH** the admin
  god-view branch and the owner branch (DD7), plus the shared `publishedPages` type. The two
  are separate queries — a comment now says so at the type, since adding a field to one only
  ships a stale menu for half the users.
- Status derivation moved from `publishedPage ? 'Published' : 'Draft'` to the DD4/DD0 slot
  predicate: `occupiesSlot = Boolean(publishedPage) && publishState !== 'draft'`. A row kept
  for slug reservation (DD12) no longer reads "Published" forever; a page stuck at
  `'unpublishing'` still shows Published and offers Unpublish as the retry.
- Item gains `publishState` (raw) + `hasCustomDomain`.

**`src/components/dashboard/ProjectGridCard.tsx`**
- `ProjectGridItem` extended with `publishState: string` + `hasCustomDomain: boolean` (both
  documented; `publishState` is deliberately NOT a duplicate of `status`). Pass-through to the
  menu needed no change — the card already forwards the whole item.
- Added `data-testid="project-card-{tokenId}"` on the card root for the e2e UI path (see
  Deviations).

**`src/components/dashboard/ProjectCardMenu.tsx`**
- New **Unpublish** item, rendered only when `publishState !== 'draft'` (so it doubles as the
  retry for a stuck `'unpublishing'`); **Delete** un-greyed. Both disabled (with the guard
  sentence as `title`) when `hasCustomDomain`, and while an action is in flight (`busy`).
- One shared `run()` helper maps the phase-4 error contract (`custom_domain_attached` /
  `teardown_incomplete`) to toasts, then `router.refresh()` on success — the app-chrome
  `useToast()` from `@/components/ui/toast`, never the editor-local `showToast()` singleton.
  No optimistic removal: the grid is a server component, so the flip to Draft / the card's
  disappearance is the SERVER's answer.
- PostHog `project_unpublish_clicked` / `project_delete_clicked`, mirroring
  `project_preview_clicked` (`{ project_id, project_name }`), fired at click — before the
  confirm — matching the existing "clicked" naming.
- Domain settings + Archive left greyed (D3).

**`e2e/dashboard-lifecycle.spec.ts`** — 3 UI tests added on top of the 7 API tests:
menu → confirm (asserting the cached-copy sentence) → toast → card flips to Draft + `/p/{slug}`
404s; delete → destructive confirm (asserts "live page taken down" + the cached-copy sentence)
→ toast → card gone + DB rows gone; custom-domain card → both items `data-disabled` with the
guard `title`. The copy assertions carry a comment telling a future editor to preserve the
MEANING rather than delete the assertion.

## Deviations / in-scope judgment calls

1. **`slug` is now nulled for a non-serving card** (`slug: occupiesSlot ? … : null`). The plan
   didn't specify. Without it, an unpublished project would keep an enabled "Visit site" that
   opens a 404 (the row + slug survive by DD12). Nulling makes a draft-state row behave exactly
   as a never-published project always did — conservative, no new behavior.
2. **`data-testid` on the card root** (file is in scope). Every meridian seed is titled
   'Meridian', so a name-based locator is ambiguous in the shared-user e2e grid; the tokenId is
   the handle the test already holds. Chosen over a brittle DOM-ancestor locator.
3. **Unpublish confirm is NOT `destructive: true`** (Delete is). Unpublish is reversible and the
   dialog says the address stays reserved; red is reserved for the irreversible action.
4. **The DD1c sentence is also shown on the PUBLISHED delete confirm.** The plan mandated it for
   unpublish only, but delete runs the identical teardown and therefore has the identical edge
   window — omitting it there would be the same dishonesty in a worse place.
5. **Confirm dialogs are opened via `setTimeout(…, 0)`** after the Radix menu closes: the menu
   restores focus to its trigger on close, which would otherwise land after DialogHost's `rAF`
   focus and leave the dialog unfocused (Esc dead).

## Verification

- `npx tsc --noEmit` — **green**.
- `npm run test:run` — **green** (196 files / 3371 tests passed, 1 file + 18 tests skipped).
- **e2e observed green by execution**: `E2E_PORT=3011 npx playwright test
  e2e/dashboard-lifecycle.spec.ts --project=setup --project=authed --reporter=list` →
  **10 passed** (the 7 pre-existing API tests + the 3 new UI tests), 5.7m. Port 3011 confirmed
  clear beforehand; Playwright started its own server.
- Manual dev pass NOT run — deferred to founder Gate A.

## Open risks

- The `hasCustomDomain` pre-disable is a courtesy over possibly-stale server-rendered data; the
  409 remains the real gate (asserted in the API test). A stale click is handled, not prevented.
- `'unpublishing'`-stuck cards show "Published" with a working Unpublish retry, but nothing
  tells the user the page is ALREADY non-serving. Acceptable (the state is rare and transient);
  no state-specific pill was added this slice.
- The DD1c copy asserts against the real cache window only if the founder accepts the ~1h
  window at Gate A. If Gate A rules the window unacceptable, the copy AND a purge mechanism
  change together.
- e2e UI tests depend on the toast's `role="status"` and Radix's `data-disabled` — both
  implementation details of components outside this spec's fence.

---

# Phase 6 — Rename + Duplicate

## Files changed
- `src/app/api/projects/[tokenId]/route.ts` (added PATCH; GET/DELETE untouched)
- `src/lib/projectToken.ts` (new)
- `src/app/api/projects/[tokenId]/duplicate/route.ts` (new)
- `src/components/dashboard/ProjectCardMenu.tsx`
- `src/app/dashboard/page.tsx` (comment only — see DD10 below)
- `e2e/dashboard-lifecycle.spec.ts`
- `docs/task/dashboard-lifecycle-actions.audit.md` (this section)

## What changed, per file

**`src/app/api/projects/[tokenId]/route.ts`** — new `PATCH` handler. Same authz ladder as
DELETE (`action: 'projects.rename'`, `claimIfOrphan: true`), demo-token → 404 guard, and the
same commented D2 one-liner (Gate A: KEEP the audited admin override). Body `{ title }`:
trimmed, 1–120 chars else `400 invalid_title`. Writes `Project.title` only. GET and DELETE were
not touched.

**`src/lib/projectToken.ts`** (new) — `mintProjectToken(client)`: `nanoid(12)` + `token.create`,
per the `/api/start:56-70` pattern. Takes a `PrismaClient | Prisma.TransactionClient` so the
duplicate route can mint inside its `$transaction` (`Project.tokenId` FKs `Token.value`, so the
Token must exist before the Project insert). `/api/start` deliberately NOT re-pointed
(blast-radius control; phase-7 follow-up) — noted in the file's docblock.

**`src/app/api/projects/[tokenId]/duplicate/route.ts`** (new) — authz ladder
(`action: 'projects.duplicate'`), demo guard, D2 comment. Loads the source with an explicit
`select` covering **every** field it clones (the unselected-field trap), plus `pages`. One
`$transaction`: mint token → `project.create` → `projectPage.createMany`. Returns
`{ ok, tokenId }`. No `user.upsert`/`createDefaultPlan` — `access.userRecord.id` is the owner.
DD9 contract implemented exactly: copied scalars/JSON + `title + " (copy)"` (clamped to 120 to
stay inside the rename bound), `status: 'draft'`; `pages` the ONLY cloned relation; no
publishedPage/testimonials/collectLink/blogPosts/editDeltas/socialPosts/emailSequence/outreach*.

**`ProjectCardMenu.tsx`** — Rename and Duplicate un-greyed (only `busy` gates them; the DD7
custom-domain guard does not apply — neither action touches the live page). Rename →
`promptDialog({ defaultValue: project.name })` (the DISPLAYED name, DD10) → PATCH → existing
`run()` (app-chrome `useToast()`, `router.refresh()`). No-ops on cancel/unchanged/blank.
Duplicate → POST → toast, no confirm (it creates, never destroys). PostHog
`project_rename_clicked` / `project_duplicate_clicked` mirror the existing convention.
`@/components/ui/dropdown-menu` and `ConfirmDialog.tsx` untouched (R11 / DD5). Domain settings +
Archive remain greyed (D3).

**`src/app/dashboard/page.tsx`** — DD10 **verified, no behaviour change**. The fallback chain is
already gated on `if (!smartName || smartName === 'Untitled Project')`, i.e. an explicit title
already wins. Added a load-bearing comment tying that gate to the rename route so a future
"simplification" can't silently eat every rename.

**`e2e/dashboard-lifecycle.spec.ts`** — 4 new tests (rename API incl. trim + 1/120 bounds; UI
rename; duplicate DD9 contract; UI duplicate) + rename/duplicate assertions folded into the
existing demo-token and non-owner tests (incl. positive proof: the foreign project survives
unrenamed and uncopied).

## Decisions / deviations

1. **Duplicate + demo token → 404 (conservative, as instructed to judge).** Duplicate is
   read-then-create, not destructive, so a rejection isn't strictly forced. Rejected anyway:
   (a) the demo short-circuit returns `userRecord: null` — there is no owner to assign the copy
   to; (b) it would otherwise let any signed-in user mint unbounded projects off the shared mock,
   outside every plan limit. Implemented as `if (access.isDemo || !access.userRecord)`, which
   also discharges the null-owner type obligation at the same point. Rationale is in the route.
2. **`(copy)` title clamped to 120 chars** — otherwise duplicating a 120-char title yields a
   title the rename route would reject as invalid. In-scope edge case, conservative choice.
3. **Duplicate's e2e plants the `PublishedPage` row instead of calling `publishSeed`.**
   `/api/publish` is rate-limited to 5/min and the pre-existing tests already spend that budget.
   The duplicate route never touches publish infra, so a real publish buys nothing here. The
   assertion "the original stays live" therefore degrades to "the original's published row is
   untouched (`projectId` + `publishState`)"; real SSR serving/take-down stays pinned by the
   publish-backed tests above it.
4. **Phase-6 tests appended at the END of the spec, with a comment explaining why.** SURPRISE
   (see below) — placing them mid-file re-timed the run and tipped a PRE-EXISTING test into a
   `/api/publish` 429. Ordering is now load-bearing.
5. Rename's prompt renders `role="dialog"` (only `confirm` is an `alertdialog`) — the e2e
   locator matches, ConfirmDialog itself was not touched.

## Surprises
- **The publish rate limit (5/min) is a real constraint on this spec's runtime, not just its
  content.** Inserting fast tests mid-file compressed the publish cadence of the tests around
  them into one 60s window → a 429 in a test I hadn't modified. This looks exactly like a real
  regression and isn't one; hence the explanatory comment in the file.
- `PublishedPage.userId` is a **Clerk** id, not `User.id` — relevant when planting rows in e2e.

## Verification (all observed)
- `npx tsc --noEmit` — **green**.
- `npm run test:run` — **green** (196 files passed / 1 skipped; 3371 passed / 18 skipped).
- `E2E_PORT=3011 npx playwright test e2e/dashboard-lifecycle.spec.ts --project=setup
  --project=authed` — **14/14 passed** (was 10/10; +4). Port 3011 checked for a stale server
  first (free); Playwright started its own.

## Open risks
- `mintProjectToken()` now has TWO call sites' worth of logic in the codebase — the helper and
  the still-inline copy in `/api/start`. They can drift until phase 7's follow-up re-points it.
- The duplicate route has no plan-limit check: a user can clone past their site allowance.
  Consistent with the rest of the app (project creation via `/api/start` is unmetered too) and
  out of this slice's scope, but it is a new, cheaper way to create projects — worth a look when
  pricing-v2 lands.
- Duplicate is unbounded in payload size (`content`/`computedDesign` JSON copied in-process for
  a project + all its pages). Fine at current scale; a very large multi-page site is untested.
- Rename has no uniqueness constraint — two projects can share a title. Intentional (the grid is
  keyed by tokenId), but the UI-duplicate test's cleanup matches on title, so it would over-match
  if a user manually created a same-named `(copy)`.

---

# Phase 7 — Acceptance sweep + docs

## Files changed

- `docs/architecture/publishArch.md` (new top-level "Unpublish / Take-down (teardown)" section)
- `src/lib/blog/ssr.tsx` (`requireServing` opt-out)
- `src/app/(blog-preview)/dashboard/blog/[slug]/[postId]/preview/page.tsx` (passes the opt-out)
- `src/lib/blog/__tests__/ssr.test.ts` (new — 8 tests)
- `e2e/helpers/seedDraft.ts` (publish-pacing wrapper)
- `e2e/dashboard-lifecycle.spec.ts` (removed the "keep last" comment; 2 stale comments; trailing newline)
- `src/app/api/projects/[tokenId]/duplicate/route.ts` (title clamp only)
- `docs/task/dashboard-lifecycle-actions.audit.md` (this section)

## Step 1 — AC walk (spec `## Acceptance criteria`)

Verdicts are against CODE + the gates I ran. Nothing deployed was checked (Gate A ruling).

1. **••• menu Rename / Duplicate / Delete live; Unpublish shows on published projects** —
   **SATISFIED.** `ProjectCardMenu.tsx`: Unpublish rendered only when `publishState !== 'draft'`
   (:273-278, so it doubles as the retry for a stuck `'unpublishing'`), Delete :316, Rename :286-290,
   Duplicate :294-298 — all enabled (`busy`/domain-guard only). Domain settings + Archive stay greyed
   by ruling D3 (:303, :310). E2e: the 4 UI tests (Unpublish / Delete / Rename / Duplicate).
2. **Rename updates the title; Duplicate creates an independent unpublished draft (new token)** —
   **SATISFIED.** PATCH `[tokenId]/route.ts` (1–120 trimmed, writes `Project.title`); duplicate route
   mints a NEW token (`src/lib/projectToken.ts`) + `status: 'draft'`, clones `pages`, clones no
   published/engagement state. E2e "rename: PATCH 200 …" and "duplicate: new Draft with a NEW token,
   pages cloned, original untouched (DD9)" (asserts a new tokenId, cloned `ProjectPage`, and that
   editing the copy leaves the original's title + published row untouched).
3. **Delete (any project, explicit confirm) removes it; published → also taken down (KV + blob cleaned)** —
   **SATISFIED-WITH-CAVEAT.** Confirm: `ProjectCardMenu.tsx:157-172` (`destructive: true`, names the
   project, says "live page taken down with it"). Route: DELETE → guard → teardown (`mode:'delete'`)
   → `$transaction` PublishedPage → Project → Token. E2e "delete removes the project and takes
   /p/{slug} down" (rows gone, `/p/{slug}` 404). **Caveat:** real KV/blob deletion is proven only by
   mocked unit tests (`teardown.test.ts`, 21) — Blob/KV are absent locally; on-prod cleanliness is
   Gate A item 3, DEFERRED.
4. **Unpublish → stops serving, `publishState` = draft, KV + blob cleaned; re-publish works** —
   **SATISFIED-WITH-CAVEAT (the DD1c deviation — stated, not papered over).** "Stops serving" is true
   at the **ORIGIN immediately** (`isServingPublishState` false for `'unpublishing'`/`'draft'` gates
   every SSR fallback; KV routes deleted) and at the **EDGE within ~1h**: no CDN purge mechanism exists
   (phase 3: no per-URL Vercel purge API; `cacheTag` is a Next-15 `'use cache'` API and this repo is
   Next 14; the blob-proxy is `runtime='edge'` so `revalidateTag` would be a no-op; lowering `s-maxage`
   rejected as a publish-happy-path change). SWR self-corrects → ~1h, not 24h. The confirm dialog +
   toast tell the user this in plain words. `publishState = 'draft'` + re-publish: e2e "unpublish takes
   /p/{slug} down (404), then re-publish serves it again".
   **Whether the edge window actually exists is the open empirical question — Gate A item 2, DEFERRED.**
5. **Custom-domain page cannot be unpublished/deleted; clear message; no partial teardown** —
   **SATISFIED.** Predicate D1 = `customDomain !== null` regardless of status (`teardown.ts:107-108`,
   `blocked` with zero writes); DELETE guards independently before its teardown branch (a draft row can
   hold a domain). Routes → 409 `custom_domain_attached` / "Remove the custom domain first"
   (`unpublish/route.ts:88`). Menu pre-disables with the same sentence (DD7); the 409 is the real gate.
   E2e "custom domain attached → 409 custom_domain_attached, page STILL serves (zero writes)" asserts
   both routes 409, the page still serves, and that NO `'unpublishing'` marker was written.
6. **Every mutation enforces `assertProjectOwner`; non-owner blocked** — **SATISFIED.** DELETE (:88),
   PATCH (:162), unpublish (:43), duplicate (:43), all with `claimIfOrphan: true` and the canonical
   status passthrough (never the `published-slug` widening). E2e "non-owner token → 403 on both
   lifecycle routes" (+ rename/duplicate folded in, with positive proof the foreign project survives
   unrenamed/uncopied). Two honest notes: (a) the routes' own `auth()` → **401 is unreachable** — Clerk
   middleware `protect()` 404s an anonymous API caller first; the e2e asserts the true 404. (b) The
   **audited admin override is KEPT** by founder ruling — "every mutation is owner-only" holds modulo
   that logged override; the one-line flip stays commented in each route.
7. **No orphaned live pages / KV routes / blobs after delete or unpublish** —
   **SATISFIED-WITH-CAVEAT.** Structurally: KV enumerated across ALL versions + blog keys (not just
   `removeRoutes`' root trio), blobs deleted strictly across all versions + blog, DB finalized LAST, and
   a failure parks the row at `'unpublishing'` (non-serving) + Sentry rather than lying. **Caveats:**
   (i) verified by mocked unit tests only — real KV/blob is Gate A item 3, DEFERRED; (ii) two
   **pre-existing PUBLISH-path gaps** (NOT introduced here, now documented) mean orphans can pre-exist:
   KV keys of versions older than the retained 10 are unenumerable once `cleanupOldVersions` prunes the
   rows, and a post whose slug changed while published strands its old `/blog/{oldSlug}` key.
8. **`tsc`, `test:run`, `npm run build` green** — **SATISFIED, all observed** (see Test results).

**DEFERRED (Gate A — the founder cannot deploy; this branch is a consuming spec of the held big-bang
push):** `{slug}.lessgo.site` take-down through real host routing; whether the DD1c edge window exists;
prod KV/blob cleanliness + re-publish on the real host. **No deployed verification is claimed.** What IS
proven locally: local dev uses REAL Vercel Blob + KV, and the e2e performed a genuine
`POST /api/publish` → unpublish → 404.

## Step 2 — `docs/architecture/publishArch.md`

New section before "Future Enhancements": the serving predicate (+ why `'publishing'`/`'failed'` serve,
+ why deleting KV routes alone does NOT stop serving) · `loadBlogSsr`'s one sanctioned opt-out ·
`isPublished` deprecated-in-place (**no writer, no reader** — new code must use `publishState`) ·
teardown order 1-5 with failure semantics · delete cascade · **DD1c** (why no mechanism exists, the
~1h/SWR nuance, the rejected `s-maxage` change, how to verify a take-down, and the tighten-if-no-window
follow-up) · DD12 slug squatting · DD0b limit-count semantics · blog demote-on-unpublish · the accepted
`/api/og` gap · the demo-token short-circuit trap · **the two pre-existing publish-path gaps** (recorded
as NOT ours) · test coverage with its honest scope · the follow-up list (ConfirmDialog `app-*`,
SlugModal/LiveStep → `publishedUrl.ts`, `/api/start` → `mintProjectToken()`, `/api/og` gating, duplicate
has no plan-limit check → revisit at pricing-v2, DD1c copy tightening, automated domain teardown).

## Step 3 — owner blog-draft preview restored

Confirmed the regression: phase 2 gated `loadBlogSsr()`, whose THIRD caller is the owner-only preview —
so an unpublished site's owner lost preview of their own drafts. `loadBlogSsr(slug, { requireServing =
true })` now takes an opt-out; the preview route passes `false` (only caller), public blog SSR keeps the
default. Both sites carry a comment saying why, and the option's docblock says never to pass `false`
from a public route. The opt-out relaxes the serving predicate ONLY — missing row / missing content /
detached project still return null (asserted). New `src/lib/blog/__tests__/ssr.test.ts`, 8 tests: public
SSR serves `published`/`publishing`/`failed` and 404s `draft`/`unpublishing`; preview loads
`draft`/`unpublishing`; the opt-out doesn't bypass the other guards.

## Step 4 — e2e ordering tripwire de-fanged

`publishSeed()` (`e2e/helpers/seedDraft.ts`) now self-paces against the real limiter
(`RATE_LIMIT_PRESETS.PUBLISHING`, 5/60s per user, `rateLimit.ts:48-51` — the task's `:30-31` is the
AI_GENERATION preset): a module-level timestamp list, a sliding-window wait (+1s skew slack) before the
6th call in a window, and a log line when it waits. **No rate-limit bypass flag** — the suite keeps
exercising the real limiter. No product code touched. The "keep phase-6 tests last" comment is removed;
test order is now irrelevant to the publish budget.

## Step 5 — cosmetic nits

- `duplicate/route.ts`: clamps the **base** to `120 - ' (copy)'.length` then appends the suffix, so a
  120-char title can no longer silently lose its " (copy)" marker (which would have produced a copy
  named identically to the original). **Deviation (conservative):** clamping the base does not by itself
  prevent splitting a surrogate pair — `slice` still cuts by code unit — so I also strip a stranded high
  surrogate (`.replace(/[\uD800-\uDBFF]$/, '')`) to actually deliver the nit's stated intent (no U+FFFD
  in the copy's name). The existing e2e title assertion still passes.
- Stale "tests below" → "above" (the phase-6 block is now last); refreshed the neighbouring rate-limit
  rationale comment, which the pacing wrapper made inaccurate; added the trailing newline.

## Deviations

1. The surrogate-strip above (in-scope, logged).
2. The e2e comment at the duplicate test was reworded (not in the nit list) because step 4 made its
   stated reason ("the suite already spends that budget") false. Same file, in scope.
3. `docs/task/dashboard-lifecycle-actions.plan.md` shows as modified in `git status` — the
   orchestrator's progress log, pre-existing, NOT touched by this phase.

## Test results (all four gates observed green)

- `npx tsc --noEmit` — **green** (`TSC_EXIT=0`, no output).
- `npm run test:run` — **green**: `Test Files 197 passed | 1 skipped (198)`,
  `Tests 3379 passed | 18 skipped (3397)` (+8 from the new ssr test; was 3371).
- `npm run test:e2e` (lifecycle spec) — **green, 14/14**:
  `E2E_PORT=3011 npx playwright test e2e/dashboard-lifecycle.spec.ts --project=setup --project=authed`
  → **14 passed (5.6m)**. Port 3011 verified clear first; Playwright started its own server.
  **Honest note:** the FIRST full run had 1 failure — the UI-unpublish test's toast assertion timed out
  at 5s while the unpublish request was still in flight (the card still read "Published", no error
  toast). It passed in isolation and passed in the clean 14/14 re-run. **A latency flake, not a
  regression** (see Open risks) — recorded rather than hidden.
- `npm run build` — **green** (exit 0, full route table emitted).

## Open risks

- ~~**The UI-unpublish toast assertion is timing-sensitive**~~ — **FIXED (phase 7 follow-up).** The
  four assertions that wait on a real teardown round-trip now carry an explicit `{ timeout: 15_000 }`
  (see "Phase 7 follow-up: teardown-assertion timeouts" below). The earlier position — "an explicit
  timeout should be a deliberate choice, so I left it" — is superseded: the deliberate choice is now
  made. The previous instruction to **"expect an occasional red here"** was the real defect. This suite
  exists to protect the take-down path on *every future push*; a gate readers are pre-authorized to
  ignore protects nothing, and a flaky gate is worse than no gate because it trains the reflex of
  re-running instead of investigating. No assertion was weakened: same text, same server truth, same
  locators — only the patience changed.
- The publish pacing assumes a **sliding** window while the limiter uses a **fixed** window with
  `resetTime`; the wait is therefore conservative (never too short). It also assumes the suite is the
  only publisher for that user — true for the serial e2e project.
- Everything under Gate A's DEFERRED list remains unproven on real infra. The DD1c copy is defensively
  honest: if the deployed check shows no window, the copy over-promises staleness (a cheap tighten).
- All prior phases' open risks stand (notably: local publishes land in `'failed'`, so teardown-from-
  `'published'` is only exercised at Gate A; the post-teardown `$transaction` window).

---

# Phase 7 follow-up: teardown-assertion timeouts

## Files changed

- `e2e/dashboard-lifecycle.spec.ts` — explicit 15s timeouts on the four teardown-bound assertions.
- `docs/task/dashboard-lifecycle-actions.audit.md` — this section; phase-7 flake risk rewritten as FIXED.

## What changed

Four assertions, all of which block on a **real Blob/KV teardown round-trip** completing server-side,
moved from Playwright's 5s default to `{ timeout: 15_000 }`:

| Line | Assertion | Why it waits on a round-trip |
|---|---|---|
| ~104 | unpublish toast `'up to an hour to clear'` | toast fires only after the teardown request resolves — **the assertion that actually flaked** |
| ~110 | card flips to `Draft` | `router.refresh()` re-derives from the server (no optimistic mutation) |
| ~137 | delete toast `'deleted'` | published delete runs the identical teardown first |
| ~139 | card disappears (`toHaveCount(0)`) | same `router.refresh()` server re-derive |

**Rationale (the point of the change).** Phase 7 recorded this as "not fixed — an explicit timeout
should be a deliberate choice" and told future readers to *expect an occasional red*. That instruction
is how a gate dies. This suite's whole job is to protect the take-down path on every future push; a
red that people are pre-authorized to shrug at stops being a signal, and the habit it teaches —
re-run, don't investigate — is exactly the habit that lets a real take-down regression through. A
flaky gate is worse than no gate. The fix weakens nothing: identical text, identical locators,
identical server truth. It only stops a slow-but-correct teardown from reading as a failure.

## Deliberately NOT touched (in-scope judgment)

An inflated timeout on a fast, purely-local assertion buys nothing and makes real failures slower to
surface, so these keep the 5s default:

- DD7 disabled-menu-item attribute checks (`data-disabled`, `title`) — local, menu already open.
- `alertdialog` copy assertions — the dialog is client-rendered on click, no network.
- Rename / Duplicate toasts — single DB write / row-clone, **no Blob/KV teardown**. Not reported flaky
  and outside this fix's stated remit (teardown round-trips only).
- `page.goto('/p/{slug}')` 404/serve checks — navigation, governed by the navigation timeout, not the
  5s `expect` default.

## Test results (observed)

`E2E_PORT=3011 npx playwright test e2e/dashboard-lifecycle.spec.ts --project=setup --project=authed --reporter=list`
→ **14 passed (7.7m)**. Port 3011 verified free beforehand; Playwright started its own server. Still 14/14.

## Open risks

- **A NEW, UNEXPLAINED failure was seen on the first run of this change and could not be reproduced —
  recorded, not hidden.** `delete removes the project and takes /p/{slug} down` (~line 340) got **404**
  from `DELETE /api/projects/{token}`, and the body was the middleware's `notFound()` **HTML page** —
  i.e. that request resolved as **unauthenticated**, the anonymous-rejection path, not the route's
  own not-found branch. Serial mode then skipped the remaining 5. On the clean re-run the same test
  passed in 58s. This is **NOT the latency flake fixed above** (different test, different mechanism —
  a Clerk session/context issue, not a slow teardown) and **is NOT fixed by this change**; the timeouts
  are irrelevant to it. It is unproven whether this is a test-harness session-refresh flake or a real
  intermittent auth fault. If it recurs, investigate `authedApi()`'s session refresh — do not assume
  it is benign, and do not add a retry to make it quiet.
- The 15s bound is a judgment call, not a measured ceiling: the UI-unpublish test took **1.7m** overall
  in the green run (mostly seeding/publish), so if the local teardown itself ever exceeds 15s this will
  red again — correctly, as a genuinely slow teardown worth looking at.
