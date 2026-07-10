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
