# `src/modules/Design/` — Design System v3

Shared, template-agnostic design primitives **plus** the legacy 30-palette color
pipeline that renders non-template projects. This directory is NOT where a
template's look lives — templates own their own tokens (see
[Relationship to templates](#relationship-to-per-template-tokens)).

> **Orientation.** Two rendering paths exist (`LandingPageRenderer.tsx`):
> - **Template-backed projects** — `usesTemplateModule()` true: all `service`
>   + `writer` projects, and `product` on `meridian`/`techpremium`/`vestria`.
>   These wrap render output in the **template's own `ThemeInjector`** and read
>   tokens from `src/modules/templates/<id>/tokens.ts` + `palettes.ts` +
>   `variants.ts`. **They bypass almost everything in this directory's color
>   pipeline** (`background/`, `ColorSystem/`).
> - **Legacy (non-template) projects** — everything else. These use this
>   directory: `background/` computes a `BackgroundSystem`, `ColorSystem/`
>   turns it into color tokens, optionally injected as CSS variables by
>   `VariableThemeInjector` (feature-flagged; defaults to legacy inline mode).
>
> A few files here (`designTokens.ts`, `buttonShape.ts`, `cardStyles.ts`) are
> **truly shared** — consumed by UIBlocks regardless of path.

---

## File map

### Shared primitives (used by both paths / by UIBlocks directly)

| File | Purpose |
|------|---------|
| `designTokens.ts` | Theme-keyed (`warm`/`cool`/`neutral`) shadow + card-hover + transition Tailwind class tokens for UIBlock visual polish. Exports `shadows`, `cardEnhancements`. |
| `cardStyles.ts` | Adaptive card styling by **section-background luminance** (via `analyzeBackground` from `@/utils/backgroundAnalysis`) × theme. Exports `getCardStyles`, `getBackgroundLuminance`. Structure (bg/border/shadow/text) is luminance-driven; icons/hover are theme-driven. Classes are **static** (Tailwind-purge-safe). |
| `buttonShape.ts` | Maps a copy `toneId` (e.g. `luxury-expert`) → `ButtonShape` (`rounded`/`soft`/`sharp`/`ghost`). Small static lookup table. |

### `background/` — legacy 30-palette v3 background system

Palette-first, **position-based** section backgrounds (replaced the archived v2
system that used 65 primaryBackgrounds + identity-based mapping + a divider slot;
v2 lives in `archive/background-v2/`, outside this dir).

| File | Purpose |
|------|---------|
| `palettes.ts` | The **30 hand-curated palettes** (`Palette[]`), grouped dark/light × cool/neutral/warm. Each has `mode`, `temperature`, `energy`, `colorFamily`, `fontPairing`, `baseColor`, `primary`/`secondary`/`neutral` background CSS, and `compatibleAccents`. Helpers: `getPaletteById`, `getPalettesByMode`, `getColorFamilies`, `getSiblingPalettes`, `getDefaultPaletteForVibe`. |
| `backgroundIntegration.ts` | Turns a palette + a section list into a `BackgroundSystem` and assigns each section a background **role** (`primary`/`secondary`/`neutral`). **Position-based alternation** (see below). Re-exports the text-color helpers from `@/utils/improvedTextColors`. |
| `textures.ts` | Optional texture overlays (`dot-grid`, `line-grid`, `paper`, `noise`, `none`) with per-mode CSS and surface-compatibility rules. `getCompatibleTextures`, `compileBackground`. |

**Position-based alternation** (`assignSectionBackgrounds`):
- `header`/`footer` (chrome) → `neutral`
- `hero`/`cta`/`closesection` → `primary`
- every other content section → alternates `secondary`/`neutral` by a running
  content index (even → `secondary`, odd → `neutral`).

Section role is derived purely from `sectionId` (`${type}-${uuid}` → type via
`split('-')[0]`) and position — there is no per-section stored config.

### `ColorSystem/` — legacy color-token + CSS-variable migration layer

Feeds the non-template path. Most of this is scaffolding for a CSS-variable
migration that is **feature-flagged off by default** (`shouldUseVariableSystem`
in `LandingPageRenderer` requires `enableVariableMode`/`enableHybridMode` from
`@/utils/featureFlags`; default = legacy inline mode).

| File | Purpose |
|------|---------|
| `colorTokens.ts` | `generateColorTokens(...)` — the core token generator. Combines a `BackgroundSystem` + base/accent colors + business-context text colors into the token set (CTA bg/hover/text, accent, links, on-light/on-dark text). Bridges to the color-science utils in `@/utils/`. |
| `uiBlockTheme.ts` | Just the `UIBlockTheme = 'warm' \| 'cool' \| 'neutral'` type alias. |
| `accentOptions.ts` | Large static table of `{ baseColor, accentColor, tailwind, tags }` accent pairings, keyed by base color + tagged (harmony, contrast, industry, energy). Consumed by `backgroundIntegration.selectAccentFromPalette`. |
| `VariableThemeInjector.tsx` | Client component that injects CSS variables for **variable mode**. NOTE: its `variableColorTokens` import is disabled — `generateVariableColorSystem`/`getCSSVariableDefinitions` are **stubs** returning empty. Effectively inert token generation; kept for the injector shell + perf monitoring. |
| `migrationAdapter.ts` | Converts legacy `bgVariations` → variable-based variations with fallbacks. Part of the (dormant) migration path. |
| `BackgroundPatternAnalyzer.ts` | Parses legacy Tailwind background classes into structural pattern + color stops for the migration adapter. |
| `HybridModeCompatibility.tsx` | React context for switching between legacy/variable modes with progressive-enhancement fallbacks. |
| `VariableModeIndicators.tsx` | Dev-only visual badges showing migration phase / mode. |

> **Legacy-vs-active summary.** `background/` (all 3 files) + the shared
> primitives are **active** for non-template projects and UIBlocks. The
> `ColorSystem/` migration/variable machinery (`VariableThemeInjector`,
> `HybridModeCompatibility`, `migrationAdapter`, `BackgroundPatternAnalyzer`,
> `VariableModeIndicators`) is **dormant** — gated behind feature flags that
> default off, and its token generator is stubbed. `colorTokens.ts` /
> `accentOptions.ts` / `uiBlockTheme.ts` are live in the legacy inline path.

---

## Relationship to per-template tokens

A **template is a skin**. Each `templateId` under `src/modules/templates/<id>/`
ships its own `tokens.ts`, `palettes.ts`, `variants.ts`, and `ThemeInjector.tsx`
and drives its look entirely from **CSS variables on `:root`** (applied via
`[data-palette]` / variant overrides). Template-backed projects therefore do
**not** call `background/backgroundIntegration.ts` or `ColorSystem/colorTokens`.

Use this directory when:
- touching **shared UIBlock polish** (shadows, card structure, button shape)
  that applies across templates → `designTokens.ts` / `cardStyles.ts` /
  `buttonShape.ts`;
- working on **legacy non-template projects** → `background/` + `ColorSystem/`.

Do **not** add a new template's palette here — that goes in the template module.
See the `/new-template` skill.

---

## Related utilities (outside this dir)

The color-science foundation lives in `src/utils/` and is documented in
[`src/utils/README-COLOR-SYSTEM.md`](../../utils/README-COLOR-SYSTEM.md):
`colorUtils.ts` (luminance/contrast/WCAG), `backgroundAnalysis.ts` (gradient
parsing), `colorHarmony.ts` (accent selection), `improvedTextColors.ts`
(background-aware text colors — re-exported by `backgroundIntegration.ts`),
`brandColorSystem.ts` (brand overrides), `featureFlags.ts` (migration gating).

---

## Fonts (`src/styles/` + `public/fonts/`)

Self-hosted fonts, no Google Fonts / dynamic font system (both removed).

- **`public/fonts/<family>/*.woff2`** — latin (and Devanagari, for Hindi/writer
  templates) woff2 subsets. Families include Inter, Inter Tight, JetBrains Mono,
  DM Sans, Lora, EB Garamond, Fraunces, Source Serif 4, plus template-specific
  faces (Spectral, Bodoni Moda, Cormorant Garamond, Space Grotesk, Mukta, Tiro
  Devanagari Hindi, Archivo, Hanken Grotesk, Instrument Serif, …).
- **`src/styles/fonts-self-hosted.css`** — the `@font-face` declarations
  (`font-display: swap`; Fraunces + Source Serif 4 are variable `opsz` fonts).
  Latin subset only → 30–40% smaller. Also copied to `public/assets/` at build
  time for published pages (`scripts/buildAssets.js`).
- **`src/modules/templates/CriticalFontPreload.tsx`** — server component that
  `ReactDOM.preload`s the **LCP-critical hero-headline face** for the rendered
  `(templateId, variantId)`. Additive to the broad Inter/Inter-Tight preloads in
  the `p/[slug]` layout; per-template + per-variant because the display face and
  weight differ (e.g. Meridian → Inter Tight 600/500; Hearth → Fraunces + DM
  Sans; Lex/Vestria/Granth swap by variant). Same-origin, so it's a pure
  early-fetch with no extra DNS/TLS hop.

### Other `src/styles/` files (context)

`input.css` / `landingInput.css` (Tailwind entrypoints), `color-variables.css`,
`custom-backgrounds.css`, `editor-baseline.css`, `structural-classes.css`,
`drag-handle.css`. These are outside the color/token modules above but share the
`src/styles/` home.

---

## Gotchas

- **Two paths, easy to mis-attribute.** If a color/background bug reproduces on a
  template project, look in `src/modules/templates/<id>/`, not here. If it's a
  legacy project, look here.
- **Dual-renderer parity** still applies to any UIBlock consuming these tokens —
  update both `.tsx` and `.published.tsx` (see root `CLAUDE.md`).
- **Tailwind purge.** `cardStyles.ts` / `accentOptions.ts` deliberately use
  static class strings; do not build classes dynamically or they'll be purged.
- Much of `ColorSystem/` is dormant migration scaffolding — don't assume the
  variable/CSS-var system is live unless a feature flag turns it on.
