# Engine Decider — how a one-liner becomes an engine

Created: 2026-07-17. Status: **design agreed** (this session), not yet specced/built.
Companion to `docs/architecture/copyEngines.md` (what the 5 engines are). This doc owns the
**mechanism**: how an incoming business gets routed to one of the 5 engines, and what the
first-time entry experience is.

> **Why revisit:** the current mechanism (`src/modules/brief/classify.ts`, scale-02) was
> designed **before** work-e2e. With work-e2e experience we re-examined it. The architecture
> holds; three assumptions don't. This doc records the corrected design.

## Current mechanism (as built, scale-02)

- **AI emits raw signals, not a verdict** (`EntrySignals`): `businessTypeGuess`, `confidence`,
  and a `tiebreaker` rung. AI's job = *name the business type*, not pick the engine.
- **Code resolves the engine** (`resolveEngine`, pure/zero-AI): known type ⇒ lookup
  `businessTypes[key].copyEngine`; unknown ⇒ tiebreaker ladder
  (`expertise→trust · portfolio-is-proof→work · browsing-place→place ·
  offer-already-understood→quick-yes · else→thing`).
- **Confidence < 0.6** ⇒ chooser upfront. **Always shown back** on page 2, one-tap correct
  (`applyBusinessTypeCorrection`).
- `place`/`quick-yes` can be *resolved* (ride `facts.entry.resolvedEngine`) but not written to
  `brief.copyEngine` (schema enum = `{thing,trust,work}` only).

## What's correct — KEEP
1. **Code resolves, AI only signals** (the firewall). Deterministic, testable, correctable —
   reinforced by E3's deterministic `buildQuestionPlan` gating.
2. **Show-back + one-tap correct, never a blocking confirm, never a silent AI verdict.**
3. **Type-carries-engine lookup** when the type is genuinely known.

## What's suspect — FIX (the three cracks)
1. **Engine committed at the moment of least evidence.** Engine = *how the visitor decides* =
   the business's **argument assets** (portfolio? product? credentials? place?). The strongest
   signal for that is **ingestion (step 2), which happens AFTER classification.** We fork the
   flow one step before the evidence that best resolves it.
2. **The tiebreaker fallback inverts reliability.** Known type → clean lookup; unknown type
   (least info) → we ask the AI for the *abstract decision-mode* judgment — its weakest skill,
   exactly when we can least afford it.
3. **Type→engine is a lossy 1:1** (see Decision 3). `0.6` is also an uncalibrated AI
   self-report driving a UX fork.

Forcing 1:1 / a too-early commit produces the **worst failure mode: a wrong *site*, not a wrong
color** (a portfolio-led studio built as a testimonials/process trust page — the **cirkles**
failure). This is why the mechanism is make-or-break.

---

## Decisions (agreed this session)

### D1 — Engine is a REVISABLE BELIEF, not a step-1 hard fork
Flow: **infer provisionally → confirm only when unsure → revisable through ingestion →
hard-commit at the plan gate** (the last responsible moment; the plan is already where the user
approves the shape).
- Provisional engine from one-liner/scrape is fine — it only needs to pick which ingestion +
  questions to show.
- Ingestion can **overturn** it (said "product," uploaded a portfolio → re-propose `work`).
  The contradiction is a signal, not an error.
- The rail already shows evolving belief; the engine becomes part of that belief.
- Caveat: can't fully defer — steps 2–3 are engine-shaped, so a provisional engine is required.
  This is "classify provisionally, keep revisable, commit at the plan gate," not "classify late."

### D2 — When we must ask, ask the BUYER-DECISION question (not persona / site-type)
Apply E3 gating to the engine: **know → don't ask** (show in rail, tap to change) ·
**almost-sure → one-tap confirm** phrased as their belief · **don't-know → ask.**

The question is **not** "what kind of site" (self-classify → users misclassify) and **not** engine
jargon. It asks *what wins the visitor over* — which **is** the engine, in plain language, mapping
1:1:

> **When someone lands on your site, what makes them reach out?**
> - They see my work and love it → **work**
> - They trust my experience / track record → **trust**
> - They understand what my product does → **thing**
> - They see my space, menu, or location → **place**
> - They already know me — I just need them to act → **quick-yes**

Why better than both today's mechanism and generic builders:
- **Replaces the weakest link:** hands the decision-mode judgment to the **human** — the only
  real oracle for "how do my buyers decide" (fixes crack #2).
- **Robust to a thin registry:** an unmodeled type is covered by one clean question, not a weak
  tiebreaker. The `businessTypes` list can stay small.
- **Conditional, pre-filled, correctable** — zero friction for the ~80% clear cases; one tap for
  the ambiguous ~20%. Generic builders ask 100% of people a worse question.
- **Unbuildable answers = demand signals**, not dead ends (pick "my place" → place not built →
  honest manual-onboard + logged demand tag, never mis-served as thing). Show all 5 as outcomes.
- **Cost/discipline:** only stays "better" if we genuinely **don't ask when we know**. The slide
  back to Wix is asking always.

### D3 — businessType→engine is NOT reliably 1:1 → add an AMBIGUOUS state to the registry
Most types have a dominant engine (saas→thing, coach→trust, photographer→work). But a
**predictable minority genuinely spans engines**, decided by which argument asset carries the sale:
- **agency / studio → trust *or* work** (performance agency = results/trust; branding studio =
  portfolio/work — the cirkles case).
- **manufacturer / trader → thing *or* trust** (maker sells specs = thing; import/export sourcing
  firm sells supplier reliability = trust — the B2B beauty-products case).
- softer: famous consultant → trust/quick-yes; booking-only restaurant → place/quick-yes.

The spanning shape = *"a firm whose output may or may not be the argument."* Nameable in advance.

**Registry change:** each `businessTypes` entry declares **either** `{ committed engine }` **or**
`{ engine-ambiguous, candidate engines, prior }`. Then:
- unambiguous type → lookup, **skip the question**;
- ambiguous known type → **fire the buyer-decision question** (D2);
- unknown type → same buyer-decision question.

The elegance: **one question serves both unknown types and ambiguous-known types**, fired exactly
when — and only when — the engine is genuinely undetermined; ingestion still revises (D1).

> **Ripple (why this is a spec, not a config poke):** `resolveEngine` returns a single engine
> today and downstream (`serveGate`, wizard hydrate, `BriefSchema.copyEngine`, voice derivation)
> assumes a resolved engine. The `ambiguous` state means those consumers must handle
> "not-yet-resolved → ask." Lands in the thing/trust e2e spec, not a silent edit.

### D4 — The first-login PERSONA GATE retires as a classifier; its gate job relocates
Today `/api/start` asks a persona and forks product-vs-service (`audienceType`) + gates access
(pilot allowlist → waitlist). Split its two jobs:
- **Classifier job → RETIRES.** Asking "product or service?" upfront *is* the cold self-classify
  antipattern (D2), forks on the retiring `audienceType` axis, and we can infer it.
- **The "better" first screen = the ONE-LINER**, not a better persona question:
  *"Tell us what you do — in a line."* Gives more signal than a persona bucket, starts momentum
  "from second one," feeds the pipeline (infer → maybe one buyer-decision question → rail fills).
  Partly built already: `EntryInputStep.tsx` / `JourneyEntryStep.tsx` (scale track).
- **Gate job → SURVIVES, moved + smarter.** Becomes the **serve gate on the confirmed Brief**
  (`serveable = type entry ∧ engine live ∧ ≥1 template fits`), decided *after* the one-liner +
  page-2, with unserveable → **manual-onboard / demand board** ("someone from Lessgo will connect
  with you"), never a cold upfront waitlist. Gate on understanding; every rejection = a demand signal.

Net first-time experience: from *"pick a bucket, maybe hit a waitlist"* → *"tell us what you do →
we already get it → let's go (or, honestly, we'll be in touch)."* Matches `onboarding_by_engine`:
**entry classifies → engine → matching flow**, entry = the one-liner, never the persona.

---

## Current-code pointers
- Resolver: `src/modules/brief/classify.ts` (`resolveEngine`, `EntrySignals`, `EntryFacts`,
  `applyBusinessTypeCorrection`, `LOW_CONFIDENCE_THRESHOLD`).
- Registry (List 1): `src/modules/businessTypes/config.ts` (9 seed types — "SHAPE, NOT BEHAVIOR").
- Serve gate: `src/modules/brief/serveGate.ts`, `serveMatrix.ts`.
- Entry step (one-liner): `src/app/onboarding/[token]/components/EntryInputStep.tsx`,
  `src/components/onboarding/journey/JourneyEntryStep.tsx`.
- Classify schema: `src/lib/schemas/entryClassify.schema.ts`. Brief confirm: `/api/brief/confirm`.

## Open questions
1. `ambiguous` registry shape — `prior` engine + `candidates[]`, or candidates-only (no prior)?
2. Buyer-decision question wording — final copy + do we always show all 5 outcomes (incl.
   unbuildable place/quick-yes) or only when the prior is one of them?
3. Confidence gate — keep `0.6` AI-confidence, or replace with a deterministic rule (is the guess
   a known unambiguous type? y/n) per E3 doctrine?
4. Ingestion-overturn (D1) — auto re-propose engine, or surface as a rail nudge the user confirms?
5. Hard-commit point — plan gate only, or also lock on first successful copy generation?
6. Does D4's one-liner-first entry belong in the thing/trust e2e spec, or its own entry-redesign spec?
