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

## Phase 2 — Store: `ensureBaseline()` + hydration honors `hasBaseline`

### Files changed
- `src/types/store/state.ts` (modified) — added `baselineAvailable: boolean` to `PersistenceSlice` next to `baseline`/`baselineDirty`, with lifecycle doc-comment.
- `src/stores/editStore.ts` (modified) — seeded `baselineAvailable: false` in createInitialState beside `baseline`/`baselineDirty`; extended the existing non-partialize comment. (partialize is an explicit whitelist, so the field is excluded by construction.)
- `src/types/store/actions.ts` (modified) — added `ensureBaseline: () => Promise<Record<string, any> | null>` next to `captureBaseline`/`markBaselineSaved`.
- `src/hooks/editStore/persistenceActions.ts` (modified) — module-level dedupe map; hydration sets `baselineAvailable`; THE GUARD; `captureBaseline` sets `baselineAvailable=true`; new `ensureBaseline` action.

### What changed
- Hydration (`loadFromDraft`): the `if (storedBaseline)` branch now also sets `state.baselineAvailable = true`; the new `else` sets `state.baselineAvailable = Boolean(apiResponse.hasBaseline)`. Tolerates BOTH shapes (baseline present OR only the flag).
- `captureBaseline()` also sets `state.baselineAvailable = true` — covers legacy backfill and Regen Copy (`generationActions.ts`) with zero changes there.
- `ensureBaseline()`: resident baseline → return it (no fetch); `!baselineAvailable` → return null; else fetch `/api/loadDraft?tokenId=…&part=baseline`, on success `set` `baseline=deepClone(json.baseline)` + `baselineDirty=false`, return it; server null → set `baselineAvailable=false`, return null; fetch failure → clear map entry + throw (no flag flip). All network I/O is outside Immer producers.

### THE GUARD (exact final form)
```
if (!storedBaseline && !apiResponse.hasBaseline) {
  get().captureBaseline();
}
```
Backfill capture fires ONLY when there is no shipped baseline AND the server reports none. A server-side baseline that simply wasn't shipped (`hasBaseline:true`, no `baseline` field — the Phase 4 / Deploy B response) is never recaptured, so autosave can't overwrite the true AI original.

### tokenId source in ensureBaseline
`get().tokenId` — the same `state.tokenId` that `save()` (`:358`) and `loadFromDraft` (`state.tokenId = apiResponse.tokenId || urlTokenId`) use. URL-encoded into `?tokenId=…&part=baseline` (route reads `searchParams.get("tokenId")`/`"part"`, confirmed at `route.ts:54-55,109`). Empty tokenId → return null (no fetch).

### Dedupe-map mechanics
Module-level `const inFlightBaselineFetches = new Map<string, Promise<…>>()` in `persistenceActions.ts` (NOT in store/Immer state — no promises in the store). Keyed by tokenId. On call: if a promise exists for the token, return it (shared request — Reset racing the review prefetch dedupes). Otherwise build the fetch promise, wrap with `.finally(() => map.delete(tokenId))` so the entry clears on settle (success OR failure), store the wrapped promise, return it. Failure propagates via the wrapped promise's rejection (Phase 3 Reset relies on the throw).

### Deviations
- None. partialize is a whitelist (not a denylist), so no exclusion edit was needed for `baselineAvailable` beyond the documentation comment (as the plan intended — "keep it OUT of partialize").

### Verification
- `npx tsc --noEmit`: clean (EXIT 0). The prior phase-1 `founder.jpg` error no longer appears.
- `npm run test:run`: 166 files passed | 1 skipped; 2821 tests passed | 15 skipped. No new failures.
- `npm run lint`: no errors; only pre-existing warnings (`<img>` LCP, react-hooks/exhaustive-deps) — none in changed files.

### Open risks
- No consumer calls `ensureBaseline()` yet (Phase 3 wires Reset + review-diff + preview opt-out). Until then the lazy path is unexercised in-app but unit-clean.
- Backward tolerance intact: loadDraft still ships `baseline` (Deploy A), so `baselineAvailable` derives from the resident branch today; the `hasBaseline`-only branch activates at Phase 4 / Deploy B.
