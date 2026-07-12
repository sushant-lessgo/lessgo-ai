# atelier — template module

On-demand **work-engine** visual-portfolio template (anchor customer Kundius
Photography). Cloned from vestria's `.core.tsx` single-source triad pattern with
the **mood axis dropped**. **Service audience** (atelier-template phase 1 ruling)
— the first *non-bespoke* work template, so declaring `gallery` in `templateMeta`
FLIPS the photographer serve decision MANUAL→SERVE.

## Status
Phases 1–4 landed. Blocks are **provisional-but-real** (structurally correct,
visually plain) — the real Atelier×Kontur design is a **phase-9 human gate**
(requires approved designer HTML). Tokens/palettes/variants are provisional and
refined in phase 6; fonts (Bricolage Grotesque) land in phase 8; the hero slider
asset in phase 10; editor mocks + parity harness in phases 11–12.

## Section grammar (two-identifier discipline)
`sectionType` (lowercase single token — hyphen-free so `extractSectionType`
round-trips) → PascalCase `layoutName`:

| sectionType | layoutName          | notes |
|-------------|---------------------|-------|
| `header`    | `AtelierNavHeader`  | |
| `hero`      | `AtelierHero`       | work core; static image (slider = phase 9/10) |
| `work`      | `AtelierWorkGallery`| work core; **`gallery` capability evidence** |
| `packages`  | `AtelierPackages`   | **`packages` capability evidence**; 2–4 cards |
| `about`     | `AtelierAbout`      | work core |
| `quote`     | `AtelierQuoteBand`  | dark band |
| `contact`   | `AtelierContact`    | shared lead-form placement = phase 9 |
| `footer`    | `AtelierFooter`     | work core |

- Engine `work` core = `hero, work, about, footer` (coreSections.ts).
- `capabilitySections`: `gallery → work`, `packages → packages` (templateMeta).
- Layouts registered in `serviceElementSchema` (so `contractFor` resolves them);
  block manifest in `blockManifest.ts` (`packages` minCards:2/maxCards:4).

## Invariants / pitfalls
- **Dual-renderer + single-source:** each block is a `.core.tsx` (pure) + `.tsx`
  (edit wrapper) + `.published.tsx` (published wrapper). NEVER import a named
  value from a `'use client'` `.tsx` into a `.published.tsx` or `.core.tsx` —
  shared strings live in plain `styles.ts`. Enforced by `coreParity.test.ts`.
- **CSS variables stay GENERIC** (`--paper`/`--ink`/`--accent`) so
  `data-surface`/`data-palette` stay template-agnostic. Class names are
  `lg-atelier-`.
- Blocks pad INSIDE the surface wrapper (`lg-atelier-pad`), never outer margin,
  and never paint a full-bleed background — the renderer wraps each section in
  `<div data-surface>`.
