# Edit-header actions (Regen Copy / Undo / Redo / Reset) — implementation plan (rev 4)

**Branch:** `feature/edit-header-actions`
**Spec:** `docs/task/edit-header-actions.spec.md`
**Revision note:** rev 2 fixed four blocking review findings — (B1) Regen Copy actually runs the per-section loop in `generationActions.regenerateAllContent`, not the `regenerationActions` paths; (B2) `updateElementContent` has three divergent storage paths (dotted collection / raw array / raw string) and history must capture the raw stored value per path; (B3) no existing restorer handles a whole-content-map entry — a new `type:'fullContent'` entry is defined; (B4) baseline capture is caller-driven, and "initial generation" capture = first `loadFromDraft` with no stored baseline. **Rev 3 fixed one new blocker (B5) + six nits:** (B5) multi-page undo across a page switch corrupts the newly-active page — `setCurrentPage` (`pageActions.ts:148-161`) swaps the active page's body into `state.content`/`sections`/`sectionLayouts` but does NOT clear history; history entries carry no `pageId` and restore into whatever page is active → edit page A, switch to B, Undo writes A's snapshot into B, `commitActivePage` persists the corruption (data loss on naayom, violates AC #8). Rev 3's fix was per-site `clearHistory()` in `pageActions.ts`. Nits folded in: baseline capture timing post-`set()`; `markBaselineSaved()` action for the autoSave path; `applySnapshot` theme-merge Reset limitation; `Project.themeValues`/mood not reverted by Reset; `regenerateSection`'s real signature puts `suppressHistory` in the 3rd position; skip the `fullContent` push when Regen Copy produced no change. **Rev 4 fixes B6:** rev 3's per-site clears (`setCurrentPage`/`addPage`/`deletePage`) MISSED three more live swap sites — `applyArchetype` (`pageActions.ts:233`), `addArchetypePage` (`:257/282`), `addCollectionItem` (`:404`) — leaving the same cross-page undo→corruption path open in the naayom collection flow. Every one of these (plus hydration at `persistenceActions.ts:302/324`) swaps the active page via the SHARED helper `loadPageIntoActive` (`src/hooks/editStore/pageHelpers.ts:129`), so the stack reset now lives THERE — the single choke point — covering all current AND future swap sites by construction. Phase 1 touches `pageHelpers.ts` instead of `pageActions.ts`.

## Overview

Make the four edit-header actions trustworthy by extending the EXISTING history stack (`state.history` + `uiActions.ts` undo/redo): inline text edits start feeding history (raw-value capture across all three storage paths, coalesced per element), the dead Undo/Redo buttons go live (shortcuts verified already wired; Cmd+D fallthrough fixed), Regen Copy becomes ONE undoable `fullContent` entry via a pre-loop snapshot inside `regenerateAllContent`, and Reset restores the full most-recent-generation baseline (copy + theme) from a `content.baseline` slot in `Project.content` — no Prisma migration. Two slices: Slice 1 (Phases 1–3, no schema/persistence change) ends in a human decision gate; Slice 2 (Phases 4–5) adds baseline storage + Reset-restore.

Store/header/API-level only. **No block `.tsx` files touched → no `.published.tsx` parity work.** If any phase finds itself editing a block component, stop — out of plan.

## Verified code map (corrections that drive this revision)

- **Regen Copy call chain:** header button (`EditHeaderRightPanel.tsx:95`) → `regenerateAllContent()` (`generationActions.ts:544`) → sequential `for` loop calling `state.regenerateSection(sectionId)` per section (line 561), 800ms apart, progress "X/Y". The REAL `regenerateSection` is `aiActions.ts:13` — signature `(sectionId: string, userGuidance?: string)` (the `contentActions.ts:441` version is a warn-only placeholder, overridden by composition order in `src/stores/editStore.ts:342-350`). It is copy-only (image elements preserved, theme untouched) and **pushes NO undo entry today** — only `queuedChanges` (~line 130) plus a per-section `completeSaveDraft` call (~143). So B1's fix is: ADD a per-section history push (gated), and wrap the full loop in ONE snapshot entry.
- **`regenerationActions.ts` (77/261, pushes at 127/315 with `beforeState:null`)** is a separate "regenerate from input changes" path. Verified: `regenerateContentOnly`/`regenerateDesignAndCopy` have **no UI callers** (only store composition; `utils/regeneration/contentOnlyRegeneration.ts` is itself unimported). Dead from UI → OUT of scope. Its broken `beforeState:null` pushes never fire in practice; left untouched, noted here so nobody "fixes" undo against them.
- **`updateFromAIResponse` (`generationActions.ts:122`)** is called ONLY from regenerationActions:115/303 — never by initial generation, never by `regenerateAllContent`. It needs no history/baseline logic at all in this feature.
- **Initial generation apply site:** onboarding `GeneratingStep.tsx` (product + service) POSTs `finalContent` to `/api/saveDraft`, then redirects to `/edit/[token]`; the edit store first sees generated content in `loadFromDraft`. → Initial-gen baseline capture = capture in `loadFromDraft` when the server returned no baseline. This is the SAME mechanism as legacy-page backfill (one code path covers both).
- **`updateElementContent` (`contentActions.ts:57`) has THREE early-return storage paths:** (a) dotted nested-collection path e.g. `features.f1.visual` (~84–134): mutates `elements[collectionName]` as an ARRAY; (b) raw array content (~138–174): `elements[elementKey] = array`; (c) raw string (~176–238): `elements[elementKey] = string`. V2 stores raw values, NOT `{content,type,...}` objects.
- **Existing content restorer (`uiActions.ts:703-721`)** rebuilds a wrapped `{content,type,isEditable,editMode}` object — this CORRUPTS V2 raw-string elements on undo (pre-existing bug; nothing pushes that shape from text edits today, which is why it's latent). No branch restores a whole content map. `EditHistoryEntry.type` union (`state.ts:90`) = `'content'|'layout'|'theme'|'section'` — must be widened.
- **Multi-page page switching (B5/B6):** every active-page swap flows through the shared Immer-draft helper `loadPageIntoActive` (`pageHelpers.ts:129-142`), which overwrites `state.currentPageId`/`sections`/`sectionLayouts`/`sectionSpacing`/`content`. Verified call sites: `setCurrentPage` (pageActions.ts:157), `addPage` (:198), `applyArchetype` (:233), `addArchetypePage` (:257/282), `deletePage` fallback (:305), `addCollectionItem` (:404), plus load-time hydration (persistenceActions.ts:302/324). History is NOT cleared at any of these, and entries (both `'content'` and the new `'fullContent'`) carry no `pageId` — they restore into the ACTIVE page. Once this plan makes undo reachable (Phase 2 live buttons; Cmd+Z fires whenever focus isn't in a contentEditable — true right after clicking page nav), undo-after-switch writes page A's snapshot into page B and `commitActivePage` persists it. Fix (Phase 1, where history first becomes reachable): reset the stacks INSIDE `loadPageIntoActive` — the single choke point — with a direct draft mutation (`state.history.undoStack = []; state.history.redoStack = [];`, matching uiActions' existing direct-mutation pattern; the `clearHistory()` store action isn't callable from this plain helper). Undo does not cross page boundaries (acceptable under the spec's in-session scope). The hydration calls (persistenceActions:302/324) also hit the reset — clearing history on load is already desired, and the overlap with Phase 5's explicit `clearHistory()` on `loadFromDraft` is an idempotent double-clear (harmless).
- **Shortcuts (`uiActions.ts:855`):** Cmd+Shift+Z redo IS already wired (lines 901–908) — verified, no work needed. Cmd+D missing `break` confirmed (~885 falls into `case '.':`).
- **Persistence:** TWO save paths ship `finalContent`: `persistenceActions.save()` (line 33) and `utils/autoSaveDraft.ts` `completeSaveDraft` (fetch at 282) — both must carry baseline. `saveDraft/route.ts` builds `updatedContent = {...existingContent, onboarding}` and shallow-merges `finalContent` (137–154); an absent key survives via the spread, so baseline handling = explicit wholesale replace when present, untouched when absent. `loadFromDraft` DOES hydrate pages/chrome (persistenceActions.ts:273–325); `export()` includes `pages/currentPageId/chrome` (353–384). **Hydration happens inside ONE `set()` producer (~90–340), and `export()` reads COMMITTED state via `get()` — so any capture that calls `export()` must run AFTER that `set()` returns, never inside it.**

## Design decisions

1. **Baseline storage = `content.baseline` slot inside existing `Project.content` JSON** (alongside `content.onboarding`/`content.finalContent`). NOT a new Prisma column. Zero migration; rides the saveDraft upsert atomically. Cost: content column roughly doubles when baseline present. Still **flagged as human gate in Phase 4** (storage-shape commitment; alternative = `Project.originalGeneration Json?` column + `prisma migrate dev` on dev+prod).
2. **`resetToGenerated()` becomes wholesale apply-baseline** via a shared `applySnapshot()` extracted from `loadFromDraft` (so Reset inherits pages/chrome/forms hydration). Current derive-from-onboarding path kept ONLY as no-baseline fallback (should be unreachable given load-time capture). **Known limitation:** the extracted hydration restores theme via MERGE (`{...state.theme, ...theme}`, persistenceActions.ts:149), not wholesale — a theme key ADDED post-generation would not be cleared by Reset. Minor in practice because the baseline `export()` carries a FULL theme (every key it knew at capture gets overwritten back), so only genuinely new keys survive; accepted, not re-engineered here.
3. **Text history entry captures the RAW stored value per storage path** (fixes B2 + the latent restorer-corruption bug): `beforeState`/`afterState` = `{ storageKey, value }` where `storageKey` = `collectionName` for dotted paths, else `elementKey`; `value` = deep copy of the raw stored value (string, array, or collection array). Restorer assigns the raw value back to `elements[storageKey]` — never synthesizes a `{content,type,isEditable,editMode}` wrapper. Legacy `{elementKey, content}` / `{elements}` branches stay for other pushers, but are explicitly NOT the model for new entries (they are the broken shape — do not extend them).
4. **Coalescing at the push layer** (no typing debounce; `updateElementContent` fires per commit): if top-of-undoStack is `type:'content'`, same `sectionId` + same ORIGINAL elementKey (the full dotted key for collection edits), within **3s**, mutate top entry's `afterState`+`timestamp` instead of pushing. Note: two edits to different items of the same collection = different dotted keys = separate entries; each entry's collection-array snapshot sequences correctly under stack-ordered undo.
5. **NEW entry `type:'fullContent'`** (B3): `beforeState`/`afterState` = `{ content, sections, sectionLayouts, theme? }` (deep copies; theme included only when the producing operation touches it — header Regen Copy does NOT, it's copy-only). `undo()`/`redo()` get a dedicated branch that swaps the ENTIRE active-page `state.content` map + `sections` + `sectionLayouts` (+ `theme` when present) in one step. Type union in `state.ts` widened.
6. **Full Regen Copy = exactly ONE undo entry** (B1): `regenerateAllContent` deep-copies `{content, sections, sectionLayouts}` BEFORE the loop, pushes one `fullContent` entry AFTER the loop (also on partial failure — undo then restores pre-regen state for whatever completed). **Skip the push when the after-snapshot deep-equals the before-snapshot** (e.g. every section failed) — a `beforeState===afterState` entry is a no-op undo that burns the user's Cmd+Z. `regenerateSection` gains its own single `'content'`-style entry (before/after `elements` of that section) for standalone toolbar use, gated by a new **third** parameter `options?: { suppressHistory?: boolean }` (signature is `(sectionId, userGuidance?)` at `aiActions.ts:13`, so the loop call becomes `regenerateSection(sectionId, undefined, { suppressHistory: true })`). Verified nothing pushes today → we are ADDING the per-section push and gating it in the same phase (no double-entry window ever exists).
7. **Baseline capture is caller-driven** (B4): new `captureBaseline()` store action (`state.baseline = export()`, sets `baselineDirty`). Callers: (a) `loadFromDraft` when the server returned no baseline — covers BOTH initial generation (first editor load after onboarding gen is pristine post-gen state) AND legacy-page backfill (load-time content enshrined as "original", per spec). **Call placement: AFTER the big hydration `set()` producer returns** — `captureBaseline` calls `export()`, which reads committed state via `get()`; invoking it inside the producer (or inside `applySnapshot`) would snapshot stale pre-hydration state. (b) `regenerateAllContent` after a successful loop. `updateFromAIResponse` NEVER captures (it can't distinguish its callers and doesn't need to). Per-section/element regen and manual edits never call it.
8. **Baseline dirty flag** (payload cost): baseline is included in a save payload ONLY when `baselineDirty` is set (by `captureBaseline`), cleared on successful save that shipped it. Clearing has two sites: `persistenceActions.save()` clears it inline (it lives in the store), while `utils/autoSaveDraft.ts` is a plain util with no inline setter — it calls a new named store action **`markBaselineSaved()`** on success.
9. **Stack lifecycle:** history entries are ACTIVE-PAGE-relative (no `pageId`) and must not survive a body swap (B5/B6). The reset lives at the SINGLE choke point `loadPageIntoActive` (`pageHelpers.ts:129`) — the shared helper through which EVERY active-page swap runs (`setCurrentPage`, `addPage`, `deletePage`, `applyArchetype`, `addArchetypePage`, `addCollectionItem`, and load-time hydration at `persistenceActions.ts:302/324`) — so every current AND future swap site is covered by construction, with no per-site enumeration to maintain. Undo never crosses a page boundary. Clearing on load is desired anyway; the overlap with Phase 5's explicit `clearHistory()` on `loadFromDraft` and on Reset is idempotent (harmless double-clear). Regen Copy does NOT clear — it pushes the `fullContent` entry. History stays out of `partialize` (never persisted).
10. **Undo/redo + autosave:** existing `undo()`/`redo()` set `isDirty=true` (uiActions.ts:723/784) → 1s poller persists reverted state; new branches must do the same. Do NOT touch `useStatePersistence.ts` or useAutoSave's VersionManager path.
11. **50-entry cap:** the new push helper enforces `maxHistorySize` + clears redoStack. The ~40 pre-existing inline `undoStack.push` sites are NOT swept here (separate cleanup).

---

## Slice 1 — trust fix, no schema

### Phase 1 — History plumbing: text edits feed the stack (all three storage paths), raw-value restore, page-swap choke-point clear

**Files touched:**
- `src/hooks/editStore/historyHelpers.ts` (NEW — plain module, no 'use client')
- `src/hooks/editStore/contentActions.ts`
- `src/hooks/editStore/uiActions.ts`
- `src/hooks/editStore/pageHelpers.ts`

**Steps:**
1. `historyHelpers.ts`: `pushContentHistoryEntry(state, entry)` — cap enforcement (shift oldest), clears `redoStack`, 3s coalesce on (`type:'content'`, same `sectionId`, same original `elementKey` incl. dotted). Also export a `deepCopy` util (JSON clone, matching persistenceActions' pattern).
2. `contentActions.ts` `updateElementContent`: add a history push at EACH of the three mutation sites, capturing the raw stored value (Design decision 3):
   - Dotted-collection path (~84–134): `beforeState={storageKey: collectionName, value: oldCollection}` (already computed at line 91), `afterState={storageKey: collectionName, value: updatedCollection}`; entry `elementKey` = full dotted key (coalesce identity).
   - Array path (~138–174): before/after = raw arrays under `storageKey: elementKey`.
   - String path (~176–238): before/after = raw strings under `storageKey: elementKey`.
   - Skip push when value unchanged (string equality / JSON-equal arrays). Leave `queuedChanges` + `isDirty` behavior untouched.
3. `uiActions.ts` undo (703–721) / redo (equivalent) content branches: add handling for the new `{storageKey, value}` shape FIRST — assign `section.elements[storageKey] = deepCopy(value)` (raw, no wrapper). Keep legacy `{elementKey, content}` / `{elements}` branches for existing pushers, with a code comment that the legacy per-element branch synthesizes a wrapped object that does NOT match V2 raw storage (known pre-existing corruption — new entries must never use it). Confirm both paths set `isDirty=true`.
4. **`pageHelpers.ts` (B5/B6): reset history at the single choke point** — inside `loadPageIntoActive` (:129), after the body-swap assignments, add `state.history.undoStack = []; state.history.redoStack = [];` (guard `if (state.history)`; direct draft mutation matches uiActions' existing pattern — the `clearHistory()` store action isn't callable from this plain helper). This is the ONE helper through which `setCurrentPage`/`addPage`/`deletePage`/`applyArchetype`/`addArchetypePage`/`addCollectionItem` (pageActions.ts) AND load-time hydration (persistenceActions.ts:302/324) all swap the active page — so every current and future swap site is covered by construction; no per-site enumeration. Hydration-time clearing is desired anyway (fresh load = empty history); the later explicit `clearHistory()` on `loadFromDraft` (Phase 5) becomes an idempotent double-clear — harmless. Done in THIS phase because this is where history first becomes genuinely reachable (text edits start pushing; buttons go live next phase) — undo entries are active-page-relative and must never outlive the page whose body they snapshot.

**Verification:** `npx tsc --noEmit` clean; `npm run test:run` green. Manual (`npm run dev`): (a) edit a headline (string path), blur, devtools `undo()` → raw string restored (inspect store: element is a STRING, not a `{content,...}` object); `redo()` re-applies; (b) edit a feature-card field (dotted collection path) → undo restores the collection array intact; (c) edit a list/array element → undo restores the array; (d) two rapid commits to the same element <3s coalesce to one entry; different elements = two entries; (e) autosave persists undone state within ~1s; **(f) multi-page (naayom-style): edit copy on page A → switch to page B (`setCurrentPage`) → undo stack is EMPTY (Cmd+Z / devtools `undo()` is a no-op — page B content untouched, no cross-page restore); repeat after `addPage` and `deletePage`; ALSO exercise the collection/archetype path: edit copy on page A → Add product via the Products panel (`addCollectionItem`) and/or add an archetype page → confirm stack empty after the swap, no cross-page corruption; switch back to A → A's edit persisted correctly.**

---

### Phase 2 — Wire Undo/Redo buttons, fix Cmd+D

**Files touched:**
- `src/app/edit/[token]/components/ui/UndoRedoButtons.tsx`
- `src/hooks/editStore/uiActions.ts`

**Steps:**
1. `UndoRedoButtons.tsx`: replace hardcoded-`disabled` placeholders with the existing `useUndoRedo` hook (`ui/useUndoRedo.ts`, no changes expected): `onClick={handleUndo/handleRedo}`, `disabled={!canUndo()/!canRedo()}`. Keep markup/tooltips.
2. `uiActions.ts` `handleKeyboardShortcut`: add missing `break;` after `case 'd':` (~885) so it no longer falls into `case '.':`. Verified already-wired (no changes): Cmd+Z undo (869), Cmd+Y redo (873), Cmd+Shift+Z redo (901–908) — the shift branch EXISTS; re-confirm by test, not by edit.

**Verification:** `npx tsc --noEmit`; manual: buttons track stack state; click Undo/Redo works; Cmd/Ctrl+Z, Cmd/Ctrl+Y, Cmd+Shift+Z all work outside text fields and are inert while typing in contentEditable (guard at 858–862); Cmd+D duplicates selected section WITHOUT the advanced-menu side effect; Cmd+. behavior unchanged; multi-page: after a page switch the buttons show disabled (stack cleared per Phase 1).

---

### Phase 3 — Regen Copy = one undoable `fullContent` entry

**Files touched:**
- `src/hooks/editStore/generationActions.ts`
- `src/hooks/editStore/aiActions.ts`
- `src/hooks/editStore/uiActions.ts`
- `src/hooks/editStore/historyHelpers.ts`
- `src/types/store/state.ts`

**Steps:**
1. `state.ts`: widen `EditHistoryEntry.type` union with `'fullContent'`.
2. `historyHelpers.ts`: add `snapshotPageContent(state)` → deep copy of `{content, sections, sectionLayouts}` (active page; theme optional param for future producers).
3. `generationActions.ts` `regenerateAllContent` (544): take the snapshot BEFORE the loop; run the loop calling `regenerateSection(sectionId, undefined, { suppressHistory: true })` (the options object is the **3rd** param — real signature at aiActions.ts:13 is `(sectionId, userGuidance?)`); AFTER the loop (success or partial failure), take the after-snapshot and push ONE entry `{type:'fullContent', description:'Regenerated all copy', beforeState, afterState}` via the helper (coalescing not applicable — different type). **Skip the push when after deep-equals before** (all sections failed / loop produced no change) — never push a no-op entry. Theme intentionally NOT in the snapshot: this path is copy-only (verified image/theme preservation in aiActions merge, 75–108).
4. `aiActions.ts` `regenerateSection` (13): extend signature to `(sectionId: string, userGuidance?: string, options?: { suppressHistory?: boolean })`. On apply (inside the `set` at ~70–139), when NOT suppressed, push one `'content'` entry with `beforeState={elements: deepCopy(pre)}` / `afterState={elements: deepCopy(post)}` + `sectionId` — this rides the EXISTING `{elements}` restorer branch (whole-elements swap is shape-safe, unlike the per-element legacy branch). When suppressed (full regen), push nothing. Do not change its `completeSaveDraft` behavior.
5. `uiActions.ts` undo/redo: add the `'fullContent'` branch — replace `state.content`, `state.sections`, `state.sectionLayouts` (and `state.theme` when the snapshot carries it) wholesale from before/after state; set `isDirty=true`.
6. No change to `/api/regenerate-section` or `/api/regenerate-content` (server untouched; all client-side apply). The `regenerationActions.ts` input-change path (127/315 broken `beforeState:null` pushes) is dead from UI — untouched, per code map.

**Verification:** `npx tsc --noEmit`; `npm run test:run` (generation-contract tests green); manual: hand-edit copy in 2 sections → Regen Copy → progress "X/Y" runs → undo stack shows EXACTLY ONE new entry → single Undo restores ALL pre-regen copy incl. hand edits → Redo re-applies the regen; standalone section-toolbar regen pushes exactly one per-section entry and Undo reverts just that section; images survive regen + undo + redo; autosave persists both directions; **multi-page: Regen Copy on page A → switch to page B → stack cleared (no cross-page fullContent restore possible)**; simulate all-sections-fail (e.g. network offline) → NO new undo entry appears.

---

### 🚦 HUMAN GATE — Slice 1 decision gate

Stop. User exercises the editor: undo granularity (per-commit + 3s coalesce), collection/array edit undo fidelity, autosave interaction, Regen-undo (one entry), **undo-clears-on-page-switch feel (multi-page)**. Sign-off required before Slice 2. Also pre-confirm the Phase 4 storage + backfill decisions below.

---

## Slice 2 — baseline snapshot + Reset restores copy+theme

### Phase 4 — Baseline capture + persistence (`content.baseline`) 🚦 HUMAN GATE

**Gate (before implementing):** approve (a) baseline as `content.baseline` JSON slot — NO Prisma migration (alternative: `Project.originalGeneration Json?` column + `prisma migrate dev` on dev+prod); (b) touching saveDraft/loadDraft + save payloads (spec candidate gate); (c) **backfill semantics** — first editor load with no stored baseline captures CURRENT content as baseline (this same mechanism IS the initial-generation capture; for pre-existing pages, load-time edits get enshrined as "original" — imperfect by design, per spec). Confirm acceptable for live customer pages (naayom multi-page etc.).

**Files touched:**
- `src/types/store/state.ts`
- `src/stores/editStore.ts`
- `src/hooks/editStore/persistenceActions.ts`
- `src/hooks/editStore/generationActions.ts`
- `src/utils/autoSaveDraft.ts`
- `src/app/api/saveDraft/route.ts`
- `src/app/api/loadDraft/route.ts`

**Steps:**
1. `state.ts` + `editStore.ts`: add `baseline: <export-payload> | null` (initial null) and `baselineDirty: boolean` (initial false) to store state; exclude both from `partialize`.
2. `persistenceActions.ts`: new `captureBaseline()` action — `state.baseline = state.export()` (covers content, sections/layouts/spacing, theme, globalSettings, nav/social/legal, forms, **pages/currentPageId/chrome**, onboardingData), sets `baselineDirty=true`. Does NOT set `isDirty` (baseline rides the next natural autosave; Reset works in-session immediately from the store copy). Also add **`markBaselineSaved()`** — clears `baselineDirty` (named action needed because `utils/autoSaveDraft.ts` is a plain util with no inline store access; `persistenceActions.save()` may clear inline).
3. **Capture call sites (caller-driven, per Design decision 7):**
   - `persistenceActions.loadFromDraft`: if the API response carried a stored baseline, hydrate `state.baseline` from it (inside the producer is fine — plain assignment, `baselineDirty` stays false); if NOT, call `captureBaseline()` — and this call MUST run **after the big hydration `set()` producer has returned** (persistenceActions.ts ~90–340), because `captureBaseline` → `export()` reads committed state via `get()`; calling it inside the producer (or later inside Phase 5's `applySnapshot`) would snapshot stale pre-hydration state. One mechanism covers initial-gen capture + legacy backfill.
   - `generationActions.regenerateAllContent`: after a fully/partially successful loop (already outside any `set()`), call `captureBaseline()` (refresh). Per-section/element regen and `updateFromAIResponse` get NO capture calls.
4. Save payloads (both paths): include `baseline` in the POST body ONLY when `baselineDirty`. On success: `persistenceActions.save()` clears the flag inline; `autoSaveDraft.ts` `completeSaveDraft` calls `markBaselineSaved()`. Absent from body otherwise.
5. `saveDraft/route.ts` (~137–154): when `baseline` present in body → `updatedContent.baseline = baseline` (REPLACE wholesale, never deep-merge); absent → preserved automatically via the `...existingContent` spread (verified). `finalContent` merge behavior untouched.
6. `loadDraft/route.ts` (~98–134): return `content.baseline` alongside `finalContent`.
7. Note for audit — **what Reset will NOT revert:** `templateId/variantId/paletteId` persist outside finalContent (template/variant/palette switches are not a copy/theme edit), and likewise **`Project.themeValues` (e.g. vestria `mood`) lives OUTSIDE the in-store `theme` the baseline exports** — a post-generation mood change is NOT restored by Reset. Known limitation vs the spec's "restores copy + theme"; baseline's `theme` covers the in-store theme only.

**Verification:** `npx tsc --noEmit`; `npm run test:run`; manual: fresh generation → open editor → make one edit → autosave → DB `Project.content.baseline` exists and mirrors pristine post-gen state (NOT the edit — proves capture ran post-hydration, pre-edit); further edits/autosaves leave DB baseline byte-identical (dirty-flag works — check network: baseline absent from routine save bodies; confirm BOTH save paths clear the flag); Regen Copy → next save ships refreshed baseline once; pre-existing project (no stored baseline) → loads without crash, baseline captured from load-time state; publish flow unaffected (`/api/publish` reads finalContent).

---

### Phase 5 — Reset restores copy + theme from baseline

**Files touched:**
- `src/hooks/editStore/persistenceActions.ts`
- `src/hooks/editStore/layoutActions.ts`
- `src/app/edit/[token]/components/ui/useResetSystem.ts`

**Steps:**
1. `persistenceActions.ts`: extract the hydration core of `loadFromDraft` (~90–325: sections/layouts/spacing/content/theme/globalSettings/nav/social/legal/forms/**pages+chrome**) into an internal `applySnapshot(state, payload)`; `loadFromDraft` delegates to it (no behavior change — pages/chrome migration logic moves verbatim; the Phase-4 `captureBaseline()` call stays OUTSIDE, after the `set()`). **Known limitation carried over:** `applySnapshot` restores theme via MERGE (`{...state.theme, ...theme}` @ 149), not wholesale — a theme key ADDED after generation won't be cleared by Reset (near-equivalent in practice since the baseline exports a full theme; documented, not fixed here).
2. `layoutActions.ts` `resetToGenerated()` (602): if `state.baseline` → `applySnapshot(baseline)`, set `isDirty=true`, `clearHistory()`. No baseline (should be unreachable post-Phase-4) → keep current derive-from-onboarding fallback.
3. Add `clearHistory()` at the end of `loadFromDraft` (Design decision 9; idempotent overlap with the Phase-1 choke-point reset inside `loadPageIntoActive` — harmless).
4. `useResetSystem.ts`: keep confirm→reset→triggerAutoSave flow; toast copy → "restored original copy + design". Scope ('design' vs all) remains toast-text-only unless dialog copy misleads (text-only tweak allowed).

**Verification:** `npx tsc --noEmit`; `npm run test:run`; manual: edit copy + change theme → Reset → BOTH revert to last-generation baseline; undo stack empty after Reset; autosave persists within ~1s; reload survives; **multi-page check (naayom-style project): switch pages, edit copy on a subpage + edit shared header, Reset → subpage content AND chrome restore correctly, page switching still works**; store with `baseline=null` (devtools-forced) still resets via fallback without crash.

---

## Acceptance-criteria map

| Criterion | Phase |
|---|---|
| Typing → Undo/Redo (incl. collection/array edits) | 1 |
| No data loss on undo/redo (incl. multi-page page-switch, B5) | 1 |
| Buttons live per canUndo/canRedo | 2 |
| Shortcuts verified + Cmd+D fix | 2 |
| Regen Copy → single Undo restores pre-regen | 3 |
| Baseline on initial gen + each Regen Copy, never on manual/per-section edits | 4 |
| Old pages: Reset doesn't crash (load-time capture) | 4 |
| Reset restores copy + theme (+ pages/chrome) | 5 |
| No autosave/publish regression | every phase |

## Explicit landmine notes

- No block components touched → dual-renderer parity not in play (re-check per phase; any block edit = plan violation).
- No Prisma migration in the recommended path; if the user picks the column at the Phase-4 gate, that phase gains `prisma/schema.prisma` + `prisma migrate dev` (never `db push`) on dev+prod.
- Published assets/CSS untouched → rebuild semantics (`build ≠ next build`) irrelevant here.
- Do NOT wire `useStatePersistence.ts` or useAutoSave's VersionManager to anything.
- Pre-existing restorer corruption (wrapped-object rebuild vs V2 raw storage) is FIXED by the Phase-1 raw-value shape — do not "preserve compatibility" with the broken per-element branch for new entries.
- History entries are ACTIVE-PAGE-relative (no `pageId`) — the stacks are reset at the SINGLE choke point `loadPageIntoActive` (`pageHelpers.ts:129`), through which ALL page swaps run (setCurrentPage/addPage/deletePage/applyArchetype/addArchetypePage/addCollectionItem + hydration at persistenceActions:302/324). Current and future swap sites are covered by construction — no per-site enumeration to maintain. Corollary: any FUTURE code that swaps the active page's body WITHOUT going through `loadPageIntoActive` reintroduces the cross-page corruption; route new swaps through the helper.
- `captureBaseline()` calls `export()` → committed-state read via `get()` — never call it from inside a `set()` producer (loadFromDraft hydration, applySnapshot).
- `regenerationActions.ts` full-page paths are dead from UI (verified no callers) — leave alone; if ever revived they must adopt the Phase-3 snapshot + Phase-4 captureBaseline pattern (noted in code comment).

## Unresolved questions

1. `content.baseline` JSON slot (no migration) vs dedicated Prisma column?
2. Coalesce window 3s ok?
3. Reset clears undo stack (Reset itself not undoable) — ok?
4. Edge: Regen Copy → Undo → Reset returns the REGEN'D copy (baseline refreshed at regen). Ok?
5. Per-section toolbar regen becomes undoable (new behavior) — want it, or full-regen-only?
6. Backfill: legacy pages enshrine load-time content as baseline — ok for naayom/live pages?
7. Reset 'design'-only scope stays toast-text-only — ok?
8. Undo cleared on page switch (never crosses page boundary) — acceptable UX?
9. Reset won't revert `themeValues`/mood or template/variant/palette — acceptable gap vs spec's "restores theme"?
