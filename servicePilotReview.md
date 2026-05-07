# Service Pilot Review — Phase 6 Sign-off

**Date:** 2026-05-07
**Reviewer:** Solo PO (sushantjainemail@gmail.com)
**Scope:** Phase 6 dogfood + decision gate per `nsoPlan.md`.

---

## TL;DR

**Decision: SHIP pilot. Proceed to Phase 7+ expansion.**

Both quality gates met:
- Italic-`<em>` LLM emit: **headline 100% (20/20)**, **lede 80% (12/15)** — threshold ≥80%.
- Forbidden words: 0 leaks.
- Schema + completeness: 5/5 personas pass.

Two minor follow-ups for Phase 7+ (non-blocking).

---

## Method

`scripts/dogfoodServicePipeline.ts` — 5 agency-flavored personas, real LLM (gpt-4o-mini), ~25 credits. Personas chosen to stress prompt across industries:

1. `skincare` — DTC skincare branding studio
2. `saas-landing` — B2B SaaS landing-page agency
3. `restaurant-marketing` — Local marketing for restaurants
4. `law-firm-web` — Specialist law-firm web design
5. `wellness-ux` — Wellness clinic UX consultancy

Per persona: full pipeline (`/api/service/strategy` → `/api/service/generate-copy` → fallback → completeness). Per-field em-emit measured on RAW LLM output before fallback. JSON dumps in `dogfoodOutput/*.json` (gitignored).

---

## Run 1 — Baseline (pre-tune)

| Metric | Value |
|---|---|
| Headline em-emit | 7/20 (35%) ✗ |
| Lede em-emit | 0/11 (0%) ✗ |
| Forbidden words | 0 |
| Schema + complete | 5/5 |

**Failure mode:** LLM emitted `<em>` only on hero headline (5/5). Dropped rule on services (0/5), packages (0/5), cta (2/5), and EVERY lede.

**Diagnosis:** voice spec's lede example had no `<em>`. Voice examples were hero-only. LLM learned "em is a hero-headline thing."

## Run 2 — Post-tune

**Tunes applied:**
- `voiceHearth.ts` — added `<em>` to lede examples; added per-section examples (services, packages, cta).
- `copyPromptService.ts` — promoted italic rule from #4 to #1; explicitly called out "every section, every lede"; OUTPUT FORMAT example now spans 4 sections, all with em.
- OUTPUT FORMAT example uses **vintage bookbinding studio** (deliberately unrelated to any dogfood persona) to prevent text leak.

| Metric | Value | Δ |
|---|---|---|
| Headline em-emit | 20/20 (100%) ✓ | +65pts |
| Lede em-emit | 12/15 (80%) ✓ | +80pts |
| Forbidden words | 0 | — |
| Schema + complete | 5/5 | — |

**Per-section headline emit:** hero 5/5, services 5/5, packages 5/5, cta 5/5.

**Lede outlier:** `restaurant-marketing` missed em on all 3 ledes (kept headlines). 4 of 5 personas at 100%. Fallback covered the gap.

---

## Output Snippets (post-tune)

**Hero headlines:**
- skincare: "Brand identities that <em>resonate</em> with your audience."
- saas-landing: "Landing pages that <em>invite</em> conversions."
- restaurant-marketing: "Fill your midweek seats with <em>local love</em>."
- law-firm-web: "Websites that <em>reflect</em> your legal expertise."
- wellness-ux: "Transform website visits into <em>booked</em> appointments."

**Bookbinding example leak check:** none. Every persona writes industry-specific copy.

---

## Known Caveats (non-blocking)

### 1. Voice example phrase leak

"What we <em>craft</em>" and "Three ways to <em>begin</em>" appear in 4/5 personas. Voice-spec examples drove convergence. Acceptable for pilot — generic-but-on-brand > flat-no-em. Mitigation: more block-level variety post-pilot reduces frequency naturally.

### 2. Credibility field hallucinates client counts

3/5 personas invented specific numbers in `ourPosition.credibility`:
- skincare: "Over 15 successful DTC skincare brands launched..."
- saas-landing: "over 50 successful B2B SaaS companies"
- restaurant-marketing: "helping over 100 restaurants increase their foot traffic"
- law-firm-web ✓ (no number, clean)
- wellness-ux ✓ (no number, clean)

Strategy prompt's "Avoid invented specifics" rule competes with the in-prompt example "40+ DTC brands launched" which models a specific number. Founder reviews/edits page before publish so bounded risk, but worth tightening.

**Suggested Phase 7 fix:** rephrase rule + drop the numbered example, or flag `credibility` as `ai_generated_needs_review` like `price_display`.

---

## Files Changed (Phase 6)

- `scripts/dogfoodServicePipeline.ts` (new) — 5-persona batch harness with em-emit + forbidden-word instrumentation.
- `.gitignore` — added `/dogfoodOutput/`.
- `src/modules/service/copy/voiceHearth.ts` — per-section examples + `<em>` in lede examples.
- `src/modules/service/copy/copyPromptService.ts` — italic rule promoted to #1; OUTPUT FORMAT example expanded to 4 sections in unrelated niche.
- `servicePilotReview.md` (this file).

No changes to: `italicAccentFallback.ts` (existing fallback covers the 20% miss), `promptsService.ts` (strategy prompt acceptable as-is, credibility tweak deferred), block renderers, schemas, store, onboarding pages.

---

## Decision Gate

| Gate | Threshold | Result |
|---|---|---|
| Em-emit headline | ≥80% | 100% ✓ |
| Em-emit lede | ≥80% | 80% ✓ |
| Forbidden words | 0 | 0 ✓ |
| Schema valid | 5/5 | 5/5 ✓ |
| Copy complete | 5/5 | 5/5 ✓ |

**Verdict: pass. Ship pilot.** Phase 7 (palette expansion) can begin.

## Phase 7+ Backlog Adds

1. Tighten credibility prompt or flag `ai_generated_needs_review`.
2. Investigate restaurant-marketing lede em-skip outlier — may correlate with one-liner length or em-dash usage.
3. Reduce voice-phrase repetition as block library grows (Phase 9 batches).
