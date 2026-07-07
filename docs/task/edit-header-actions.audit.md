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

## Phase 4 — Baseline capture + persistence (`content.baseline`)

### Files changed
- `src/types/store/state.ts`
- `src/stores/editStore.ts`
- `src/hooks/editStore/persistenceActions.ts`
- `src/hooks/editStore/generationActions.ts`
- `src/utils/autoSaveDraft.ts`
- `src/app/api/saveDraft/route.ts`
- `src/app/api/loadDraft/route.ts`
- `src/types/store/actions.ts`

### Per-file changes
- **`src/types/store/state.ts`** — `PersistenceSlice` gains `baseline: Record<string, any> | null` (full `export()` payload — covers content/sections/layouts/theme/**pages/currentPageId/chrome**/forms for free) and `baselineDirty: boolean`, both doc-commented "NEVER in partialize".
- **`src/stores/editStore.ts`** — `createInitialState`: `baseline: null`, `baselineDirty: false` in the Persistence Slice block. `partialize` is an ALLOWLIST — neither key added, so both are excluded from localStorage persistence (no partialize edit needed; verified).
- **`src/hooks/editStore/persistenceActions.ts`** —
  - New `captureBaseline()`: `get().export()` OUTSIDE any producer, then `set` assigns `state.baseline` + `baselineDirty = true`. Does NOT set `persistence.isDirty` (baseline rides the next natural autosave). Comment forbids calling it from inside a `set()` producer.
  - New `markBaselineSaved()`: clears `baselineDirty` (named action for the plain-util autoSave path).
  - `loadFromDraft`: reads `storedBaseline = apiResponse.baseline ?? apiResponse.content?.baseline ?? null` before the producer. Present → hydrated INSIDE the producer via `deepClone` plain assignment, `baselineDirty = false`. Absent → `get().captureBaseline()` runs **after the big hydration `set()` producer returns** (post-commit, so `export()` sees hydrated state) — this one path is BOTH initial-gen capture and legacy backfill.
  - `save()`: computes `shipBaseline` from `baselineDirty && baseline` before the fetch; spreads `baseline` into the POST body only then; success `set` clears `baselineDirty` inline only when this request shipped it.
- **`src/hooks/editStore/generationActions.ts`** — `regenerateAllContent`: `get().captureBaseline()` after the loop + `pushFullContentEntry()`, in the try path only (already outside any `set()`). NOT added to the outer catch (unexpected mid-loop crash shouldn't enshrine a half-regenerated page as "the generation"). Per-section/element regen and `updateFromAIResponse` get no capture.
- **`src/utils/autoSaveDraft.ts`** — inside the `includePageData` block (after `payload.finalContent` assembly): reads the store via `storeManager.getEditStore(tokenId).getState()`; `payload.baseline = baseline` only when `baselineDirty && baseline`. On successful response, `payload.baseline !== undefined` → `markBaselineSaved()` via the store. Both wrapped in try/catch (warn-only), matching the file's existing store-access pattern.
- **`src/app/api/saveDraft/route.ts`** — after the `finalContent` block: `if (body.baseline !== undefined) updatedContent.baseline = body.baseline` — wholesale REPLACE, never deep-merge. Absent → preserved via the existing `{...existingContent, onboarding}` spread (verified: spread carries all non-`onboarding` keys; `finalContent` merge behavior untouched).
- **`src/app/api/loadDraft/route.ts`** — response gains `baseline: content.baseline ?? null` alongside `finalContent`.
- **`src/types/store/actions.ts`** — carried-over Phase-3 fix: `regenerateSection` widened to `(sectionId: string, userGuidance?: string, options?: { suppressHistory?: boolean }) => Promise<void>` (matches the aiActions implementation; behavior-free). Also declared `captureBaseline: () => void` and `markBaselineSaved: () => void` in `MetaActions` (next to `save`/`loadFromDraft`, whose implementations live in the same persistenceActions file).

### Deviations
- **`baseline` read from raw `body` in saveDraft, not from `validationResult.data`:** `DraftSaveSchema` (`src/lib/validation.ts`) strips unknown keys, and validation.ts is NOT in this phase's Files-touched list. Adding `baseline: z.unknown().optional()` there would be validation-equivalent to reading the raw body (finalContent is already `z.unknown()`), so the conservative in-scope option was raw-body read with a comment. If the reviewer prefers the schema key, it's a 1-line validation.ts change in a later phase.
- **`actions.ts` gained the two baseline action declarations** beyond the mandated `regenerateSection` fix — required for `tsc` (`EditStore extends MetaActions`; `get().captureBaseline()` and `editStoreState.markBaselineSaved()` are typed calls). No behavior.
- **`captureBaseline()` not called in `regenerateAllContent`'s outer catch** (only after the loop in the try path). Task said "after the loop completes"; the outer catch is an unexpected mid-loop crash — refreshing the baseline there would enshrine a half-regenerated page as the Reset target. Per-section failures inside the loop still reach the try-path capture (loop catches per-section errors), matching "fully/partially successful loop".
- `loadFromDraft` also tolerates `apiResponse.content.baseline` (raw-project shape) as a fallback, mirroring the file's existing `finalContent || content?.finalContent` tolerance. Primary path is the new top-level `baseline` from loadDraft.

### Test results
- `npx tsc --noEmit`: clean (no output).
- `npm run test:run`: **51 files passed | 1 skipped; 670 tests passed | 2 skipped.** No failures.

### Manual items for Phase-5 / final QA (not automatable)
- Fresh generation → open editor → make one edit → autosave → DB `Project.content.baseline` exists and mirrors the pristine post-gen state, NOT the edit (proves capture ran post-hydration, pre-edit).
- Further edits/autosaves leave DB baseline byte-identical; network tab: `baseline` absent from routine save bodies (dirty flag works).
- BOTH save paths clear the flag: `persistenceActions.save()` (inline) and `completeSaveDraft` → `markBaselineSaved()`.
- Regen Copy → the NEXT save ships a refreshed baseline exactly once.
- Pre-existing project with no stored baseline → loads without crash; baseline captured from load-time state (backfill).
- Publish flow unaffected (`/api/publish` reads `finalContent`; baseline sits beside it in `content`).

### Open risks / notes
- Reset is NOT built this phase — baseline is captured-but-unused (safe intermediate; Phase 5 consumes it).
- What Reset will NOT revert (plan step 7, for the record): `templateId/variantId/paletteId` and `Project.themeValues` (e.g. vestria `mood`) live OUTSIDE the exported in-store `theme` — post-generation mood/template switches are not restored by baseline. Known limitation vs the spec's "restores copy + theme".
- `content` column roughly doubles when baseline is present (accepted at the gate).
- If a baseline-carrying autosave fails, the flag stays dirty and baseline simply rides the next save attempt (retry-safe by construction).
