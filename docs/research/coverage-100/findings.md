# Coverage-100 — Findings

Experiment: scrape + taxonomy-classify 101 real ICP-adjacent websites to ground the
template/section/capability coverage north star (see `docs/tracks/scalePlan.md` §2,
`docs/task/template-factory.spec.md`). Every site captured verbatim (`raw/`), then
classified against the **fixed** Lessgo taxonomy (5 engines · canonical sections ·
closed capability vocab · 6 design styles). Unmappable observations recorded as gap
findings — never forced to fit.

**N = 101** · scraped 101 / analyzed 101 / 0 failures · confidence: 56 high · 44 medium · 1 low.

> **Cross-checked & canonicalized.** An independent second pass over `raw/` only (2026-07-10)
> agreed with this report on every strategic conclusion and on 82/101 per-site engine picks.
> The 19 disagreements clustered into 4 taxonomy ambiguities, since **ruled** in
> `docs/tracks/templatePlan.md` (T1 designers→work, ladder reordered · T2 salons→trust ·
> T3 storefronts→upfront self-selection · T4 courses split solo→trust/product-led→thing).
> The cross-check's additional catches are folded in as §10 below. This file is the single
> canonical record of the experiment; decisions derived from it live in templatePlan.md.

---

## 1. ICP verdict

| | count | % |
|---|---|---|
| **in_icp = true** (single conversion action) | 75 | 74% |
| in_icp = false | 26 | 26% |

The 26 out-of-ICP sites are overwhelmingly **full storefronts / listing portals** — WooCommerce/Shopify
carts (boutiquedeluz, harmonylife, yogyakartas, thietbivesinhtoto, metatex), a real-estate MLS
(studioduerre), content/affiliate hubs (greenhealthycooking, epiclaunch), and defunct/spam sites
(goodspiritgraphics). **Takeaway:** the publicWWW `wp-content`/storefront seams pull in a lot of
multi-action commerce that is *not* our ICP. Vetting on "one conversion action" needs to stay strict.

---

## 2. Engine distribution

| engine | primary | of which in_icp=true | as runner-up |
|---|---:|---:|---:|
| **place** | 36 | 26 | 10 |
| **trust** | 30 | 24 | 26 |
| **thing** | 20 | 15 | 23 |
| **work** | 14 | 9 | 11 |
| **quick-yes** | 1 | 1 | 31 |

- **place + trust = 65% of all sites** and the bulk of in-ICP. These two engines carry the coverage load.
- **quick-yes** almost never wins as the primary engine (1×) but is the **most common runner-up (31×)** —
  it's the fallback read for "just contact/subscribe," rarely the truest classification. Expected, healthy.
- Batch-2 (publicWWW) skewed **place**-heavy (restaurants, venues, gyms, hotels); batch-1 pilot + trust
  seam supplied the consultant/professional density.

---

## 3. Structure: single vs multi

- **multi-page: 98 / 101 (97%)**, single-page: 3 (whatsdev, amplainformatica, notaryassist).
- **Average page count ≈ 8.9.**

**`multipage` is table stakes, empirically confirmed** — it's the #1 needed capability (99/101). The
single-page landing page is now the exception, not the norm, even for tiny businesses. This validates
the "multi-page is the new normal" direction in the template guide.

---

## 4. Conversion mechanism

| mechanism | count |
|---|---:|
| form | 43 |
| redirect (off-site booking/store/ordering) | 35 |
| subscribe-follow | 11 |
| call-WhatsApp | 11 |
| donate-RSVP | 1 |

**Redirect is 35% of conversions** — the site's job ends by handing off to Calendly / Avaibook /
delivery site / linktr.ee / an external store. Our conversion layer must treat "delegated CTA to a
third party" as a first-class mechanism, not an afterthought. WhatsApp (11) is a real primary CTA in
LatAm/SEA/Turkey markets.

---

## 5. Design style distribution

| style | count |
|---|---:|
| warm/human | 35 |
| editorial/craft | 19 |
| authority/professional | 17 |
| bold/performance | 12 |
| tech/minimal | 7 |
| literary/quiet | 2 |

**warm/human dominates (35%)** — hospitality, salons, restaurants, family businesses. tech/minimal
(the aesthetic most of our templates lean into) is only 7%. The 6-style vocab held with **zero
"none-fits" escapes** — style taxonomy is adequate; the *supply* of templates is skewed toward the
rarest style.

---

## 6. Section frequency — the spine (engine × section)

Counts = # of sites (of that engine) whose page carried the canonical section.

| section | place/36 | trust/30 | thing/20 | work/14 |
|---|---:|---:|---:|---:|
| hero | 32 | 29 | 20 | 13 |
| features | 23 | 27 | 20 | 6 |
| cta | 30 | 27 | 14 | 9 |
| leadForm | 25 | 25 | 17 | 13 |
| founderNote | 24 | 24 | 15 | 12 |
| socialProof | 19 | 21 | 9 | 9 |
| useCases | 17 | 20 | 14 | 5 |
| testimonials | 11 | 20 | 7 | 6 |
| pricing | 20 | 14 | 10 | 3 |
| faq | 11 | 13 | 9 | 3 |
| howItWorks | 7 | 13 | 9 | 2 |
| uniqueMechanism | 8 | 11 | 10 | 0 |
| results | 2 | 10 | 10 | 7 |
| problem / objectionHandling | 3/4 | 8/8 | 5/4 | 1/1 |
| map-hours | 4 | 1 | 0 | 0 |
| security | 1 | 2 | 6 | 0 |

**Universal spine (all engines):** `hero · features · cta · leadForm · founderNote · socialProof · footer · useCases`.
Engine-differentiators: **trust** leans testimonials + howItWorks + objectionHandling; **thing** leans
uniqueMechanism + results + security; **work** is lean (hero + leadForm + founderNote + results/portfolio);
**place** adds map-hours + pricing/menu. The section list's core is well-exercised — the tail
(`stats`, `team`, `gallery`, `packages`, `integrations`) is rarely the top-level canonical, mostly
folded into `miscellaneous`.

Top components observed: `text` (503) · `grid-cards` (162) · `form` (101) · `gallery` (35) ·
`accordion` (34) · `logo-strip` (33) · `pricing-table` (24) · `stats` (23) · `timeline` (20) ·
`team` (20) · `carousel` (16) · `map` (15) · `menu-list` (8).

Proof types: testimonials 46 · certs 40 · stats 35 · portfolio 26 · reviews 19 · logo-wall 19 · case-studies 7.

---

## 7. Capabilities

### Existing capability demand (canonical `needed`)
`multipage 99 · lead-form 64 · blog 63 · map-hours 54 · gallery/portfolio 44 · catalog 38 · packages 33 · bilingual 21 · video-hero 11 · store-badges 5`

**blog (63) and bilingual (21) are far more in-demand than the current build assumes.** Bilingual isn't
a Lumen one-off — 28 of 101 sites are non-English, and multiple carry twin-language content
(ja/es/pt/fr/it/id/nl/th/vi/de/pl).

### Proposed-new capabilities — grouped (the live signal)

The analyzers coined 41 distinct proposed capabilities across 100+ site-mentions. Clustered by theme:

| theme | site-mentions | representative coinings |
|---|---:|---|
| **commerce / checkout** | 19 | storefront-checkout (13), membership-checkout (3), quote-cart, app-signup, course-curriculum |
| **delegated booking / ordering redirect** | 16 | external-booking-redirect (11), online-ordering-redirect, external-order-redirect, menu-ordering, booking-portal, booking-wizard |
| **event listings** | 10 | event-listings (venues, theatres, clubs, festivals) |
| **content / media hub** | 10 | media-hub (4), content-index, content-feed, blog-teaser, recipe-index |
| **multi-location directory** | 8 | location-directory, store-locator, stockist-locator, practitioner-profiles (5) |
| **interactive tools** | 7 | interactive-calculators (4), product-finder-quiz, geo-landing-network, inventory-search |
| **portfolio / works catalog** | 5 | works-catalog (4), bibliography/works-listing |
| **list-signup** | 3 | external-list-signup, email-capture-popup |
| **affiliate** | 3 | affiliate-list, affiliate-hub, affiliate-resource-directory |

### Where the section list strains — unmapped sections (148 total, by closest canonical)

`miscellaneous 61 · pricing 19 · features 15 · useCases 7 · cta 6 · leadForm 6 · socialProof 4 · results 3 · gallery 3 · map-hours 2 · catalog 2`

- **`miscellaneous` absorbed 61 unmapped sections** — the catch-all is doing heavy lifting; several
  recurring real sections have no home (menu galleries, per-location directories, secondary B2B
  funnels, media/press grids).
- **`pricing` strained 19×** — service *packages* and membership *tiers* don't fit a single pricing
  block; the packages/pricing model needs a tiered variant.

---

## 8. Build-priority read

Ranked by in-ICP frequency × current-gap severity:

1. **Delegated-booking / redirect CTA as a first-class mechanism (16+ sites, mostly in-ICP place/trust).**
   `external-booking-redirect` alone hit 11 appointment/hospitality businesses (Calendly, Avaibook,
   linktr.ee). Redirect is 35% of all conversions. This is the highest-leverage, most in-ICP gap.

2. **Multi-location directory capability (8 sites).** `map-hours` models exactly one location; real
   restaurants/gyms/retailers have N branches each with own address/phone/WhatsApp. Needed for a whole
   class of place businesses. Cheap to add, clearly missing.

3. **event-listings (10 sites).** Venues, theatres, clubs, festivals — an upcoming-events section with
   dates/tickets. Concentrated, coherent, in-ICP.

4. **Bilingual as a platform capability, not a template one (21 sites, 28 non-English).** Twin-language
   content is common enough to promote out of the Lumen special-case. Ties to the deferred i18n track.

5. **blog / content-media hub (63 blog + 10 media-hub).** Under-served vs demand; matters for
   trust/work engines especially.

6. **Restaurant sub-vertical bundle (menu-display + menu-ordering/redirect + map-hours + hours).**
   A recurring place archetype the current section/menu model captures only partially.

**Explicitly NOT a priority:** full storefront checkout. `storefront-checkout` was the single most
"proposed" capability (13×) — but it is disproportionately **out-of-ICP** (full carts). The in-ICP read
is "product **catalog** + redirect to an external store," which we can serve without building a
commerce engine. Chasing checkout would optimize for the 26% we deliberately exclude.

---

## 9. Caveats

- Classifier is a single Opus pass per site (no adversarial second vote); engine picks with a close
  runner-up (esp. place↔quick-yes, thing↔place on storefronts) carry medium confidence.
- 44/101 medium + 1 low (goodspiritgraphics — spam-obscured). Restaurant/storefront edge cases are the
  main source of medium confidence.
- Proposed-new capabilities are *observations*, not taxonomy — coined names cluster but aren't
  deduped/canonicalized. The clustering in §7 is the intended read, not the raw 41-item list.
- Language/geography skew reflects the publicWWW seams used (wp-content, linktr.ee, Tally/Calendly),
  not a representative sample of the global ICP.

---

## 10. Independent cross-check additions (folded 2026-07-11)

From the second pass over `raw/` (script aggregation, no analyzed/ reuse):

- **`team` deserves canonical-section status — 24 sites** render a staff/practitioner grid.
  This pass had folded team into miscellaneous/founderNote (founderNote ≈75 sites is inflated
  by about/team/story mappings; the 61-item miscellaneous overflow corroborates). → Ruled into
  contract patch wave 1 (templatePlan T7).
- **Certs/awards band — 42 sites**, distinct proof grammar from logo walls (23). → wave 1.
- **Style supply mismatch corroborated from raw data:** only **5/101 dark sites**; 74%
  photo-heavy. Image-pipeline quality is a bigger lever than another dark tech template.
- **Google-reviews widget — 15 sites** → `reviews-widget` capability (wave 1).
- **Forms stay simple:** avg 3.2 fields (name/email/message dominate) — form sophistication is
  NOT a gap; WhatsApp/tel prominence (SEA/EU cohorts) matters more.
- **Dropdown navs on 53%** — nav is a real component, not a link row.
- Engine-count deltas explained: this report's place=36 vs cross-check's 28 came from
  retail-with-cart and salon edge cases — resolved by T2/T3 rulings (salons→trust,
  storefronts→self-selection); true place cohort is the venue-IS-the-product set.

Post-rulings status of §8 priorities: superseded as a decision list by `templatePlan.md`
(place engine committed ASAP per T5/T6, not trigger-gated; wave-1 vs wave-2 capability split
per T7). §8 remains the evidence ranking.

---

*Source data: `analyzed/*.json` (101 files) + `raw/*.json` cross-check. Aggregation:
`scratchpad/aggregate.js` → `agg.json`. Per-site status: `progress.json`. Decisions:
`docs/tracks/templatePlan.md` T1–T8.*
