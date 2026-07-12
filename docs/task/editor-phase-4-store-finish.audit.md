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

## Phase 2 — Step A: façade unification (mechanical)

**Files changed:**
- `src/hooks/useEditStoreBootstrap.ts` (NEW)
- `src/hooks/useEditStore.ts` (rewritten)
- `src/hooks/useEditStoreLegacy.ts` (reduced to thin re-export)
- `src/components/EditProvider.tsx` (one import line + one call-site name)

### What changed
- **`useEditStoreBootstrap.ts` (new):** the old `useEditStore.ts` token/SSR hook body moved VERBATIM, function renamed `useEditStore` → `useEditStoreBootstrap`. Header comment "EditProvider-only bootstrap; do not import elsewhere." added. The `window.__useEditStoreDebug` dev IIFE (`process.env.NODE_ENV === 'development'` block referencing `storeManager`) moved WITH it — it lives here now, NOT in the reactive file. `export type { EditStore, EditStoreInstance }` retained.
- **`useEditStore.ts` (rewrite):** now the old `useEditStoreLegacy.ts` body verbatim — reactive `useEditStore(selector?)` overloads (function renamed from `useEditStoreLegacy`), `useEditStoreApi`, `globalStoreRef` set-on-render in both hooks, static `useEditStore.getState()`. Added explicit `export type { EditStore, EditStoreInstance }` (from `@/types/store` and `@/stores/editStore` respectively) — the legacy body did not carry these; added so `import type` consumers keep resolving after phase 3. Removed the legacy file's default export and `export { useEditStoreLegacy as useEditStore }` alias (no longer needed — this file's own function is named `useEditStore`).
- **`useEditStoreLegacy.ts` (thin re-export):** reduced to `export { useEditStore, useEditStore as useEditStoreLegacy, useEditStoreApi } from './useEditStore'` + `@deprecated delete in phase 3` header. Keeps the ~107 existing importers resolving until phase 3's sweep.
- **`EditProvider.tsx`:** import changed `useEditStore` from `@/hooks/useEditStore` → `useEditStoreBootstrap` from `@/hooks/useEditStoreBootstrap`; call site `useEditStore(tokenId, {...})` → `useEditStoreBootstrap(tokenId, {...})`. Nothing else changed.

### Default export decision
- `rg "import useEditStore(Legacy)? from" src/` → **zero hits** (no default importers). Therefore NO default export was added to either `useEditStore.ts` or the `useEditStoreLegacy.ts` shim. No default-import normalization needed.

### Confirmations
- Debug IIFE (`window.__useEditStoreDebug`) landed in `useEditStoreBootstrap.ts`, NOT in the reactive `useEditStore.ts`. Verified.
- Both type re-exports (`EditStore`, `EditStoreInstance`) present in `useEditStore.ts`. Verified.
- No logic lines altered — pure move/rename. `globalStoreRef` set-on-render semantics and static `.getState()` preserved exactly; `useEditStoreApi` unchanged.

### Deviations
- None.

### Test results
- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — 2476 passed, 11 skipped (156 files).
- `npm run lint` — passes; only pre-existing warnings (no errors). The bootstrap-file `react-hooks/exhaustive-deps` warning on the useEffect is carried verbatim from the old file.
- `npm run build` — succeeded.

### Open risks
- The reactive `useEditStore.ts` carries a now-unused `useContext` import and unused `LegacyEditStoreContext` (both verbatim from the legacy body). Lint only warns, not errors, consistent with the prior legacy file. Left as-is to preserve pure-move discipline; can be swept in phase 3.
