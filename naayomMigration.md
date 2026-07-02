# Naayom Migration — Gap Analysis

> First customer. Goal: give naayom **at least** what their current site has, on the Lessgo platform.
> Status: analysis only (no build decision made yet). Date: 2026-06-20.

## What naayom is

Multi-page hardware/IoT marketing site — mushroom climate-control systems. ~12 real pages.
Sales-led: **no e-commerce, no cart, no pricing.** Conversion = phone / WhatsApp / "Contact Sales".
Hardware-founder voice → maps to the **TechPremium** product template.

Out of scope: Success Story page ("Coming Soon" placeholder), mobile app (separate native product on Google Play).

## Their actual site surface

- **Homepage** — value-props grid (~7 cards), 3-step "How Naayom Works" (Sensing → Control → Data Analytics), 3+ alternating image+text explainer rows, product showcase, 2 testimonials, partner-logo rail, footer
- **Products catalog page** — 9 SKUs in 3 categories
  - Mushroom Growing Control: NWC 1000, NWC 2000, NWB 3000
  - Control Systems: NWC 101, NWC 301, NWC 201
  - Monitoring Systems: NWM 100, NWM 300, NWM 200
- **9 product detail pages** — each: 4-image gallery (prev/next), 7-ish feature bullets, "Contact Sales" CTA, related products
- **Gallery page** — 36 images, grid
- **Contact page** — static info only (address / email / phone), no form, no map
- **Login** → external IoT app (https://iot.naayom.com/)
- **Floating WhatsApp widget** (prefilled message), multi-level **dropdown nav**

## Gaps vs Lessgo today

### Tier 1 — hard blockers (no parity without these)

| # | Missing | Naayom has | Lessgo today |
|---|---------|-----------|--------------|
| **A** | **Multi-page sites** | ~12 pages | **1 page per project/slug.** Only legal subpages (`/p/[slug]/privacy`) exist. Everything below cascades from this. |
| **B** | **Product catalog + product-detail page type** | 9 products, 3 categories, each its own page | No "product" concept — only pricing tiers + feature cards |
| **C** | **Image gallery block (grid / lightbox / carousel)** | 36-img gallery page + 4-img per product | **Absent.** Single images only (hero / logo); no image collections |
| **D** | **Cross-page nav + dropdown menus** | dropdowns, links across pages | Nav is **flat, anchor-only (`#`)**, single-page |

### Tier 2 — visible but workaroundable

| # | Missing | Note |
|---|---------|------|
| **E** | **Floating WhatsApp chat widget** | External-link buttons work → can fake with a `wa.me` button, but no persistent floating bubble + prefilled msg |
| **F** | **Alternating image+text explainer rows + 3-step "How it works"** | TechPremium renders only a feature grid; naayom homepage leans on these. Partial |
| **G** | **"Contact Sales" instead of pricing** | Product template hardwires a 3-tier Pricing section; naayom is sales-led, no prices → need Pricing→Contact-Sales swap |

### Already covered (no gap)

Hero · value/feature cards · testimonials · **partner-logo rail** · footer w/ contact+social · **external login link** (iot.naayom.com) · **lead-capture form** (Lessgo exceeds naayom — they have none).

## The one decision that drives everything

**Single long landing page vs. true multi-page site.**

- **One-page** (fits Lessgo today): collapse homepage onto a scroller. Loses catalog, 9 detail pages, gallery page → not real parity, but shippable now + only minor blocks needed (gallery, image+text rows).
- **Multi-page** (real parity): requires Tier-1 A–D. Multi-page publishing is a **core architecture change** (project→pages model, slug routing, cross-page nav) — the biggest lift by far.

## Open questions

1. Parity target: faithful multi-page clone, or "good enough" one-pager for v1?
2. 9 product detail pages must-have, or is one catalog section acceptable?
3. Gallery: real requirement, or drop the 36-img page?
4. WhatsApp floating widget: hard requirement, or is a `wa.me` button enough?
5. Content migration: auto-import via scraper, or hand-entered by us/naayom?

## Sources

- https://www.naayom.com/ · /products.html · /nwc-2000.html · /contact.html · /gallery.html
