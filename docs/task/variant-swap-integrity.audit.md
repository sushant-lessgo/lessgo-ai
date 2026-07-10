# variant-swap-integrity — audit

## Phase 1 — Undo snapshot fix

### Files changed

- `src/types/core/ui.ts`
- `src/types/store/state.ts`
- `src/types/store/actions.ts`
- `src/hooks/editStore/layoutActions.ts`
- `src/hooks/editStore/uiActions.ts`
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx`
- `src/app/edit/[token]/components/ui/LayoutChangeModal.tsx`
- `src/hooks/editStore/sectionSwap.test.ts` (new)

### Per-file changes

- **`src/types/core/ui.ts`** (~L3026): added `'sectionSwap'` member to the `UndoableAction` union.
- **`src/types/store/state.ts`** (L90): added `'sectionSwap'` to the `EditHistoryEntry.type` union
  (now `'content'|'layout'|'theme'|'section'|'fullContent'|'sectionSwap'`).
- **`src/types/store/actions.ts`** (L32): `updateSectionLayout` interface signature gained an
  optional 3rd param `opts?: { skipHistory?: boolean }`.
- **`src/hooks/editStore/layoutActions.ts`** (updateSectionLayout, ~L280-320): added the `opts?`
  param; the internal `type:'layout'` history push AND the `redoStack = []` clear are now wrapped
  in `if (!opts?.skipHistory)`. The `queuedChanges`/autosave push and `isDirty`/`lastUpdated`
  remain unconditional (autosave path intact). Default behavior for all existing callers unchanged.
- **`src/hooks/editStore/uiActions.ts`**:
  - `executeUndoableAction()` type-mapping (~L857): added `actionType === 'sectionSwap' ? 'sectionSwap'`
    case before the `'element-content-update'` case. Snapshot capture (before/after whole-map:
    theme + sections + content + sectionLayouts) is unchanged — it already captured everything
    `'sectionSwap'` needs.
  - `undo()` (~L741): new `else if (lastAction.type === 'sectionSwap')` branch mirroring the
    `'fullContent'` branch — restores `content` + `sections` + `sectionLayouts` from `beforeState`
    via mandatory restore-time `deepCopy` (does NOT touch `theme`).
  - `redo()` (~L819): new `else if (actionToRedo.type === 'sectionSwap')` branch mirroring the
    `'fullContent'` REDO branch — restores the same three keys from `afterState` via `deepCopy`.
    Deliberately NOT modeled on the `'section'` redo branch (which only re-adds/removes and would
    not re-clamp).
- **`src/app/edit/[token]/components/ui/BlockVariantSelector.tsx`**:
  - `applyLayoutOnly()` (~L205) and `applyWithClamp()` (~L212): replaced
    `executeUndoableAction('section-layout-update' as any, …)` with the typed `'sectionSwap'`
    action, and pass `{ skipHistory: true }` to `updateSectionLayout`.
  - Prop type (~L166): `updateSectionLayout` prop signature widened to include the optional
    `opts?: { skipHistory?: boolean }` 3rd param (this prop is locally typed, not inferred from the
    store interface — required for the `{ skipHistory }` call to typecheck).
- **`src/app/edit/[token]/components/ui/LayoutChangeModal.tsx`** (`handleLayoutChange`, ~L39):
  same fix — typed `'sectionSwap'` action + `updateSectionLayout(..., { skipHistory: true })`.

### Test file

`src/hooks/editStore/sectionSwap.test.ts` (picked up by the `src/**/*.test.{ts,tsx}` vitest glob;
verified by running it in isolation — 2/2 passed). Builds a real store via `createEditStore` +
`loadFromDraft` seeding a testimonials section (`elements.testimonials` = 4 cards + a `headline`
scalar + `elementMetadata.cta_button`) at layout `ReviewGrid`.

- **Clamped-swap test** — runs `updateSectionLayout(section, 'PullQuoteWithMark', {skipHistory:true})`
  + `setSection(section, {elements: clampedTo2})` inside ONE `executeUndoableAction('sectionSwap', …)`.
  Asserts: (a) exactly ONE new history entry, typed `'sectionSwap'`; swap applied (layout mirror +
  `content.layout` + 2 cards); (b) undo restores `ReviewGrid`, the full 4-card array, `elementMetadata`,
  and the `sectionLayouts[section]` mirror; (c) redo re-applies BOTH the swapped layout and the 2-card
  clamp; (d) a second undo restores the full state again.
- **Plain-swap test (e)** — a layout-only `'sectionSwap'` (no `setSection`) round-trips: one history
  entry, undo/redo flip the layout on both `sectionLayouts` and `content.layout`, cards untouched (4).

### Verification

- `npx tsc --noEmit`: clean for all Phase-1 files. Two remaining errors are in
  `src/app/api/forms/submit/route.ts` (`notifiedAt` / `notifyError` not in the Prisma
  `FormSubmission*Input` types) — a pre-existing schema drift in a file NOT touched by this phase
  and unrelated to these changes. Left as-is (out of scope).
- `npm run test:run`: **124 passed | 1 skipped test files; 1945 passed | 3 skipped tests**; exit 0.

### Deviations / notes

- **In-scope addition (not a scope change):** widened the `updateSectionLayout` PROP type inside
  `BlockVariantSelector.tsx` (~L166) in addition to the call sites. The prop is typed locally in
  that same in-scope file, and tsc failed ("Expected 2 arguments, but got 3") without it. No new
  files touched.
- Verified no other layout action near `layoutActions.ts` ~L268 double-pushes on the swap path —
  `updateSectionLayout` is the only action on that path; `setSectionLayouts`/`moveSection`/
  `reorderSections` are separate actions the swap does not call.
- The `'sectionSwap'` undo/redo branches intentionally do NOT restore `theme` (a variant swap never
  changes theme), unlike `'fullContent'` which conditionally restores it.
- Restore-time `deepCopy` kept exactly like the `'fullContent'` branches (defense-in-depth against
  aliasing; the root-cause fix is purely the type-mapping case).

### Open risks

- Manual dev-server repro (surge `bibO4F6MfOI8`, vestria hero `nmzl0brZggz5`) is the human gate,
  intentionally not run here.
- Pre-existing `forms/submit` tsc errors remain in the tree (unrelated); a full `tsc --noEmit` will
  keep reporting them until that separate schema drift is fixed.
