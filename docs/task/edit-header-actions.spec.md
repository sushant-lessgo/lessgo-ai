# Edit-header actions (Regen Copy / Undo / Redo / Reset) — spec

## Problem / why
The right side of the /edit/[token] header ships four actions that don't behave as users expect:
- **Undo / Redo** are dead placeholder buttons — hardcoded `disabled` (`UndoRedoButtons.tsx:11-29`). A store history stack exists but the most common edit — inline text typing (`contentActions.ts:updateElementContent`) — never feeds it, so coverage is partial regardless.
- **Reset** restores design/theme only, NOT copy (`layoutActions.ts:602`) — surprising when the button reads "Reset."
- **Regen Copy** rewrites all copy in-place with no way back except a warning that "edits will be lost" (`generationActions.ts:544`).

Net: the editor's safety net looks present but is untrustworthy — punishes experimentation in an AI-draft-then-edit product.

## Goal
Make the four header actions trustworthy. A single, comprehensive in-session Undo/Redo stack that covers everything including inline typing; wired buttons + keyboard shortcuts; Reset restores the full original generation (copy + theme); and Regen Copy becomes revertible via that same Undo stack. No new revert/version UI — one dependable stack + Reset.

## Scope OUT (non-goals)
- **Version history UI** — no timeline, named versions, or compare-two-versions panel.
- **Per-section revert UI** — reversion is via Undo only.
- **Cross-session undo** — stack is in-memory per edit session; closing the tab clears it (not persisted to DB).
- **Redesigning Regen Copy** — keep the current confirm→replace flow (no side-by-side/streaming); only make it undoable.

## Constraints
- The undo/redo **store machinery already exists** (`uiActions.ts:667/728/789/794/801`, `state.history.undoStack/redoStack`). Extend it; don't build a parallel system. Note the unused `useAutoSave.ts` / `useStatePersistence.ts` snapshot systems — do NOT wire those to the header.
- Text-edit history must be **debounced** so typing doesn't create one undo entry per keystroke (choose a sane grouping interval).
- **Reset-to-copy needs a stored baseline snapshot** — none exists today. Baseline captured on **initial generation** and on **each Regen Copy** (full-page gen events only; per-section/element regen count as edits, not baseline updates). Manual edits never touch the baseline.
- **Pre-existing pages have no baseline** → lazily capture current content as baseline on first load (imperfect but pragmatic) so Reset doesn't hard-fail on old projects.
- Storing the baseline likely adds a **Project field → Prisma migration** (`prisma migrate dev`, dual-renderer/dev-prod reconcile).
- Must not regress autosave (1s poller, last-write-wins `POST /api/saveDraft`) or publish.
- Fix the literal `Cmd+D` missing-`break` fallthrough bug (`uiActions.ts:881`) while wiring shortcuts.

## References
- Header container + button order: `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx` (Regen → UndoRedo → Reset → Preview).
- Undo/redo UI (dead): `src/app/edit/[token]/components/ui/UndoRedoButtons.tsx`; real-but-unused hook `useUndoRedo.ts` (already wires `undo/redo/canUndo/canRedo`).
- History stack + actions: `src/hooks/editStore/uiActions.ts`.
- Ops that push history today: `layoutActions.ts`, `sectionCRUDActions.ts`, `regenerationActions.ts:127/315`, `formsImageActions.ts`. Gap: `contentActions.ts:57` (`updateElementContent`) pushes nothing.
- Regen Copy: `generationActions.ts:544` → `regenerationActions.ts:77/261` → `POST /api/regenerate-content`.
- Reset: `ResetButton.tsx:28` → `useResetSystem.ts` → `layoutActions.ts:602 resetToGenerated()`.

## Open exploration questions (feeds scout)
- Exact shape/size of a history entry — is it a full content snapshot or a diff? Can it hold the whole `content` map cheaply, or does typing coverage force a lighter delta?
- Where to store the original-generation baseline: new `Project` column vs. a slot inside existing `content`/`themeValues`/`computedDesign` JSON.
- Does `resetToGenerated()` become "apply baseline snapshot" wholesale, or keep its theme-derivation path and add copy on top?
- How autosave interacts with undo (does an undo re-mark dirty and persist? does it clobber via last-write-wins?).
- What clears the stack (load, reset, regen)? Confirm expected boundaries.

## Candidate human gates
- Prisma schema change for the baseline snapshot field (migration on dev+prod).
- Any change to `POST /api/regenerate-content` or generation-time persistence (baseline capture).
- Backfill/lazy-capture behavior for existing production pages.

## Acceptance criteria
- [ ] Typing copy then Undo reverts that text change; Redo re-applies it.
- [ ] Undo/Redo buttons enable/disable per `canUndo`/`canRedo`; are no longer hardcoded disabled.
- [ ] Keyboard shortcuts (Undo / Redo) work; the `Cmd+D` fallthrough bug is fixed.
- [ ] Regen Copy → Undo restores the pre-regen copy.
- [ ] Reset restores BOTH copy and theme to the most-recent-generation baseline.
- [ ] Baseline is captured on initial generation and refreshed on each Regen Copy; manual edits don't change it.
- [ ] Pre-existing pages don't crash on Reset — baseline is lazily captured.
- [ ] No regression: autosave still saves, publish still works, no data loss on undo/redo.

## Pilot / smallest slice
**Slice 1 (trust fix, no schema):** make inline text edits feed the existing history stack (debounced) + wire the dead Undo/Redo buttons and shortcuts + fix `Cmd+D`. This alone makes Regen Copy and section/layout ops revertible via Undo and proves the core value.
**Decision gate:** confirm undo feels right (granularity, autosave interaction) before the heavier **Slice 2** — baseline snapshot storage (Prisma), Reset-restores-copy, and lazy backfill for old pages.
