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
