# selection-highlight-labels — plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\selection-highlight-labels`
- **Branch:** `feature/selection-highlight-labels`
- **Spec:** `docs/task/selection-highlight-labels.spec.md` (full tier)
- **Pilot template:** Atelier (template-agnostic by construction — attribute-driven only)

## Overview

Redesign the editor canvas selection affordance: hover shows one stable outline + a label badge naming the toolbar the click will open (1:1 with `getActiveToolbar`); click commits selection through the existing dispatch spine. Along the way fix the two bugs: (1) hover/selection flicker caused by four competing highlight writers + duplicate `data-section-id` stamping on nested wrappers and element nodes; (2) section-click visually lighting up all child elements because `SelectionSystem` sweeps `document.querySelectorAll('[data-section-id]')`, which matches element wrappers too. No store/selection-state changes; no schema; editor-only.

**Parity confirmation (spec asked):** NO `.published.tsx` work. Every touched file is editor chrome (`src/app/edit/[token]/**`, `useEditor.ts`, `selectionPriority`/new util, `globals.css` editor rules). `data-section-root` is stamped only in the edit renderer (`EditablePageRenderer`, edit mode), never in published output. `public/published.css` untouched → no rebuild-for-publish concern.

## Progress log

- phase 1 canonical section-root + rescoped section queries: done (review loops 1, ship)
- phase 2 single-writer highlight consolidation (flicker fix): pending
- gate A bug-fix sign-off on Atelier: pending
- phase 3 shared target resolver + hover overlay + labels (wired types): pending
- phase 4 placeholder-type labels (Logo/Menu/Header/Form/Footer/Social bar): pending
- gate B pilot decision gate (readability, 1:1, hover-trigger, label strings): pending
- phase 5 regression pinning + docs + full green: pending

## Key design decisions (rationale up front)

### D1 — Root fix = canonical `data-section-root` marker, NOT removing `data-section-id` from element wrappers
Scout verified `data-section-id` is duplicated at **many** levels per section: MainContent wrapper (`MainContent.tsx:585`), ElementDetector wrapper (`ElementDetector.tsx:109`), EditablePageRenderer root (`EditablePageRenderer.tsx:125`), some template block `<section>` tags (meridian/techpremium/hearth/lumen blocks), AND every element wrapper (`EditableWrapper.tsx`, all 9 `*Editable.tsx`, `EditableText`, `InlineTextEditorV2`, `FormRenderer`). So stripping it from element wrappers alone would NOT make `[data-section-id]` unique (nested section containers remain), and it would touch 12+ files across every template. Load-bearing check: all consumers use `closest('[data-section-id]')` (same value regardless of which node matches) or descendant selectors `[data-section-id="X"] [data-element-key="Y"]` (still match via the container) — so removal is *safe* but *insufficient*. Correct root fix: stamp **one** canonical marker `data-section-root={sectionId}` at a single choke point and re-scope all "enumerate/decorate sections" queries to it. Leave `data-section-id` stamping untouched everywhere (anchors, closest() reads, descendant selectors keep working).

**Choke point:** `EditablePageRenderer.tsx` root div (L119-129) — the ONE wrapper every edit-canvas section flows through (MainContent is its only mounter, verified), and it hugs the actual section content (no editor px-4 chrome padding like MainContent's wrapper) → the outline drawn on it matches what the user thinks of as "the section". Stamp only when `mode !== 'preview'`.

### D2 — One highlight writer per concern
Today four writers style "section selected": MainContent React className (ring-2, L576-579), EditablePageRenderer React className (ring-2, L122), SelectionSystem imperative sweep (`.selected-section`, L67-117), ElementDetector imperative effect (`.section-selected`, L27-50). Plus ElementDetector's click handler imperatively adds `.element-hover`/`data-selection-depth`. Consolidation (minimal, not the M9/M10/M11 cleanup which stays scope-OUT):
- **Selected visuals (section + element): SelectionSystem sweep is the single writer** — it must run anyway for aria stamping, and after D1 it targets exactly one node per section. Delete the other three writers' selection classes.
- **Hover visuals: single JS-driven overlay** (phase 3) — needed anyway for the label badge; interim (phase 2) the existing CSS hover is re-scoped + de-transitioned so no bad intermediate state ships.
- `isSectionVisuallySelected()` (`selectionPriority.ts:95-101`) stays the one gate feeding the writer — spine unchanged.

### D3 — Flicker mechanics being fixed
(a) CSS `:hover` applies to the whole ancestor chain, and today ~5 nested nodes per section match `[data-section-id]:hover` (incl. the element wrapper under the pointer) → overlapping outlines appearing/disappearing as the pointer crosses nested boundaries; (b) `transition: all/outline 0.15-0.2s` (`SelectionSystem.tsx:353,360,377-379`, `globals.css:19,107`) makes every re-application fade in/out → reads as flicker; (c) ElementDetector's imperative `.element-hover` on click competes with the sweep. Fix = D1 scoping + D2 consolidation + remove outline transitions.

### D4 — Hover label must be derived from the SAME resolution as click
Extract the pure target-resolution core of `determineClickTarget` (`useEditor.ts:48-127`: closest `[data-element-key]` wins, else closest section, guards for toolbar/`data-image-id`) into a shared pure module; both the click path and the new hover overlay call it. That makes hover-label ↔ resulting-toolbar 1:1 by construction, not by parallel reimplementation. The store guards (isTextEditing / toolbar.type) stay in `useEditor`; no parallel selection path (spec constraint).

### D5 — Hover overlay is a fixed-position element, NOT classes/DOM injected into content
Follow the proven `VerifyMarkerControls` pattern (`SelectionSystem.tsx:205-306`): `position: fixed` box + label chip computed from `getBoundingClientRect()`, recomputed on scroll/resize (rAF-throttled), `pointer-events: none`. Zero writes into content DOM → no contentEditable serialization pollution (warned at `SelectionSystem.tsx:202-204`), no layout shift, no class thrash.

### D6 — Section-level hover trigger (proposal; human confirms at Gate B)
**Recommendation: the whole section surface — background, padding, and gaps between elements — triggers section hover, EXCEPT when the pointer is over a child `[data-element-key]` node (element wins).** This exactly mirrors click dispatch (`determineClickTarget`), so the hover label always predicts the click — the core promise of this feature. Alternatives rejected: "whole background even over elements" breaks 1:1; "no section hover at all / only via chrome" makes section selection undiscoverable.

### D7 — Label vocabulary (toolbarPlan verbatim; human confirms at Gate B)
From `docs/tracks/toolbarPlan.md` action-list table (L25-39), dropping doc-only parentheticals:

| Resolved target | Label | Status |
|---|---|---|
| section container | `Section` | wired |
| text element (default) | `Text` | wired |
| elementKey matches cta/button convention | `Button/CTA` | wired (element toolbar) |
| image (`data-image-id` / IMG) | `Image` | wired |
| logo element (`logo` key convention, e.g. Atelier `logo_image`) | `Logo` | placeholder |
| nav item inside header section | `Menu` | placeholder |
| header section container (sectionId `header-*`) | `Header` | placeholder |
| form container (closest `form` / form-builder container) | `Form` | placeholder |
| footer section container (sectionId `footer-*`) | `Footer` | placeholder |
| social elements (`social` key convention) | `Social bar` | placeholder |

Notes for the gate: spec's vocab list (L23) omits `Header` but toolbarPlan has a Header (bar) toolbar — proposing to include it. Spec mentions `Link` as a placeholder type but toolbarPlan has NO Link toolbar (links ride the Text toolbar's Link action) — proposing standalone links label `Text` (or `Button/CTA` when the key matches cta/button), i.e. the toolbar they actually get.

---

## Phase 1 — Canonical section-root + rescoped section queries (fixes bug 2)

**Goal:** exactly one node per section matches the "section" selector; section-click decorates only that node.

**Files touched:**
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
- `src/hooks/useEditor.ts`
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx`

**Steps:**
1. `EditablePageRenderer.tsx`: on the root div (L119-129), add `data-section-root={sectionId}` when `mode !== 'preview'` (alongside existing `data-section-id`; do not remove anything).
2. `SelectionSystem.tsx` accessibility/selection sweep (L67-117): change `document.querySelectorAll('[data-section-id]')` (L71) → `'[data-section-root]'` and read `data-section-root`. Role/tabindex/aria/`.selected-section`/`.multi-selected` now land on exactly one node per section. Element sweep (L96-116) unchanged.
3. `SelectionSystem.tsx` focus effect (L168): section focus query → `[data-section-root="${selectedSection}"]` (the node that now carries `tabindex`).
4. `useEditor.ts` keyboard next/prev-section navigation (L357-374): `querySelectorAll('[data-section-id]')` → `'[data-section-root]'` (currently iterates element wrappers too — latent nav bug fixed for free).
5. `ToolbarShell.tsx` `resolveAnchor` section branch (L51): `[data-section-id="${id}"]` → `[data-section-root="${id}"]` with fallback to the old selector if null (defensive; behavior identical since first document-order match was already a section container).
6. Do NOT touch: `closest('[data-section-id]')` reads, descendant selectors, `LeftPanel` scroll-to, `emailFormDetector`, templates.

**Verification:**
- `npx tsc --noEmit` + `npm run test:run` green.
- Manual (Atelier, `npm run dev`): click a section background → exactly ONE blue outline around the section; child elements show no outline; SectionToolbar opens and anchors correctly. Element click still selects the element. Tab/arrow section navigation walks sections (not elements). Store checks unchanged (spec/scout confirm store was already correct — this is visual-layer only).

---

## Phase 2 — Single-writer highlight consolidation (fixes flicker)

**Goal:** one writer for selected visuals, stable de-transitioned hover; pointer resting on a target never blinks.

**Files touched:**
- `src/app/edit/[token]/components/selection/ElementDetector.tsx`
- `src/app/edit/[token]/components/layout/MainContent.tsx`
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
- `src/app/globals.css`

**Steps:**
1. `ElementDetector.tsx`: delete the selection-indicator effect (L27-50: `.element-selected`/`.section-selected` writers), delete `handleNestedElementClick` + its `onClick` (L53-89, 111 — purely visual `.element-hover`/`data-selection-depth`, competes with unified click handler), delete the corresponding rules from `ElementDetectorStyles` (L125-155) and the mode-change cleanup for those classes. Keep the wrapper div + `data-section-id` (other code `closest()`s through it).
2. `MainContent.tsx`: remove the section-selected ring/border classes from both wrappers (L549 `border-primary/40 shadow-md bg-primary/5`, L576-579 `ring-2 ring-blue-500...` ternary → keep only non-selection hover chrome or drop). `isSectionVisuallySelected` import stays (still feeds `aria-selected` L589 + `isSelected` prop if retained).
3. `EditablePageRenderer.tsx`: remove `isSelected ? 'ring-2 ring-blue-500' : ''` (L122) — SelectionSystem's `.selected-section` on this same node is now the single visual.
4. `SelectionSystem.tsx` `SelectionStyles` (L309-406): rescope hover rules — `[data-section-id]:hover…` (L350) → `[data-section-root]:hover:not(:has([data-element-key]:hover))…` (element wins, mirrors dispatch; interim until phase 3 overlay replaces it); keep `[data-element-key]:hover` (L356) but drop `transition: all` → no transition. Remove the blanket transition rule (L377-379). Keep `.selected-section`/`.selected-element`/`.multi-selected`/focus styles.
5. `globals.css`: L19 `transition: all 0.2s ease` on `[data-element-key]` → `transition: background-color 0.2s ease` (or remove); L107 drop `outline` from the transition list. Leave cursor/contentEditable rules alone.

**Verification:**
- `npx tsc --noEmit` + `npm run test:run` green.
- Manual (Atelier): (a) rest pointer on an element 5s → outline steady, no on/off; (b) sweep pointer across element boundaries → single outline follows, no stacked/overlapping outlines; (c) select section → one outline; select element → element outline only, section outline drops (`isSectionVisuallySelected` gate); (d) text editing outline (contentEditable) unaffected; (e) AI-verify markers still render.

### 🚦 GATE A — human sign-off (bug fixes on the selection-dispatch surface)
Per spec candidate gate "any change to editor selection dispatch": user verifies on Atelier dev that both bugs are dead (no flicker; section-click selects only the section) and nothing regressed (text edit, image toolbar, form, keyboard nav, drag) before we build the new affordance on top. No merge — feature branch only.

---

## Phase 3 — Shared target resolver + hover overlay + label badge (wired types)

**Goal:** hovering any editable target shows one outline + a badge naming the toolbar the click will produce, for wired types: `Section`, `Text`, `Button/CTA`, `Image`.

**Files touched:**
- `src/utils/hoverTarget.ts` (new)
- `src/utils/hoverTarget.test.ts` (new)
- `src/hooks/useEditor.ts`
- `src/app/edit/[token]/components/selection/HoverOverlay.tsx` (new)
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx`
- `src/app/globals.css`

**Steps:**
1. `src/utils/hoverTarget.ts` (pure, jsdom-testable, no store imports):
   - `resolveTarget(node: HTMLElement): { kind: 'element'|'section'|null; sectionId; elementKey; node }` — extracted from `determineClickTarget`'s DOM core (`useEditor.ts:86-127`): toolbar guard (`closest('[data-toolbar-type]')` → null), `data-image-id` detection, closest `[data-element-key]` wins else closest section container; section resolution prefers `closest('[data-section-root]')`.
   - `getTargetLabel(target): string` — classifier per D7 table, wired types only this phase: section → `Section`; element with `data-image-id`/IMG → `Image`; elementKey cta/button convention (reuse the `*="cta"` / `*="button"` key convention already relied on by `globals.css:100-101`) → `Button/CTA`; else → `Text`. Where a node carries a usable `data-element-type`, map via `UNIVERSAL_ELEMENTS` (`src/types/universalElements.ts:136-283`) `label`/`toolbarType` first (covers manually-added universal elements); fall back to key conventions (attr is debug-only on AI blocks).
2. `useEditor.ts`: refactor `determineClickTarget` to call `resolveTarget` for the DOM resolution, keeping its store-state guards (isTextEditing/toolbar.type/targetId checks L53-77, image early-return contract L86-90) and its return shape exactly as-is. **Behavior-preserving refactor — no dispatch semantics change.**
3. `HoverOverlay.tsx` (new, mounted from `SelectionSystem` alongside `SelectionIndicators`, edit mode only): document-level `pointerover`/`pointermove` (rAF-throttled) + `pointerleave`; resolves via `resolveTarget`; renders a `position: fixed`, `pointer-events: none` outline box + label chip (top-left, flipping inside viewport) from `getBoundingClientRect()`, recomputed on scroll/resize (D5, `VerifyMarkerControls` pattern). Suppress when: `mode !== 'edit'`, `isTextEditing`, pointer over `[data-toolbar-type]`/editor chrome panels, or hovered target === current selection (selected outline already owns it). Style: outline color distinct from selection blue/green; label chip like the existing `.selection-badge`/section-label chip styling.
4. `SelectionSystem.tsx`: mount `HoverOverlay`; remove the interim CSS hover-outline rules from `SelectionStyles` (phase-2 step 4) — the overlay is now the only hover affordance. Remove the dead commented `SelectionBadge` usages (L421-437) if trivial, else leave.
5. `globals.css`: remove element hover background tints now superseded (L22-26, L96-103); keep cursor rules.
6. `hoverTarget.test.ts`: jsdom fixtures with the real nesting shape (section-root wrapper > block `<section data-section-id>` > element wrappers carrying BOTH attrs) asserting: element hover wins over section; section background/gap resolves to section (D6); duplicate `data-section-id` nodes never yield multiple targets; toolbar guard; image detection; label classifier cases.

**Verification:**
- `npx tsc --noEmit` + `npm run test:run` green (incl. new `hoverTarget.test.ts`).
- Manual (Atelier): hover headline → outline + `Text`, click → text-capable element toolbar (1:1); hover CTA → `Button/CTA`; hover image → `Image`, click → ImageToolbar; hover section gap/padding → `Section`, click → SectionToolbar; no flicker; no layout shift (badge overlays, never injected); scroll while hovering → overlay tracks; text-editing mode → overlay hidden; preview mode → nothing.

---

## Phase 4 — Placeholder-type labels (Logo/Menu/Header/Form/Footer/Social bar)

**Goal:** full vocabulary per spec — placeholder types show the correct toolbarPlan label even though their toolbar isn't wired yet. Labels only; NO new toolbars (scope-OUT).

**Files touched:**
- `src/utils/hoverTarget.ts`
- `src/utils/hoverTarget.test.ts`

**Steps:**
1. Extend `getTargetLabel` with template-agnostic, attribute/convention-driven rules (D7 table), checked before the wired defaults:
   - Section-level: sectionId prefix (`${type}-${uuid}` convention) `header-*` → `Header`, `footer-*` → `Footer`.
   - Element-level: logo key convention (`logo`, `logo_image`, `nav_logo` — verify against Atelier header + `EditableLogo`/`resolveLogo.ts` conventions during implementation) → `Logo`; nav-item keys inside a `header-*` section (e.g. `nav_item*`, keys used by `NavItemToolbar`/`NavigationEditor`) → `Menu`; `closest('form')` or form-builder container (`FormRenderer.tsx` wrapper attrs) → `Form`; `social` key convention → `Social bar`.
   - Precedence: specific placeholder rules > `Image`/`Button/CTA` conventions > `Text`; section placeholders > `Section`.
2. Extend tests: one fixture per placeholder type + precedence cases (logo inside header labels `Logo` not `Menu`; form field labels `Form` not `Text`).
3. Clicking a placeholder-labelled target keeps today's behavior (whatever toolbar currently fires) — labels are forward-vocabulary only; document this in the module docstring so the toolbarPlan track relabels nothing when real toolbars land.

**Verification:**
- `npx tsc --noEmit` + `npm run test:run` green.
- Manual (Atelier): hover logo → `Logo`; nav item → `Menu`; header bar background → `Header`; contact form → `Form`; footer → `Footer`; social links → `Social bar`. Cross-check one other template (e.g. meridian or hearth) to confirm attribute-driven, zero per-template code.

### 🚦 GATE B — pilot decision gate (human)
Per spec: on Atelier dev, user confirms (1) highlight + label read clearly; (2) hover-label ↔ resulting-toolbar feels 1:1; (3) section hover-trigger choice (D6: whole surface, element wins) is right; (4) exact placeholder label strings (D7 incl. `Header` inclusion + `Link`→`Text` ruling). Rejections loop back into phase 3/4 tweaks before phase 5.

---

## Phase 5 — Regression pinning, docs, full green

**Goal:** pin the fixed behavior in tests, update the editor README contract, ship-ready green.

**Files touched:**
- `src/utils/selectionPriority.test.ts`
- `src/utils/hoverTarget.test.ts`
- `src/app/edit/[token]/README.md`

**Steps:**
1. `selectionPriority.test.ts`: add cases pinning `isSectionVisuallySelected` interplay with the single-writer model (section selected + element selected → section visual off) if not already covered; assert `getActiveToolbar` priorities used by the label mapping stay stable.
2. `hoverTarget.test.ts`: add a regression fixture named for the bugs — many nodes sharing one `data-section-id` (element wrappers + nested containers) → exactly one section target; ensures the duplicate-stamp bug can't silently return.
3. `src/app/edit/[token]/README.md`: document the selection DOM contract — `data-section-root` (canonical, one per section, edit-only) vs `data-section-id` (legacy, duplicated, closest()/descendant reads only), single-writer rule (SelectionSystem = selected classes; HoverOverlay = hover), and the hover-label vocabulary source (`hoverTarget.ts` ↔ toolbarPlan).
4. Full gate: `npx tsc --noEmit`, `npm run test:run`, `npm run lint`, `npm run build` — all green locally (no-PR workflow: green BEFORE the merge gate).

**Verification:** all four commands green; acceptance-criteria checklist from the spec walked once end-to-end on Atelier dev.

### 🚦 Merge to main — human gate (per pipeline; user merges + pushes, Vercel auto-deploys, deploy-watcher polls).

---

## Explicitly out of scope (restating spec)
- Building Logo/Menu/Form/Footer/Social toolbars (toolbarPlan track).
- M9/M10/M11 editor landmines (legacy DOM-hijack text path, `bulkUpdateSection`, `reset` stub).
- Model B drill-in, freeform canvas, multi-select UX changes (`multiSelection` classes kept as-is).
- Removing `data-section-id` stamping from element wrappers/templates (safe but insufficient; revisit in a cleanup track).

## Unresolved questions
1. D6 hover trigger (whole section surface, element wins) — OK? (confirm at Gate B)
2. D7: include `Header` label though spec vocab omitted it? (Gate B)
3. D7: standalone links label `Text` (no Link toolbar in toolbarPlan) — OK? (Gate B)
4. Hover overlay while an element is text-editing: fully hidden (proposed) or shown for other targets?
5. Badge chip position: top-left of target (proposed) vs top-right?
