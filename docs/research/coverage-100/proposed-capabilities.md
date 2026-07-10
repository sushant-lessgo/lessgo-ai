# Proposed-capability registry (coverage-100)

Canonical names for capabilities observed in the wild that the CLOSED capability
vocab (multipage · gallery/portfolio · catalog · map-hours · bilingual ·
video-hero · store-badges · lead-form · packages · blog) cannot express.

**site-analyzer MUST read this before emitting `proposed_new`.** If an
observation matches a canonical below, reuse its EXACT slug. Only coin a NEW slug
when the observation is genuinely distinct from every entry here — and then
follow the house style: one kebab-case slug, no slashes, no "a / b" alternates,
no trailing "-hub/-grid" synonyms for a concept already listed. Call out any new
slug you coined in your final message so it can be registered.

This registry is APPEND-ONLY and maintained by the orchestrator between sites.

## Canonical capabilities

| slug | definition | distinct from | seen on |
|------|-----------|---------------|---------|
| `booking-wizard` | On-site, multi-step booking flow with scheduling inventory (package → date/slot → details → confirm), conversion completes on the site | not `external-booking-redirect` (off-site), not `booking-portal` (login-gated) | priscillawolf |
| `external-booking-redirect` | Every booking CTA hands off to a third-party appointment engine (Treatwell, Optios, Fresha…); no on-site scheduling | not `booking-wizard` (on-site), not generic `store-badges` | morenoshairandbeauty |
| `booking-portal` | Booking requires register/login into a stateful account portal (My Info/My Pets/My Schedule); conversion is gated behind auth | not `booking-wizard` (anonymous, on-page), not `external-booking-redirect` (stateless handoff) | petsittersireland |
| `external-list-signup` | Primary email/list-capture CTA routes to an off-site tool (monstercampaigns, external ConvertKit page) instead of an on-page form | not `lead-form` (on-page), sibling of `external-booking-redirect` for email not booking | runnersconnect |
| `interactive-calculators` | Live computational tools producing user-specific outputs (cost/margin/cash-flow calculators) | not a static `features` section — it computes | coltivar |
| `media-hub` | An owned podcast / video / episode library, usually on a subdomain or external channel, as a standing content property | not `blog` (article posts), not `content-index` (card grid) | coltivar |
| `content-index` | A browsable/paginated grid of content cards (recipes, articles) on home or category pages — the page IS a feed/index | not `blog` (the capability of having posts), not `blog-teaser` (a small featured strip) | greenhealthycooking, epiclaunch |
| `blog-teaser` | A small section showing N featured/recent post previews that link into the blog | not `content-index` (full browsable grid), not `blog` itself | runnersconnect |
| `affiliate-hub` | A page/grid of curated OUTBOUND affiliate/referral links (Amazon, SEMrush) with no cart or prices — monetization by referral | not `catalog` (own products, may have cart), not `store-badges` | greenhealthycooking, epiclaunch, olyvia |
| `works-catalog` | A catalogue of the creator's OWN works as the site's spine (author bibliography, discography) with per-work subpages; buying is usually an off-site redirect | not `catalog` (generic product catalog), not `gallery/portfolio` (visual proof, not a purchasable list) | contractseries |
| `event-listings` | A dated schedule of events/shows/sessions, each typically redirecting to an external ticketing page | not `catalog` (goods), not `booking-*` (per-event ticket redirect, not a scheduling flow) | fondatheatre, louisiana-ontour |
| `press-kit-downloads` | A downloadable press/media kit (photos, riders, logos, bio) for organizers/press — a B2B secondary audience | not `lead-form`, not `catalog`; asset download, not a purchase or inquiry | louisiana-ontour |
| `fan-voting` | An engagement widget where visitors vote/interact (fan votes, polls) — not a conversion, an engagement loop | not `lead-form` (no capture), not `followStrip` | louisiana-ontour |
| `practitioner-profiles` | Per-person (or per-location) profile subpages for a multi-practitioner/multi-branch business — each staff member/branch gets its own bio/detail page | not `testimonials`/team grid (a single section), not `gallery/portfolio` (work, not people) | lightcrew |
| `membership-checkout` | On-site recurring membership/subscription purchase — plan/tier configurator + cart/checkout for an ongoing plan | not `packages` (static price display), not `pricing` (a section); this transacts a recurring plan | beanstalkhq |
| `product-finder-quiz` | An interactive quiz/wizard that asks questions and recommends a product/plan/package | not `interactive-calculators` (computes a number), not `faq`; it routes to an offer | golivehq |
| `storefront-checkout` | An on-site cart + checkout selling one-time goods (products, templates, prints) | not `membership-checkout` (recurring plan), not `catalog` (browse only, no cart), not `affiliate-hub` (outbound links) | aprilandmay |
| `app-signup` | Primary CTA is create-account / register into the product app itself (freemium self-serve SaaS) — conversion is app registration, not a lead form or newsletter | not `lead-form` (inquiry), not `subscribe-follow`; the CTA enters the product | PROVISIONAL — coined for mediamodifier/reloop but both final analyses settled on membership-checkout/external-list-signup; 0 disk citations. Keep as vocab for future SaaS. |
| `course-curriculum` | An online-course offer: curriculum/module outline + enrollment, often with an alumni/graduate showcase | not `packages` (a price grid), not `faq`; sells structured course content | podcastpro |

## Booking family note
`booking-wizard` / `external-booking-redirect` / `booking-portal` are three
DISTINCT capabilities, not synonyms. They split on WHERE and HOW conversion
completes (on-site anonymous / off-site handoff / login-gated portal). Do not
collapse them and do not coin a fourth synonym — pick the matching one. A plain
single-step "pick a time" calendar embed with no inventory/multi-step is NOT any
of these; treat it as a delegated `form`/`redirect` mechanism, not a proposed
capability (per the coltivar /schedule-your-call decision).

## Alias history (raw name → canonical) — for the aggregation count
- affiliate-list, affiliate-resource-directory → `affiliate-hub`
- content-feed, recipe-index, content-category-grid → `content-index`
- email-capture-popup → `external-list-signup`
- podcast/media-hub → `media-hub`
- bibliography, works-listing → `works-catalog`
