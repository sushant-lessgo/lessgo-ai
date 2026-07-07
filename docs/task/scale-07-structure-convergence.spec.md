# scale-07 — engine-owned structure: core sections, universal sitemap gate, safe swap

Source: scalePlan §3 invariants (core+capability sections, frozen sets, designer's bar), step 7b, §4 #17–19. Depends: scale-01, scale-06.

## Goal
Section lists stop being template property. Engine core + Brief-required capability sections decide structure; every template of an engine renders the same core; swap is always safe.

## Scope IN
1. **Engine-owned section grammar**: replace `MERIDIAN_PILOT_SECTIONS`/`VESTRIA_PILOT_SECTIONS` (`product/sectionSelection.ts`) and service ordering with engine modules: core sets (frozen, scale-01) + awareness/asset ordering (generalize service's pattern — the one "right pattern" in inventory #19) + capability-bound optionals (gallery/packages/map-hours/catalog/blog) entering only if Brief requires.
2. **meridian/vestria core convergence**: both implement full thing-core; vestria extras re-expressed as capability sections. Conformance test (scale-01) turns red until done — this spec makes it green honestly.
3. **Universal structure confirm (7b)**: generalize vestria's `SitemapReviewStep` — multi = pages+sections; single = section list+order. Required sections locked (hero first, CTA present) · optionals toggleable OFF (no adds; add-later in editor) · default-accept 1 tap. Runs after strategy, before copy fan-out ⇒ deleted section = no copy generated.
4. **Sitemap for all**: `getPageArchetypesForTemplate` vestria-only hardcode (`pageArchetypes.ts:118`) → keyed off `multipage` capability + businessType structure default; `clampSitemap` law extends to single-page (slugs never AI, home forced).
5. **7b deletion relaxes hard-fit**: requirements recompute from confirmed structure (drop gallery ⇒ more templates eligible).
6. **Template swap post-gen**: swap shortlist = same `fit()` query ⇒ only templates rendering every section this site has. Wire into existing theme popovers; unlock meridian (pilot-lock removed, inventory #13–16); vestria fan-out orchestration (`runFanOut` hardcoded `templateId==='vestria'`) re-keyed to `multipage` capability.
7. **Block assembly**: section → template's block via declared map (still 1:1; D18 filter arrives spec 09) → element list from ENGINE contract (kill per-template layout-name keying in elementSchema — the §3 invariant "copy depends on engine+Brief only" becomes true in code here).

## Scope OUT
Voice re-key + manufacturerFlow melt (08) · block variants (09) · new capability blocks (gallery etc. — demand-gated, build ladder rung C).

## Acceptance
Same Brief generates the same section list under meridian and vestria(single-page mode); switching template post-gen loses zero sections, changes zero words (golden test). 7b shown for single-page service fixture; toggling testimonials off ⇒ no testimonial copy generated. Conformance tests green for converged cores. Multipage keyed by capability not templateId (naayom collections path untouched). All dual-renderer parity + existing golden tests green.

## Open questions
1. Vestria 12-section list: which of the 5 extras become capability sections vs get absorbed into thing-core — needs founder call per section at plan review.
