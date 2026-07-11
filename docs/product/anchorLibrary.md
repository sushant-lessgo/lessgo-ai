# Anchor Library

Curated reference library that makes template variety **deliberate**. When a new
template is art-directed (per the `/new-template` skill, path D), a session pulls
**3–5 anchors from DIFFERENT groups** below to seed distinct hero tiles. Anchors, not
adjectives: each entry is a named site / design movement / type system / real product
concrete enough to seed one distinct hero — with a 1-line "why" plus typeface and token
cues.

> **Maintenance rule (guard-enforced):** when a new template ships, its
> `templateMeta.designStyles` fingerprint is added to the **Banned fingerprints** list
> below. The derived guard `src/modules/templates/anchorLibrary.test.ts` reads this file
> and turns RED if any live `templateMeta.designStyles` value is missing from that list —
> so a newly-shipped template's style can never silently become re-usable as an "anchor".
> The banned list keeps every shipped feel single-use; anchors must diverge FROM it.

> **Taste review:** the *quality* of these anchors (are they genuinely distinct, well-cued,
> useful for tile divergence?) is a FOUNDER decision — reviewed at the phase-11
> `/new-template` skill gate, alongside the skill rewrite. This file's automated guard only
> protects the banned list from rotting; it does not judge anchor taste.

---

## How to use (art-direction step)

1. Read the **Banned fingerprints** section — never propose a hero that lands on a shipped
   template's feel or a default-mode cliché.
2. Pull **3–5 anchors from at least 3 DIFFERENT groups** below. Divergence across groups is
   the point — 3 anchors from the same group produce 3 near-identical tiles.
3. Turn each pulled anchor into ONE hero tile (typeface + token cues are the starting
   palette, not a copy job).
4. Founder taste-picks among the tiles; the pick seeds the full design + kit.

---

## Anchors

### Group A — Swiss / Modernist grid systems

- **Swiss International Typographic Style** — Helvetica/Akzidenz-Grotesk, strict modular
  grid, flush-left ragged-right, generous whitespace, objective/neutral; asymmetric balance
  over ornament. Tokens: near-black on off-white, single accent, hairline rules, tight
  baseline grid. <!-- anchor -->
- **Josef Müller-Brockmann posters** — mathematical grid, diagonal dynamism, 2-color max,
  Akzidenz-Grotesk; type IS the image. Tokens: red/black on white, large type ramp, no
  photography chrome. <!-- anchor -->
- **Massimo Vignelli / Unigrid (NPS brochures)** — one grid, one typeface (Helvetica),
  flat color bands, ruthless consistency. Tokens: bold horizontal color bars, flush-left
  captions, zero rounding. <!-- anchor -->
- **Braun / Dieter Rams product manuals** — quiet functionalism, monochrome + one signal
  color, tabular clarity. Tokens: light-grey neutrals, single warm-orange signal, thin
  dividers, sans-serif labels. <!-- anchor -->

### Group B — Industrial / Utilitarian / Hardware

- **Teenage Engineering product pages** — industrial-instrument feel, monospace labels,
  hairline rules, exploded-diagram imagery, playful-but-precise. Tokens: JetBrains-Mono /
  grotesk mix, orange-on-grey, thin borders, no shadows. <!-- anchor -->
- **NASA graphics standards manual (the "worm")** — engineering-precise, uppercase
  grotesk, red monochrome, technical drawings. Tokens: Helvetica-heavy uppercase,
  single-red accent, blueprint linework. <!-- anchor -->
- **Blueprint / CAD schematic aesthetic** — cyan-on-navy linework, dimensioned callouts,
  monospace annotations, grid paper. Tokens: mono type, thin cyan strokes, dark ground,
  crosshair markers. <!-- anchor -->
- **Aviation / cockpit HUD panels** — dense readouts, monospace numerics, amber/green on
  black, framed modules. Tokens: high-contrast dark UI, mono numerics, boxed segments,
  no gradients. <!-- anchor -->

### Group C — Editorial / Print / Literary

- **The New York Times / broadsheet masthead** — serif authority, tight column rules,
  dateline hierarchy, restrained palette. Tokens: transitional serif (Georgia/Cheltenham
  feel), black-on-cream, thin column dividers, drop-cap option. <!-- anchor -->
- **Penguin Classics book covers** — orange band + Gill-Sans wordmark, spine-driven
  grid, austere. Tokens: single saturated band, humanist sans, generous margins, no
  imagery bleed. <!-- anchor -->
- **Kinfolk / slow-living magazine** — vast whitespace, small centered serif, muted
  photography, calm cadence. Tokens: light serif, off-white ground, oversized margins,
  low-contrast neutrals. <!-- anchor -->
- **Monocle magazine** — dense but tidy grid, humanist sans + serif pairing, muted
  primaries, briefing-style modules. Tokens: two-typeface system, small caps labels,
  muted red/blue accents, ruled boxes. <!-- anchor -->

### Group D — Warm / Craft / Human

- **Aesop store & web** — apothecary restraint, wide-tracked serif, earthy neutrals,
  tactile paper feel. Tokens: warm greige palette, letter-spaced serif caps, generous
  leading, no hard shadows. <!-- anchor -->
- **Farmhouse / artisan-bakery branding** — hand-set warmth, cream + terracotta, humanist
  serif, textured backgrounds. Tokens: warm cream ground, terracotta accent, soft serif,
  subtle grain texture. <!-- anchor -->
- **Muji catalog** — anti-brand plainness, tiny neutral sans, product-forward whitespace,
  recycled-paper tone. Tokens: pale-kraft ground, minimal sans, thin grey rules, zero
  ornament. <!-- anchor -->

### Group E — Bold / Expressive / Maximal

- **Brutalist web (early Bloomberg redesign / Balenciaga)** — raw system fonts, harsh
  contrast, oversized type, exposed structure. Tokens: system-ui / Arial, black-white
  clash, borderless blocks, aggressive scale jumps. <!-- anchor -->
- **Memphis / 1980s postmodern** — clashing primaries, geometric confetti, playful
  disorder, chunky sans. Tokens: primary color trio, hard geometric shapes, thick
  outlines, no gradients. <!-- anchor -->
- **Y2K / chrome-and-gradient revival** — metallic sheen, bubble type, saturated
  spectrum, techno-optimism. Tokens: chrome grays + electric accents, rounded display
  face, glossy chips (use sparingly — see bans). <!-- anchor -->

### Group F — Concrete software product references

- **Stripe.com** — mono-accent restraint over a tight 12-col grid, gradient-mesh reserved
  for one hero moment, immaculate spacing. Tokens: near-black text, single indigo signal,
  fine grid, disciplined whitespace. <!-- anchor -->
- **Linear.app** — dark-mode precision, tight type ramp, subtle depth, keyboard-speed
  minimalism. Tokens: dark neutrals, one violet-ish signal, hairline separators, compact
  density. <!-- anchor -->
- **Vercel / geometric monochrome** — black-white geometry, triangle motif, mono
  numerics, ultra-clean. Tokens: pure black/white, grotesk display, thin rules, no
  decorative color. <!-- anchor -->

---

## Banned fingerprints

Never propose a hero that lands on any of these. Two sources: (a) every shipped template's
style fingerprint (derived rule below), and (b) default-mode clichés.

### (a) Shipped-template fingerprints — DERIVATION RULE

The banned set includes **every value in `src/modules/templates/templateMeta.ts` →
`designStyles`**, for every non-retired template. This is a RULE, not a static list: when a
new template ships and declares a new `designStyle`, that value automatically joins the
banned set, and the guard test enforces its presence in this doc. Current live values:

- `tech-minimal` (meridian)
- `editorial-craft` (vestria, lumen)
- `warm-human` (hearth)
- `authority-professional` (lex)
- `bold-performance` (surge)
- `literary-quiet` (granth)

(`techpremium` is retired — empty `designStyles`, contributes nothing. The rule reads the
live map, so retired/empty templates are naturally excluded.)

### (b) Default-mode bans (cliché avoidance)

- **Inter** — the default sans of every AI-generated site; pick anything else.
- **Purple gradients** — the generic "AI SaaS" hero wash.
- **Glassmorphism** — frosted-blur cards; overused, low-contrast.
- **Rounded-2xl card grids** — the default Tailwind card-grid look.
- **Emoji icons** — as feature/section icons; use real iconography or none.
