# templateMapping — 101 sites → template fit + gap list

Derived 2026-07-11 from `analyzed/*.json` (N=101) × `src/modules/templates/templateMeta.ts`
(engine × designStyle matrix, ICP-flavor overrides for health/finance/edu/retail/writer).
Companion to `findings.md`; feeds `docs/tracks/templatePlan.md` + designer commissioning.
Method note: 9 sites had no style captured (mapped by engine, marked `?`); "needs beyond
template" subtracts the picked template's declared capabilities + platform capabilities
(bilingual, blog) — for design-only picks the listed needs are port requirements.

## Headline (75 in-ICP sites)

| Bucket | Sites | Share |
|---|---:|---:|
| Servable by an IN-CODE template | 27 | 36% |
| Atelier (design DELIVERED, port queued #1) | 5 | 7% |
| Design bench (built HTML, needs port) — vital 4 · atlas 2 · comet 2 · pulse 1 · stockroom 1 | 10 | 13% |
| Place engine missing (mill/cabin designs waiting) | 26 | **35%** |
| Empty style×engine cells (no design exists) | 6 | 8% |
| quick-yes (engine unbuilt, 1 site) | 1 | 1% |

Multipage: 72/75 in-ICP sites are multi-page; only vestria has it today → **multipage
threading for the other in-code templates is the single biggest unlock, and it's
platform+design-chrome work, not new templates.** (Surge + vestria page designs already
delivered by designer; hearth/lex/meridian/granth have no subpage chrome designed.)

In-ICP capability demand: multipage 73 · lead-form 49 · blog 45 · map-hours 38 ·
gallery/portfolio 33 · packages 20 · catalog 20 · bilingual 16 · video-hero 9.
Proposed-new (≥2 sites): event-listings 8 · external-booking-redirect 8 · works-catalog 4 ·
practitioner-profiles 4 · interactive-calculators 4 · media-hub 4.

## Per-template needs (what "fully serve" requires)

**In-code templates (27 sites):**
| Template | Sites | Needs (new blocks/uiblocks unless noted) |
|---|---:|---|
| hearth | 8 | subpage chrome (multipage) · packages/tiered-pricing block (T7-w1 ✅ ruled) · gallery block ×2 · map-hours ×2 · media-hub ask ×2 |
| lex | 6 | subpage chrome · packages block ×3 (T7-w1 ✅) · map-hours ×2 |
| meridian | 5 | subpage chrome · video-hero variant ×2 · catalog/store-badges ×1 · blog-teaser section |
| vestria | 5 | already multipage ✅ · lead-form/catalog declared ✅ · stockist-locator + calculators = fringe |
| granth | 3 | works-catalog collection ×2 (collection family `works` exists in code — needs granth blocks) · gallery · lead-form block · subpage chrome |
| surge | 0 corpus | (demand is lead-flow — scalifixai, winngrowth — not corpus; multipage pages DELIVERED in designer-workspace) |

**Design bench (15 sites) — port order by demand:**
| Template | Sites | Port pulls |
|---|---:|---|
| atelier (work/editorial) | 5 | port = factory drill (queued). Needs: gallery/portfolio ✅ in design · lead-form · tiered packages (T7-w1) |
| vital (trust/warm-clinical) | 4 | practitioner-profiles≈team (T7-w1 ✅) · map-hours ×3 · booking-embed (T7-w1 ✅) — expected first port per templatePlan step 3 ✅ confirmed by this mapping |
| atlas (trust/finance) | 2 | calculators (fringe — skip) · media-hub |
| comet (thing/consumer-app) | 2 | store-badges · gallery |
| pulse (work/personal-brand) | 1 | works-catalog |
| stockroom (thing/retail) | 1 | catalog collection |
| vector (trust-thing/edu) | 0 | zero corpus demand — deprioritize port |

**Place bucket (26 sites — biggest single block):** engine build (T5 ✅ committed) + Mill
port + wave-2 contract bundle. This mapping adds evidence for the bundle: map-hours 25 ·
event-listings 8 · external-booking-redirect 8 (≈booking-embed) · gallery 15 ·
menu-display/ordering-redirect · practitioner-profiles ×3. All fold into the ruled wave-2
set (menu, multi-location, events-calendar) + wave-1 booking-embed — **no new rulings
needed, only two additions to consider: external-booking/order REDIRECT capability (thin —
link-out, no embed) and location-directory (multi-location, wave-2 ✅).**

**Empty cells (6 sites — need NEW designs, none exist):**
- **trust × editorial-craft — 4 sites** (interior-design studios, design-led consultancies:
  design-plus, insideoutcolouranddesign, lenivastudio, valencienne). Biggest true design
  gap. Candidate: new system or an editorial variant/look of hearth pushed further.
- **thing × warm-human — 2 sites** (artisan food producers: deliciasdotrigo, ecorevolution).
  Candidate: warm look of vestria vs new system.

## Gist — what to ask the designer (in order)
1. **Subpage/multipage chrome for hearth, lex, meridian, granth** (page-hero band + page
   compositions; surge + vestria + atelier already delivered). Small per-template asks,
   unlocks the 72/75 multipage reality for in-code stock.
2. **trust×editorial-craft direction** — 1 new system (or hearth-editorial spinoff): 4-site
   demand, in-ICP studios. Style tiles first per factory protocol.
3. **Block-level asks bundled with T7 wave 1** (already ruled, just include in kits):
   tiered packages (hearth/lex), team/practitioner-profiles (vital port), booking-embed.
4. **Video-hero variant** (meridian first, 9 in-ICP mentions) + **media-hub section**
   (4 mentions, hearth/atlas flavor) — new uiblock designs.
5. **thing×warm-human** — defer decision (2 sites): try vestria warm look before
   commissioning a system.
6. Place designs (Mill/Cabin) are READY — the blocker is the engine build, not design.
   Wave-2 kit should add: menu, events-calendar, multi-location, booking/order-redirect.

## Per-site mapping (101 rows)
| site | icp | engine | style | template | status | needs beyond template |
|---|---|---|---|---|---|---|
| storiesinsound | ✓ | work | unknown | atelier? | delivered-design | multipage(3p), video-hero, +media-hub |
| adriantofei | ✓ | work | editorial-craft | atelier | delivered-design | multipage(10p), gallery/portfolio, video-hero, +works-catalog |
| brettlair | ✓ | work | editorial-craft | atelier | delivered-design | multipage(5p), gallery/portfolio, lead-form |
| epiclaunch | ✗ | work | editorial-craft | atelier | delivered-design | multipage(5p), +content-feed, +affiliate-list |
| fabiola-ferrero | ✓ | work | editorial-craft | atelier | delivered-design | multipage(17p), gallery/portfolio, lead-form |
| priscillawolf | ✗ | work | editorial-craft | atelier | delivered-design | multipage(7p), gallery/portfolio, packages, lead-form, map-hours, +booking-wizard |
| tigerhousefilms | ✓ | work | editorial-craft | atelier | delivered-design | multipage(5p), gallery/portfolio, lead-form |
| tomecano7 | ✗ | work | editorial-craft | atelier | delivered-design | multipage(6p), gallery/portfolio, catalog, packages, lead-form, map-hours, +storefront-checkout |
| coffeefinance | ✓ | trust | warm-human | atlas | design | multipage(8p), gallery/portfolio, map-hours |
| coltivar | ✓ | trust | authority-professional | atlas | design | multipage(6p), video-hero, lead-form, +interactive-calculators, +media-hub |
| lite-tek | ✓ | thing | bold-performance | comet | design | multipage(3p), catalog, gallery/portfolio, map-hours, lead-form, +software-downloads |
| podcastpro | ✗ | thing | bold-performance | comet | design | multipage(7p), lead-form, packages, video-hero, +course-curriculum, +storefront-checkout, +content-index |
| sugoikanban | ✓ | thing | bold-performance | comet | design | multipage(6p), gallery/portfolio, lead-form |
| deliciasdotrigo | ✓ | thing | warm-human | GAP(thing-warm) | none | multipage(4p), catalog, lead-form, +content-index |
| ecorevolution | ✓ | thing | warm-human | GAP(thing-warm) | none | multipage(6p), catalog, lead-form |
| aprilandmay | ✗ | trust | editorial-craft | GAP(trust-editorial) | none | multipage(5p), catalog, gallery/portfolio, packages, +external-booking-redirect, +storefront-checkout |
| design-plus | ✓ | trust | editorial-craft | GAP(trust-editorial) | none | multipage(5p), gallery/portfolio, lead-form, map-hours |
| insideoutcolouranddesign | ✓ | trust | editorial-craft | GAP(trust-editorial) | none | multipage(9p), gallery/portfolio, packages, lead-form |
| lenivastudio | ✓ | trust | editorial-craft | GAP(trust-editorial) | none | multipage(5p), gallery/portfolio, lead-form |
| valencienne | ✓ | trust | editorial-craft | GAP(trust-editorial) | none | multipage(6p), gallery/portfolio, map-hours, catalog |
| contractseries | ✓ | work | literary-quiet | granth | code | multipage(12p), lead-form, +bibliography/works-listing |
| david-velasco | ✓ | work | editorial-craft | granth | code | multipage(6p), gallery/portfolio, +works-catalog, +progress-tracker |
| rabbleboy | ✓ | work | editorial-craft | granth | code | multipage(12p), gallery/portfolio, video-hero, lead-form, +works-catalog |
| sekrondigital | ✓ | trust | unknown | hearth? | code | multipage(12p), catalog, lead-form, +external-lead-form |
| chiho-international-academy | ✓ | trust | warm-human | hearth | code | multipage(9p), map-hours |
| drcynthiahawver | ✓ | trust | warm-human | hearth | code | multipage(6p), +media-hub |
| juliedawnfox | ✗ | trust | warm-human | hearth | code | multipage(6p), catalog, packages |
| katbyles | ✓ | trust | warm-human | hearth | code | multipage(8p), gallery/portfolio, packages, +storefront-checkout |
| olyvia | ✓ | trust | warm-human | hearth | code | multipage(4p), +affiliate-resource-directory |
| osbornewoodcare | ✓ | trust | warm-human | hearth | code | multipage(6p), gallery/portfolio, map-hours |
| petsittersireland | ✓ | trust | warm-human | hearth | code | multipage(5p), packages, +booking-portal |
| travelitalianstyle | ✓ | trust | warm-human | hearth | code | multipage(11p), packages, +media-hub |
| amplainformatica | ✓ | trust | authority-professional | lex | code | map-hours |
| bores | ✓ | trust | authority-professional | lex | code | multipage(12p) |
| financialgym | ✓ | trust | authority-professional | lex | code | multipage(6p) |
| golivehq | ✗ | trust | authority-professional | lex | code | multipage(8p), gallery/portfolio, catalog, packages, +product-finder-quiz |
| nassimbelouar | ✓ | trust | authority-professional | lex | code | multipage(8p), packages |
| shemmassianconsulting | ✓ | trust | authority-professional | lex | code | multipage(6p), packages |
| sommeliercompany | ✓ | trust | authority-professional | lex | code | multipage(40p), map-hours, packages, +interactive-calculators, +geo-landing-network |
| studioduerre | ✗ | trust | authority-professional | lex | code | multipage(6p), catalog, map-hours, +inventory-search |
| nesplas | ✗ | thing | unknown | meridian?/vestria? | code | multipage(6p), catalog, gallery/portfolio, lead-form, +quote-cart |
| runnersconnect | ✓ | thing | unknown | meridian?/vestria? | code | multipage(5p), packages, lead-form, +email-capture-popup / external-list-signup, +blog-teaser |
| easybooking | ✓ | thing | tech-minimal | meridian | code | multipage(6p), +interactive-calculators |
| goodspiritgraphics | ✗ | thing | tech-minimal | meridian | code | multipage(25p), catalog, gallery/portfolio, +community-forum |
| mediamodifier | ✓ | thing | tech-minimal | meridian | code | multipage(5p), video-hero, catalog, +membership-checkout |
| notaryassist | ✓ | thing | tech-minimal | meridian | code | store-badges, video-hero, +app-signup |
| reloop | ✓ | thing | tech-minimal | meridian | code | multipage(10p), +external-list-signup |
| seao2 | ✓ | thing | tech-minimal | meridian | code | multipage(8p), map-hours, gallery/portfolio, +blog-teaser |
| angello-pizza-rennes | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(5p), map-hours, catalog, +external-order-redirect |
| babygiftretail | ✗ | place | warm-human | mill/cabin | engine-missing | multipage(7p), catalog, map-hours, +storefront-checkout |
| beanstalkhq | ✗ | place | warm-human | mill/cabin | engine-missing | multipage(15p), gallery/portfolio, map-hours, packages, lead-form, +membership-checkout |
| beststopinscott | ✗ | place | warm-human | mill/cabin | engine-missing | multipage(12p), catalog, map-hours, lead-form, gallery/portfolio, +store-locator |
| bookskubrick | ✓ | place | unknown | mill/cabin | engine-missing | multipage(11p), catalog, map-hours, +event-listings, +practitioner-profiles |
| boutiquedeluz | ✗ | place | unknown | mill/cabin | engine-missing | multipage(6p), catalog, map-hours, +storefront-checkout |
| circle-cafe | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(3p), catalog, map-hours, +online-ordering-redirect |
| coppi | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(6p), gallery/portfolio, map-hours, lead-form, +external-booking-redirect |
| donlealpizzaria | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(5p), gallery/portfolio, map-hours, lead-form, +location-directory, +franchise-recruitment |
| elbosc | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(11p), gallery/portfolio, map-hours, packages, lead-form, +external-booking-redirect |
| flyingsushi | ✓ | place | unknown | mill/cabin | engine-missing | multipage(12p), map-hours, lead-form, +practitioner-profiles, +menu-display |
| gokyuzurestaurant | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(5p), map-hours, +practitioner-profiles |
| harmonylife | ✗ | place | warm-human | mill/cabin | engine-missing | multipage(6p), catalog, map-hours, +storefront-checkout |
| hinodeyaramen | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(4p), gallery/portfolio, catalog, map-hours, lead-form, +menu-ordering, +loyalty-rewards |
| houndstoothcoffee | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(8p), map-hours |
| maestrokomputer | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(3p), gallery/portfolio, map-hours |
| moonrakerhotel | ✗ | place | warm-human | mill/cabin | engine-missing | multipage(9p), gallery/portfolio, map-hours, packages, lead-form, +external-booking-redirect |
| morenoshairandbeauty | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(6p), gallery/portfolio, catalog, map-hours, +external-booking-redirect |
| motherkellys | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(9p), map-hours, catalog, +external-list-signup, +event-listings |
| precinctdtla | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(4p), map-hours, catalog, store-badges, lead-form, +event-listings |
| sagungseto | ✗ | place | unknown | mill/cabin | engine-missing | multipage(5p), catalog, +storefront-checkout |
| sportsofallsortsky | ✓ | place | unknown | mill/cabin | engine-missing | multipage(40p), map-hours, gallery/portfolio, lead-form |
| tokyo-okutama-otsunaturegarden | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(10p), gallery/portfolio, map-hours, packages, +external-booking-redirect |
| trianglehairorganic | ✓ | place | warm-human | mill/cabin | engine-missing | multipage(8p), map-hours, packages, gallery/portfolio |
| 7adire | ✓ | place | literary-quiet | mill | engine-missing | multipage(3p), gallery/portfolio, +event-listings |
| airsafaris | ✓ | place | editorial-craft | mill | engine-missing | multipage(20p), gallery/portfolio, map-hours, packages, +external-booking-redirect |
| drycreekvineyard | ✗ | place | editorial-craft | mill | engine-missing | multipage(5p), catalog, map-hours, packages, store-badges, +external-booking-redirect, +storefront-checkout, +membership-checkout |
| edisontally | ✓ | place | editorial-craft | mill | engine-missing | multipage(11p), map-hours, lead-form, packages, video-hero, +external-booking-redirect |
| fondatheatre | ✓ | place | bold-performance | mill | engine-missing | multipage(11p), map-hours, lead-form, +event-listings |
| kwadratowa | ✓ | place | bold-performance | mill | engine-missing | multipage(7p), gallery/portfolio, map-hours, packages, +event-listings |
| lowbrowpalace | ✓ | place | bold-performance | mill | engine-missing | multipage(5p), lead-form, map-hours, +event-listings |
| palestrauniverso | ✗ | place | bold-performance | mill | engine-missing | multipage(9p), map-hours, catalog, packages, lead-form, +storefront-checkout |
| pariwana-hostel | ✓ | place | bold-performance | mill | engine-missing | multipage(6p), gallery/portfolio, catalog, map-hours, lead-form, +external-booking-redirect |
| thebelltoweron34th | ✓ | place | editorial-craft | mill | engine-missing | multipage(6p), gallery/portfolio, map-hours, lead-form, packages |
| thietbivesinhtoto | ✗ | place | bold-performance | mill | engine-missing | multipage(8p), catalog, map-hours, +storefront-checkout |
| totc | ✓ | place | bold-performance | mill | engine-missing | multipage(20p), gallery/portfolio, map-hours, store-badges, +event-listings |
| whatsdev | ✓ | quick-yes | tech-minimal | NONE(quick-yes) | none | — |
| greenhealthycooking | ✗ | work | warm-human | pulse | design | multipage(21p), catalog, packages, lead-form, +recipe-index / content-category-grid, +affiliate-hub |
| jadesummer | ✓ | work | warm-human | pulse | design | multipage(5p), catalog, gallery/portfolio, lead-form, +works-catalog |
| louisiana-ontour | ✗ | work | bold-performance | riot | design | multipage(6p), gallery/portfolio, video-hero, lead-form, +event-listings, +press-kit-downloads, +fan-voting |
| namlin | ✓ | thing | editorial-craft | stockroom | design | multipage(8p), catalog, map-hours |
| empoweredvolleyball | ✗ | trust | bold-performance | vector | design | multipage(30p), packages, map-hours, +event-listings |
| conlancongnghiep | ✓ | thing | authority-professional | vestria? | code | multipage(6p), lead-form, catalog, video-hero |
| diabetna | ✓ | thing | authority-professional | vestria? | code | multipage(6p), catalog, lead-form, +stockist-locator |
| metatex | ✗ | thing | authority-professional | vestria? | code | multipage(6p), catalog, map-hours, lead-form, +storefront-checkout |
| pasikuikka | ✓ | thing | authority-professional | vestria? | code | multipage(11p), catalog, packages, lead-form, +interactive-calculators |
| psnce | ✓ | thing | authority-professional | vestria? | code | multipage(6p), catalog, lead-form |
| yogyakartas | ✗ | thing | authority-professional | vestria? | code | multipage(10p), catalog, map-hours, gallery/portfolio, lead-form, +storefront-checkout |
| curacell | ✓ | trust | authority-professional | vital | design | multipage(10p), map-hours, video-hero, lead-form, +external-booking-redirect |
| healthfullifemd | ✓ | trust | warm-human | vital | design | multipage(9p), map-hours, lead-form |
| kristenyarker | ✓ | trust | warm-human | vital | design | multipage(6p), map-hours, lead-form |
| lightcrew | ✓ | trust | warm-human | vital | design | multipage(14p), gallery/portfolio, packages, lead-form, +practitioner-profiles |
| rsalislam | ✗ | trust | authority-professional | vital | design | multipage(40p), store-badges, packages, map-hours, +practitioner-profiles |
