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
