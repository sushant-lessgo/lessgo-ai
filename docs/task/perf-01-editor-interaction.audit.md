# perf-01 editor interaction — implementation audit

## Phase 1 — Debounced localStorage persist

**Files changed**
- `src/stores/editStore.ts`

**What changed**
- Added a module-level flush registry + one-time window-listener attach helper (`editStore.ts` ~line 39-62): `pendingFlushers: Set<() => void>`, `flushListenersAttached` guard, `attachFlushListeners()`. Listeners (`beforeunload`, `pagehide`, `visibilitychange→hidden`) are attached ONCE per app lifetime and iterate all registered per-instance flushers. SSR-safe (`typeof window !== 'undefined'` guard).
- Inside `createEditStore` (after `getStorageKey`, ~line 363-388): added per-instance debounce state `debounceTimer` + `pendingWrite`, and `writeNow()` which clears the timer, stringifies + writes the LATEST pending value, then nulls it. Registers `writeNow` in `pendingFlushers` and calls `attachFlushListeners()`.
- Storage adapter `setItem` (~line 490): now stores `{name, value}` as the latest pending write, resets a trailing 1000ms `setTimeout(writeNow)` on each call — keeps only the latest value.
- Storage adapter `removeItem` (~line 500): cancels any pending write + clears the timer before `localStorage.removeItem`, so a debounced setItem can't resurrect just-removed data.

**Debounce / flush / scoping design**
- Debounce: trailing 1000ms idle timer; each `setItem` overwrites `pendingWrite` and resets the timer → continuous typing produces zero writes; single write ~1s after idle.
- Flush: on tab teardown, `flushAll` runs every registered `writeNow` synchronously (stringify + write the LATEST pending value, not a stale snapshot). Belt-and-braces `visibilitychange→hidden` covers mobile/bfcache where unload may not fire.
- Per-instance scoping: `debounceTimer`/`pendingWrite`/`writeNow` live in the `createEditStore` closure (token-scoped factory), NOT module-global → no cross-project flush bleed. Only the listeners are shared/module-level (dedup'd), which is the intended app-lifetime pattern.

**storeManager finding**
- `storeManager.removeFromCache`/`destroyStore` only `delete this.storeCache[tokenId]` — no teardown method is invoked on the store instance, so there is no place to add a flush hook without editing storeManager.ts (out of scope, and not needed). On LRU eviction the pending `setTimeout` closure stays alive and still flushes ~1s later, so no draft loss. All flush handling lives entirely in editStore.ts's adapter lifecycle, as the plan's fallback allowed. storeManager.ts was NOT modified.

**Persist-shape note (spec "move UI-chrome out")**
- `partialize` (lines 415-451), storage key, and `version` are UNCHANGED. No version bump → old localStorage drafts load as-is, no migration. UI-chrome fields (toolbar, leftPanel, selection, aiGeneration, etc.) are already excluded from `partialize` — confirmed by inspection; no re-slicing was needed or done.

**Deviations**
- `removeItem` was made to cancel pending writes (conservative in-scope choice, not explicitly in steps) to prevent a race where a debounced write outlives a removal. Logged here per in-scope-ambiguity rule.

**Tests / typecheck**
- `npx tsc --noEmit`: green (no output).
- `npm run test:run`: green — 126 passed / 1 skipped files; 1998 passed / 3 skipped tests.

**Open risks**
- Flusher closures accumulate in `pendingFlushers` for the app lifetime (never removed — no teardown hook). Bounded/small: after flush `pendingWrite` is null, and store instances are few (LRU max 3, client-only editor). Acceptable per plan's "per-app-lifetime listener is fine".
- Debounce/flush behavior is inherently runtime; unit tests don't cover the timer path. Manual dev QA (localStorage write counting, close-tab-mid-typing) is in the plan's Phase 1 verification and Phase 7 gate.

## Phase 2 — Selector support in useEditStoreLegacy

**Files changed**
- `src/hooks/useEditStoreLegacy.ts`

**What changed**
- Added TS function OVERLOADS to `useEditStoreLegacy`:
  - `export function useEditStoreLegacy(): EditStore;`
  - `export function useEditStoreLegacy<T>(selector: (state: EditStore) => T): T;`
  - impl: `export function useEditStoreLegacy<T>(selector?: (state: EditStore) => T): EditStore | T` — passes `useStore(store, selector)` when a selector is given, `useStore(store)` when omitted. Zero-arg behavior byte-identical.
- Added `useEditStoreApi(): EditStoreInstance` — returns the context store INSTANCE (non-reactive) from `useEditStoreContext().store` for `.getState()` in event handlers against the correct token-scoped store. Existing static `useEditStoreLegacy.getState()` left untouched for back-compat.
- Imported `EditStore` from `@/types/store` (the real store state type; instance type stays `EditStoreInstance` from `@/stores/editStore`).

**Real state type used:** `EditStore` (from `@/types/store`). Store instance type: `EditStoreInstance`.

**Deviations:** none. No caller changes (infrastructure only, per phase scope).

**Tests:** `npx tsc --noEmit` green (proves zero-arg back-compat across all ~103 call sites). `npm run test:run` green — 126 files passed / 1 skipped; 1998 tests passed / 3 skipped.

**Open risks:** none — purely additive. `useEditStoreApi` unused until phases 5/6 wire it in.
