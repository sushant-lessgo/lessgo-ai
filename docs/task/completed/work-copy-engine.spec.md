---
tier: standard
tier-why: new additive engine module (prompts + slim strategy + fan-out wiring); existing engines untouched; no renderer/store/schema/publish surface — auto-escalate if scout finds sprawl >15 files
---

# work-copy-engine — spec (phase C of the work vertical)

## Problem / why
Work engine has only a seed (granth/lumen hand-seeded copy). Photographers/designers/
writers/agencies can't generate. Kundius (Atelier) needs real generated copy. Beta
floor (T6) requires the work engine live.

## Goal
The engine that writes a complete work site from the Brief + work library: lean,
voice-true copy that frames the work instead of replacing it. Facts are law — every
sentence traceable to what the user said or showed. Output feeds any work-skeleton
template (copy never knows templateId/skeletonId).

## Agreed shape (2026-07-14)

### Lean by design
Research (coverage-100 §6): work sites are copy-lean — hero + leadForm + founderNote +
results/portfolio. C writes: promise line · gallery intros/captions framing · story ·
prices framing · proof framing · contact nudge · per-page one-liners. Short. The craft
= voice + restraint, not volume.

### Slim strategy (ruled — no full strategy call)
Deterministic from Brief + library (CODE, not AI): pages (archetype rule), sections per
page (assembly), which work leads (curation signals), gallery sizes/card counts (group
sizes), story branch (new/established slot). The ONE small AI strategy call decides only
where judgment lives: positioning angle (from praise + dream client + price position) ·
story angle · voice notes. Its output feeds the copy phase. Every AI decision we don't
need is an invention surface — this is the anti-invention philosophy in code.

### Language (option 2, ruled)
Generate in the site's PRIMARY language (slot 8) — engine is language-aware, one
language per site. Prompting quality in non-EN (NL first) is in scope. NO twin-field/
assisted-translation generation (i18n deferred); Kundius's EN/NL twin = one-time
concierge patch outside this engine.

### Story two-tier (ruled — the Sugarman section)
- **Ship-grade (auto, v1 path):** built ONLY from known facts (slots + verbatim
  harvest from her old site's about text). Gaps = graceful omission — never
  placeholder, never invention. Short and true beats long and fake.
- **Sugarman-grade (invited, post-reveal):** the story interview — 3 micro-questions
  (origin one-liner · unforgettable client moment · craft belief) offered AFTER the
  reveal via the About section + first weekly email, NEVER inside the main flow
  (≤5-question ceiling is sacred; post-reveal answers are thoughtful ones). Answers →
  regenerate ONLY the story section (incremental-copy machinery). Copy technique:
  hook on the specific moment, belief as spine, praise as landing.

### Voice
Keyed by profession row (List-1 wording layer) × price position (premium/middle/
friendly) × new/established branch. Pattern: surge's archetype-keyed voice
(firewall-safe). Never keyed to template.

### Facts binding (inherits the 2026-07-14 fix, hardened from birth)
Services/groups/prices/praise bound verbatim-or-derived with explicit anti-invention +
anti-padding rules (see copyPrompt.ts binding rules shipped 5b4da96f). Testimonials/
praise word-for-word. Agency case-study metrics = bracketed placeholders (existing
rule 10 pattern) — the ONE placeholder zone.

## Scope OUT (non-goals)
- Twin-language generation / assisted translation (i18n plan owns it)
- Slimming trust/thing strategy calls (later, if slim proves out)
- Ingestion/curation (D2), skeleton/blocks (D1), onboarding screens (E)
- Story-interview UI polish beyond a working entry point (editor nudge surface can be minimal)
- In-report copy suggestions, A/B copy

## Constraints
- Copy firewall: no templateId/skeletonId anywhere in engine inputs (assertNoTemplateLeak pattern)
- Reads ONLY phase-A contracts (work-core sections/elements, slots, group shape, profession rows) — if a needed fact isn't in the contract, contract gets amended, not bypassed
- Multi-page fan-out rides newGeneration machinery (per-page fan-out, retry×2, resume) — phase B (Gate 0 QA) is a prerequisite
- Provider chain as-is (gpt-4o-mini primary); degraded/mock paths must carry the new meta.mock/generation_degraded signals
- Verbatim praise: reuse injectRealTestimonials seam

## References
- `docs/task/work-contract.spec.md` — phase A contracts this engine reads
- `src/modules/audience/service/copyPrompt.ts` — binding-rules pattern (5b4da96f) to inherit
- surge archetype-keyed voice (src/modules/templates/surge + its voice wiring) — voice keying pattern
- newGeneration per-page fan-out (docs/tracks/newGeneration.md) — multipage generation spine
- `docs/tracks/workEndtoEnd.md` steps 5, promises 4/8 — acceptance-criteria source
- granth/lumen seeded copy (src/hooks/editStore/lumenSeed.ts, granth equivalents) — tone/section evidence, NOT a code path to extend

## Open exploration questions
- Exact seam where slim-strategy output replaces parseStrategyResponse shape for work
- How newGeneration SiteContext carries Brief+library into per-page prompts today
- Where incremental single-section regeneration lives (regenerate-section route) and what it needs to accept interview answers
- NL prompt quality: does gpt-4o-mini hold voice in Dutch, or does work-NL need a stronger model per call?

## Candidate human gates
- Kundius golden output read by founder (THE quality gate) before any merge
- Any change touching shared prompt/parse code used by trust/thing (should be zero; if scout finds coupling, gate it)

## Acceptance criteria
- [ ] Full site copy generates from a work Brief + library fixture: every page of the standard archetype filled, lean lengths respected
- [ ] Facts law: services/groups/prices/praise appear verbatim-or-derived; a test Brief with distinctive fake services shows zero invented services/prices; no padding beyond user's list
- [ ] Slim strategy: assembly decisions provably deterministic (unit-tested, no AI); the single AI strategy call returns only angle/story/voice fields
- [ ] Story ship-grade: generated from facts only; with minimal Brief, output is short + true (no placeholders, no fabricated biography)
- [ ] Story interview: 3 answers in → only About regenerates, Sugarman-shaped (hook/belief/landing)
- [ ] Language: NL-primary Brief generates NL copy throughout
- [ ] Copy firewall test green (no template/skeleton leak); degraded runs flagged
- [ ] Kundius golden: her real Brief fixture → founder-approved output (CAPTURE=1 golden pattern)

## Pilot / smallest slice
Slice = Home page only, Kundius Brief fixture, real LLM: slim strategy + facts-bound
copy + ship-grade story for one page. Founder reads it. Gate passes → fan out to
remaining pages + interview tier.
