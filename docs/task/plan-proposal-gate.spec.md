---
tier: standard
tier-why: reworks one onboarding journey step (PlanStep.tsx) over existing plan machinery (proposeWorkSiteStructure / addableWorkPages / applyPlanEdit / Brief.structure). No schema, no publish/store/auth surface. One caveat item (one-pager section richness) may touch the sitemap seed — auto-escalates if so.
---

# plan-proposal-gate — spec

## Problem / why
The work journey's plan-proposal gate ("Here's your site", `PlanStep.tsx`) is over-loaded and confusing. QA (O12, 18 July): "how do I remove a page… change/remove/reorder sections? Otherwise what's the point?" The screen shows unexplained 4-photo strips, a per-page goal selector, and internal section rows — none of which belong at this altitude — so users can't tell what it's for or find the controls. Its actual job is narrow: **confirm the pages to build before we spend generation.**

## Goal
Replace the gate with the reconceived design: confirm the site's **shape** (single-page vs multi-page, pre-selected to our guess) and the **page set** (simple tiles from a closed master list, Home locked). Strip everything that's the editor's job. The approved plan is still the generation input (`Brief.structure`); "Build my site" still fires generation.

## Scope IN
- **SITE SHAPE choice — Single-page vs Multi-page**, pre-selected to the archetype `proposeWorkSiteStructure()` already picks (`one-pager` → Single; `compact`/`standard` → Multi). Copy per design: Multi = "A home page plus separate pages for your work, prices and more"; Single = "One long home page — every section stacked on a single scroll."
  - **Single-page** collapses to **Home only** — one page with **every section stacked** (hero → work → about → contact, + prices if present). ⚠️ See the caveat under Open Questions: confirm/ensure the `one-pager` home actually carries the full stacked section set, not just home's default sections.
  - **Multi-page** shows the page tiles below.
- **PAGES tiles from the closed master list** (`workPageTypes`), each with the design's plain description:
  - **Home** — locked-on, never removable ("Your promise, best work and how to reach you.")
  - **Work** ("Your portfolio — every photo, best first."), **Prices** ("Packages and prices, so buyers pre-qualify."), **About** ("Your story — who you are and how you shoot."), **Contact** — pre-selected per the proposed archetype; toggle on/off.
  - **add** optionals: **Work Group** ("Promote one collection to its own page.") — only when a group qualifies (`addableWorkPages` gates it), **Project Story** ("One project, told start to finish."), **Blog**.
  - Enforced by `addableWorkPages()` — **cannot add any page outside the closed vocab.**
- **"Build my site" CTA** → approve → persist `Brief.structure` (existing `buildPlanCommit`/`commitRail` write door) → fire generation (existing STEP 05). Footer note: "You can change the pages anytime after — nothing's locked in."
- Reuse the **existing write door** (`applyPlanEdit` → `buildPlanCommit` → `commitRail`) for add/remove page and the shape switch — no new API route / saveDraft / store action.

## Scope OUT (non-goals)
- **Photo strips / thumbnails** on the gate — removed.
- **Per-page goal selector** — removed (goal editing is the editor's job).
- **Section rows + any section-level add/remove/reorder** — removed; sections are shaped in the editor post-generation (where they can be seen). Confirmed with founder: page-level shape here, section detail in editor.
- **Page rename / free drag-reorder** — not at the gate (page order = canonical set; rename in editor).
- **Non-work engines** — work journey only; other engines get their own plan gates later.
- Changing generation, the section contract, or `Brief.structure`'s shape.

## Constraints
- **Closed vocabulary** — tiles are a fixed set (`workPageTypes`); the UI must not imply free-form "add any page." **Home always present, never removable.**
- **Design = visual source of truth; flow/functionality = founder-dictated.** Recreate the design in-codebase with existing components + app-chrome tokens (Onest, JetBrains Mono, Material Symbols, blue `#006CFF`, orange `#FF6B3D`) — do NOT ship the HTML.
- **Copy is already plain in the design — use it** (no internal keys like hero/proof/archetype ever on screen). Product name "Lessgo AI".
- **Keep the shared journey shell** — the shell owns the top bar + left "What we understood" rail; this step body renders only shape + tiles + CTA and must not cover the rail.
- Preserve the load-bearing approve invariant (`PlanStep.tsx:180-201`): `Brief.structure` persisted BEFORE advancing to STEP 05; a failed commit surfaces inline and does NOT dead-drop into an ungenerated build.
- Pre-beta scope → lands on `main` (beta), not `next`.
- Standard-tier /feature: scout → plan → implement → ONE impl-review over the whole diff.

## References
- **Design (visual source of truth):** `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Plan Gate Screen (standalone).html` (4.2MB — semantic content: SITE SHAPE Single/Multi + PAGES tiles + "Build my site"). Supersedes the earlier `docs/Design/briefs/plan-proposal-gate.brief.md` (pre-design context).
- **Code being replaced:** `src/components/onboarding/journey/engines/work/PlanStep.tsx` (STEP 04, work engine body; keep the write-door + approve invariant, replace the presentation + drop photos/goals/sections).
- **Machinery to reuse:** `src/modules/engines/workPages.ts` (`workPageTypes`, `workSiteArchetypes` = one-pager/compact/standard, `proposeWorkSiteStructure`, `addableWorkPages`) · `src/modules/wizard/work/plan.ts` (`applyPlanEdit`, `buildPlanCommit`) · `src/modules/wizard/work/rail.ts` (`commitRail`).
- Shell + rail + token language: the Engine Decider handoff + `Lessgo Onboarding Flow.dc.html`.

## Open exploration questions (feeds scout/plan)
- **The single-page caveat (load-bearing):** does the `one-pager` home today actually stack the FULL section set (hero+work+about+contact, +prices if present), or only home's default sections? If the latter, selecting Single-page would silently drop about/contact/prices content — so the sitemap seed must fold those sections onto home in one-pager mode. Scout to confirm current behavior; if it's a gap, it's part of this build (may auto-escalate).
- What exactly does the shape toggle write — does switching Single↔Multi re-seed the sitemap via `proposeWorkSiteStructure` / a plan edit, and does that round-trip cleanly through `commitRail`?
- How the pre-selected page set + `addableWorkPages` gating renders as tiles (selected vs addable vs unavailable states).

## Candidate human gates
- **Visual eyeball** — the gate matches the design and reads clearly (the whole reason for O12).
- **Single-page correctness** — a Single-page selection produces a real one-page site with all sections stacked (nothing silently dropped), and Multi-page still produces the separate pages; both generate + reveal correctly.

## Acceptance criteria
- [ ] The gate shows SITE SHAPE (Single/Multi, pre-selected to the proposed archetype) + PAGES tiles from the closed master list, per the design; no photo strips, no goal selector, no section rows.
- [ ] Home is always present and cannot be removed; no page outside the closed vocab can be added.
- [ ] Selecting Single-page yields a Home-only site with all relevant sections stacked; Multi-page yields the separate pages — both persist to `Brief.structure` and generate.
- [ ] "Build my site" persists structure before advancing; a commit failure surfaces inline and does not advance to an ungenerated build.
- [ ] Copy is the design's plain language; product name "Lessgo AI"; the "What we understood" rail is untouched.
- [ ] Green gates: `tsc` · `test:run` · `build` · `lint`; existing plan write-door tests (`plan.test.ts`) stay green (updated for the new edits).

## Pilot / smallest slice
Single bounded step rework — no phasing. Replace the PlanStep body with the shape toggle + tile picker over the existing write door; verify Single-page and Multi-page both generate correctly on the QA preview. **Decision gate:** founder visual sign-off + a Single-page and a Multi-page end-to-end generation on the preview.
