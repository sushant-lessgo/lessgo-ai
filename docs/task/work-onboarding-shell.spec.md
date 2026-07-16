---
tier: full
tier-why: new onboarding journey for the work audience — token-scoped multi-step flow + state + generation handoff + persistent rail; touches generation entry + editor handoff. High blast radius for a new flow; needs scout + plan-review.
---

# work-onboarding-shell — spec  (Work vertical · Phase E · Slice E1 — journey spine)

## Problem / why
The work audience (`src/modules/audience/work/*`, skeleton templates — Atelier) can generate
+ edit, but has **no dedicated onboarding**. workEndtoEnd designed the "one line → live site"
6-step journey (STEP 01–06) with a persistent "What we understood" rail; the handoff
(`Lessgo Onboarding Flow.dc.html`) is its final visual. This slice builds the **journey spine**
everything else in phase E hangs off. Legacy product/service onboarding is untouched (pilot =
work audience only, decided 2026-07-16).

Part of the **work-onboarding slice plan** (see `workEndtoEnd.md` §Phase E slices):
E1 spine (this doc) · E2 ingestion pilot · E3 questions · E4 site-plan gate · E5+ auto-curation.

## Goal
Ship the end-to-end 6-step work-onboarding flow shell + the persistent "What we understood"
rail, proving the journey on the work audience (Kundius) using existing generation. STEP 01
(one-line), STEP 05 (building), STEP 06 (reveal → editor) are real; STEP 02/03/04 are present
as **thin placeholders** wired to `work/generate-copy` with defaults — their depth lands in
E2/E3/E4.

## Approach (decided)
- **New flow built once in the new design** (per track rule — never build-ugly-then-reskin);
  work audience only; token-scoped like existing onboarding.
- **Rail replaces confirmation-as-a-step** (workEndtoEnd journey-wide rule): a persistent side
  panel shows live understanding (name, what they do, where, price position, languages, what
  they sell), fills as steps progress, **correctable any time** (incl. a "something wrong? tell
  us" free-text box at its bottom). Never replay answers back as a blocking screen.
- Thin steps 02/03/04 now; generation runs on the existing work engine with defaults so the
  journey completes end-to-end.

## Scope IN
- **6-step flow shell**: container + step routing + step-index state + progress, per handoff
  minimal composer chrome (logo + "New site", no dashboard sidebar).
- **Persistent "What we understood" rail**: progressively filled, correctable, free-text
  "something wrong?" box. Its data model = the running understanding (feeds the Brief).
- **STEP 01 — One line in**: single large prompt (describe business). Kicks off the flow +
  seeds the rail.
- **STEP 05 — We write and build it**: building/progress state driving `work/generate-copy`.
- **STEP 06 — The reveal (MAGIC MOMENT)**: finished site revealed → handoff into editor
  (`/edit/[token]`) / dashboard.
- **STEP 02/03/04 placeholders**: rendered in the flow (so the journey is complete) at minimal
  depth — 02 = plain upload stub, 03 = minimal question(s), 04 = simple confirm — wired to
  generation defaults. Real depth = E2/E3/E4.
- Built on `ui-foundation` tokens/primitives; work-audience generation (`api/audience/work/*`).

## Scope OUT (non-goals)
- **STEP 02 ingestion depth** (upload + website-scrape + image pipeline) — E2.
- **STEP 03 8-slot question intelligence** ("never ask twice" pre-fill) — E3.
- **STEP 04 visual site-plan gate** (rich pages+sections confirm/tweak) — E4.
- **Auto-curation** (IG/Drive pull, smart placement, heuristic ranking, technical image
  filter) — E5+, post-pilot.
- **No changes to legacy product/service onboarding** or the generic `[token]` flow.
- **No changes to the work generation engine** internals (this drives it, doesn't rewrite it).
- No responsive/mobile pass.

## Constraints
- Depends on **`ui-foundation` merged**; builds on existing **work audience + skeleton**
  (`work-skeleton` D1, deployed 2026-07-16).
- **Rail is the source of the running understanding** — model it so E2 (ingestion) and E3
  (answers) fill the same structure (feeds `Brief`), not a throwaway.
- Token-scoped like existing onboarding; do not regress `assertProjectOwner`-style access on
  the token routes.
- Zero-collision with editor lane (separate tree `src/app/onboarding/**`).
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `docs/tracks/workEndtoEnd.md` §The journey (steps 1–6), §rail rule (lines ~43–70; v1 sources
  = website + upload). Behavior source of truth.
- `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Onboarding Flow.dc.html`
  — STEP 01–06 visuals + the "What we understood" rail. Layout source.
- `src/app/onboarding/{product,service}/[token]`, `src/app/onboarding/[token]/components`
  (EntryInputStep/ConfirmBriefStep/ManualOnboardStep), `src/components/onboarding/wizard/`
  — existing onboarding scaffolds (reuse patterns; new flow is work-audience).
- `src/modules/audience/work/*`, `src/app/api/audience/work/generate-copy` — work generation.
- `src/types/brief.ts` — the Brief the rail/understanding feeds.
- `useServiceGenerationStore` / `useProductGenerationStore` — generation-store patterns.

## Open exploration questions (feeds scout)
- Which onboarding scaffold (generic `[token]` vs wizard components) is the right base for the
  new work flow vs build fresh?
- How does a work project + token get created today (entry → token → onboarding route)?
- What minimal Brief does `work/generate-copy` need to produce a revealable site (for the E1
  defaults path)?
- Where does the reveal (06) hand off to the editor; what state must be set.
- Generation store to use/extend for work onboarding (new `useWorkGenerationStore`?).
- Rail data model that E2/E3 will fill — shape vs `Brief`.

## Candidate human gates
- **Reveal → editor handoff** correctness (a generated work site opens editable). Founder QA.
- Rail data-model shape sign-off (E2/E3 build on it) — cheap to get right now, costly later.

## Acceptance criteria
- [ ] 6-step flow renders in new design (handoff chrome); step navigation + state work.
- [ ] "What we understood" rail persists across steps, fills progressively, is correctable,
      has the free-text box.
- [ ] STEP 01 one-line seeds the flow + rail.
- [ ] STEP 05 drives `work/generate-copy`; STEP 06 reveals the site + hands off to `/edit/[token]`.
- [ ] STEP 02/03/04 present as thin placeholders; journey completes end-to-end on the work audience.
- [ ] Legacy product/service onboarding unchanged.
- [ ] Built on `ui-foundation`; token access not regressed.
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
This IS the spine/pilot of phase E — the decision gate for the journey architecture (flow +
rail + generation handoff). Gate: a work user completes 01→06 and lands in the editor with a
generated site. Then E2 (ingestion) deepens the heart, E3/E4 deepen questions + plan.
