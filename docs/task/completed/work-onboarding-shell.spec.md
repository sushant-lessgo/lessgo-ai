---
tier: full
tier-why: new onboarding journey for the work vertical — token-scoped multi-step flow + state + generation handoff + persistent rail; touches generation entry + editor handoff. High blast radius for a new flow; needs scout + plan-review.
---

# work-onboarding-shell — spec  (Work vertical · Phase E · Slice E1 — journey spine)

> **Model note (2026-07-16, superseding the earlier "audience" framing):** onboarding is
> organized by **copy engine, NOT `audienceType`** — the `audienceType` concept (esp. "service")
> is being **retired**. The **5 closed engines** (canonical, per `.claude/agents/site-analyzer.md`),
> split by how the visitor decides: **`thing`** (SaaS/product — features + proof), **`trust`**
> (person/firm — credentials/testimonials/process), **`work`** (portfolio — the work itself is the
> proof), **`place`** (restaurant/venue — photos/menu/hours), **`quick-yes`** (one claim, one
> button). **Entry classifies the business → engine → the matching onboarding runs.**
>
> This slice is the **engine-AGNOSTIC journey shell** (option A), built once and reused by all 5
> engines; the **Work engine is implemented as the pilot** (first engine, anchor = Kundius). What
> differs per engine is the *content* of steps — especially "show us your work" (STEP 02):
> work=portfolio images · trust=credentials/testimonials · thing=the offer · place=menu/location ·
> quick-yes=the single claim. `src/modules/audience/work/*` is the work *engine* (dir name is legacy).

## Problem / why
There is **no per-engine onboarding**. workEndtoEnd designed the "one line → live site" 6-step
journey (STEP 01–06) with a persistent "What we understood" rail; the handoff
(`Lessgo Onboarding Flow.dc.html`) is its final visual. The journey is **largely universal across
engines** — only step *content* varies. This slice builds the **engine-agnostic journey shell +
rail** (the spine all 5 engines reuse), implementing the **Work engine** as the pilot. Existing
product/service/writer onboarding for other projects is untouched (pilot = Work / Kundius, 2026-07-16).

Part of the **work-onboarding slice plan** (see `workEndtoEnd.md` §Phase E slices):
E1 spine (this doc) · E2 ingestion pilot · E3 questions · E4 site-plan gate · E5+ auto-curation.

## Goal
Ship the end-to-end 6-step **engine-agnostic** flow shell + the persistent "What we understood"
rail, proving the journey with the **Work engine** (Kundius) using existing generation. STEP 01
(one-line), STEP 05 (building), STEP 06 (reveal → editor) are real + engine-agnostic; STEP
02/03/04 render via a **per-engine step seam** with only the **Work** engine's thin placeholders
wired to `audience/work/generate-copy` — their Work depth lands in E2/E3/E4; other engines snap
into the same seam later.

## Approach (decided — option A, engine-agnostic shell)
- **Build the shell once, engine-agnostic** (per track rule — never build-ugly-then-reskin);
  token-scoped like existing onboarding. **Steps are pluggable per engine** (a clean seam);
  implement **only the Work engine** now.
- **Engine is the classification key.** Entry classifies the business → engine → the shell runs
  that engine's step set. E1 wires the Work engine; the seam is where thing/trust/place/quick-yes
  plug in later.
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
- **Per-engine step seam**: STEP 02/03/04 render through a pluggable interface keyed by engine,
  so thing/trust/place/quick-yes attach their own step content later without touching the shell.
- **STEP 02/03/04 (Work engine placeholders)**: rendered via the seam at minimal depth —
  02 = plain upload stub, 03 = minimal question(s), 04 = simple confirm — wired to generation
  defaults. Real Work depth = E2/E3/E4.
- Built on `ui-foundation` tokens/primitives; Work-engine generation (`api/audience/work/*` —
  the engine route).

## Scope OUT (non-goals)
- **STEP 02 ingestion depth** (upload + website-scrape + image pipeline) — E2.
- **STEP 03 8-slot question intelligence** ("never ask twice" pre-fill) — E3.
- **STEP 04 visual site-plan gate** (rich pages+sections confirm/tweak) — E4.
- **Auto-curation** (IG/Drive pull, smart placement, heuristic ranking, technical image
  filter) — E5+, post-pilot.
- **Other 4 engines' step content** (thing/trust/place/quick-yes STEP 02/03/04) — later; E1 only
  provides the seam + the Work engine's steps.
- **No changes to the existing product/service/writer onboarding** for other projects or the
  generic `[token]` flow.
- **No changes to the Work copy-engine** internals (this drives it, doesn't rewrite it).
- **No engine-classifier rebuild** — E1 consumes the engine decision; if a classifier gap exists,
  note it (don't build it here).
- No responsive/mobile pass.

## Constraints
- Depends on **`ui-foundation` merged**; builds on the existing **work copy-engine + Atelier
  skeleton** (`work-skeleton` D1, deployed 2026-07-16; atelier/atelier2 = service audience).
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
  — existing onboarding scaffolds (reuse patterns; new flow is the work vertical).
- `src/types/service.ts` (~L36–43) — audienceType union + atelier/atelier2 = work-engine templates, service audience.
- `src/modules/audience/work/*`, `src/app/api/audience/work/generate-copy` — the work copy-engine (NOT an audience).
- `src/types/brief.ts` — the Brief the rail/understanding feeds.
- `useServiceGenerationStore` / `useProductGenerationStore` — generation-store patterns.

## Open exploration questions (feeds scout)
- Which onboarding scaffold (generic `[token]` vs wizard components) is the right base for the
  new work flow vs build fresh?
- **Where/how is the engine classified at entry today?** (site-analyzer taxonomy, serve gate,
  a `Brief.engine` field, or nowhere yet.) The shell needs an engine value to pick the step set —
  is it available at onboarding entry, and where does the classifier live? Nail before build.
- **What's the cleanest per-engine step seam** (interface/registry) so thing/trust/place/quick-yes
  plug in later without shell edits?
- How does a project + token get created today (entry → token → onboarding route)?
- What minimal Brief does the work copy-engine (`audience/work/generate-copy`) need to produce a
  revealable site (for the E1 defaults path)?
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
- [ ] STEP 02/03/04 present as thin placeholders; journey completes end-to-end on the work vertical (Atelier).
- [ ] Existing product/service/writer onboarding for non-work projects unchanged.
- [ ] Built on `ui-foundation`; token access not regressed.
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
This IS the spine/pilot of phase E — the decision gate for the journey architecture (flow +
rail + generation handoff). Gate: a work user completes 01→06 and lands in the editor with a
generated site. Then E2 (ingestion) deepens the heart, E3/E4 deepen questions + plan.
