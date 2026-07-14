# content-baseline-split — Implementation Audit

## Phase 1 — Server-additive: `hasBaseline` flag + `?part=baseline` fetch path

### Files changed
- `src/app/api/loadDraft/route.ts` (modified)
- `src/app/api/loadDraft/baseline.test.ts` (new)

### What changed
- `route.ts`:
  - Read `const part = searchParams.get("part")` alongside the existing `tokenId` read.
  - After the existing auth/ownership block AND after `content`/`onboarding` extraction, added a `part === 'baseline'` branch that returns `createSecureResponse({ baseline: content.baseline ?? null })` and nothing else. Placed AFTER auth so it reuses the exact Clerk-auth → demo/admin carve-out → `verifyProjectAccess` chain (no new auth path). Added the required rationale comment.
  - Default response: added `hasBaseline: Boolean(content.baseline)`. Kept the existing `baseline` field with a `// Phase 4 (Deploy B) removes this` comment (removal is Deploy B only — NOT this phase).
- `baseline.test.ts` (new): follows the `saveDraft/i18n.test.ts` mocking pattern (mocks `@clerk/nextjs/server`, `@/lib/prisma`, `@/lib/security`, `@/lib/admin`; route logic real). Mutable `currentUserId` / `ownershipOk` let tests flip auth. Covers all four required assertions: (i) `hasBaseline:true` + baseline still shipped in default; (ii) `?part=baseline` returns ONLY `{ baseline }` (key-set asserted exactly `['baseline']`); (iii) 401 unauthenticated + 403 non-owner on the part fetch; (iv) legacy project → `hasBaseline:false`, part fetch → `{ baseline: null }`.

### Deviations from plan
- None functional. Placed the `part` branch after the `content` extraction line (a few lines below where a bare line-number reading might suggest) so it can reference `content.baseline`; still strictly after the full auth/ownership block as required.

### Verification
- `npx tsc --noEmit`: one PRE-EXISTING, unrelated error only — `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (missing asset, not touched by this phase). No errors in the two files changed.
- Scoped tests (`baseline.test.ts` + `i18n.test.ts`): 14 passed.
- `npm run test:run` (full): 166 files passed | 1 skipped; 2821 tests passed | 15 skipped.
- `npm run lint`: no errors; only pre-existing warnings (`<img>` LCP, react-hooks/exhaustive-deps) — none in the changed files.

### Notes for reviewer / open risks
- Purely additive: `baseline` remains in the default response this phase; its removal is Phase 4 / Deploy B only.
- The `?part=baseline` branch is reached only after full auth/ownership, so it inherits demo-token + admin read-only carve-outs unchanged.
- The pre-existing `founder.jpg` tsc error appears to be a worktree asset artifact and is out of scope.
