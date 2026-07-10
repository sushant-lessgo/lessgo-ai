# proof-truth — implementation audit

## Phase 1 — Toggle integrity: capability ≠ content

**Files changed**
- `src/modules/generation/blockEligibility.ts` (modified)
- `src/modules/generation/blockEligibility.test.ts` (modified)

### What changed

`deriveAssetFactsFromBrief()` (the function the plan calls `deriveAssetFacts`, at
`blockEligibility.ts:138`) — reworked the `proofAvailable`-derived fields so the
capability-hint list can no longer masquerade as proof CONTENT. Added an inline
comment block documenting each per-field decision.

New `hasTestimonials` rule:
```
hasTestimonials: entryTestimonials.length > 0
```
(was `proofHas('testimonial') || entryTestimonials.length > 0`) — the
`proofHas('testimonial')` capability-hint clause is removed. `entryTestimonials`
= `brief.facts.entry.testimonials` (actually captured verbatim quotes).

Per-field step-2 decisions (each documented in a code comment):
- `hasPhotos` (`proofHas('photo'|'image'|'gallery')`) — LEFT AS capability hint.
  Pure layout signal (photo-led vs text-led variant); does not make the AI
  fabricate a proof claim.
- `hasLogos` (`proofHas('logo')`) — LEFT AS capability hint. Logo-wall layout
  signal; no captured-logo content source exists in the Brief, and it does not
  drive fabricated copy.
- `hasTestimonials` — CHANGED to captured-quotes-only (content-claiming; the
  spec's primary target).
- `hasTestimonialPhotos` — CHANGED from `proofHas('testimonial') && proofHas('photo')`
  to `entryTestimonials.length > 0 && proofHas('photo')`. It gates the
  photo-testimonial variant (`testimonialPhotos` AssetKind) — content-claiming
  (a fabricated person WITH a photo), so the testimonial dimension now requires
  real captured quotes; `photo` stays a capability hint.

### "Does the confirmed toggle reach this seam?" trace outcome

NO. Traced the input type end-to-end: `deriveAssetFactsFromBrief` takes `Brief`
(`@/types/brief` → inferred from `BriefSchema`). `BriefSchema` (`brief.schema.ts`)
has only `proofAvailable: string[]` and `facts: Record<string,unknown>` — there is
NO confirmed-proof boolean field on the Brief. The wizard's `proof.hasTestimonials`
conscious toggle reaches generation via a SEPARATE route-level `proof` object, which
is the section-inclusion gate (`sectionGrammar.ts:74`; product drop-gate
`parseStrategyProduct.ts:43`), NOT via this Brief seam. `deriveAssetFactsFromBrief`'s
sole consumer is `parseStrategyProduct.ts:305`, feeding `assetFacts` into VARIANT
selection only. Per the plan's instruction, I derived `hasTestimonials` from
`entryTestimonials` ONLY and did NOT invent new plumbing — the conscious flip is
respected via the existing route-level `proof` gate, so a consciously-toggled-ON
section is still included (drafted+flagged path) even when this fact is false.

Additional note: `hasTestimonials` is not even mapped in `assetFactForKind` (no
`testimonials` AssetKind case → default `false`), so it never gated variant
eligibility directly; it is exported as part of `AssetFacts` for completeness. Only
`hasTestimonialPhotos` (via `testimonialPhotos`) gates a variant. Blast radius is
therefore minimal.

### Tests

Updated the pre-existing `deriveAssetFactsFromBrief` describe block:
- Corrected the "reads proofAvailable kinds" test — it previously ASSERTED the buggy
  behavior (`hasTestimonials === true` from capability). Now asserts `false` while
  keeping the `hasLogos`/`hasPhotos` capability assertions.
- Added the plan's step-3 regression cases: `proofAvailable:['testimonials','case studies']`
  + `testimonials:[]` → `hasTestimonials === false`; 2 verbatim quotes → `true`; plus
  a `hasTestimonialPhotos` capability-only-false / real-testimonials+photo-true pair.

The "conscious toggle ON with zero captured quotes → section still eligible" case is
NOT tested here — that path lives in the route-level `proof` gate
(`sectionGrammar.ts`/`parseStrategyProduct.ts`), outside this phase's files. Noted so
the reviewer knows it was a deliberate omission, not a miss.

### Verification results

- `npx tsc --noEmit` — PASS (no output).
- `npm run test:run -- src/modules/generation/blockEligibility.test.ts` — PASS
  (1 file, 27 tests).
- Full `npm run test:run` — PASS (116 files passed / 1 skipped; 1888 tests passed /
  3 skipped). No failures, no pre-existing failures encountered.

### Open risks / reviewer double-checks

- Confirm `hasTestimonialPhotos` scope is acceptable: I applied the capability≠content
  rule to it (in-scope judgment call — it gates a content-claiming photo-testimonial
  variant). If the reviewer wants it left as a pure capability hint, revert that one
  clause; the primary `hasTestimonials` fix stands independently.
- Product mock/real strategy variant selection: with no captured testimonials, a
  photo-testimonial variant will no longer be auto-picked from capability hints. This
  is the intended truthful behavior; phase-8 live check will confirm no visual
  regression on real-quote sites.

---

## Phase 2 — Prompt guard + fillMode audit + sentinel hardening

### Files changed
- `src/lib/schemas/copy.schema.ts` — added shared `flattenReviewSentinel()` helper (+ private `isReviewSentinel`/`flattenValue`).
- `src/modules/audience/product/copyPrompt.ts` — per-element proof guard in `formatElement()`; global RULES rule 4 strengthened.
- `src/modules/audience/service/copyPrompt.ts` — per-element proof guard in `formatElement()`; global RULES rule 5 strengthened.
- `src/modules/audience/product/parseCopy.ts` — apply `flattenReviewSentinel` at top of `processProductCopy`.
- `src/modules/audience/service/parseCopy.ts` — apply `flattenReviewSentinel` at top of `processServiceCopy`.
- `src/lib/schemas/copy.schema.test.ts` — new `flattenReviewSentinel` describe block (4 tests).
- `src/modules/audience/__tests__/generationContract.test.ts` — new prompt-guard describe block (thing + trust, 2 tests).
- (NOT edited) `src/modules/audience/{product,service}/elementSchema.ts` — fillMode audit found NO gap; untouched.

### 1. Per-element prompt guard (exact wording + placement)
In `formatElement()` of both builders, when `isProofElement(element.element)` is true, this string is appended to the element's line:
`[PROOF — plausible-generic only: a fictional first-name persona is OK, but NEVER attribute the quote to a real or invented company/brand name, and NEVER put a specific number, percentage, or revenue/ROI claim inside the quote]`

Proof-element predicate (belt of the belt-and-suspenders — **reviewer: scrutinize this**): matches on the actual keys `getAllElements` emits. Collection subfields arrive as `<collection>.<field>`, flat fields as bare keys. Fires when the collection is one of `{testimonials, reviews, cases}` OR the field name is one of `{quote, author_name, author_role, author_company}`. Covers product thing `testimonials[]{quote,author_name,author_role}` and service trust flat `quote/author_name/author_role/author_company` + `reviews[]` + `cases[]`. Note: matching the whole `cases`/`reviews` collection tags every subfield (client/client_meta/tag/headline/metrics) as proof — intentional over-inclusion (conservative), and service `cases` already carries its own rule 10 placeholder mandate, so no conflict.

### 2. Global RULES delta
- Product rule 4 (was: "NO invented exact numbers, customer names, or dollar figures. Use honest framing…") extended with: "For any testimonial/proof content (quotes and attributions): a fictional first-name persona is acceptable, but NEVER attribute a quote to a real or invented company/brand name, and NEVER put a specific metric, percentage, or revenue/ROI figure inside a quote (e.g. \"284% ROI for GlowSkin\" is forbidden)."
- Service rule 5 (NEEDS_REVIEW price_display/quote/author_*) extended with the same prohibition, naming `author_company` / `cases[].client`.
Stated once at global level (not duplicated verbatim from the per-element line).

### 3. fillMode audit result — ALL COVERED, no schema edit
- Product `elementSchema.ts`: testimonials collection `quote/author_name/author_role` all `ai_generated_needs_review` (`:219-221,:265-267,:1076-1078`). No reviews/brands/cases collections exist (grep empty). No gap.
- Service `elementSchema.ts`: PullQuoteWithMark `quote/author_name/author_role/author_company` (`:88-91`) all `needs_review`; `reviews[]` quote/author_* (`:116-119`) all `needs_review`; `brands[].name` (`:183`) `needs_review`; `cases[].client` (`:241`) `needs_review`; `cases[].metrics[].value` (`:250`) `needs_review`. Non-attribution copy fields (client_meta/tag/headline) are `ai_generated` by design — not quote/attribution proof, so not flagged. No gap.
- Neither elementSchema file was edited.

### 4. Sentinel-flatten helper — location + application
- Helper `flattenReviewSentinel(sections)` lives in `src/lib/schemas/copy.schema.ts` (one shared impl, per plan preference). Recurses into collection-item fields defensively; non-string sentinel `value` is `String()`-coerced. The dead zod union branch STAYS (F27a coercion excludes it by name).
- Applied post-validation at the top of `processProductCopy` and `processServiceCopy` (both run after `CopyResponseSchema.parse` / mock, before defaults/backfill/assembly). Guarantees no object-shaped element value survives into content → no `[object Object]` on published pages.

### 5. Test additions
- `copy.schema.test.ts`: object-in→string-out (top-level), sentinel nested in a collection item, plain/array/null untouched + idempotency, and an explicit `[object Object]` guard. 4 new tests.
- `generationContract.test.ts`: builds thing (product) + trust (service) copy prompts for a proof-bearing section and asserts both the per-element guard mark (`plausible-generic only`) and the global mark (`284% ROI for GlowSkin`) are present; each includes a sanity assert that a proof section actually routed. 2 new tests.

### Verification results
- `npx tsc --noEmit` — GREEN (no output).
- `npm run test:run -- src/lib/schemas/copy.schema.test.ts src/modules/audience/__tests__/generationContract.test.ts` — GREEN (2 files, 28 tests passed).
- Full `npm run test:run` — **1 failed / 1893 passed / 3 skipped**. The single failure is `src/modules/audience/product/promptBranch.test.ts > SaaS path — byte-identical to frozen baseline > copy prompt is unchanged`: the frozen `COPY_SAAS_BASELINE` string no longer matches because global RULES rule 4 changed (step 2, plan-mandated). This is a deliberately-recaptured frozen baseline.

### OUT-OF-SCOPE BLOCKER (reviewer/orchestrator decision required)
`promptBranch.test.ts` is NOT in my Phase 2 Files-touched list, so I did not edit it. But the plan-mandated global-RULES change necessarily alters the byte-identical `COPY_SAAS_BASELINE` it asserts. Resolution options: (a) add `promptBranch.test.ts` to Phase 2 Files-touched and recapture `COPY_SAAS_BASELINE` to the new prompt (the file's header explicitly says "recapture deliberately"); or (b) another owner recaptures it. The `phase 8b invariant` tests in the same file still pass (both meridian+vestria get the same per-element guard; equality holds). No other test regressed.

### 6. COPY_SAAS_BASELINE recapture (follow-up — promptBranch.test.ts now IN Files-touched)
Orchestrator added `src/modules/audience/product/promptBranch.test.ts` to Phase 2 Files-touched. Recaptured `COPY_SAAS_BASELINE` deliberately. The frozen-string delta is EXACTLY ONE line (rule 4), nothing else:

Old line:
`4. NO invented exact numbers, customer names, or dollar figures. Use honest framing for NEEDS_REVIEW fields — the founder verifies before publish.`

New line:
`4. NO invented exact numbers, customer names, or dollar figures. Use honest framing for NEEDS_REVIEW fields — the founder verifies before publish. For any testimonial/proof content (quotes and attributions): a fictional first-name persona is acceptable, but NEVER attribute a quote to a real or invented company/brand name, and NEVER put a specific metric, percentage, or revenue/ROI figure inside a quote (e.g. "284% ROI for GlowSkin" is forbidden).`

Confirmation nothing else differs: vitest `toBe` prints the full unified diff; it showed a single hunk (`@@ -134,11 +134,11 @@`) with only the rule-4 line changed — no whitespace, reordering, or other-section changes. The per-element `[PROOF — …]` guard did NOT surface in this fixture because the SaaS fixture's sections are hero+cta only (no testimonials section carrying a quote element); it only attaches to a proof element inside a section spec, not the collection-schema block. Added a one-line header note recording the rebaseline; `STRATEGY_SAAS_BASELINE` untouched.

Other assertions in the file remain green on their own logic: the manufacturer trade-label assertions (What they make / Industries served / Categories / tailored-trade framing) and the phase-8b invariant test all pass unchanged (14/14 in the file).

### Follow-up verification (final)
- `npx tsc --noEmit` — GREEN (exit 0).
- `npm run test:run -- src/modules/audience/product/promptBranch.test.ts` — GREEN (14 passed).
- Full `npm run test:run` — **0 failed / 1894 passed / 3 skipped** (was 1 failed / 1893 passed / 3 skipped).

### Open risks
- Proof-element predicate over-includes all `cases`/`reviews` subfields as proof (see §1) — verify that's acceptable vs. limiting to attribution/quote fields only.
- Per-element guard adds tokens to every proof-bearing section prompt; negligible but noted.

### Phase 2 addendum — frozen-baseline recapture (scope extension)

- **Scope extension (orchestrator-approved):** `src/modules/audience/product/promptBranch.test.ts` added to Phase 2 Files-touched. Its `COPY_SAAS_BASELINE` is a deliberate-recapture frozen baseline (header: "do not hand-edit — recapture deliberately"); the plan-mandated rule-4 strengthening is exactly the intended prompt change.
- **Recapture done mechanically:** regenerated `buildProductCopyPrompt(saasCopyInput)` from the actual builder (matching the existing SaaS fixture) and confirmed the current baseline equals the builder output byte-for-byte (both 11783 chars, 0-line diff).
- **Diff vs pristine (git HEAD) baseline — ONLY the guard text:** exactly ONE line changed (rule 4), +304 chars. Old: `4. NO invented exact numbers, customer names, or dollar figures. Use honest framing for NEEDS_REVIEW fields — the founder verifies before publish.` → New: same + ` For any testimonial/proof content (quotes and attributions): a fictional first-name persona is acceptable, but NEVER attribute a quote to a real or invented company/brand name, and NEVER put a specific metric, percentage, or revenue/ROI figure inside a quote (e.g. "284% ROI for GlowSkin" is forbidden).` No per-element proof-guard text appears in the SaaS prompt (hero/cta carry no proof elements). No other prompt bytes changed → no unintended regression. A one-line header comment noting the rebaseline was also added.
- **Verification (re-run):** `npx tsc --noEmit` GREEN; `npm run test:run -- src/modules/audience/product/promptBranch.test.ts` GREEN (14 passed); full `npm run test:run` GREEN — **1894 passed / 3 skipped / 0 failed**.
