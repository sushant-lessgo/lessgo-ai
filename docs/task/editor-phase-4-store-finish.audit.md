# editor-phase-4-store-finish — audit

## Phase 1 — Step A: dead-export removal

**Files changed:**
- `src/hooks/useEditStore.ts` (modified — deleted dead exports)
- `src/hooks/useEditStoreGlobal.ts` (deleted outright)

### What changed

**`src/hooks/useEditStore.ts`** — deleted four dead members, kept the live hook + type re-exports:
- Deleted `useCurrentEditStore(tokenId)` (was ~line 236).
- Deleted `useEditStoreSelector<T>(tokenId, selector, equalityFn)` (was ~line 259).
- Deleted the deprecated `createEditStore(tokenId?)` warn-shim (was ~line 314).
- Deleted the `export { useEditStoreLegacy as useEditStoreCompat } from './useEditStoreLegacy'` re-export (was ~line 325).
- KEPT: the live `useEditStore(tokenId, options)` token/SSR hook, the `window.__useEditStoreDebug` dev IIFE (untouched — moves in phase 2, not this phase), and `export type { EditStore, EditStoreInstance };`.

**`src/hooks/useEditStoreGlobal.ts`** — deleted the whole file (dead 4th compat layer; re-exported `useEditStoreLegacy as useEditStore`, `useEditStore as useEditStoreWithToken`, plus both types; zero importers in `src/`, only README mentions).

Diff summary: `useEditStore.ts` +1/-80, `useEditStoreGlobal.ts` -15. No logic changed in the kept `useEditStore(tokenId, opts)` hook. The REAL factory `createEditStore` in `src/stores/editStore.ts` was NOT touched.

### Confirm-dead-ness greps (step 3) — run over `src/`

**`rg "useCurrentEditStore|useEditStoreSelector|useEditStoreCompat" src/`** → only the definition file (pre-edit):
```
src\hooks\useEditStore.ts:236:export function useCurrentEditStore(tokenId: string) {
src\hooks\useEditStore.ts:259:export function useEditStoreSelector<T>(
src\hooks\useEditStore.ts:325:export { useEditStoreLegacy as useEditStoreCompat } from './useEditStoreLegacy';
```
Expected — all three are the definitions/re-export being deleted. No external consumers. ✅

**`rg "useEditStoreGlobal|useEditStoreWithToken" src/`** → only the shim itself + README mentions:
```
src\stores\README.md:65:name still says "Legacy". `useEditStoreGlobal.ts` re-exports the same wrapper.
src\hooks\useEditStoreGlobal.ts:11:export { useEditStore as useEditStoreWithToken } from './useEditStore';
src\hooks\README.md:27:`useEditStore` (both from this file and from `useEditStoreGlobal.ts`); most call
src\hooks\README.md:97:  `useEditStoreGlobal.ts` are the context-based no-token wrappers used everywhere.
```
Expected — the only code hit is the shim being deleted; README hits are docs (cleaned in phase 13 per plan). No `.ts`/`.tsx` importers. ✅

**`rg "createEditStore" src/`** → real factory + storeManager + editStore tests + the shim (pre-edit):
- `src/stores/editStore.ts` (lines 43, 370, 627, 632) — the REAL factory (untouched).
- `src/stores/storeManager.ts` (lines 14, 97) — imports the REAL factory.
- `src/stores/README.md` (lines 10, 62) — docs.
- `src/hooks/editStore/*.test.ts` (setItemAlt, sectionSwap, pageActions, imageWriteGuard, aiBaselinePatch, i18nStoreState) — all `import { createEditStore } from '@/stores/editStore'` (the REAL factory).
- `src/hooks/useEditStore.ts:314` — the deprecated shim being deleted.

No test or code imports `createEditStore` from `@/hooks/useEditStore`; every non-shim hit resolves to `@/stores/editStore`. Expected — matches plan step 3 exactly. ✅

Post-edit spot check: after deletion, `rg` for `useCurrentEditStore|useEditStoreSelector|useEditStoreCompat|useEditStoreGlobal|useEditStoreWithToken` in `src/**/*.{ts,tsx}` returns zero code hits (only README docs remain, deferred to phase 13).

### Verification

- **`npx tsc --noEmit`** → PASS (exit 0, zero errors). Note: the very first tsc run emitted a single transient error `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` — a stale Next.js image-module `.d.ts` artifact unrelated to this change (the asset exists at `src/assets/images/founder.jpg`; the diff touches only the two store files, never `page.tsx`). It did not reproduce on any subsequent run; final confirmed exit code 0.
- **`npm run test:run`** → PASS. Test Files 155 passed | 1 skipped (156); Tests 2476 passed | 11 skipped (2487).
- **`npm run lint`** → PASS (no errors; only pre-existing `@next/next/no-img-element` and one `react-hooks/exhaustive-deps` warnings, all in unrelated template/provider files).

### Deviations

None. Scope executed exactly as specified. The dev IIFE and type re-exports were left in place (their move is phase 2 work).

### Open risks

None for phase 1. The `useEditStoreGlobal.ts` README references in `src/hooks/README.md` and `src/stores/README.md` now point at a deleted file — this is expected and scheduled for cleanup in phase 13 (docs close-out), per the plan.
