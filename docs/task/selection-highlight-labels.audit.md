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

## Phase 2 — Single-writer highlight consolidation (fixes flicker)

**Files changed:**
- `src/app/edit/[token]/components/selection/ElementDetector.tsx`
- `src/app/edit/[token]/components/layout/MainContent.tsx`
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
- `src/app/globals.css`
- `src/utils/selectionPriority.ts` (permitted comment-only fix)

### Per-file changes

**ElementDetector.tsx**: deleted the selection-indicator effect (former L27-50: `.element-selected`/`.section-selected` writers), `handleNestedElementClick` + its `onClick` wiring (former L53-89, 111: purely visual `.element-hover`/`data-selection-depth`), the mode-change cleanup effect for those classes (former L91-104), and the entire `ElementDetectorStyles` component + its render (former L115, L120-157 — every rule referenced the now-deleted classes, so nothing remained). Removed now-unused imports `useShallow` and `isSectionVisuallySelected`. Kept the wrapper `<div>` with `ref` + `data-section-id` + className (other code `closest()`s through it) — now `ElementDetector` (~L14-30) is a thin structural wrapper. `ElementBoundaryVisualizer` (debug tool) untouched; its use of `useEffect`/`useState`/`useCallback` keeps those imports live, and `useRef` stays for `sectionRef`.

**MainContent.tsx**: removed the selected-section ring/border from both wrappers. Outer wrapper (~L546-551): dropped `isSectionVisuallySelected(...) && "border-primary/40 shadow-md bg-primary/5"`, kept the non-selection hover chrome. Inner section wrapper (~L573-577): collapsed the selection ternary to the plain `hover:ring-1 hover:ring-gray-300` hover class. `isSectionVisuallySelected` import retained — still feeds `aria-selected` (~L586) and the `isSelected` prop passed to `EditablePageRenderer` (~L594).

**EditablePageRenderer.tsx**: removed `${isSelected ? 'ring-2 ring-blue-500' : ''}` from the root div className (~L120-123). SelectionSystem's `.selected-section` now lands on this same node (it carries `data-section-root`) as the single selected visual. The `isSelected` prop/interface field is retained (still passed by MainContent; harmlessly unused in the body — no `noUnusedLocals` in tsconfig). Phase-1 `data-section-root` stamping intact.

**SelectionSystem.tsx** `SelectionStyles` (~L349-373): rescoped the section hover rule `[data-section-id]:hover:not(.selected-section):not(.multi-selected)` → `[data-section-root]:hover:not(:has([data-element-key]:hover)):not(.selected-section):not(.multi-selected)` (element wins, mirrors dispatch) and removed its `transition: outline` line. Dropped `transition: all` from `[data-element-key]:hover`. Removed the blanket `[data-section-id], [data-element-key] { transition: … }` rule (former L376-379). Kept `.selected-section`/`.selected-element`/`.multi-selected`/focus/badge styles. Also applied the remount mitigation below (selector + sweep-effect dep).

**globals.css**: `[data-element-key]:not(...)` (~L16-20) `transition: all 0.2s ease` → `transition: background-color 0.2s ease`. `[data-element-key]` smooth-transition rule (~L106-109) dropped `outline` from the list (now `background-color, box-shadow`). Cursor/contentEditable rules untouched.

**selectionPriority.ts** (comment-only, ~L86-93): updated the `isSectionVisuallySelected` docstring — the stale reference to the "three redundant highlight systems" incl. ElementDetector's `.section-selected` writer (deleted this phase) now describes the single-writer model (SelectionSystem sweep = selected classes; hover = CSS interim → phase-3 HoverOverlay). No logic changed.

### Remount-staleness caution — handled IN-SCOPE (mitigated)
Real regression risk: pre-phase-2, remount of a selected section re-applied its ring via MainContent's React className AND ElementDetector's per-section effect (deps incl. `sectionId`, runs on that component's remount). Deleting both leaves only SelectionSystem's document-level sweep, whose deps were selection-state only (`[mode, selectedSection, selectedElement, multiSelection]`) — so a reorder/add that remounts a still-selected node without changing `selectedSection` would drop `.selected-section` until the next selection change.

Mitigation (clean, low-risk, fully within the Files-touched `SelectionSystem.tsx`): subscribed the component to `s.sections` via the existing `useShallow` selector and added `sections` to the sweep effect's dep array. The `sections` array reference changes on any structural edit (reorder/add/remove) under Zustand+Immer, so the sweep re-runs and re-stamps `.selected-section`/`.selected-element`/aria after remount. No new render churn on unrelated edits (shallow-guarded). Gate-A manual check still recommended: drag/reorder a selected section, confirm the outline persists.

### Verification
- `npx tsc --noEmit`:
  ```
  src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg' or its corresponding type declarations.
  ```
  Only the known pre-existing unrelated error; no new errors.
- `npm run test:run`:
  ```
   Test Files  181 passed | 1 skipped (182)
        Tests  2973 passed | 18 skipped (2991)
  ```

### Open risks
- Interim CSS hover is scoped via `:has()` — well-supported in current evergreen browsers; it is replaced by the JS `HoverOverlay` in phase 3, so no long-term dependency.
- Remount staleness for the AI-verify marker sweep (separate effect, same document-level pattern) is pre-existing and untouched — out of this phase's scope.
