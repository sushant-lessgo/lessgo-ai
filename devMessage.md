# Service onboarding — gaps vs latest Product flow

Product (`/onboarding/product`) is newest/most-polished. Below = what `/onboarding/service` is missing relative to it. For review before porting.

Compared: page dispatcher, store, StepContainer, OneLiner, Understanding, Goal, Offer, Generating, layout.

---

## P0 — Major missing capabilities

### 1. Website import ("already have a site? skip typing")
- Product OneLinerStep: orange import box → `POST /api/v2/scrape-website` → hydrates store (oneLiner, name, understanding, offer, goal, **testimonials**) → jumps to Understanding confirm view (no double charge). Graceful fallback to manual on fail.
- Service: **none**. Manual typing only.
- `/api/v2/scrape-website` already generic; service could reuse. Extraction returns product fields (categories/audiences/whatItDoes/features) — needs service-shaped mapping (serviceCategories/industries/services/targetClients).

### 2. AI-powered Understanding step
- Product: auto-calls `POST /api/v2/understand`, shows LoadingView (rotating msgs + skeletons), error/retry view, editable AI output (chips + textarea), "Edit one-liner" recovery.
- Service: **fully manual** chip entry, no inference, no loading/error states. User types every category/industry/service by hand.
- Biggest UX delta. Needs service-shaped `/understand` (or branch existing route).

### 3. Imported testimonials carried into copy
- Product: OfferStep renders imported testimonials w/ remove; GeneratingStep passes `realTestimonials` → generate-copy (verbatim into page). Store has `importedTestimonials` + `importSourceUrl`.
- Service: no testimonial-import path. (Has manual AssetsStep availability flags, but no real verbatim quotes pulled in.)

---

## P1 — Polish / parity

### 4. OneLiner step polish
- Product: "Takes ~30 seconds" microcopy; Continue btn `transform hover:scale-105` animation; optional Product name field.
- Service: plain button, no name field, no microcopy. (Service title derived from oneLiner only.)

### 5. Understanding "Looks Good" CTA
- Product confirm btn has hover-scale/shadow animation; service plain btn.

### 6. Goal step pattern divergence (intentional?)
- Product: shared `OptionCard` component + **auto-advance** on select, 6 goals.
- Service: bespoke inline buttons, **manual Continue**, 3 goals (intentional subset).
- Q: align to OptionCard+auto-advance for consistency, or keep service's explainer-heavy cards?

---

## Reverse gaps — things SERVICE has that PRODUCT lacks (parity note)
- **PostHog step analytics**: service fires `service_onboarding_step_view`/`_submit` every step. Product only fires PostHog at generation — product missing granular funnel tracking. Consider porting *to* product.
- Service-only steps (intentional): AssetsStep (testimonial/logo/outcome availability), StyleStep (Hearth palette picker). Product pilot-locked to single palette/variant.

---

## Open questions
- `/understand` + `/scrape-website` for service: branch existing v2 routes or new service routes?
- Import box for studios/agencies — worth it? (they have sites too)
- Goal step: unify to OptionCard+auto-advance, or keep service variant?
- Port PostHog tracking into product for funnel parity?
- Collect studio/business name (like product name) for title, or keep oneLiner-derived?
