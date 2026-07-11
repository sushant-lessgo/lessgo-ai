# Template Library Inventory

Source: claude.ai/design "Lessgo" project (CONTEXT.md + file list, pulled 2026-07-10) ⨯ local `template-design/` ⨯ `src/modules/templates/` registry.
Purpose: single source of truth for coverage planning (template-factory continuous-development track). Design library = raw material; porting order = coverage strategy decision.

## The library's own parameter model (every design system)
- One self-contained HTML file: spec doc + rendered section mockups (`.frame`) + copyable token block (`:root` + `[data-palette]` + `[data-variant]`).
- **Two-axis model baked into every design:** 9 palettes (hue-only swap, OKLCH, newer systems single `--h` var) × 3 variants (mood/density/font shift) = **27 combos per system** — pre-designed knob ranges the factory spec (§flexibility) wants.
- Google Fonts via `<link>` (⚠ must convert to self-hosted on port), OKLCH everywhere, realistic mockup copy with per-system AI-slop ban list.

## Built design systems (13 + Vestria)

| Vol | Template | Serves (ICP) | Copy engine | Variants | Default palette | Style fingerprint | Status |
|---|---|---|---|---|---|---|---|
| 01 | **Meridian** — Modern Tech | SaaS / dev-tools / infra | thing | Developer · Marketing · Light | mint | dark-native, hairline-first, mono, crosshairs, single accent | ✅ IN CODE (flagship, +3 block variants scale-09) |
| 02 | **Hearth** — Warm Service | agencies / coaches / course creators | trust | Classic · Condensed · Editorial | terracotta | light, photo-led, Fraunces+DM Sans, swoop underline | ✅ IN CODE |
| 03 | **Folio** — Editorial Minimalist | premium DTC / studios / photographers | work (thing-adjacent for DTC) | Serif · Mixed · Grotesque | bone | cream paper, type-as-art, NO cards, folio numbers, drop-caps | 🎨 design-only |
| 04 | **Riot** — Bold Expressive | creative agencies / fashion / music / festivals | work/trust (mixed) | Brutalist · Maximalist · Riso | acid | DUAL-accent (only one), marquees, stamp shadows, stickers | 🎨 design-only |
| 05 | **Lex** — Trust Professional | banks / law / fiduciaries / gov | trust | Statesman · Clinical · Civic | counsel | composed/COLD, annual-report grid, dotted leaders, § numerals | ✅ IN CODE |
| 06 | **Mill** — Local Craft | restaurants / bakeries / makers / hotels | **place (engine ❌ not live)** | Letterpress · Market · Workshop | clay | single-ink-on-paper, wood-type, tickets/price-tags, paper grain | 🎨 design-only |
| 07 | **Atlas** — Financial Planner | fee-only CFPs / RIAs / life-planners | trust | Practice · Firm · Life-planner | north | composed/WARM, cartographic grammar, REAL SVG charts | 🎨 design-only |
| 08 | **Pulse** — Creator & Personal Brand | writers / podcasters / founders / coaches | work/trust | Voice · Operator · Coach | ink | face-forward, portrait+name+claim, "where I publish" strip, /now | 🎨 design-only |
| 09 | **Vital** — Healthcare & Wellness | clinics / therapists / dentists / telehealth | trust (+map-hours, booking-CTA caps) | Practice · Modern Clinic · Specialty | sage | clinical-warm, bookable-not-browsable calendar hero, conditions-not-features | 🎨 design-only |
| 10 | **Stockroom** — E-commerce & Retail | DTC apparel / home / beauty | thing (+catalog cap; redirect action — no checkout, in ICP) | Boutique · Catalog · Marketplace | ink | product-photo-first, price visible, product grid w/ badges+swatches | 🎨 design-only |
| 11 | **Comet** — Consumer App & Mobile | consumer mobile apps (habit/money/fitness) | thing (+store-badges; quick-yes candidate) | Bright · Calm · Bold | coral | PRODUCT LINE; device-frame hero w/ CSS app screens, bright+rounded, `--h` hue | 🎨 design-only (local ✓ designer-workspace/) |
| 12 | **Surge** — Growth & Perf Marketing | growth / paid-media agencies | trust | Performance · Editorial · Bold | volt | metrics-as-hero, dashboard hero, green/red semantics, `--h` | ✅ IN CODE |
| 13 | **Vector** — Career Transition & Cohort Ed | bootcamps / cohort courses / career pivots | trust/thing (course) | Roadmap · Mentor · Brief | indigo | trajectory-track motif (milestone nodes), proof-comparison table, image-slot.js | 🎨 design-only (local ✓ designer-workspace/) |
| — | **Vestria** — Uniform Manufacturing (v1/v2/Cobalt, post-CONTEXT, 4d ago) | manufacturers / B2B industrial | thing | (own axes) | cobalt | editorial/craft, full-bleed hero (v2) | ✅ IN CODE (newGeneration pilot) |

Also in code, NOT from this design project: **Granth** (writer/work engine, from WRDirection1) · **Lumen** (Kundius bespoke §13) · **TechPremium** (retired §11.4). Local-only unported writer directions: WRDirection2Patrika, WRDirection3Nishant.

## Designed-but-unbuilt (DNA proposed in CONTEXT.md)
| Name | Serves | Engine | Proposed variants | DNA |
|---|---|---|---|---|
| **Cabin** — Hospitality & Place | inns / retreats / venues | place ❌ | Inn · Group · Retreat | photo-led, atmosphere-first, availability chips, journey map |
| **Quarry** — Industrial & Trades | contractors / industrial / fleet | trust | Contractor · Industrial · Fleet | safety-orange+steel, stencil type, capability matrix, certs, phone-prominent |
| **Helix** — Science / Research / Pharma | labs / research cos / institutes | trust/thing | Lab · Company · Institute | lab-paper, Fig. captions, publication lists, funder logos |
| **Halo** — Faith & Community | parishes / networks / missions | trust | Parish · Network · Mission | ecclesiastical serif, service-time tables, stained-glass palettes |

Runners-up held: **Civic** · **Stadium**. Library convention: "breadth before depth" — next default build = Cabin.

## Engine-coverage view (the strategic read)
| Engine | In code | Design-ready, unported | Gap |
|---|---|---|---|
| thing | meridian, vestria | Comet, Stockroom | consumer-app + DTC-retail styles ready to port |
| trust | hearth, lex, surge | Atlas, Vital, Vector, (Riot), Quarry/Helix/Halo unbuilt | deepest bench — healthcare (Vital) likely highest-demand ICP |
| work | granth (seed-only) | Folio, Pulse, Riot | work engine itself ⚠ seed-only — porting blocked on engine, not design |
| place | — | Mill (built!), Cabin (DNA only) | engine ❌ not live (P3) — Mill/Cabin unusable until then |
| quick-yes | — | Comet closest | engine ❌ not live (P3) |

## Porting caveats (design → code)
- Google Fonts `<link>` → must map to self-hosted set or add fonts (`public/fonts/` + `fonts-self-hosted.css`).
- 9-palette × 3-variant axes per design ≈ template-factory knob ranges already designed — port them as `[data-palette]`/`[data-variant]` tokens, don't flatten.
- Switcher panel / localStorage / `aria-pressed` bits are design-file chrome — drop on port.
- Vol-number collision: Surge & Vector both stamp "Volume XII" (Vector should be XIII) — cosmetic, fix in design project.
- ~~Comet + Vector HTML not yet downloaded locally~~ — RESOLVED 2026-07-11: full designer
  export lives at `template-design/designer-workspace/` (folder map: `template-design/MAPPING.md`).
  Includes designer-built MULTI-PAGE deliveries not previously inventoried: `surge/` 6-pager
  (page-hero chrome + case-study detail), `atelier/` 5-pager + style-system, Vestria
  multi-page addendum HTML, naayom (newer than handoff), vishwas blog site.

## Client builds in same project (NOT templates; bespoke precedents)
- **Kundius** (photographer, EN/NL): 3 directions — Lumen (ported §13) / Atelier / Kontur. Source of truth `delivery/`.
- **Naayom** (agritech, customer #1): single-page + multi-page + `design_handoff_naayom/` package (handoff-format exemplar).
- **The Fozi Co** (mukhwas DTC): Saffron / Verdant directions.
- `design_handoff_meridian/` — scale-09 block-variant handoff (hero editorial-photo, features ledger, testimonials centered-editorial) — already implemented.
