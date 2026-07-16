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
