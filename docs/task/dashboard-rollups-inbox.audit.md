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
