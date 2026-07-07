# scale-06 — one wizard engine, resolved by contract

Source: scalePlan §8 (full spec), §3 step 5, D9/D10. Depends: scale-01, scale-02. Kills the product/service wizard fork; writer becomes a real path.

## Goal
One wizard renderer for all engines. Questions are computed, not designed: `ask = contract(engine) − scraped − inferred − dropped`.

## Scope IN
1. **One wizard engine** replacing `/onboarding/product/[token]` + `/onboarding/service/[token]` step components. Fixed slot skeleton: identity · understanding · goal(+param, spec 05) · offer · proof/assets · style. Slots skippable per engine (quick-yes skips offer — future-proofing only).
2. **Engine input contracts** (§8 table): 5 fact groups WHO/WHAT/WHY-BELIEVE/WHY-YOU/ACT per engine (THING/TRUST/WORK shapes). businessType entry supplies labels/examples/extraction schema only (scale-01 `wizardFields`).
3. **Waterfall per field**: SCRAPED (prefill, mark inferred) → INFERRED (safe category-level) → ASK → DROP (optional unanswered = section cut). ASK converges on: differentiator · real numbers · proof artifacts · goal param. Reuse `useOnboardingStore` confirmed/validated/inferred states; generalize v2 scrape schemas per businessType entry (kill the `templateId==='vestria'` schema switch in `v2/understand:34`).
4. **Timing tiers**: T1 words → wizard · T2 existence booleans → wizard 1-tap (generalize `ServiceAssetInput` to all engines — product gets a proof step for the first time) · T3 artifacts → editor only. WORK exception: ask 3–5 work uploads (or scrape) — empty-gallery reveal kills the wow.
5. **Review-mode**: URL-entry ⇒ prefilled wizard, confirm-per-slot fast path; manual ⇒ fill-mode. Same components.
6. **Writer joins** (§11.5): writer businessType entry (work engine) → wizard → generation path replaces dev-only `seed-writer`. Work-engine strategy+copy may start thin (bio + work framing), but the PATH is self-serve.
7. **Proof hard rule enforced in pipeline**: testimonial text woven verbatim (`injectRealTestimonials` exists); no proof ⇒ section dropped, never generated.
8. Kill: persona-seeded `serviceType` (Brief carries it) · goal-option forks (spec 05 supplies per-type intents) · `?template=` param + manufacturer-persona→vestria + hardware→techpremium bridges (Brief + gate decide; techpremium retired).

## Scope OUT
Section/structure changes (07) · voice re-key + manufacturerFlow melt (08) · anonymous entry (post-site-20).

## Acceptance
URL entry with rich site ⇒ ≤3 questions asked; bare one-liner ⇒ ≤6. Product path gets proof booleans; unpromised proof ⇒ section absent from generated page. Writer self-serves end-to-end without dev seed. Old wizard routes redirect. Product/service/writer fixtures generate green through the one engine; e2e updated; both old stores (`useProductGenerationStore`/`useServiceGenerationStore`) replaced or wrapped by one Brief-backed store.

## Open questions
1. Differentiator question UX: free text vs guided chips (highest-leverage field) — founder picks copy at build review.
2. Numbers ASK skippable? (skipping guts trust copy — lean: require ≥1 of outcomes/credentials, allow skip with warning)
