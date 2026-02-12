# Editor UX Refactor — Implementation Plan

## Context

newEdit.md spec redesigns the editor around: merged Theme popover (killing 5 modals), simplified left panel (section outline + read-only inputs), text-direct-edit (skip ElementToolbar for text), and 3-level regen hierarchy. designReview.md clarifies ElementToolbar is kept for buttons/CTAs, only bypassed for text elements. This plan divides work across 3 devs with parallel streams.

---

## Dev A: Theme System + Header + Modal Cleanup

Owns: EditHeader, EditHeaderRightPanel, ThemePopover (new), SectionBackgroundModal, 5 dead modals

### A1. Build ThemePopover (NEW) — parallel-safe
Create `src/app/edit/[token]/components/ui/ThemePopover.tsx`
- Radix Popover anchored to Theme button
- **Palette swatches**: siblings in current colorFamily (2-5). Read current palette from theme via `useEditStore()`. Use `getColorFamilies(mode)` to find siblings. Click = `updateTheme()` instant swap
- **Accent picks**: filter by `palette.compatibleAccents`. Show 3-4 quick picks + custom hex input. Live contrast warning (reuse `colorAccessibilityUtils.ts`)
- **Texture toggle**: None / Dot Grid / Paper|Line Grid based on mode
- **"Browse all styles →"**: opens full palette browser modal (can be Phase 2 — just wire the link)
- Add `getSiblingPalettes(paletteId)` helper to `palettes.ts`

Key imports: `palettes.ts`, `textures.ts`, `useEditStore()`, `updateTheme()`

### A2. Header refactor — after A1
Modify `EditHeader.tsx`:
- Remove `showBackgroundModal`/`showColorModal` local state
- Remove VariableBackgroundModal + ColorSystemModalMVP imports and renders
- Remove Background button + Color button
- Add Theme button → opens ThemePopover

Modify `EditHeaderRightPanel.tsx`:
- Add "Regenerate Copy" button (between Reset and Preview)
- Wire to `regenerateAllContent` from store (exists in `generationActions.ts`)
- Add confirmation dialog (destructive action)

### A3. Simplify SectionBackgroundModal — after A1
Rewrite `SectionBackgroundModal.tsx`:
- Kill gradient builder (GradientPicker)
- Radio buttons: Auto (position-based) / Primary / Secondary / Neutral / Custom hex
- Auto = use `assignSectionBackgrounds` calculated value
- Custom = single hex input + contrast warning
- "Reset to auto" button
- Keep contrast validation

### A4. Kill 5 old modals — after A1+A2 validated
Delete (or archive):
- `VariableBackgroundModal.tsx`
- `ColorSystemModalMVP.tsx`
- `BackgroundSystemModal.tsx`
- `ColorSystemModal.tsx` (full)
- `ResponsiveBackgroundModal.tsx`

Clean imports from any files referencing them. Check `ColorRegenerate.tsx`, `colorRecommendations.ts`, `ColorValidation.tsx`, `ColorPresets.tsx` — assess which utilities ThemePopover still needs vs which die with modals.

---

## Dev B: Left Panel + Element Management

Owns: LeftPanel, SectionToolbar, ElementToggleModal (new)

### B1. Left Panel restructure — parallel-safe
Rewrite `LeftPanel.tsx`:

**Remove:**
- All field edit buttons
- Regeneration controls (bottom sticky)
- Design regen checkbox + warning modal
- `handleRegenerateContent`, `handleEditField`
- `TaxonomyModalManager` render

**Add at top — Section outline:**
- Read `sections` array from store
- Render clickable list: extract type via `sectionId.split('-')[0]` for display name
- Click = `scrollIntoView({ behavior: 'smooth', block: 'center' })` using `[data-section-id]` selector
- Optional: highlight active section via IntersectionObserver

**Add below — "Your Inputs" accordion (collapsed):**
- `<details>/<summary>` or Radix Accordion
- Read-only display: productName, oneLiner, landingGoal, offer, features, assetAvailability
- Inside accordion: "Change inputs & regenerate" button → routes to `/create/[token]` with prefilled values

**Keep:** resize handle, collapse/expand panel behavior

### B2. Element Toggle Modal (NEW) — parallel-safe
Create `src/app/edit/[token]/components/ui/ElementToggleModal.tsx`
- Props: `sectionId`, `layoutType`, `isOpen`, `onClose`
- Call `getSectionElementRequirements(sectionId, layoutType, variables)` from `elementDetermination.ts`
- Show ALL elements (required + optional) with toggle switches
- Required: always on, toggle disabled
- Optional present: toggle on. Toggle off = soft-remove (mark `___REMOVED___`, reversible)
- Optional absent: toggle off. Toggle on = add element
- Wire to element add/remove store actions

### B3. SectionToolbar swap — after B2
Modify `SectionToolbar.tsx`:
- Replace "Add Element" button label → "Manage Elements"
- Replace `showElementPicker()` call → open `ElementToggleModal`
- Keep everything else: Layout, Move Up/Down, Duplicate, Delete, Advanced menu
- Keep "Regenerate Content" in Advanced menu (section-level regen per the 3-level hierarchy)

Note: `ElementPicker.tsx` not deleted — may be used elsewhere.

---

## Dev C: Toolbar Interaction

Owns: useEditor.ts, TextToolbarMVP, FloatingToolbars, selectionPriority

### C1. Text direct edit on click — parallel-safe
Modify `useEditor.ts` `handleEditorClick` (~line 278, element click branch):
- After `determineElementType(clickTarget.element)`, check if result is `'text'`
- If text-type: call `enterTextEditMode(clickTarget.elementKey!, clickTarget.sectionId!)` directly
- If NOT text (button/CTA): keep existing `showToolbar('element', ...)` behavior

Text-type element keys (from `determineElementType` lines 169-175): keys containing `text`, `headline`, `subhead`, `description` — NOT `cta`/`button`.

**No changes needed to:**
- `FloatingToolbars.tsx` — priority chain already handles this: when `isTextEditing=true`, TextToolbar wins over ElementToolbar
- `selectionPriority.ts` — logic already correct
- `ElementToolbar.tsx` — still renders for button/CTA elements

### C2. TextToolbarMVP ✨ button — after C1
Modify `TextToolbarMVP.tsx`:
- Add sparkle (✨) icon as top-level button
- On click: call `regenerateElementWithVariations(sectionId, elementKey, 5)` from `aiActions.ts` (NOT the stub in contentActions.ts — the real implementation exists)
- Import: `regenerateElementWithVariations`, `elementVariations`, `applyVariation`, `hideElementVariations` from `useEditStore()`
- Show variations dropdown (extract/reuse UI from ElementToolbar lines 111-150, or build inline)
- Widen toolbar to accommodate new button

### C3. Verify edge cases
- Click text → edit directly → click Done → back to no toolbar (not stuck in ElementToolbar)
- Click CTA → ElementToolbar → Button Settings works
- Click text → sparkle → 5 variations shown → pick one → text updates
- Click image → ImageToolbar (unchanged)
- Click form → FormToolbar (unchanged)

---

## Dependency Graph

```
PARALLEL (all start together):
  Dev A: A1 (ThemePopover)
  Dev B: B1 (LeftPanel) + B2 (ElementToggleModal)
  Dev C: C1 (text direct edit) + C2 (✨ button)

SEQUENTIAL (after Phase 1):
  Dev A: A2 (header refactor) → A3 (SectionBG simplify) → A4 (kill modals)
  Dev B: B3 (SectionToolbar swap)
  Dev C: C3 (edge case verification)

FINAL:
  All: npm run build, integration smoke test, fix type errors
```

## File Ownership (no merge conflicts)

| File | Dev | Action |
|------|-----|--------|
| ThemePopover.tsx (NEW) | A | Create |
| EditHeader.tsx | A | Refactor |
| EditHeaderRightPanel.tsx | A | Add Regen Copy |
| SectionBackgroundModal.tsx | A | Simplify |
| 5 dead modals | A | Delete |
| palettes.ts | A | Add helper |
| LeftPanel.tsx | B | Rewrite |
| ElementToggleModal.tsx (NEW) | B | Create |
| SectionToolbar.tsx | B | Swap Add→Manage |
| useEditor.ts | C | Modify click handler |
| TextToolbarMVP.tsx | C | Add ✨ button |
| FloatingToolbars.tsx | C | Verify (likely no change) |

## Workload

| Dev | Effort | Why |
|-----|--------|-----|
| A | Heavy | New ThemePopover component + header plumbing + modal cleanup |
| B | Medium | LeftPanel is mostly removal + new outline. ElementToggleModal is moderate |
| C | Light-Medium | useEditor change is ~15 lines. ✨ button is ~50 lines. Selection system fragility needs careful testing |

## Deferred to Phase 2

- "Browse all styles" full palette browser modal (link wired in A1, modal built later)
- Section outline active-section highlight via IntersectionObserver
- Card-level regeneration

## Verification

1. `npm run build` passes with no type errors
2. Theme button opens popover → swap palette → page updates instantly
3. Accent change → all CTAs update color
4. Texture change → hero/CTA backgrounds show texture
5. Section BG override → radio buttons work, custom hex shows warning
6. Left panel → section outline scrolls to section on click
7. Left panel → inputs accordion collapsed by default, read-only
8. Regen Copy → confirmation → all page copy regenerates
9. Click text element → TextToolbarMVP directly (no ElementToolbar step)
10. Click CTA → ElementToolbar → Button Settings works
11. ✨ button → 5 variations → pick → text replaces
12. Manage Elements → toggle modal → toggle off removes element, toggle on adds
13. No regressions: image toolbar, form toolbar, undo/redo, auto-save, device preview
