# techpremium-harbor-palette — scout findings

Read alongside `techpremium-harbor-palette.spec.md`. Where this file contradicts the spec,
**this file wins** (it is evidence-based; the spec's guesses are noted as corrected).

---

## A. Palette resolution + the DB question (LOAD-BEARING)

**Stored `paletteId` always beats the template default.**

- `techpremium/ThemeInjector.tsx:47-61` — `paletteId` is a REQUIRED prop; sets
  `document.documentElement.dataset.palette` + injects
  `serializeBaseTokens() + serializePaletteOverrides() + serializeVariantOverrides()`.
  All palettes are emitted; one is selected by the `data-palette` attribute. No palette fallback.
- `components/TechPremiumSSRTokens.tsx:24-38` — identical, `<div data-palette={paletteId}>`.
- The template NEVER resolves a default. Callers do:
  - Editor: `src/app/edit/[token]/components/layout/EditLayout.tsx:71` —
    `const effectivePalette = paletteId || tmpl?.defaultPaletteId`
    (store `state.paletteId`, hydrated from `Project.paletteId` via `persistenceActions.ts:454`).
  - Renderers: `LandingPageRenderer.tsx:194`, `LandingPagePublishedRenderer.tsx:103-105` —
    `paletteId || tmpl?.defaultPaletteId ?? 'terracotta'`.
  - `tmpl.defaultPaletteId` ← `modules/templates/registry.ts:78` → `m.defaultTechPremiumPalette`.

**Where paletteId is persisted:** `src/modules/wizard/generation/thing.ts:721-742` — the only live
techpremium creation path — calls `saveDraft({ …, paletteId: defaultTechPremiumPalette })`, writing
the literal resolved value. `api/saveDraft/route.ts:273` (create) / `:286` (update). Publish never
writes `Project.paletteId`; it reads it (`api/publish/route.ts:249`) and copies onto
`PublishedPage`/version (`:316/:352/:475`).

**Consequence (FOUNDER DECISION 2026-07-22):** flipping `defaultTechPremiumPalette` reaches only
projects whose column is null — i.e. NEW techpremium projects. Existing rows (incl. Naayom's,
which almost certainly stores `'forest'`) keep forest until someone writes the row.
**Founder ruled: build now, decide delivery later.** This run does NO DB write, NO migration,
NO admin script. How `harbor` reaches Naayom rides with the separate republish decision.
Do not add a row write, a backfill, or a picker to satisfy this.

**Published path:** `api/publish/route.ts:190/249` → `lib/staticExport/renderPublishedExport.ts:98`
→ `htmlGenerator.ts:37/144` → `LandingPagePublishedRenderer.tsx:103-105`. Same resolution rule as
the editor; only difference is a last-ditch `?? 'terracotta'` (unreachable for techpremium).
Live SSR paths share the shape: `app/p/[slug]/page.tsx:99`, `[...subpath]/page.tsx:321`,
`renderPublishedRoot.tsx:146`, `lib/blog/ssr.tsx:99`.

## B. Current token/palette split

`techpremium/palettes.ts`
- `TechPremiumPaletteConfig` (:14-23) has exactly **6** fields: `forest, forestD, forest2, lime, limeD, limeDim`.
- `techPremiumPaletteConfigs` (:26-35) — single `forest` entry. `pilotEnabledPalettes = ['forest']` (:38).
- `paletteBlock()` (:43-45) emits only `--forest, --forest-d, --forest-2, --lime, --lime-d, --lime-dim`.
- `serializePaletteOverrides()` (:48-54) maps `techPremiumPalettes` → `[data-palette="id"]{…}`.

`techpremium/tokens.ts` — `serializeBaseTokens()` (:118-158) emits `:root{}` with palette-INVARIANT
vars: `--paper/-2/-3`, `--ink/-2/-3`, `--line/-2/-dk`, `--ok`, `--ok-bg`, `--warn`, `--warn-bg`, `--wa`,
fonts, `--pad-y/-x`, `--max-w`, `--r/-lg`, **plus `--forest*`/`--lime*` as `:root` fallbacks and
`--teal`/`--teal-dim` (base-ONLY, never overridden)**, then `[data-surface=…]` rules,
`[data-palette] em`, and the `--blog-*` contract (:157).

Palette-switchable today = 6 vars. Neutrals + `--teal*` + `--ok*` are base-only.
Note `:root` fallbacks can stay — the `[data-palette]` block wins on specificity.

## C. Multi-palette shape to imitate

`meridian/palettes.ts:11-70`: import id tuple + type from `@/types/product`; small `XPaletteConfig`
interface; export `Record<XPalette, XPaletteConfig>` keyed by every id; re-export default from types;
private `paletteBlock(selector, cfg)`; `serializePaletteOverrides(base = configs)` mapping the tuple.
(Meridian's second `light` variant map is not needed — techpremium has one variant.)
Every other template sets `pilotEnabledPalettes = [...xPalettes]`; techpremium is the deliberate
outlier with `['forest']` — **keep it hardcoded so harbor stays out of any picker.**

## D. Blast radius outside `templates/techpremium/`

- `src/types/product.ts:52-62` — `techPremiumPalettes = ['forest'] as const`, `defaultTechPremiumPalette`.
  Both change here.
- `src/types/service.ts:368` — `PALETTES_BY_TEMPLATE.techpremium = techPremiumPalettes`;
  `palettesForTemplate()` (:375) feeds `ServiceThemePopover.tsx:88` / `VestriaThemePopover.tsx:116`
  palette grids. Adding `harbor` could surface it in a popover **if** either renders for techpremium —
  verify at implement time. `templateCatalog.ts` has no techpremium entry, so onboarding pickers are safe.
- `modules/templates/registry.ts:78` — `defaultPaletteId: m.defaultTechPremiumPalette` (auto-follows).
- `techpremium/imageKeywords.ts:8` — `Record<TechPremiumPalette, string>`; adding `harbor` is a
  **compile error until an entry is added** (good — closed-fail).
- **`conformance.test.ts:409-414`** asserts only `templateMeta.techpremium.retired === true`,
  `copyEngines === []`, `capabilities === []` (same in `templateMeta.test.ts:32-45`).
  "Retired" = excluded from fit/swap/engine checks; says nothing about palettes.
  **Adding a palette / flipping the default does NOT trip it.** `templateConformance.ts:762`
  checks `look.paletteId` but techpremium declares no looks.
- No test asserts `techPremiumPalettes.length === 1`. `types/__tests__/service.test.ts:55-62` only
  asserts non-empty + no duplicate ids — 2 entries pass.
- Other techpremium test mentions (`fit.test.ts`, `swap.test.ts`, `pageArchetypes.test.ts`,
  `i18nHonesty.test.ts`) are retired-exclusion assertions, palette-agnostic.

## E. Regression-test surface

- `paletteSelection.regression.test.ts` — hearth/lex only, no techpremium.
- `blogRegistration.test.ts:50,71-76` — only test calling techpremium `serializeBaseTokens()`;
  asserts the five `--blog-*` vars exist. No token snapshot anywhere.
- `techpremium/registration.test.ts` — resolver/surface only.
- Golden tests are LLM-copy, not CSS.

**Home for the "forest byte-identical" guard:** new `techpremium/palettes.test.ts` freezing the exact
`[data-palette="forest"]{…}` string from `serializePaletteOverrides()` PLUS the `:root` block from
`serializeBaseTokens()`. Values are being relocated between the two functions, so only the
**combined computed** value must stay stable — snapshot both together.

---

## F. Literal census — spec CONFIRMED (75 occurrences / 30 distinct, 20 files)

| hue | n | distinct |
|---|---|---|
| 158 | 17 | 5 |
| 159 | 7 | 4 |
| **158+159** | **24** | 9 |
| 140 | 27 | 12 |
| 128 | 7 | 2 |
| 150 | 11 | 4 |
| 192 | 2 | 1 |
| 95 | 4 | 2 |

No `oklch(` literals elsewhere in `templates/techpremium/` outside `tokens.ts`/`palettes.ts`/`blocks/`.
(ripgrep `count` under-reports — it counts matching LINES; `Hero.tsx:316` and `Readout.tsx:67` each
carry two literals. Line-count 71, match-count 75.)

### Per-file (paths under `src/modules/templates/techpremium/blocks/`)

**Shared style modules — single-source, consumed by BOTH renderers (highest leverage):**

| file | n |
|---|---|
| `shared/sharedStyles.ts` | 13 |
| `Footer/footerStyles.ts` | 9 |
| `ProductDetail/styles.ts` | 7 |
| `GalleryPreview/styles.ts` | 3 |
| `Header/navStyles.ts` | 2 |
| `Catalog/styles.ts`, `Contact/styles.ts`, `Gallery/styles.ts`, `Problem/styles.ts`, `Explainer/styles.ts` | 1 each |

**Dual-renderer pairs with inline literals — all SYMMETRIC (verified value-for-value):**

| pair | `.tsx` | `.published.tsx` |
|---|---|---|
| `Hero/TechPremiumHero` | 5 | 5 |
| `CTA/TechPremiumCTA` | 4 | 4 |
| `Pricing/TechPremiumPricing` | 1 | 1 |
| `Testimonials/TechPremiumResults` | 1 | 1 |

**Asymmetric / special:**

- `Footer/TechPremiumFooter.tsx` = 10, `.published.tsx` = 0. **The spec's framing is misleading.**
  The 10 literals live in `EDIT_EXTRA` (`TechPremiumFooter.tsx:236-263`) — *editor-only affordances*
  (remove buttons, add-link chips, newsletter setup). Both renderers import `FOOTER_STYLES` from
  `footerStyles.ts` (`.tsx:21`, `.published.tsx:13`). **Not a parity risk.** Edit `footerStyles.ts`
  once for shared visuals; recolour the 10 EDIT_EXTRA literals so editor chrome doesn't look broken.
- `Readout/TechPremiumReadout.tsx` = 4, **no `.published.tsx`** — server-safe shared component
  imported by BOTH `Compatibility/TechPremiumCompatibility.tsx:11` and `.published.tsx:7`.
  Single-source, no pair needed.
- **No other asymmetric pairs.** Zero-literal blocks: Trust, Process, Lineup, Faq, Features,
  Compatibility, Header components, Footer newsletter.

## G. Derivation analysis

Base today: `--forest oklch(0.325 0.045 158)`, `--forest-d oklch(0.255 0.038 159)`,
`--paper oklch(0.978 0.005 95)`, `--lime oklch(0.855 0.185 128)`.

`color-mix(in oklch, …)` is the REQUIRED form. `oklch(from …)` relative-colour syntax is **BANNED**
(published pages need broad browser support).

### Hues 158/159 (24) — genuinely forest-derived

| value | n | verdict | replacement |
|---|---|---|---|
| `0.325 0.045 158 / 0.055` | 3 | EXACT `--forest` + α | `color-mix(in oklch, var(--forest) 5.5%, transparent)` |
| `0.255 0.038 159 / 0.4` | 2 | EXACT `--forest-d` + α | `color-mix(in oklch, var(--forest-d) 40%, transparent)` |
| `0.30 0.04 158 / 0.5` | 9 | near-exact mid forest/forest-d; all box-shadow tints | `color-mix(in oklch, var(--forest) 50%, transparent)` — the 0.325→0.30 collapse is invisible in a 40-48px blur |
| `0.30 0.04 158 / 0.25` | 3 | same, α .25 | same form @ 25% |
| `0.30 0.04 158 / 0.55` | 1 | same (navStyles scrim) | same form @ 55% |
| `0.285 0.040 159` | 1 | ≈exact midpoint | `color-mix(in oklch, var(--forest) 50%, var(--forest-d))` |
| `0.34 0.045 158` | 1 | slightly lighter than `--forest`; footer panel fill | `var(--forest)` |
| `0.20 0.03 159 / 0.92` | 2 | darkened `--forest-d` (lightbox scrim) | nested mix off `--forest-d` |
| `0.20 0.03 159 / 0.6` | 2 | same, α .6 | same |

### Hue 140 (27) — CORRECTION TO SPEC: **not** forest-derived

All are L 0.78–0.86, C 0.022–0.03 — pale ink sitting **on** the dark bands. There is no `--on-dark`
token today (`--paper` is hue 95, wrong family). **Add `--on-dark` / `--on-dark-2` to the palette
record** and express these as that token at varying alpha. The 12 distinct values are copy-paste
drift, not design intent — the L differences (0.82 vs 0.86) are below JND at these alphas.
**Collapse the cluster to 2 tokens + alphas.**

Distinct values:
- `0.84 0.022 140` @ α {0.5, 0.55, 0.6, 0.7, 0.78, 0.82} — 16 occurrences (Footer EDIT_EXTRA 10 + footerStyles 6)
- `0.86 0.025 140 / 0.82` ×2 (CTA lede), `0.85 0.025 140 / 0.82` ×1 (shared `.tp-lede`),
  `0.85 0.025 140 / 0.8` ×2 (lightbox caption, ProductDetail), `0.84 0.025 140 / 0.78` ×1 (Problem)
- `0.82 0.03 140 / 0.78` ×2 (CTA phone line)
- `0.78 0.03 140` ×3, opaque (`.tp-ph.on-dark .tp-tag`, GalleryPreview ×2)

### Hue 128 (7) — CORRECTION TO SPEC: these ARE derivable, **tokenise, do not hard-code**

`--lime` = `oklch(0.855 0.185 128)` **exactly**.

| value | n | files | role |
|---|---|---|---|
| `oklch(0.815 0.185 128)` | 6 | `CTA/TechPremiumCTA.tsx:113`, `CTA/…published.tsx:57`, `Hero/TechPremiumHero.tsx:336`, `Hero/…published.tsx:151`, `Explainer/styles.ts:16`, `shared/sharedStyles.ts:43` | hover fill of primary lime button (`.tp-btn--lime:hover`, `.tp-btn2.lime:hover`, `.tp-explain-up:hover`) — `--lime` darkened 0.04L → `color-mix(in oklch, var(--lime) 88%, var(--forest-d))` |
| `oklch(0.855 0.185 128 / 0.07)` | 1 | `shared/sharedStyles.ts:11` | diagonal stripe in `.tp-ph.on-dark` — literally `--lime` @ 7% → `color-mix(in oklch, var(--lime) 7%, transparent)` |

The spec said hard-code these to the new green. **Overruled (founder-logged):** that rebuilds the
half-switch failure the spec exists to kill. Tokenise all 7.

### Leave alone (per spec scope-out)

hue 150 (11, ok-status/WhatsApp green), hue 192 (2, teal), hue 95 (4, paper @ alpha).

## H. `.tp-ph.on-dark` — confirmed single source

Defined **only** at `blocks/shared/sharedStyles.ts:11-12` inside `PH_STYLES`. No second definition in
`src/`. `PH_STYLES` is re-exported into `STYLES` by `Explainer/styles.ts:30`, `Contact/styles.ts:49`,
`GalleryPreview/styles.ts:25`, `Gallery/styles.ts:48`. Class applied in BOTH renderers:
`GalleryPreview/TechPremiumGalleryPreview.tsx:58` + `.published.tsx:36`,
`Gallery/TechPremiumGallery.tsx:185` + `.published.tsx:47`. One edit site, parity-safe.

**Caveat:** Hero re-declares a *different*, non-`on-dark` `.tp-ph` inline at
`Hero/TechPremiumHero.tsx` / `.published.tsx:128` — same stripe literal, separate edit site.

## I. Suggested batching (risk-ordered)

- **B1 — shared foundation (first; highest blast radius, single-source):** `shared/sharedStyles.ts` (13).
  Establishes the derivation vocabulary; fixes `.tp-ph.on-dark`, `.tp-lede`, pills, buttons, lightbox
  for 5+ consuming blocks at once. Verify visually before proceeding.
- **B2 — Footer family (highest count):** `Footer/footerStyles.ts` (9) + `Footer/TechPremiumFooter.tsx`
  EDIT_EXTRA (10). Keep conceptually separate: footerStyles = both renderers, EDIT_EXTRA = editor only.
- **B3 — dual-renderer inline pairs (parity-critical, edit in lockstep, diff each pair after):**
  Hero (5+5), CTA (4+4), Pricing (1+1), Testimonials/Results (1+1).
- **B4 — ProductDetail + Readout:** `ProductDetail/styles.ts` (7) + `Readout/TechPremiumReadout.tsx` (4).
  Both single-source. ProductDetail **duplicates 3 sharedStyles values** (lightbox scrim/caption) —
  consider deduping into `sharedStyles.ts` rather than re-tokenising.
- **B5 — one-liner style modules (mechanical):** `Header/navStyles.ts` (2), `GalleryPreview/styles.ts` (3),
  `Catalog`, `Contact`, `Gallery`, `Problem`, `Explainer` (1 each).

**Highest-risk files:** `shared/sharedStyles.ts` (one bad mix breaks 6 blocks), the four B3 pairs
(divergence = editor↔published bug), `ProductDetail/styles.ts` (silent duplicate of shared values —
easy to change one and not the other).
