---
tier: full
tier-why: editor selection/store internals + dispatch shell + dual-renderer blocks + per-element markup + Ask-AI (LLM/credits). Risky editor surface — full pipeline.
---

# toolbar-standard-beta — spec  (Lane 3 · Toolbar standard — Beta, buildable-now slice)

# NOTE: `docs/tracks/toolbarPlan.md` is the CLOSED contract (anatomy + full Beta/Final action
# list + resolved decisions). This spec carves the **Beta, non-skeleton-gated** slice to build now.

## Problem / why
In-editor editing is inconsistent: a dispatch spine exists (`ToolbarShell` + `useSelectionPriority`
+ `actionSets.tsx`) that Text/Image/Section flow through, but renegades bypass it (Link = standalone
Radix popover; Menu/Logo/Header = bespoke UI) and Form/Footer/Social/Box have no toolbar. "How you
edit depends on what you clicked." The reimagined editor (handoff t2) wants **one floating curated
toolbar** everywhere. editor-shell reskinned the top bar and left the per-element toolbars as greyed
placeholders — this fills them. selection-highlight-labels (merged) is the precursor.

## Goal
Every editable element/section is edited through **one floating shell** with the handoff t2 look and
our curated **Beta** action set — for the toolbars that don't need the skeleton. Migrate the
buildable renegades (Link → shared picker; Menu/Social/Footer/Form lists → one manage-items shell).
Defer skeleton-gated pieces (Design ▾, Logo, Header-menu) to Final.

## Approach (decided — per toolbarPlan dependency analysis)
- **Build the Beta shell + action sets that auto-consume the dispatch spine today** (attribute-driven
  `data-element-key`/`data-section-id`): Text, Button/CTA, Image, Section, Form, Footer, Social.
- **Migrate the buildable renegades onto the shell**: **Link picker (t4)** (kill the standalone
  Radix popover) + **Manage-items (t5)** — one reorder/add/edit/remove shell reused for Menu, Social,
  Footer links, Form fields.
- **Ask Lessgo AI** = first-class per-element Beta action (rewrite/regenerate in context).
- **Defer skeleton-gated** (per toolbarPlan): **Design ▾** panel, **Logo** toolbar, **Header-menu**
  toolbar — they live in per-template bespoke markup with no token surface to write into until
  skeleton generalizes (D1 is atelier2-only/dev). Box/Card + Portfolio/Gallery = Final/skeleton-era.
- Reskin all toolbars to handoff **t2** using `ui-foundation`.

## Scope IN (Beta action sets — see toolbarPlan for the exact list)
- **One shell (t2)**: floating, consistent anatomy `[element actions] · [Ask Lessgo AI] · [⋯/Delete]`
  (Design ▾ slot present but disabled/greyed — skeleton-gated), reskinned to t2.
- **Text**: inline edit · size · B/I/U · color · align · Link · Ask AI (rewrite).
- **Button/CTA**: edit text · Link/Action · Style (primary/secondary/tertiary) · Ask AI.
- **Image**: Replace · Stock · Crop · Link · Delete — **Replace/Stock/Crop route through the
  media picker** (`media-library-picker`, coordinate).
- **Section**: Change Layout · Elements (toggle) · Move · Duplicate · Delete · Background.
- **Form**: edit fields · choose type · settings (recipient/integration) · Ask AI (labels).
- **Footer**: manage links · background. **Social**: manage items (platform+URL, reorder) · orientation.
- **t4 — Link picker**: one shared picker (segmented type control, new-tab switch), opens from
  Button/CTA, text link, menu items.
- **t5 — Manage-items**: one reorder/add/edit/remove shell for Menu (reorder/add page-link-anchor/
  rename/remove + bar↔hamburger format), Social, Footer, Form fields.
- **Ask Lessgo AI** per-element (rewrite/regenerate in context).

## Scope OUT (non-goals)
- **Design ▾** style panel (background/spacing/corners/border/shadow/opacity) — **skeleton-gated → Final**.
- **Logo** + **Header-menu** toolbars — per-template bespoke markup, **skeleton-gated → Final**.
- **Box/Card, Portfolio/Gallery** toolbars — Final/skeleton-era.
- **"Explore designs"**, font-family, animation, filters, alt-text, version-history, custom-code —
  all **Final**.
- **Global-chrome top bar** (Page dropdown/Publish/Settings/Mobile toggle) — **owned by
  `editor-shell-redesign`**; this spec is the floating per-element toolbars only.
- No selection/highlight rework (built in the merged precursor).
- No dual-renderer/published output changes (edit-side toolbars only).
- No responsive/mobile pass.

## Constraints
- Depends on **`ui-foundation` merged** + the **selection-highlight-labels** precursor (merged).
- **Coordinate with `editor-shell-redesign`** (top-bar chrome — do NOT touch it here) and
  **`media-library-picker`** (Image Replace/Stock/Crop opens its picker — wire, don't rebuild).
- **Do NOT touch published output** (`.published.tsx`/renderers) — editor-side toolbars only.
- Migrate renegades onto the shell = **delete their bespoke UI** (no parallel toolbars left).
- **Ask AI = LLM + credits** — gate via `checkCredits()` + surface the block (align with the
  billing-beta gating message); it's the heaviest Beta piece (may be its own phase).
- Skeleton-gated items render **disabled/greyed** in the shell (consistent with editor-shell grey-out).
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- **`docs/tracks/toolbarPlan.md`** — the closed contract: anatomy, full Beta/Final action list,
  dependency analysis (which toolbars are skeleton-gated), resolved decisions. Primary input.
- `src/app/edit/[token]/components/toolbars/` — `ToolbarShell`, `actionSets.tsx`, `ElementToolbar`,
  `SectionToolbar`, `TextToolbarMVP`, `ImageToolbar` (existing spine to build on).
- `useSelectionPriority` / selection system (merged precursor).
- `docs/task/media-library-picker.spec.md` — Image Replace/Stock/Crop picker (coordinate).
- `docs/task/editor-shell-redesign.spec.md` — top-bar chrome (do not overlap).
- Handoff `Lessgo Editor Redesign.dc.html` t2 (toolbar), t4 (link picker), t5 (manage-items).
- `checkCredits()` + `docs/task/billing-beta.spec.md` — Ask-AI gating.

## Open exploration questions (feeds scout)
- Exact current state of each Beta toolbar in `actionSets.tsx` (which already flow through the shell
  vs need building — Button/CTA, Form, Footer, Social).
- Where Link's standalone Radix popover lives (to replace with t4) + all its call sites.
- Existing manage-items-like UI (any) to generalize into t5; the Menu/Social/Footer/Form data shapes.
- How Ask-AI-per-element should call generation (existing regenerate-element/section routes?) + credit cost.
- Confirm Design ▾/Logo/Header-menu are genuinely skeleton-gated for beta (skeleton D1 = atelier2-only).

## Candidate human gates
- **Ask AI credit/gating** copy + path before it faces paying users.
- Editor still edits + publishes end-to-end; published output identical (edit-side-only). Founder QA.

## Acceptance criteria
- [ ] One floating shell (t2 look) for Text/Button/Image/Section/Form/Footer/Social with Beta actions.
- [ ] Renegades migrated: Link → shared picker (t4); Menu/Social/Footer/Form lists → one manage-items
      shell (t5); bespoke UIs deleted.
- [ ] Ask Lessgo AI per-element works (credit-gated, block→message).
- [ ] Image Replace/Stock/Crop routes through the media picker.
- [ ] Design ▾ / Logo / Header-menu render disabled (greyed), deferred to Final; no published-output change.
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
Phase order for the planner: (1) t2 shell reskin + Text/Section/Image Beta (already spine-flowing),
(2) Button/CTA/Form/Footer/Social action sets, (3) t4 link picker + t5 manage-items (renegade
migration), (4) Ask Lessgo AI (LLM/credits). Gate after (2): every listed element edits through the
one shell in the t2 look.
