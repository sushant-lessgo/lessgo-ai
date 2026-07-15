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

## Phase 3 — Shared target resolver + hover overlay + label badge (wired types)

**Files changed:**
- `src/utils/hoverTarget.ts` (new)
- `src/utils/hoverTarget.test.ts` (new)
- `src/hooks/useEditor.ts`
- `src/app/edit/[token]/components/selection/HoverOverlay.tsx` (new)
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
- `src/app/globals.css`

### Per-file changes

**hoverTarget.ts (new)** — pure, no store/React imports (imports only the `UNIVERSAL_ELEMENTS` type map). Two exports:
- `resolveTarget(node)` → `{ kind: 'element'|'section'|null, sectionId, elementKey, node }`. Extracted DOM core of `determineClickTarget`: toolbar guard (`closest('[data-toolbar-type]')` → null), image detection (`closest('[data-image-id]')` ?? `closest('img')` → element target on the image node), closest `[data-element-key]` wins, else closest section container. Section resolution PREFERS `[data-section-root]` (phase-1 canonical marker) with fallback to `[data-section-id]`; the id value is read from whichever matched. Because every node in a section shares the same id value, duplicate `data-section-id` stamping can never produce >1 distinct target.
- `getTargetLabel(target)` → D7 verbatim strings. Wired types this phase: section → `Section`; image (`data-image-id`/`IMG`) → `Image`; `data-element-type` mapped via `UNIVERSAL_ELEMENTS` (button → `Button/CTA`, text-category → `Text`, image toolbarType → `Image`); then key conventions (`*cta*`/`*button*` → `Button/CTA`); default → `Text`. Null target → `''`.

**useEditor.ts** — `determineClickTarget` refactored to call `resolveTarget` for DOM resolution. The store-state guards (isTextEditing / `toolbar.type === 'text'` / targetId checks), the toolbar-click early-return, and the `data-image-id` early-return (→ null, so image handlers keep working) are all UNCHANGED and still run inline BEFORE `resolveTarget`. Return shape (`ClickTarget`) unchanged: `element`/`sectionId`/`elementKey`/`type`. Added import of `resolveTarget`.

**Behavior-preserving refactor confirmation:** dispatch semantics are unchanged. `sectionId`/`elementKey`/`type` values are identical to before (section-root and section-id carry the same id value on the choke-point node; the element-key node is the same `closest('[data-element-key]')` as before; background/toolbar/image branches are byte-identical). The ONE node-identity difference: the section-case `ClickTarget.element` is now the canonical `data-section-root` node instead of the nearest `data-section-id` node. This is position-neutral for the rendered toolbar because `ToolbarShell.resolveAnchor` (phase 1) already re-anchors section toolbars to `[data-section-root]` regardless of the `position` passed to `showToolbar`. Full test suite (incl. selection/toolbar coverage) stays green.

**HoverOverlay.tsx (new)** — mounted from SelectionSystem (edit mode only). Document-level `pointerover` + rAF-throttled `pointermove` + `pointerleave`; resolves via `resolveTarget`; renders a `position: fixed`, `pointer-events: none` outline box + label chip computed from `getBoundingClientRect()`, recomputed on scroll (capture) / resize — the proven `VerifyMarkerControls` pattern (zero writes into content DOM). Chip sits top-left of the target and flips inside the viewport if clipped at top / right. Outline+chip color `#475569` (slate) — distinct from selection blue `#3b82f6`, element green `#10b981`, multi violet `#8b5cf6`, focus amber `#f59e0b`. Suppressed when: `mode !== 'edit'`, `isTextEditing` (plan Q4 → hidden), pointer over `[data-toolbar-type]`/`header`/`[role="dialog"]`/`[data-radix-portal]`, resolved kind null, or the hovered target IS the current selection (element match, or `isSectionVisuallySelected` for sections — the selected outline already owns it).

**SelectionSystem.tsx** — imports + mounts `<HoverOverlay />` alongside `SelectionIndicators` inside the existing `mode !== 'preview'` block. Removed the interim phase-2 CSS hover rules from `SelectionStyles` (`[data-section-root]:hover…` + `[data-element-key]:hover…`) — the overlay is now the sole hover writer. Dead commented `SelectionBadge` usages (L421-437) left as-is (non-trivial to remove cleanly; harmless).

**globals.css** — removed the two superseded element hover background-tint rule blocks: `[data-element-key]:hover{background-color…}` and the per-type `[data-element-key*="headline"/"cta"/"button"]:hover{…}` tints. Cursor rules (`[data-element-key]{cursor:pointer}`, contentEditable text-cursor rules) and transition rules kept untouched.

**hoverTarget.test.ts (new)** — jsdom fixtures with the real nesting (section-root wrapper carrying both attrs > block `<section data-section-id>` > element wrappers carrying both attrs > leaf). Asserts: element hover wins over section; section gap/background → section (D6); section-root preferred over nested duplicate id; duplicate `data-section-id` nodes never diverge/multiply; toolbar guard → null; no-section → null-kind; image via `data-image-id` and bare `<img>`; label classifier for Section/Text/Button/CTA/Image + null + `data-element-type` mapping. 14 tests.

### Deviations
- **Section-case `ClickTarget.element` node identity** changed from nearest `data-section-id` to canonical `data-section-root` (see behavior-preservation note above). Conservative call: verified position-neutral via ToolbarShell's phase-1 re-anchoring; logged here.
- Dead commented `SelectionBadge` block in SelectionSystem left in place (plan said "if trivial, else leave").

### Atelier double-affordance flag (for Gate B)
`src/modules/templates/atelier/.../AtelierEditable.tsx` (~L30) has its OWN `hover:outline-dashed` + pencil-icon hover affordance baked into the template. That file is OUT OF SCOPE (template file, not on this phase's Files-touched). Now that the global/SelectionSystem CSS hover outline is gone, hovering an Atelier element shows BOTH the new JS `HoverOverlay` (slate outline + label chip) AND the template's own dashed outline + pencil. Gate B should evaluate this readability overlap and decide whether the template affordance should be retired (separate template-scope change).

### Verification
- `npx tsc --noEmit`: exit 0, clean (no errors — the previously-reported `page.tsx` asset error did not surface in this run; no new errors from any touched file).
- `npx vitest run src/utils/hoverTarget.test.ts`: `Test Files 1 passed (1) · Tests 14 passed (14)`.
- `npm run test:run` (full):
  ```
   Test Files  182 passed | 1 skipped (183)
        Tests  2987 passed | 18 skipped (3005)
  ```
  (+14 vs phase 2's 2973 — exactly the new hoverTarget tests; no regressions.)

### Open risks
- `HoverOverlay` chrome-suppression uses a conservative selector set (`[data-toolbar-type]`, `header`, `[role="dialog"]`, `[data-radix-portal]`); if some editor panel isn't covered the overlay may briefly show over it — Gate-B manual check recommended, cheap to extend.
- Atelier double-affordance (above) — Gate B decision, not a code risk in this phase.
