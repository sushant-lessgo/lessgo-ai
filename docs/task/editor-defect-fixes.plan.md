# editor-defect-fixes — plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\editor-defect-fixes`
- **Branch:** `feature/editor-defect-fixes` (hard-stop if `git branch --show-current` mismatches)
- **Tier: FULL** — auto-escalated from `standard` by the orchestrator because Files-touched hits editor-store internals (`src/hooks/editStore/`), a risky surface.
- **Spec:** `docs/task/editor-defect-fixes.spec.md`

## Overview

Pure removal/cleanup, no new behavior. Two 🔴 editor defects: (1) `convertCTAToForm` crashes on use by writing a phantom `state.forms.formBuilder.visible` — the feature is deleted entirely (action, type decl, UI trigger); (2) `GlobalButtonConfigModal` is mounted twice (EditLayout + GlobalModals) causing a Radix cross-aria-hide a11y bug — the EditLayout mount is deleted, keeping the canonical GlobalModals mount. A second, droppable phase sweeps the `formBuilder` store slice + the two dead `showFormBuilder`/`hideFormBuilder` duplicates (persistenceActions + uiActions) that are shadowed by the live formActions pair.

### Store composition fact (load-bearing for Phase 2)

`showFormBuilder`/`hideFormBuilder` has **THREE** impls, composed by spread in `src/stores/editStore.ts` — **last spread wins**:

1. `persistenceActions.ts:816–824` — spread FIRST (`editStore.ts:423`). DEAD: always overridden, and writes the phantom `state.forms.formBuilder.visible`.
2. `uiActions.ts:448–458` — spread at `editStore.ts:425`. Writes `formBuilderOpen` correctly but is itself DEAD-SHADOWED by (3).
3. `formActions.ts:137–149` (via `createFormsImageActions`) — spread LAST (`editStore.ts:426`). **This is the LIVE/canonical pair** (writes `formBuilderOpen`). `FormBuilder.test.tsx:12–17` documents this spread-order explicitly.

## Progress log

- phase 1 core removals (convertCTAToForm + modal de-dup): pending
- phase 2 dead-code sweep (formBuilder slice + dead duplicates): pending

---

## Phase 1 — Core removals: delete `convertCTAToForm` + de-dup `GlobalButtonConfigModal`

This phase alone satisfies the spec's primary acceptance criteria.

### Files touched

1. `src/hooks/editStore/uiActions.ts` — delete action impl (lines ~460–491) AND trim the now-stale crash-history comment at ~430–447 (it narrates the convertCTAToForm crash / cites ButtonConfigurationModal :486 — survives grep-clean since it lacks the literal `convertCTAToForm`, but is stale once the action is gone)
2. `src/types/store/actions.ts` — delete type decl (line ~180)
3. `src/app/edit/[token]/components/layout/MainContent.tsx` — delete `case 'convert-form':` block (lines ~318–322)
4. `src/app/edit/[token]/components/layout/EditLayout.tsx` — delete `<GlobalButtonConfigModal />` mount (line ~223), its import (line ~11), and any stale comment referencing it (check line ~139)

Nothing outside this list may be edited.

### Steps

1. **Re-grep to confirm** (scout findings are verified, but re-confirm before cutting):
   - `convertCTAToForm` → exactly 3 hits (uiActions.ts impl, actions.ts decl, MainContent.tsx caller).
   - `'convert-form'` → exactly 1 hit (MainContent.tsx case block).
   - `GlobalButtonConfigModal` mounts → exactly 2 (`EditLayout.tsx:223`, `GlobalModals.tsx:99`), both bare `<GlobalButtonConfigModal />` (no props → no config divergence).
   - If counts differ, STOP and report to orchestrator; do not widen scope.
2. Delete the whole `convertCTAToForm` action from `uiActions.ts` (the crash site `:489` goes with it) and trim the stale crash-history comment at ~430–447. Do NOT touch the `showFormBuilder`/`hideFormBuilder` pair at `uiActions.ts:448–458` in this phase — it's dead-shadowed and Phase 2 sweeps it.
3. Delete the `convertCTAToForm` decl from `src/types/store/actions.ts:180`. No other slice type declares it — do not touch anything else in the file.
4. Delete the entire `case 'convert-form':` block in `MainContent.tsx` `executeContextualAction` (~318–322). **DO NOT touch** `ElementToolbar.tsx:163 canConvertToForm()` — different gate (button-settings visibility), unrelated despite the name.
5. In `EditLayout.tsx`: delete the `<GlobalButtonConfigModal />` mount at ~223, the now-unused import at ~11, and clean the stale comment at ~139 if it references the mount. KEEP the `GlobalModals.tsx:99` mount untouched (canonical modal aggregator, mounted at `MainContent.tsx:682`).

**Implementer confidence note:** the de-dup is font/DOM-safe — `ButtonConfigurationModal` renders via `createPortal`, and both mounts render the identical component off identical `useButtonConfigModal` global state, so removing EditLayout's `.app-chrome`-wrapped copy has zero DOM/font consequence.

### Verification

- Grep-clean: `convertCTAToForm` → 0 hits in `src/`; `'convert-form'` → 0 hits.
- `GlobalButtonConfigModal`: assert **0 mounts and 0 imports remain in `EditLayout.tsx`**. The following hits are EXPECTED to remain and are correct: `GlobalButtonConfigModal.tsx:6` (def), `GlobalModals.tsx:3` (import), `GlobalModals.tsx:99` (mount), `src/components/README.md:13` (doc). Do NOT gate on a total-hit count.
- Parity spot-check (spec constraint): grep `convertCTAToForm|formBuilder` across `*.published.tsx`, `LandingPagePublishedRenderer`, `componentRegistry.published` → 0 hits (scout already confirmed clear; re-confirm).
- `npx tsc --noEmit` green (catches any dangling reference).
- `npm run test:run` green (no test references `convertCTAToForm` per scout — suite should be unaffected).
- `npm run lint` green (catches the unused import if missed).
- `npm run build` green (~2 min).

### e2e decision (Deterministic-QA rule)

**No new Playwright spec.** Justification: asserting "single dialog in the a11y tree" requires an authed editor session (Clerk via `auth.setup.ts`) + a seeded project + driving the editor UI to open button settings — heavy setup for a one-line DOM-count assertion, and the duplicate mount is already structurally impossible after this phase (one mount site remains; `tsc` + grep prove it). The behavioral check ("popup opens / edits / closes, single dialog in a11y tree") is the **founder eyeball at the merge gate** (per spec §Candidate human gates), not a mid-pipeline gate.

### Human gate

None mid-pipeline. Founder eyeball of the button-settings popup (opens/edits/closes, single dialog in devtools a11y tree) happens at the merge gate.

---

## Phase 2 — Dead-code sweep: orphaned `formBuilder` slice + dead `show/hideFormBuilder` duplicates

Isolated so it can be **dropped entirely** if the confirm-grep finds any live reader. Justified by the spec's "no dead types — grep-clean" acceptance criterion.

**Decision on the `uiActions.ts:448–458` pair: SWEEP IT.** Reasoning: it is dead-shadowed (formActions' pair is spread last at `editStore.ts:426` and wins), and a "grep-clean / remove dead duplicates" phase that leaves a dead shadowed duplicate behind is incomplete. Safety: the type decls at `actions.ts:178–179` and `formActions.ts:21–22` are satisfied by formActions' live impl alone; deleting uiActions' copy changes nothing at runtime. If the implementer's closer read finds the deletion breaks the uiActions slice's own type shape (e.g. a `UIActions` interface that declares the pair), keep the pair and document it in the audit as intentionally-kept with a one-line why — don't contort types in a cleanup phase.

### Files touched

1. `src/types/store/state.ts` — delete `FormsSlice.formBuilder` type (lines ~524–529)
2. `src/stores/editStore.ts` — delete `formBuilder` slice init (lines ~296–300)
3. `src/hooks/editStore/persistenceActions.ts` — delete dead duplicate `showFormBuilder`/`hideFormBuilder` (lines ~816–824; spread first at `editStore.ts:423`, always overridden — confirmed SAFE)
4. `src/hooks/editStore/uiActions.ts` — delete dead-SHADOWED duplicate `showFormBuilder`/`hideFormBuilder` (lines ~448–458; overridden by formActions' pair spread last)

Nothing outside this list may be edited. `formActions.ts` (the LIVE pair) is NOT touched.

### Steps

1. **Re-grep to CONFIRM zero readers + spread order across all THREE creators** (mandatory precondition — narrow or drop the phase if any hit is live):
   - `state.forms.formBuilder`, `.formBuilder.visible`, `forms.formBuilder` → after phase 1, only remaining writers should be the dead persistenceActions pair + the editStore.ts init + the state.ts type.
   - Confirm the three-way spread order in `editStore.ts` (`persistenceActions` :423 → `uiActions` :425 → `formActions`/`createFormsImageActions` :426) matches the model above — **formActions' pair must be spread LAST** so deleting the other two leaves it bound. `FormBuilder.test.tsx:12–17` is the documented reference for this.
   - Confirm the `showFormBuilder`/`hideFormBuilder` type decls (`actions.ts:178–179`, `formActions.ts:21–22`) remain satisfied by formActions' impl alone (see decision block above for the fallback if not).
   - Confirm the live consumer `GlobalFormBuilder.tsx:8–22` reads only `formBuilderOpen`/`editingFormId` — NOT the `formBuilder` slice. **Leave it alone.**
   - If any live reader of the `formBuilder` slice exists → narrow the sweep to only the provably-dead pieces and note the residue in the audit; if either duplicate pair turns out load-bearing → keep it and delete only the provably-dead pieces.
2. Delete `FormsSlice.formBuilder` from `state.ts` (~524–529).
3. Delete the `formBuilder` init object from `editStore.ts` (~296–300).
4. Delete the duplicate `showFormBuilder`/`hideFormBuilder` from `persistenceActions.ts` (~816–824).
5. Delete the dead-shadowed duplicate `showFormBuilder`/`hideFormBuilder` from `uiActions.ts` (~448–458). The live `formActions.ts:137–149` pair and the type decls are NOT touched.

### Verification

- Grep-clean: `formBuilder` (the slice — not `formBuilderOpen`/`GlobalFormBuilder`) → 0 hits in `src/`; `formBuilder.visible` → 0 hits.
- `showFormBuilder`/`hideFormBuilder` → exactly ONE impl each (`formActions.ts:137–149`) + the existing type decls (`actions.ts:178–179`, `formActions.ts:21–22`); `GlobalFormBuilder.tsx` and `formActions.ts` untouched (git diff shows no change).
- `FormBuilder.test.tsx` still green (it exercises the live pair).
- `npx tsc --noEmit` green.
- `npm run test:run` green.
- `npm run lint` green.
- `npm run build` green — final re-green gate for the feature (spec: `tsc` + `test:run` + `build` + `lint`).

### Human gate

None.

---

## Acceptance mapping

| Spec criterion | Covered by |
|---|---|
| `convertCTAToForm` + all refs removed, grep-clean | Phase 1 steps 2–4 + grep verification |
| Toolbar/menu no longer offers convert-to-form | Phase 1 step 4 (`'convert-form'` case = the only entry point) |
| Modal mounts exactly once; popup still works | Phase 1 step 5 + founder eyeball at merge gate |
| a11y: single dialog in tree | Structural (one mount) + founder eyeball |
| Published parity unaffected | Phase 1 parity grep (already scout-clear) |
| `tsc`/`test:run`/`build`/`lint` green | Both phases' verification |
| No dead types, grep-clean | Phase 2 (droppable if live reader found) |

## Unresolved questions

- None. (e2e call made in-plan: skip Playwright, founder eyeball at merge gate — flag if you want the authed e2e instead.)
