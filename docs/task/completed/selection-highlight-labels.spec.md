---
tier: full
tier-why: editor selection internals + dispatch spine (SelectionSystem, useSelectionPriority, selectionPriority, FloatingToolbars) — risky surface per pipeline rules.
---

# selection-highlight-labels — spec

## Problem / why
On the editor canvas the hover/selection affordance is confusing — you can't tell what you're about to act on. Two concrete bugs make it worse:
1. Highlight **flickers** — appears then disappears immediately on hover.
2. Clicking a **section** also selects **all its child elements** (wrong — should select just the section).

Users don't know which toolbar a click will give them.

## Goal
Redesign the section/element highlight + label affordance so the canvas clearly shows what you're about to select, tied 1:1 to the toolbar you'll get. Hover shows an outline + a label badge naming the target's toolbar type; clicking commits selection and opens that toolbar. Fix the flicker and the section→all-elements selection bleed as part of the redesign.

## Selection model (agreed)
- **One thing at a time (Model A):** hover/click resolves to a single Section OR a single element — never both. Clicking a section selects only the section; its child elements stay unselected until you click into one.
- **Affordance timing:**
  - **Hover** = highlight outline + label badge of the target (no toolbar yet).
  - **Click** = commits selection, toolbar appears.
- **Label = toolbar-type vocabulary**, 1:1 with the resulting toolbar: Section · Text · Button · Image · Logo · Menu · Form · Footer · Social (per toolbarPlan table).
- **Full vocab now:** label every editable type immediately. Types whose real toolbar isn't wired yet (Logo/Menu/Link/Form/Footer/Social) use **placeholder toolbar names** so hover-label ↔ toolbar stays 1:1 and the system is ready when toolbarPlan lands.

## Scope OUT (non-goals)
- Building the actual toolbarPlan toolbars (Logo/Menu/Form/Footer/Social) — that track comes next; here they're placeholder labels only.
- Editor landmines M9 / M10 / M11 from the code-quality report (legacy DOM-hijack text-edit path, `bulkUpdateSection` shape, `reset` stub) — **kept as a separate cleanup track**, not bundled here.
- Nested drill-in / Figma-style frame selection (Model B) — explicitly not this.
- Freeform/Wix-style canvas selection.

## Constraints
- Must flow through the existing dispatch spine — `useSelectionPriority` / `selectionPriority.ts` / `ToolbarShell` — not a parallel selection path.
- Editor-only overlay (selection/highlight UI); not a published-renderer concern. (No `.published.tsx` parity work expected — planner confirm.)
- Attribute-driven and template-agnostic by construction (`data-element-key` / `data-section-id`); don't hardcode per-template.
- Placeholder toolbar names should match the toolbarPlan vocabulary so the follow-on track drops in without relabeling.

## References
- Dispatch spine: `src/app/edit/[token]/components/ui/FloatingToolbars.tsx` → `.../toolbars/ToolbarShell.tsx` → `useSelectionPriority` (`src/hooks/useSelectionPriority.ts`, `src/utils/selectionPriority.ts`) → `.../toolbars/actionSets.tsx`.
- Selection query layer: `src/app/edit/[token]/components/selection/SelectionSystem.tsx` (queries `[data-element-key]` / `[data-section-id]`) — primary suspect for both bugs (flicker + section→all-elements).
- Toolbar-type vocabulary + which toolbars are wired vs placeholder: `docs/tracks/toolbarPlan.md` (action-list table).
- Solid toolbar patterns to stay consistent with: `.../toolbars/TextToolbarMVP.tsx`, `ImageToolbar.tsx`, `SectionToolbar.tsx`.

## Open exploration questions (feeds scout)
- Root cause of the **flicker**: is it hover-state thrash in `SelectionSystem` (mouseover/mouseout bubbling between element and section) or a re-render/z-index issue on the highlight overlay?
- Root cause of **section-click → all-elements**: where does the section click handler set element selection? Is it event-bubbling from child `[data-element-key]` nodes, or an explicit "select children" in the store?
- How is the current highlight rendered (overlay div vs outline on the node) and where would a label badge attach without layout shift?
- What determines a node's toolbar type today, and is that mapping reusable to derive the hover label (incl. placeholder types)?
- Section-level hover trigger: whole background vs gaps/padding vs only child elements — **planner decides** (see gates).

## Candidate human gates
- Any change to editor selection dispatch / store selection state.
- Section-level hover-trigger decision (background vs padding/gaps) — planner proposes, human confirms at the pilot gate.
- Exact placeholder-toolbar label strings — planner proposes from toolbarPlan; human confirm.
- Merge to main (Vercel auto-deploy).

## Acceptance criteria
- [ ] Hovering any editable target shows a stable outline + label badge naming its toolbar type (no flicker).
- [ ] Highlight does **not** flicker on/off while the pointer rests on a target.
- [ ] Clicking a section selects **only** the section (child elements not selected).
- [ ] Clicking a child element selects only that element; the hover label matched the toolbar that then opens (1:1).
- [ ] Placeholder-labelled types (Logo/Menu/Form/Footer/Social) show the correct label even though their real toolbar isn't wired yet.
- [ ] Selection flows through `useSelectionPriority` — no parallel selection path introduced.
- [ ] Works on Atelier (pilot); template-agnostic by construction.
- [ ] `tsc` + `test:run` green; dispatch/selection regression tests updated if behavior pinned.

## Pilot / smallest slice
Prove on **Atelier** (matches toolbarPlan's pilot). Thin slice = fix the 2 bugs + ship the hover outline + label badge for the **wired** types (Section/Text/Image/Button), with placeholder labels for the rest.
**Decision gate:** does the highlight + label read clearly and does hover-label ↔ resulting-toolbar feel right before rolling label polish across all templates.
