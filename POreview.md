# PO review — Service onboarding up-to-speed (re: devMessage.md)

**Verdict:** analysis is accurate (spot-verified: `/api/v2/scrape-website` + `/api/v2/understand`
exist; product OneLinerStep calls scrape; service Understanding is manual + has step PostHog).
Endorse closing the P0 gaps, but **not as one big port** — sequence as thin vertical slices with a
gate after each. Core insight: #1+#2+#3 all hinge on **one new thing — a service-shaped
extraction/inference schema**. Build that once; the three features layer on it.

## What this really is
The gap is not "5 features." It's: product has an **AI-inferred, import-able Understanding**;
service is hand-typed. The route plumbing (scrape fetch/crawl/SSRF, credits, auth, rate-limit,
demo) is audience-agnostic and already built. The only genuinely new asset = a **service Zod
schema + prompt** (serviceCategories / industries / services / targetClients [+ testimonials])
to sit beside the product one.

## Priority / sequencing (pilot-first, gate after each)
1. **Slice 1 — Service AI Understanding (#2).** Biggest UX win + the foundation. Add service schema
   + prompt to `/api/v2/understand` (branch by `audienceType`, see decisions). Reuse product
   UnderstandingStep UX wholesale: LoadingView, error/retry, editable chips/textarea, "edit
   one-liner" recovery. **Gate:** real inference quality on 2–3 live service sites before moving on.
2. **Slice 2 — Website import (#1).** Builds directly on Slice 1's schema (import hydrates the same
   Understanding shape). Same orange box + graceful manual fallback. High ROI — agencies/consultants
   almost always have a site (answers the dev's open Q: yes, worth it; arguably more than product).
3. **Slice 3 — Imported testimonials → copy (#3).** Depends on Slice 2. Mirror product's verbatim
   path: `realTestimonials` through service `generate-copy` + an `injectRealTestimonials` in service
   `parseCopy`. Verify the service testimonials block (`PullQuoteWithMark`) element keys match the
   extraction shape. High trust value for service.
4. **P1 polish (#4/#5) + business-name field** — fold in opportunistically; shared components, near-zero
   cost. Collect studio/business name like product (better title + copy input): yes.
5. **PostHog funnel parity (reverse gap)** — port product → service-style step events INTO product.
   Standalone small PR, decouple from the above. Do it; cheap, real funnel value.

## Decisions on the dev's open questions
- **Branch existing v2 routes, do NOT fork new service routes.** Add an `audienceType` param; select
  schema+prompt; reuse SSRF/credits/auth/rate-limit/demo untouched. One route per concern, one place
  to maintain. (Scrape's crawl/fetch is identical; only the final LLM schema differs.)
- **Import for studios/agencies: yes** (Slice 2).
- **Goal step (#6): keep service's explainer cards, but adopt product's auto-advance + shared
  `OptionCard`.** Consistency of interaction + DRY without losing the service explainers (service's 3
  goals benefit from a description slot). Low priority — not a P0.
- **PostHog into product: yes**, as its own PR.
- **Business name: yes**, mirror product.

## Risks / must-not-miss (carry into the build plan)
- **Double-charge guard.** Product import skips the 2nd `/understand` via the
  `understandingLoading && !understanding` mount guard. Service UnderstandingStep MUST replicate it
  when hydrated by import, or imports get charged twice.
- **Service copy pipeline doesn't accept `realTestimonials` yet** — Slice 3 must add it (schema +
  parse inject) exactly as product did; don't assume parity.
- **AssetsStep × import collision.** Service's AssetsStep asks "do you have testimonials/logos?"
  If import pulls REAL testimonials, that flag is redundant/confusing. Decide: import pre-fills
  AssetsStep (availability + verbatim quotes) → AssetsStep becomes a confirm, not a question.
- **Extraction framing.** Service sites describe services/testimonials differently than product
  sites — the prompt needs service framing; budget real-site test runs (product's naayom equivalent).
- **SSRF hardening** rides along when service reuses scrape — confirm the route's SSRF/DNS-rebinding
  guard is solid before driving more traffic to it.

## Keep as-is (don't over-symmetrize)
Goal = service at product's UX *quality*, not identical flows. Service legitimately keeps
**AssetsStep** + **StyleStep** (palette picker) — product is pilot-locked there. Not gaps.

## Cross-check vs your Round 1 service testing (testResultsService.md)

**Already covered by this plan / already shipped:**
- #1 "should take agency name" → P1 business-name field (yes). In scope.
- #2 "business page empty, should pre-fill like product" → **this IS Slice 1** (AI Understanding).
  The headline fix.
- #5 "went straight to edit, no generate phase" → **already fixed** (Phase 4 wired service
  GeneratingStep → `/generate/[token]`). Re-test a fresh build.
- #6 template switch, #8 publish → working, no action.

**NEW issues to ADD to scope (not in devMessage):**
- **#3 + #4 — service field model is bloated/overlapping** ("industries" ∩ "target clients";
  "service categories" ∩ "specific services"; *"only take what's necessary from a copywriting
  POV"*). This **reshapes Slice 1**: don't AI-fill the existing 4 overlapping fields — first
  **redesign the service Understanding to a lean, non-overlapping set** (likely ~2: *what you do*
  / *who you serve*), THEN make it inferred + importable. Cheapest input, best copy. Note: trimming
  fields lightly touches the service understanding→strategy input mapping (`modules/audience/service`),
  so it's not purely onboarding-UI — scope accordingly. **Treat this as a prerequisite refinement to
  Slice 1, not a separate item.**
- **#7 — StyleStep palette swatches all look the same.** Standalone service-UX bug, independent of
  the parity port. Diagnose: `StyleStep.tsx:136` paints only `t.swatch(p).accent` as one dot — check
  it isn't resolving to `transparent` (config/id mismatch); regardless, Hearth's muted earth tones
  read as "same" in a tiny dot. Fix = multi-tone swatch chip (accent + accentDeep + wash) so palettes
  are visually distinct. Small, do opportunistically.

## Decisions (approved — build to these)
- **Sequencing:** Slice 1 (service AI Understanding) FIRST, then **gate** on real-site inference
  quality before Slices 2 (import) + 3 (testimonials→copy).
- **Field model (#3/#4):** mirror product's 4 lean groups, service-flavored + de-overlapped —
  **whatYouDo (one-liner) + services[] + targetClients[] + outcomes/differentiator**. Drop the
  industries/categories duplicate fields. AI-prefilled → low burden. This is Slice 1's core schema
  (and the contract import + copy lock onto).
- **Credit model:** mirror product — `/understand` = 1 credit; website-import scrape **replaces**
  that charge (no double-charge). Not free.
- **AssetsStep:** **confirm-after-import** — import/AI pre-fills assets + verbatim testimonials;
  AssetsStep becomes a quick confirm/edit; still functions without import; keeps the availability
  signal service strategy uses for section selection.
- **Polish:** fix the **palette-swatch bug (#7) this round** (real bug, cheap); **defer goal-step**
  → product OptionCard + auto-advance to a later parity-polish pass.

## Round 1 service test items — disposition
- #1 agency name → in Slice 1 OneLiner polish (business-name field).
- #2 empty understanding / pre-fill → **Slice 1** (the headline fix).
- #3/#4 overlapping fields → folded into Slice 1 field-model decision above.
- #5 no generate phase → **already shipped** (Phase 4); re-test fresh build.
- #7 palette swatches same → **fix this round** (multi-tone swatch chip; check accent≠transparent).
- #6 template switch, #8 publish → working, no action.
