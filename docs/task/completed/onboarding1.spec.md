# onboarding1 — manufacturer persona fit for /onboarding/product — spec

## Problem / why
New customer **Golden Shadow Trading** (goldenshadowtrading.com) is a B2B **uniform
manufacturer / supplier**. We gave v1 on the `/onboarding/product` path, but the flow
is SaaS-shaped and mis-fits a manufacturer on two axes:

1. **Goal step** — the 6 goal options (`waitlist / signup / free-trial / buy / demo /
   download`, `src/types/generation.ts:9-27`) are all SaaS/app actions. Golden Shadow's
   goal is **send enquiry / generate leads** — no fitting option, so the CTA copy comes
   out wrong.
2. **Page-2 (understanding) fields** — the product schema `{categories, audiences,
   whatItDoes, features}` (`src/lib/schemas/understand.schema.ts`) is SaaS-shaped. For a
   uniform maker the AI extraction produces **garbage**:
   - `categories` → "uniform manufacturing, professional apparel, custom uniforms" =
     synonyms, no signal.
   - `audiences` → "businesses, professionals, distributors" = generic; the real axis is
     **industries served** (hospitality, healthcare, corporate…).
   - `features` → "customization, quality assurance, attention to detail" = fluff, not
     concrete product facts.
   Result: low-quality inputs → low-quality copy.

The plumbing already fits (manufacturer persona auto-selects **vestria**; vestria's
`contact` section already provisions a real `MVPForm` enquiry form; archetypes are
already lead-gen shaped). The gap is **goal vocabulary + page-2 field set + SaaS example
copy + downstream prompt wiring** — not sections or forms.

## Goal
Make `/onboarding/product` produce a good page for a **manufacturer / trade-supplier**
persona: a goal option that matches lead-gen, a page-2 field set that captures a
manufacturer's real axes (industries served, product categories, USPs), AI extraction
that yields concrete non-redundant values, and downstream generation that actually
consumes those fields so the copy improves. Golden Shadow is the pilot; ship him v2.

## Trigger (how the flow branches)
Everything in this spec is keyed on the **`manufacturer` persona** — the exact persona
value `'manufacturer'` (label "Manufacturer / trade supplier"), one of the 4 product
personas in `src/types/service.ts:93-96,112,126`. It is fetched from
`/api/user/persona` and, in `src/app/onboarding/product/[token]/page.tsx:59-62`, already
drives `setTemplateId('vestria')`. The new field set, the new goal, the de-SaaS copy,
and the downstream prompt branch all switch on this same `persona === 'manufacturer'`
signal. SaaS / indie / hardware personas keep the existing SaaS field set + goals + prompts.

## Scope IN
1. **Goal vocab** — add `enquiry` LandingGoal ("Send enquiry") + label + GoalStep
   icon/description + a `getGoalCtaGuidance` entry; CTA drives to the on-page `contact` form.
2. **Page-2 field set (manufacturer)** — a manufacturer-specific understanding shape:
   **whatYouMake / industriesServed / productCategories / valueAdds (USPs)** — replacing
   categories/audiences/features for this persona. Includes the matching extraction prompt
   so values come out concrete + non-redundant.
3. **De-SaaS copy** — manufacturer-appropriate example/placeholder copy in
   `OneLinerStep` + `OfferStep`.
4. **Downstream generation wiring** (see below) — strategy + copy prompts must consume the
   new fields, not the old keys.

## Downstream generation — DOES need changes
The understanding fields are read by the generation prompts under **exact old key names**.
Swapping the schema without re-pointing these would silently drop the new fields → copy
would not improve. Both consumers must be persona-branched / re-mapped:

- **Strategy prompt** `src/modules/audience/product/strategy/promptsProduct.ts:77,82` —
  emits `**Categories:** ${categories}` and `**Other audiences:** ${otherAudiences}`. For a
  manufacturer these must be fed by `productCategories` + `industriesServed` (or emitted as
  manufacturer-labelled lines), not the SaaS keys.
- **Copy prompt** `src/modules/audience/product/copyPrompt.ts:188,343-344` — reads
  `features` and emits "Features (raw, from the founder)". For a manufacturer this should be
  fed by `valueAdds` (USPs) + product facts, not the SaaS `features`.
- Confirm where `whatYouMake` (vs `whatItDoes`) and the one-liner feed in, so the big idea
  reflects a manufacturer, not an app.

## Scope OUT (non-goals)
- **Multi-template selection** for product (auto-lock to vestria stays) → **onboarding2** spec.
- **Per-section UIblock variants** (hero video-vs-image, testimonial layouts) → **onboarding3** (blocked: needs designer HTML).
- **Color / font variation** in the pipeline → **onboarding4** (blocked: needs designer options).
- Changing the **service** onboarding flow (only product/manufacturer here).
- New form / section infrastructure — vestria's `contact` `MVPForm` already exists; reuse it.
- Adding new templates.

## Constraints
- Product route uses `src/modules/audience/product/*` (strategy + generate-copy), **not**
  the legacy `/api/generate-landing` + `buildStrategyPrompt`/`buildPrompt` path.
- **Do not regress SaaS/indie/hardware personas.** New field set + new goal + prompt branch
  must switch on `persona === 'manufacturer'` so the other 3 personas are byte-for-byte
  unchanged.
- The new page-2 field set feeds **both** hydration sources: `/api/v2/understand` **and**
  `/api/v2/scrape-website` (product) — both must emit the new shape.
- Field-schema change has divider-removal-style blast radius (schema → store →
  extraction prompt → strategy/copy prompt consumers → any frozen contract test). Grep all
  readers; re-point, don't silently drop.
- Credits unchanged (understand = 1 credit).

## References                   <!-- best input is source code -->
- **`src/lib/schemas/understandService.schema.ts`** — THE pattern to imitate: a
  persona-specific field set (`whatYouDo / services / targetClients / outcomes /
  deliveryModel`). Manufacturer set mirrors this (`whatYouMake / industriesServed /
  productCategories / valueAdds`).
- `src/types/service.ts:93-96,112,126` — `manufacturer` persona value + label + description.
- `src/app/onboarding/product/[token]/page.tsx:59-62` — persona fetch → vestria auto-select
  (the branch signal to reuse).
- `src/types/generation.ts:9-27` — `landingGoals` + `landingGoalLabels` (add `enquiry`).
- `src/modules/onboarding/product/GoalStep.tsx:15-31` — goal icons/descriptions.
- `src/modules/audience/product/copyPrompt.ts:106-122` (`getGoalCtaGuidance`), `:188` +
  `:343-344` (features passthrough) — add `enquiry` guidance + re-point features.
- `src/modules/audience/product/strategy/promptsProduct.ts:77,82` — Categories / Other
  audiences emission to re-map for manufacturer.
- `src/app/api/v2/understand/route.ts:41-44` — SaaS-shaped extraction prompt to persona-branch.
- `src/lib/schemas/scrapeWebsite.schema.ts` — product scrape schema (second hydration path).
- `OneLinerStep.tsx`, `OfferStep.tsx` — SaaS example/placeholder copy to de-SaaS.
- `src/hooks/useProductGenerationStore.ts` — `understanding` shape + `landingGoal` field.
- **goldenshadowtrading.com** — the live pilot customer (uniform manufacturer).

## Open exploration questions   <!-- feeds scout -->
- Is the `manufacturer` persona available (not just at page.tsx) at the **understanding**
  and **goal** steps, and at strategy/copy-prompt build time? If not, how is it threaded?
- Does product `scrape-website` reuse `UnderstandingResponseSchema` or a separate schema?
  Both hydration paths must emit the manufacturer shape.
- Is `UnderstandingStep.tsx` UI hardcoded to the 4 fields or generic? UI rework size for the
  manufacturer field set.
- Full list of consumers reading `categories / audiences / whatItDoes / features` — so all
  are re-pointed (grep beyond the two known prompt sites).
- Are there frozen **generation-contract / golden** tests pinned to the understanding shape?

## Candidate human gates        <!-- feeds planner -->
- Field-schema change (blast radius) — sign-off before merge.
- **Golden Shadow's existing project** has old-shape understanding + a live v1 page —
  decide back-compat / migration / re-generation approach (his page is already published).
- Merge to main + push (deploy) — standard human gate.

## Acceptance criteria
- [ ] `persona === 'manufacturer'` sees a **"Send enquiry"** goal option; selecting it
      produces enquiry-flavored CTA copy that drives to the on-page `contact` form.
- [ ] Page-2 for a manufacturer collects **what-you-make / industries served / product
      categories / value-adds (USPs)** instead of categories/audiences/features.
- [ ] Website import + AI extraction populate those fields with **concrete, non-redundant**
      values (no synonym-spam, no fluff) for goldenshadowtrading.com.
- [ ] Strategy + copy prompts **consume** the new manufacturer fields + goal (verified in
      `DEBUG_AI_PROMPTS` output — no dropped fields, no SaaS labels).
- [ ] SaaS / indie / hardware personas **unchanged** — old field set + goals + prompts still work.
- [ ] Re-onboarding Golden Shadow (or regenerating) yields **materially better copy** than v1.
- [ ] `tsc` + `test:run` green; generation-contract test updated if the shape is frozen.

## Pilot / smallest slice
**Golden Shadow is the pilot.** Build the manufacturer field set + `enquiry` goal +
de-SaaS copy + downstream prompt wiring, re-onboard him, ship v2.

**Decision gate:** does it produce a page you/he accept? If yes → it becomes the template
for all future manufacturer onboarding, and we proceed to onboarding2 (template choice). If
the field set is still wrong, iterate on the axes before generalizing — cheaper to fix on
one customer than after productizing.

---

## Roadmap note (the other 3 threads — separate specs)
- **onboarding2** — product template-selection mechanism (how a product project picks among
  multiple relevant templates instead of persona-auto-lock). Specable now; low urgency
  (1 product template today). Decision-spec.
- **onboarding3** — per-section UIblock variants (hero: video-clip-overlay vs image;
  testimonial layouts). **Blocked** — needs designer HTML for the video hero + an alt hero.
- **onboarding4** — generation variation (alternate palettes / fonts). **Blocked** — Cobalt
  HTML ships one look only; needs designer to supply alternates.
