# dashboard-rollups-inbox — implementation audit

## Phase 1 — accountScope helper + cross-user isolation unit test

**Files changed**
- `src/lib/dashboard/accountScope.ts` (new)
- `src/lib/dashboard/accountScope.test.ts` (new)

### What was built

`src/lib/dashboard/accountScope.ts` — server-only plain module (no `'use client'`). Exports
`AccountPage` / `AccountScope` interfaces and
`getAccountScope(clerkUserId, db = prisma): Promise<{ pages, pageIds, slugs }>`.
It runs `db.publishedPage.findMany({ where: { userId: clerkUserId }, select: { id, slug, title } })`
and derives `pageIds` / `slugs`. No `publishState`/`isPublished` filter — all of the user's pages are in
scope. `db` defaults to the prisma singleton (`import { prisma } from '@/lib/prisma'`, matching every
other `src/lib` module) and is injectable for tests. Doc comment states all four required points:
(a) `clerkUserId` = the Clerk id from `auth()`, never internal `User.id` (wrong space = tsc-green,
silently zero rows); schema confirms `PublishedPage.userId` is "Clerk User ID (external, not a foreign
key)". (b) R-A rationale: `/api/forms/submit` writes `FormSubmission.userId` from the client body →
untrusted → scope leads via these page ids. (c) Known gap: `publishedPageId = null` orphan submissions
are invisible to the inbox. (d) R-B: no admin widening — always the viewer's own pages.

`src/lib/dashboard/accountScope.test.ts` — vitest, following the repo pattern (`testimonials/repo.test.ts`):
`vi.mock('@/lib/prisma')` so no DB is touched, plus an in-memory fake `db` that filters a two-user
fixture (user_A: 2 pages incl. one unpublished; user_B: 1 page) by `args.where.userId` and applies
`select`. Three tests:
1. Isolation both directions — A gets only A's ids/slugs (incl. the unpublished page) and none of B's; inverted for B.
2. Query shape — spy asserts `where` equals exactly `{ userId: 'user_A' }` (and the select shape).
3. Empty — unknown user → `{ pages: [], pageIds: [], slugs: [] }`.

### Verification (actually run)

`npx tsc --noEmit`:
```
src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg' or its corresponding type declarations.
```
Pre-existing environment artifact, NOT caused by this phase: `src/assets/images/founder.jpg` exists on
disk; the failure is that this fresh worktree has no generated `next-env.d.ts` / `.next/types` (both
gitignored, produced by `next dev`/`next build`), so Next's image-module type declarations are absent.
Zero errors in the phase's files. Left untouched — `next-env.d.ts` is outside the Files-touched list and
regenerates on the first dev/build run (phase 5 runs `npm run build`, which will regenerate it).

`npm run test:run`:
```
 Test Files  198 passed | 1 skipped (199)
      Tests  3382 passed | 18 skipped (3400)
   Duration  101.41s
```
All green, including the 3 new accountScope tests.

### Deviations
None. (Test file additionally `vi.mock`s `@/lib/prisma` — not spelled out in the plan, but required so
importing the module under test does not instantiate the prisma singleton; the injected fake `db` is
still what the assertions exercise, per plan.)

### Open risks / notes carried forward
- **R-A accepted gap** (to repeat in the phase-2 audit): submissions with `publishedPageId = null` will
  not appear in the inbox.
- **R-B divergence**: helper has no admin branch by design — phases 2/4 must not add one.
- Consumers MUST pass the Clerk `userId` from `auth()`. There is no runtime guard against passing an
  internal `User.id` (it would compile and return zero rows) — the test's query-shape assertion only
  guards the where-clause shape, not the caller's id space.

---

## Phase 2 — All Leads inbox (`/dashboard/leads`) + top-bar titles

**Files changed**
- `src/app/dashboard/leads/page.tsx` (new)
- `src/app/dashboard/leads/LeadsInbox.tsx` (new)
- `src/components/dashboard/DashboardTopBar.tsx` (edit — TITLES map only, 2 lines)

### What changed

**`src/app/dashboard/leads/page.tsx`** (server component)
- Auth: `const { userId } = await auth()`; `if (!userId) return null` — same shape as `src/app/dashboard/page.tsx:22-23`. Page scopes its own query; `dashboard/layout.tsx` is not an auth boundary. `getUserPlan()` is NOT called.
- `getAccountScope(userId)` with the **Clerk id** (documented in-file).
- Query (R-A): `prisma.formSubmission.findMany({ where: { publishedPageId: { in: pageIds } }, orderBy: { createdAt: 'desc' }, take: 200 })`. No `userId` filter anywhere.
- Two `app-*` empty states: no pages → "Publish a site to start collecting leads."; pages but zero submissions → "When visitors submit forms on your sites, they appear here."
- Truncation notice rendered when exactly 200 rows (`truncated` prop).
- Serializes `createdAt` → ISO string, flattens `data` Json to `Record<string,string>`, builds a `pageId → {title, slug}` map for site labels; only plain objects cross the RSC boundary.
- Code comments cover: no compound `[publishedPageId, createdAt]` index → in-memory sort, fine at beta volume, pagination out of scope; R-A null-`publishedPageId` limitation; R-B no-admin divergence.

**`src/app/dashboard/leads/LeadsInbox.tsx`** (`'use client'`)
- Fresh build, `app-*` tokens only. Master list (preview via priority keys email/name/phone with a first-non-empty fallback, form name, site title/slug, short date; selected row `bg-app-tint`; `useState`, first row default) + detail pane (full timestamp, form/site meta, all `data` key/values with per-field `navigator.clipboard` copy, submission id + form id). Read-only — no reply/status/assignment UI.
- `FormSubmissionsTable.tsx` and `[token]/analytics/components/*` neither imported nor edited (R-D).

**`src/components/dashboard/DashboardTopBar.tsx`** — added `leads: ['Lead management', 'All Leads']`, changed `analytics` to `['Performance', 'All Analytics']`. Nothing else.

### Verification (real output)

- `npx tsc --noEmit` →
  ```
  src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg' or its corresponding type declarations.
  ```
  Only the known pre-existing worktree artifact (gitignored `next-env.d.ts` absent in a fresh worktree). **Zero errors in phase-2 files.**
- `npm run test:run` →
  ```
  Test Files  198 passed | 1 skipped (199)
       Tests  3382 passed | 18 skipped (3400)
  ```

### Notes / deviations

- No deviations from the plan's Phase 2 steps.
- In-scope judgment calls (conservative option taken):
  - Lead preview matching is case-insensitive substring on the data key (`email`/`name`/`phone`), with a first-non-empty-value fallback so a row is never blank.
  - Non-string `data` values are `JSON.stringify`'d for display; null/undefined values are dropped.
  - Missing page title → "Untitled site" (`stripHTMLTags` applied to titles, matching the per-site leads page).
  - Clipboard failures (insecure context / permission denied) are swallowed silently — copy is a convenience, not a gate.
- Manual dev-server verification is the Human Gate A step (not run here).

### Restated limitations / divergences

- **R-A known limitation:** the inbox scopes on `publishedPageId: { in: pageIds }`; `FormSubmission.publishedPageId` is nullable, so **orphan submissions with `publishedPageId = null` are NOT shown**. Accepted gap. `FormSubmission.userId` is deliberately never used for scoping — `/api/forms/submit` writes it from the client-supplied body (untrusted).
- **R-B divergence:** no admin god-view branch; `isAdmin` is not imported. The viewer always sees only their own leads — deliberate divergence from S1's dashboard-root all-projects admin widening.

---

## Phase 3 — un-grey All Leads nav + e2e updates

**Files changed**
- `src/components/dashboard/AppSidebar.tsx` (edit)
- `e2e/dashboard-shell.spec.ts` (edit)
- `e2e/dashboard-rollups-inbox.spec.ts` (new)

### What changed

**`src/components/dashboard/AppSidebar.tsx`**
- Added `const leadsActive = pathname?.startsWith('/dashboard/leads') ?? false` next to `billingActive`.
- Replaced the `All Leads` `DisabledNavItem` with the enabled `NavItem asChild` + `<Link href="/dashboard/leads">` + `AppIcon name="move_to_inbox" filled={leadsActive}` shape (copied from the Projects row). **No count pill (R-C).**
- `All Analytics` still `DisabledNavItem` (route lands in phase 4 — no dead links). `Domains` still greyed (R15). `src/components/ui/nav-item.tsx` NOT touched.
- Doc-comment L20-23: removed only the `All Leads (S4)` token from the greyed list (minimal diff; billing S3 conflict surface).

**`e2e/dashboard-shell.spec.ts`**
- Greyed loop narrowed to `['All Analytics', 'Domains']`; test retitled to match. Bell assertions unchanged.
- R14 pill guard repointed to `getByRole('link', { name: 'All Leads', exact: true })`, `toHaveText(/All Leads$/)` KEPT (not weakened to `toContainText`); comment updated to note the row is now a link and that R-C means still no pill.

**`e2e/dashboard-rollups-inbox.spec.ts` (new)**
- Authed, serial, `APP_CHROME = '.app-chrome'`, same patterns as `dashboard-shell.spec.ts`. Test: click sidebar `All Leads` → URL `/dashboard/leads` → exactly one `.app-chrome` → heading `All Leads` visible → renders either the empty state (`No leads yet`) or an inbox row (`listitem`), and no error overlay.
- In-file comment records that cross-user isolation is covered by `src/lib/dashboard/accountScope.test.ts`, NOT e2e (single-account fixture by design).

### Verification (real results)

- `npx tsc --noEmit` → **clean, zero output** (the known `src/app/page.tsx` founder.jpg artifact did not even appear this run).
- `npm run test:run` → **green**: `Test Files 198 passed | 1 skipped (199)`, `Tests 3382 passed | 18 skipped (3400)`.
- `npx playwright test e2e/dashboard-shell.spec.ts e2e/dashboard-rollups-inbox.spec.ts` → port 3000 was held by a sibling worktree's dev server (EADDRINUSE), so re-run with `E2E_PORT=3117`. Result: **1 failed, 5 passed, 4 did not run**.
  - ✓ `dashboard shell › un-built controls are greyed in place (All Analytics / Domains / bell)` — **the phase-3 target test passes**.
  - ✓ shell render, nested screens, grid+filter pills.
  - ✘ `projects grid (phase 2) › ••• menu ships all 7 items…` — **PRE-EXISTING, NOT caused by phase 3** (blocker 1, below).
  - `e2e/dashboard-rollups-inbox.spec.ts` — **NOT RUN** (blocker 2, below). Its assertions are therefore UNVERIFIED.

### Blockers reported to the orchestrator (no out-of-scope edits made)

1. **Stale S2 assertion, pre-existing red.** `e2e/dashboard-shell.spec.ts:147` asserts `getByRole('menuitem')` `toHaveCount(7)`; the real menu now renders **8** — `src/components/dashboard/ProjectCardMenu.tsx` gained an `Unpublish` item in the merged `dashboard-lifecycle-actions` (S2) work, and the spec's item-list/active-set assertions were never updated. Phase 3 cannot add a menu item, so this is independent of this phase. The file IS in phase 3's Files-touched, but fixing an S2 regression is outside phase 3's scope → conservative call: **left untouched, escalated**. Needs an orchestrator decision (fix here vs. an S2 follow-up).
2. **New spec never runs.** `playwright.config.ts`'s `authed` project `testMatch` list does not include `/dashboard-rollups-inbox\.spec\.ts/`; per that file's own comment an unregistered spec "silently never runs". `playwright.config.ts` is NOT in phase 3's (or any phase's) Files-touched list → **not edited**. The plan needs one added line there before this spec (and phase 4's additions to it) provide any gate value.

### Deviations
- None within the Files-touched list. Both issues above were escalated rather than fixed.

### Process note (self-reported)
While trying to prove blocker 1 pre-existed, `git stash push -- <3 paths>` silently failed and the following `git stash pop` popped an unrelated pre-existing stash, conflict-writing `src/modules/skeletons/work/blocks/editPrimitives.tsx` (UU) and touching `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap`. Both were immediately restored with `git checkout HEAD -- <paths>`; the popped stash entry was KEPT by git and is still `stash@{0}` ("WIP on feature/work-skeleton") — nothing lost. Working tree now contains exactly the 3 phase-3 files. Blocker 1 is evidenced by code inspection (Unpublish item in `ProjectCardMenu.tsx`), not by that aborted experiment.

### Open risks
- Phase 4 also edits `AppSidebar.tsx` + both e2e specs — same billing-S3 doc-comment conflict surface.
- The new spec's assertions are unproven until it is registered in `playwright.config.ts`.

---

## Phase 3 — ADDENDUM: blocker fixes (orchestrator ruling)

Both blockers escalated above were RULED on and are now implemented. Phase 3 is complete.

### Files changed (this addendum)
- `playwright.config.ts` — **added to phase-3 Files-touched by orchestrator ruling** (was not in the plan).
- `e2e/dashboard-shell.spec.ts` (already in Files-touched).

### FIX 1 — register the new spec (`playwright.config.ts`)
Added `/dashboard-rollups-inbox\.spec\.ts/,` to the `authed` project's `testMatch`, alongside the other
dashboard specs, matching existing style/order. One line; nothing else in the config touched. Before this,
the phase-3 spec matched no project and gated nothing.

### FIX 2 — re-sync stale S2 assertions (`e2e/dashboard-shell.spec.ts`)
Every claim was verified against `src/components/dashboard/ProjectCardMenu.tsx`; the code matched the
ruling exactly (incl. `Delete` = `disabled={blockedByDomain || busy}` → enabled on a published, non-busy,
domain-less card). No contradictions found.
- `toHaveCount(7)` → `toHaveCount(8)` (the test targets a PUBLISHED card; `Unpublish` renders only when
  `isPublished`, so a draft card would still be 7).
- `toHaveText([...])` gained `/Unpublish$/` in DOM order (3rd, after `Visit site`). End-anchored regex style
  and the AppIcon ligature-text GOTCHA comment both preserved verbatim — not weakened to `toContainText`.
- Active loop now: `Open editor, Visit site, Unpublish, Rename, Duplicate, Delete`.
  Greyed loop now only: `Domain settings, Archive` (D3 chrome, no backend). Comment updated from
  "the other five (R4)" to name the true two-item set and the reason.
- Test title updated (it asserted "all 7 items, exactly 2 active"); card-anchor comment updated (a draft
  card also lacks `Unpublish`, not just a disabled "Visit site").
- Added a comment recording that these assertions were re-synced to S2's shipped `ProjectCardMenu`.

### Deviations
- **Files-touched extended** with `playwright.config.ts` — by explicit orchestrator ruling, not self-authorized.
- **S2 debt, fixed forward here.** `e2e/dashboard-shell.spec.ts` was RED ON MAIN since `dashboard-lifecycle-actions`
  shipped (S2 changed `ProjectCardMenu.tsx` without updating the spec). The fix is **test-only** — no product
  code changed; the assertions moved to match shipped behaviour, no assertion was weakened or skipped.
- Assumes the E2E account's published card has **no custom domain** (else `blockedByDomain` would grey
  Unpublish/Delete). Confirmed true by the green run below.

### Verification (real output)
- `npx tsc --noEmit` → **clean**, `TSC_EXIT=0`, zero output.
- `npm run test:run` → **Test Files 198 passed | 1 skipped (199); Tests 3382 passed | 18 skipped (3400)**.
- `E2E_PORT=3117 npx playwright test e2e/dashboard-shell.spec.ts e2e/dashboard-rollups-inbox.spec.ts`
  → **10 passed, 1 skipped** (`Running 11 tests using 1 worker`). The skip is the pre-existing
  data-conditional empty-state test (account has projects).
  **The new spec WAS collected and DID pass**: `✓ 2 [authed] › e2e\dashboard-rollups-inbox.spec.ts:22:7 ›
  all leads inbox (phase 3) › sidebar All Leads navigates to /dashboard/leads and the page renders in the
  shell (5.1s)` — it now genuinely gates.
  Re-synced menu test green: `✓ 7 … ••• menu ships all 8 items on a published card, only Domain settings +
  Archive greyed (R4) (2.6s)`.

### Open risks
- Phase 4 also edits `AppSidebar.tsx` + both e2e specs — same conflict surface as noted above.
- Pre-existing `stash@{0}` ("WIP on feature/work-skeleton") is still parked in the repo — untouched here
  (no git stash used in this addendum), but someone should reclaim or drop it.
