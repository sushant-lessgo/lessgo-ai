# edit-header-actions — implementation audit

**Files changed**
- `src/hooks/editStore/historyHelpers.ts` (NEW)
- `src/hooks/editStore/contentActions.ts`
- `src/hooks/editStore/uiActions.ts`
- `src/hooks/editStore/pageHelpers.ts`

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
