# selection-highlight-labels — audit

## Phase 1 — Canonical section-root + rescoped section queries (fixes bug 2)

**Files changed:**
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
- `src/hooks/useEditor.ts`
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx`

### Per-file changes

**EditablePageRenderer.tsx** (root div, ~L125): added `{...(mode !== 'preview' ? { 'data-section-root': sectionId } : {})}` alongside the existing `data-section-id={sectionId}`. Nothing removed. This is the single choke point every edit-canvas section flows through, so exactly one node per section now carries `data-section-root`.

**SelectionSystem.tsx**:
- Accessibility/selection sweep (~L71): section query `querySelectorAll('[data-section-id]')` → `'[data-section-root]'`; the per-node read `getAttribute('data-section-id')` → `getAttribute('data-section-root')`. Element sweep (`[data-element-key]`) and the `closest('[data-section-id]')` read inside it left unchanged.
- Focus effect (~L168): section focus query `[data-section-id="${selectedSection}"]` → `[data-section-root="${selectedSection}"]`.

**useEditor.ts** (Tab section nav, ~L357-364): `querySelectorAll('[data-section-id]')` → `'[data-section-root]'` and the matching `getAttribute('data-section-id')` → `getAttribute('data-section-root')` in the `findIndex`. This also fixes the latent nav bug where the loop previously iterated element wrappers too.

**ToolbarShell.tsx** (`resolveAnchor` section branch, ~L51): `[data-section-id="${id}"]` → `[data-section-root="${id}"]` with a defensive `??` fallback to the old `[data-section-id]` selector if the new one returns null. Behavior identical (the first document-order `data-section-id` match was already this same container).

### Deviations
- **useEditor.ts L374** (`nextSection.getAttribute('data-section-id')`): left as-is. The node is now sourced from the `[data-section-root]` query but still carries both attributes (both stamped on the same root div with identical values), so the read is correct and unchanged in behavior. Conservative minimal-diff choice; noted for completeness.
- Plan step 4 called out changing the `querySelectorAll` and the `findIndex` read; I changed both. No other divergences.

### Verification
- `npx tsc --noEmit`: clean for all four touched files. One pre-existing, unrelated error remains: `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'` — asset-typing issue present on the base branch, not in any Phase-1 file.
- `npm run test:run`: green.
  ```
   Test Files  181 passed | 1 skipped (182)
        Tests  2973 passed | 18 skipped (2991)
  ```

### Open risks
- None functional. The single pre-existing `page.tsx` tsc error is out of scope for this phase.
