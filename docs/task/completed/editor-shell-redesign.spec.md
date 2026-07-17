---
tier: full
tier-why: editor surface + publish path (both risky-surface) + touches shared chrome files that Lane-2/3 also edit; presentation-only but delicate. Needs scout + plan-review + impl-review to hold the presentation/behavior line.
---

# editor-shell-redesign — spec  (Lane-1 · reskin #4)

## Problem / why
The in-editor chrome (top bar, Design menu, settings/SEO modals, publish flow, page
switcher, status pills, left rail) is pre-redesign. The handoff (`Lessgo Editor
Redesign.dc.html`) reimagines the editor shell in brand colors. This is the last top-level
Lane-1 reskin; it absorbs the held `editor-chrome.spec.md` + `publish-ux.spec.md`.

## Goal
Reskin the **complete non-canvas editor shell** to the handoff look so the editor reads as
one finished, brand-colored surface. Where an action's behavior belongs to a later lane,
render it **greyed/disabled** ("coming") rather than omitting it — later lanes wire behavior
into these finished slots. Presentation only: no editor internals, no publish-path logic,
no toolbar/selection/AI behavior.

## Approach (decided)
- **"Command Bar" = the reskinned top bar/chrome** (brand colors), NOT a new Ctrl+K command
  palette (rejected as new-behavior/Lane-3). Today's buttons/menus stay; they get redrawn.
  (Handoff Beta scope note confirms: Design stays in the top-bar menu; toolbars + per-element
  Design ▾ + Ask AI are held to Lane-3 / post-Beta.)
- **Full skin + grey-out.** Reskin all non-canvas chrome; not-yet-wired shell controls render
  greyed/disabled.
- **Presentation / behavior line (the #1 constraint).** Lane 1 owns the *visual shell*; later
  lanes own *behavior*, wiring into Lane-1's styled slots. Factor the reskin as
  **containers/slots** (styled shells accepting behavior via props/children) so Lane-2/3 add
  logic without redoing layout → no file collisions, no touching internals.

## Scope IN (reskin — presentation)
- **Top bar / chrome (t1)**: logo = app-menu → dashboard, brand colors, layout per t1.
- **Design menu (t14)**: reskin the existing top-bar theme controls (`ThemePopover` /
  `ServiceThemePopover` / `VestriaThemePopover`) into the new Design menu look (swap
  template / variant / accent). Behavior unchanged.
- **Site settings + SEO (t16) & per-page SEO (t18)**: reskin existing `SeoSettingsModal`
  (+ `SlugModal`, languages/`LocaleSettings`, domain entry) — SEO/languages/domain, global +
  per-page overrides. Behavior unchanged.
- **Publish flow (t17)**: reskin the confirm → publishing → live UI
  (`GlobalAppHeader` / `EditHeaderRightPanel` / `EditLayout` publish surface). Soft Review
  nudge, never a hard block. **Presentation only — do not change the publish API/staticExport/
  KV logic.**
- **Page switcher** (multi-page nav), **status pills** (setup/`ReviewPill`, `SaveStateChip`),
  language toggle — reskin.
- **Left rail / LeftPanel** — reskin the **container/frame + visual** only; its interactive
  behavior (add-section t13, skeleton) stays Lane-2/3, which wires into the styled shell.
- Not-yet-wired shell controls render **greyed/disabled** with a "coming" affordance.
- Built on `ui-foundation` tokens/primitives.

## Scope OUT (non-goals)
- **No editor internals**: edit store (`useEditStore`) internals, selection system
  (`SelectionSystem`/`ElementDetector`/`HoverOverlay`), canvas renderer
  (`LandingPageRenderer` / `EditablePageRenderer`). Presentation files may *read* the store via
  selectors (selector-first) but must not change store logic.
- **No toolbars (t2)** — Lane-3 / toolbarPlan builds them fresh in the new design.
- **No per-element Design ▾** (skeleton-gated) — Lane-2/3.
- **No Ask AI panel (t20)** — POST-BETA.
- **No publish-path logic** changes (API, `staticExport/htmlGenerator`, KV routes) — reskin
  the flow's UI only.
- **No stubbing of whole new-behavior screens** — grey-out applies to shell-level
  controls/menus, not to entire later-lane screens.
- **No dual-renderer / `.published.tsx` changes** — editor chrome is edit-side only; published
  output must not change.
- No responsive/mobile pass (desktop-first).

## Constraints
- Depends on **`ui-foundation` merged first**.
- **Presentation/behavior line is non-negotiable** — see Approach. impl-review must verify no
  store/selection/canvas/publish-logic change.
- **Published output unchanged** — this touches edit-side chrome only; a published page must
  render byte-identical (no `.published.tsx` / renderer / template edits).
- **Coordinate with adjacent tracks** (shared files): editor perf track (#0, store refactor
  just landed — build on selector-first), toolbarPlan (Lane 3, toolbars/left-rail behavior),
  work-skeleton (Lane 2). Structure shared chrome as slots to avoid collisions.
- Top-bar "back to dashboard" + logo/app-menu should be consistent with the dashboard
  workspace shell (`dashboard-workspace-ia`) top bar.
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Editor Redesign.dc.html`
  — t1 (shell), t14 (Design menu), t16 (site settings/SEO), t17 (publish), t18 (per-page SEO).
  Read markup for exact chrome layout/spacing/color. Beta scope note (near t1/t2b) defines
  what's held to later lanes.
- Handoff README §Editor + §Interactions (publish flow, focus/hover states).
- `src/app/edit/[token]/components/layout/` — `EditHeader`, `EditHeaderRightPanel`,
  `GlobalAppHeader`, `EditLayout`, `PageSwitcher`, `LeftPanel` (chrome to reskin).
- `src/app/edit/[token]/components/ui/` — `SeoSettingsModal`, `ReviewPill`, `SaveStateChip`;
  `src/components/SlugModal.tsx`.
- `ThemePopover` / `ServiceThemePopover` / `VestriaThemePopover` — Design menu controls to reskin.
- `docs/tracks/toolbarPlan.md`, `docs/tracks/workEndtoEnd.md` — adjacent-lane contracts (seam).
- `docs/task/ui-foundation.spec.md` — token/primitive source.

## Open exploration questions (feeds scout)
- Exact seam between chrome (reskin here) and behavior (Lane-2/3) in `EditHeader` / `LeftPanel`
  — which files can be reskinned without touching selection/store/toolbar logic?
- Which shell controls are "not yet wired" → should render greyed (map to grey-out list)?
- How the publish flow UI is currently wired (`GlobalAppHeader`/`EditHeaderRightPanel`/
  `EditLayout`) so the reskin restyles the flow without touching publish logic.
- `SeoSettingsModal` current shape vs handoff t16/t18 (global + per-page override model).
- Any editor-perf-track (#0) in-flight work on the same chrome files (collision check).
- Confirm chrome reskin can't reach `.published.tsx` / renderer (published parity).

## Candidate human gates
- **MANDATORY: published-parity gate.** A published page renders identical before/after
  (proves edit-side-only). Founder QA manual.
- **Presentation/behavior gate.** impl-review confirms zero store/selection/canvas/publish-logic
  change; editor still edits + publishes correctly end-to-end (founder manual QA).

## Acceptance criteria
- [ ] Editor top bar/chrome reskinned to t1 (brand colors, logo→dashboard, layout).
- [ ] Design menu (t14), SEO/site settings (t16) + per-page SEO (t18), publish flow (t17),
      page switcher, status pills reskinned to handoff — behavior unchanged.
- [ ] Left rail container/visual reskinned; its behavior untouched (Lane-2/3 slot).
- [ ] Not-yet-wired shell controls render greyed/disabled ("coming").
- [ ] No changes to store internals / selection / canvas renderer / toolbar logic / publish
      path / `.published.tsx`.
- [ ] Editor still edits, autosaves, and publishes end-to-end; published page identical
      before/after.
- [ ] Built on `ui-foundation` tokens/primitives.
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
Not a pilot — bounded reskin. Planner phasing suggestion: (1) top bar + status pills + page
switcher (safest, highest-visibility), (2) Design menu + SEO/settings modals, (3) publish
flow, (4) left-rail container + grey-out pass. Verify published parity after each phase.
