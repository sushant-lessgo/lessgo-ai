---
tier: full
tier-why: editor selection/store internals + dual-renderer blocks + per-template header markup + form/publish surface — all risky.
status: agreed (action list closed 2026-07-14); build sequencing partly open (see Open questions)
---

# Toolbar Standard — plan

## Problem / why
In-editor editing is inconsistent. There IS a dispatch spine (`ToolbarShell` + `useSelectionPriority` + `actionSets.tsx`) that Text / Image / Section already flow through cleanly, but the worst offenders **bypass** it with bespoke UI: Logo = inline upload buttons (no toolbar), Link = a standalone Radix popover, Header menu = its own legacy `fixed` bar outside the shell. Form / Footer / Social / Box have no selection toolbar at all. Result: "how you edit" depends on what you clicked.

Not competing with Wix — our product is different (AI-generated, single-conversion landing pages, template/skeleton-driven, no freeform canvas). We want **all toolbars, with our own curated actions**, unified on one shell.

## Goal
One toolbar standard: every editable element/section is edited through the same floating shell with a consistent anatomy and our own action set. Close the full per-element action list, split **Beta (essentials)** vs **Final shape**. This doc is the build contract AND the requirements input for the skeleton architecture (see Dependency).

## Toolbar standard — anatomy
Every toolbar: `[ element-specific actions ] · [ Design ▾ ] · [ Ask Lessgo AI ] · [ ⋯ / Delete ]`
- One shell, floats above selection (migrate the renegades — Logo/Link/Menu — onto it; kill their bespoke UI).
- **Design ▾** = our curated style sub-panel (formerly "D1"): background, spacing, corners, border, shadow, opacity. **Skeleton-gated → Final everywhere** (blocks hardcode CSS today; nothing to render style tokens into until skeleton).
- **Ask Lessgo AI** = first-class per-element AI action (rewrite/regenerate in context).

## Agreed action list (Beta = essentials · Final = full shape)

| Toolbar | Beta (essentials) | Final |
|---|---|---|
| **Text** | Edit inline · size · B/I/U · color · align · Link · Ask Lessgo AI (rewrite) | Font family · strikethrough · save/apply style · animation |
| **Button/CTA** | Edit text · Link/Action · Style (primary/secondary/tertiary) · Ask Lessgo AI | Icon · display (text/icon) · color override · explore designs · animation |
| **Image** | Replace · Stock · Crop · Link · Delete | Adjust/filters · alt text · animation · explore designs |
| **Logo** | Replace/upload · Link (home) · size | Text/image toggle · dark vLessgo AInt · explore designs |
| **Menu (nav)** | Manage items (reorder, add page/link/anchor, rename, remove) · Format (bar ↔ hamburger) | Vertical/horizontal · color · text style · explore designs |
| **Header (bar)** | Background color · Sticky on/off | Scroll effects (fade/disappear) · opacity · Design ▾ |
| **Section** | Change Layout · Elements (toggle) · Move · Duplicate · Delete · Background | Design ▾ (spacing/corners/border/shadow) · animation |
| **Form** | Edit fields · Choose type · Settings (recipient/integration) · Ask Lessgo AI (labels) | Color/style · explore designs |
| **Footer** | Manage links · Background | Design ▾ · explore designs |
| **Social bar** | Manage items (platform + URL, reorder) · Orientation | Icon style · color |
| **Box/Card** | — (deferred: skeleton-era) | Explore designs · Background · Design ▾ |
| **Portfolio/Gallery** | — (per-vertical, skeleton-era) | Manage projects · display elements · layout |
| **Global chrome** (top bar) | Page dropdown · Mobile-view toggle · Publish · Settings (SEO/language/domain) · Ask Lessgo AI | Version history · custom code |

### Resolved decisions (this discussion)
- **Ask Lessgo AI = per-element, Beta** on every toolbar (not one global Lessgo AI).
- **Menu editor Beta = manage items + bar/hamburger format only**; color/text styling → Final.
- **"Explore designs" = Final everywhere** — per-element design browsing is a Wix-ism; for us layout/palette live at section + template level.
- **Logo "settings" cut** — redundant.
- **Box + Portfolio = Final only** — no Beta version; they exist once skeleton exposes editable boxes / the work vertical.
- **Preview merges into edit** — no separate preview page; Mobile-view toggle + clean read mode is the Beta chrome.

## Dependency: skeleton (why this doc feeds it, not the reverse)
Fault line is **shared-primitive vs per-template-markup**, not content-vs-style:
- **Auto-consume today (no template work):** Text, Image, Section, and the selection/dispatch shell — attribute-driven (`data-element-key` / `data-section-id`), shared `InlineTextEditorV2`. Atelier already gets these.
- **Per-template bespoke (skeleton consolidates these):** Logo, Header menu, and the whole Design ▾ panel live inside each template's header/block markup (e.g. Atelier's logo is inline `E.Img elementKey="logo_image"`; only techpremium uses the shared `EditableLogo`). Blocks style via fixed `className` → template CSS; they do NOT read arbitrary style tokens, so a toolbar writing `radius:8px` has nowhere to land until skeleton.

Direction: **skeleton unblocks** the rich toolbars; **this action list informs** skeleton's token/editable-surface contract. So: spec toolbars (this doc) → build skeleton to serve it → build the header-resident + Design ▾ toolbars on the shared layer once → propagates to all templates. Avoids 9× bespoke rework.

## Scope OUT (non-goals)
- Wix parity / freeform canvas.
- Per-element "explore designs" in Beta.
- Design ▾ (background/border/corner/shadow/spacing) in Beta — skeleton-gated.
- Box + Portfolio toolbars in Beta.

## References (current code)
- Dispatch spine: `src/app/edit/[token]/components/ui/FloatingToolbars.tsx` → `.../toolbars/ToolbarShell.tsx` → `useSelectionPriority` (`src/hooks/useSelectionPriority.ts`, `src/utils/selectionPriority.ts`) → registry `.../toolbars/actionSets.tsx` (only section/element/text/image wired).
- Solid to imitate: `.../toolbars/TextToolbarMVP.tsx`, `.../toolbars/ImageToolbar.tsx`, `.../toolbars/SectionToolbar.tsx`.
- Renegades to migrate/kill: `.../primitives/EditableLogo.tsx` (+ resolver `src/modules/editing/resolveLogo.ts`) · `src/components/editor/LinkTargetPopover.tsx` · `src/components/navigation/NavItemToolbar.tsx` (+ `NavigationEditor`).
- Selection: `src/app/edit/[token]/components/selection/SelectionSystem.tsx` (queries `[data-element-key]`/`[data-section-id]`).
- Template coupling exemplar: `src/modules/templates/atelier/blocks/Header/AtelierNavHeader.core.tsx`, `atelier/components/AtelierEditable.tsx`.
- Dual-renderer reminder: every style/structure action must work in both `.tsx` and `.published.tsx`.

## Candidate human gates
- Any change to editor store internals / selection dispatch.
- Per-template header ports (Logo/Menu) — decide the template set + whether to do it pre- or post-skeleton (see Open questions).
- Merge to main (Vercel auto-deploy).

## Acceptance criteria (Beta)
- [ ] Every Beta-listed element type is edited via the one shell (no bespoke Logo/Link/Menu UI remains).
- [ ] Toolbar anatomy consistent across all element types.
- [ ] Header menu editor exists: reorder / add (page|link|anchor) / rename / remove / bar↔hamburger.
- [ ] Logo, Link edited through the shell.
- [ ] Editor↔published parity holds for every toolbar action (dual-renderer).
- [ ] Works on active pilot templates (set TBD — Open questions).

## Pilot / smallest slice
Ratify the shell as the standard, then migrate the **3 renegades (Logo · Link · Menu)** onto it on one template (Atelier) + fold in the already-shared toolbars. Decision gate: does one consistent shell across all element types feel right before rolling to all templates + adding Form/Footer/Social Beta actions.

## Open questions
- Sequencing: build Beta Logo/Menu **per-template now** (accept skeleton rework) or **wait for skeleton**? (Text/Image/Section/Link safe now regardless.)
- Which templates must Beta support — all 9 or active pilots only?
- Pre-multipage, what does Menu "add page" mean — anchors only until skeleton multipage lands?
- Form editor: reuse existing form builder as-is, or restyle into the shell?
- Global chrome (top bar) — in this track or a separate edit-UI-shell track?
