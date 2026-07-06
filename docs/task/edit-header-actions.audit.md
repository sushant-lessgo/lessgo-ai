# edit-header-actions — implementation audit

**Files changed**
- `src/hooks/editStore/historyHelpers.ts` (NEW)
- `src/hooks/editStore/contentActions.ts`
- `src/hooks/editStore/uiActions.ts`
- `src/hooks/editStore/pageHelpers.ts`
- `src/app/edit/[token]/components/ui/UndoRedoButtons.tsx` (Phase 2)
- `src/hooks/editStore/generationActions.ts` (Phase 3)
- `src/hooks/editStore/aiActions.ts` (Phase 3)
- `src/types/store/state.ts` (Phase 3)

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

## Phase 3 — Regen Copy = one undoable `fullContent` entry

### `src/types/store/state.ts`
- Widened `EditHistoryEntry.type` union: `'content' | 'layout' | 'theme' | 'section' | 'fullContent'`. No other change.

### `src/hooks/editStore/historyHelpers.ts`
- New `FullContentSnapshot` type: `{ content, sections, sectionLayouts, theme? }`.
- New `snapshotPageContent(state, theme?)` — deep-copies the ACTIVE page's `content`/`sections`/`sectionLayouts` from the passed state; `theme` included ONLY when passed (optional param for future producers; header Regen Copy does NOT pass it — copy-only).
- New `pushHistoryEntry(state, entry)` — generic push: cap enforcement (shift oldest past `maxHistorySize`, fallback 50) + `redoStack` clear, NO coalescing. `pushContentHistoryEntry` now delegates its non-coalesce path to it (behavior identical to Phase 1).

### `src/hooks/editStore/generationActions.ts` — `regenerateAllContent`
- BEFORE the loop: `beforeSnapshot = snapshotPageContent(state)` (committed state from `get()` at fn top; the intervening `set` only touches `aiGeneration`). Theme intentionally NOT snapshotted.
- Loop call changed to `state.regenerateSection(sectionId, undefined, { suppressHistory: true })` (options = 3rd param).
- AFTER the loop: `afterSnapshot = snapshotPageContent(get())`; push exactly ONE `{type:'fullContent', description:'Regenerated all copy', beforeState, afterState}` via `pushHistoryEntry` inside a `set` producer.
- **No-op skip:** push skipped when `JSON.stringify(after) === JSON.stringify(before)` (all sections failed / no change) — no burnt Cmd+Z.
- Push also runs in the outer `catch` (unexpected mid-loop failure): sections already regenerated still get an undo path; the no-op guard makes it safe when nothing changed. Per-section failures are caught inside the loop as before, so the after-loop push covers partial failure.

### `src/hooks/editStore/aiActions.ts` — `regenerateSection`
- Signature extended: `(sectionId: string, userGuidance?: string, options?: { suppressHistory?: boolean })`.
- Inside the apply `set`: `preElements = deepCopy(existingElements)` captured BEFORE mutation; after mutation, when NOT suppressed, ONE `'content'` entry pushed via `pushHistoryEntry` (not the coalescing pusher — avoids two back-to-back section regens coalescing on `elementKey === undefined`): `beforeState={elements: preElements}`, `afterState={elements: deepCopy(updatedElements)}`, `sectionId`. Rides the EXISTING `{elements}` restorer branch — verified it does a full `section.elements = snapshot.elements` swap (uiActions undo ~725 / redo ~794), no per-element wrapping.
- `suppressHistory: true` (full-regen loop) → no push. `completeSaveDraft` call untouched.

### `src/hooks/editStore/uiActions.ts` — undo/redo
- New `'fullContent'` branch in both `undo()` and `redo()`: wholesale replace `state.content`, `state.sections`, `state.sectionLayouts` (and `state.theme` ONLY when the snapshot carries it) from `beforeState` (undo) / `afterState` (redo). Restore assigns `deepCopy(...)` so later draft mutations never touch the stack entry's snapshot. Falls through to the existing `isDirty = true` at branch end (autosave picks it up).

### Deviations
- `src/types/store/actions.ts` declares `regenerateSection: (sectionId, userGuidance?) => Promise<void>` — NOT widened (file not in Phase 3 Files-touched). Harmless: the loop call goes through untyped `get()` (`createGenerationActions(set: any, get: any)`), the new param is optional, and `tsc` is clean. Typed external callers simply can't pass `options` (none need to). Flagging for a future 1-line widening if a typed caller ever needs suppression.
- Per-section regen push uses generic `pushHistoryEntry` instead of `pushContentHistoryEntry` (plan said "via the helper" only for the fullContent entry; coalescing on undefined `elementKey` would wrongly merge two consecutive section regens ≤3s apart). Conservative choice.
- `pushFullContentEntry` also invoked in `regenerateAllContent`'s outer catch — plan said "success OR partial failure"; outer catch is the only path where changed sections would otherwise lose their undo entry. No-op guard prevents spurious entries.

### Test results
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run`: **51 files passed | 1 skipped; 670 tests passed | 2 skipped** (incl. generation-contract tests). No failures.

### Manual items for the Slice-1 gate (not automatable)
- Hand-edit copy in 2 sections → Regen Copy → undo stack gains EXACTLY ONE entry; single Undo restores ALL pre-regen copy incl. hand edits; Redo re-applies.
- Standalone section-toolbar regen → exactly one per-section entry; Undo reverts just that section.
- Images survive regen + undo + redo (image keys/values skipped in merge; snapshots round-trip them).
- All-sections-fail (offline) → NO new undo entry (no-op skip).
- Multi-page: Regen Copy on page A → switch to page B → stack cleared (Phase 1 choke-point), no cross-page fullContent restore.
- Autosave persists undo/redo state within ~1s.

### Open risks
- `fullContent` snapshots are active-page-relative (no `pageId`) — safe ONLY because `loadPageIntoActive` clears the stacks on every swap (Phase 1). Any future swap path bypassing that helper reintroduces cross-page corruption.
- Content-map JSON.stringify equality is key-order-sensitive; a pure reorder would push a technically-no-op entry (undo then harmless). Accepted.
- Two `fullContent` entries roughly double the page-content memory per Regen Copy; capped at 50 entries.
