# edit-header-actions — implementation audit

**Files changed**
- `src/hooks/editStore/historyHelpers.ts` (NEW)
- `src/hooks/editStore/contentActions.ts`
- `src/hooks/editStore/uiActions.ts`
- `src/hooks/editStore/pageHelpers.ts`
- `src/app/edit/[token]/components/ui/UndoRedoButtons.tsx` (Phase 2)

## Phase 1 — History plumbing (text edits → stack, raw-value restore, page-swap clear)

### `src/hooks/editStore/historyHelpers.ts` (NEW, plain module, no 'use client')
- `pushContentHistoryEntry(state, entry)`: 3s coalesce when top-of-undoStack is `type:'content'` + same `sectionId` + same original `elementKey` (full dotted key for collection edits) — mutates top's `afterState`+`timestamp`; else push, shift-oldest past `maxHistorySize` (fallback 50), always clears `redoStack`.
- `deepCopy` util (JSON clone, `undefined`-safe), matching persistenceActions' pattern.
- Exports `ContentHistoryEntry extends EditHistoryEntry` with `elementKey: string` — no `state.ts` change needed (subtype assignable into `EditHistoryEntry[]`).

### `src/hooks/editStore/contentActions.ts`
- `updateElementContent`: history push at all THREE storage paths, raw-value shape `{storageKey, value}`:
  - Dotted collection: `beforeState={storageKey: collectionName, value: deepCopy(oldCollection)}`, `afterState={storageKey: collectionName, value: deepCopy(updatedCollection)}`; entry `elementKey` = full dotted key.
  - Array: before/after raw arrays under `storageKey: elementKey`.
  - String: before/after raw strings under `storageKey: elementKey`.
- Skip push when unchanged (string `!==` / JSON-stringify equality for arrays+collections). `queuedChanges` + `isDirty` behavior untouched.

### `src/hooks/editStore/uiActions.ts`
- `undo()`/`redo()` content branches: new `{storageKey, value}` shape handled FIRST — `section.elements[storageKey] = deepCopy(value)` (raw, no wrapper). Legacy `{elementKey, content}` / `{elements}` branches kept, with comment flagging the wrapped-object rebuild as pre-existing V2 corruption (new entries must never use it). Both paths still set `persistence.isDirty = true` (pre-existing lines, confirmed).

### `src/hooks/editStore/pageHelpers.ts`
- `loadPageIntoActive`: after body-swap assignments, `if (state.history) { undoStack = []; redoStack = []; }` — single choke point covering all page-swap sites + hydration (B5/B6). Direct draft mutation (clearHistory action not callable from plain helper).

### Deviations
- None functional. Coalesce-identity `elementKey` lives on the entry via a local `ContentHistoryEntry` subtype instead of widening `EditHistoryEntry` in `state.ts` (out of Files-touched; type-safe as-is).
- String-path skip uses `oldValue !== stringContent` (covers legacy non-string oldValue too — always pushes then, conservative).

### Verification
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run`: 51 files passed | 1 skipped; 670 tests passed | 2 skipped. Green.

### Open risks
- Legacy wrapped-object restorer branch remains reachable by old pushers (`executeUndoableAction` etc.) — pre-existing, out of scope.
- Manual multi-page verification (plan item f) pending human QA.

## Phase 2 — Wire Undo/Redo buttons, fix Cmd+D

### `src/app/edit/[token]/components/ui/UndoRedoButtons.tsx`
- Replaced hardcoded-`disabled` placeholders with live buttons via existing `useUndoRedo` hook (`./useUndoRedo`, unmodified).
- **Hook return shape used:** `{ handleUndo, handleRedo, canUndo, canRedo }` where `canUndo`/`canRedo` are BOOLEANS — the hook already invokes the store's `canUndo()`/`canRedo()` internally (with a `typeof === 'function'` safety guard). So wiring is `disabled={!canUndo}` / `disabled={!canRedo}` (NOT `!canUndo()` as the plan sketched — plan wording assumed function shape; boolean is the actual shape).
- Kept markup/icons/layout identical; tooltips updated from "Undo (Not available)" → "Undo (Ctrl+Z)" / "Redo (Ctrl+Y)"; className made conditional (enabled: gray-600 + hover; disabled: prior gray-300 cursor-not-allowed styling preserved).
- Removed now-unused `useEffect` import.

### `src/hooks/editStore/uiActions.ts`
- `handleKeyboardShortcut`: added missing `break;` after the `case 'd':` block (duplicateSection) so it no longer falls through into `case '.':` (advanced-menu side effect). Also re-indented `case '.':` to align with siblings (was mis-indented inside the 'd' block — cosmetic, same edit site).
- Verified by READING (no edits): Cmd+Z undo (line 886), Cmd+Y redo (890), Cmd+Shift+Z redo (918–924) all correctly wired; contentEditable/input guard at 876–879 intact.

### Deviations
- None functional. `disabled={!canUndo}` (boolean) instead of plan's literal `!canUndo()` — hook's actual return shape, per plan's own "check the exact return shape" instruction.

### Test results
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run`: 51 files passed | 1 skipped; 670 tests passed | 2 skipped. Green.

### Open risks / manual QA needed (Slice-1 gate)
- Button interactivity (buttons track stack state; click Undo/Redo works; disabled after page switch per Phase-1 choke-point clear) — manual.
- Cmd+D duplicates selected section WITHOUT advanced-menu side effect; Cmd+. unchanged; shortcuts inert while typing in contentEditable — manual.
