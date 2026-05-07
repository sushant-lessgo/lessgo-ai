# design.md — Current State Inventory

Factual end-to-end documentation of the design system as it exists today. No judgment.

---

## 1. Overview

Design system is built around five named **vibes**. Each vibe maps to fonts, accent energy, tone profile, and a default background palette. Most structural decisions (spacing, radius, elevation, text tones beyond primary/secondary/muted) live inside UIBlock JSX as hardcoded Tailwind classes.

**File map:**

| Concern | File |
|---|---|
| Vibe → fonts/tone | `src/modules/Design/vibeDesignTokens.ts` |
| Typography scale | `src/modules/Design/fontSystem/landingTypography.ts` |
| Font themes | `src/modules/Design/fontSystem/fontThemes.ts`, `pickFont.ts` |
| Color tokens | `src/modules/Design/ColorSystem/colorTokens.ts` |
| Accent options | `src/modules/Design/ColorSystem/accentOptions.ts` |
| UIBlock theme enum | `src/modules/Design/ColorSystem/uiBlockTheme.ts` |
| Button shapes | `src/modules/Design/buttonShape.ts` |
| Card styling | `src/modules/Design/cardStyles.ts` |
| Background palettes | `src/modules/Design/background/palettes.ts` |
| Textures | `src/modules/Design/background/textures.ts` |
| Section padding | `src/components/layout/LayoutSection.tsx` |
| Strategy prompt | `src/modules/strategy/promptsV3.ts` |
| Copy prompt | `src/modules/copy/copyPromptV3.ts` |
| Element schemas | `src/modules/sections/layoutElementSchema.ts` |
| Editor renderer | `src/components/landing/LandingPageRenderer.tsx` |
| Published renderer | `src/components/landing/LandingPagePublishedRenderer.tsx` |

---

## 2. Vibe system

Five vibes. Each emits 4 fields.

| Vibe | accentEnergy | headingFont | bodyFont | toneProfile |
|---|---|---|---|---|
| Dark Tech | high | `'Sora', sans-serif` | `'Inter', sans-serif` | minimal-technical |
| Light Trust | medium | `'Inter', sans-serif` | `'Inter', sans-serif` | friendly-helpful |
| Warm Friendly | medium | `'DM Sans', sans-serif` | `'DM Sans', sans-serif` | confident-playful |
| Bold Energy | high | `'Sora', sans-serif` | `'DM Sans', sans-serif` | bold-persuasive |
| Calm Minimal | low | `'Playfair Display', serif` | `'Inter', sans-serif` | luxury-expert |

Exported: `getFontsForVibe`, `getToneProfileForVibe`, `getAccentEnergyForVibe`, `getDesignTokensForVibe`.

Vibe → default palette:
- Dark Tech → `midnight-slate`
- Light Trust → `ice-blue`
- Warm Friendly → `coral`
- Bold Energy → `soft-lavender`
- Calm Minimal → `cloud-white`

---

## 3. Typography scale

14 variants. All use `clamp()` for responsive sizing.

| Variant | fontSize | fontWeight | lineHeight | letterSpacing |
|---|---|---|---|---|
| display | `clamp(3rem, 8vw, 5rem)` | 700 | 1.1 | -0.01em |
| hero | `clamp(2.5rem, 6vw, 4rem)` | 700 | 1.1 | -0.01em |
| h1 | `clamp(2rem, 5vw, 3rem)` | 700 | 1.3 | -0.005em |
| h2 | `clamp(1.5rem, 3.5vw, 2rem)` | 600 | 1.3 | 0 |
| h3 | `clamp(1.25rem, 2.5vw, 1.5rem)` | 600 | 1.4 | 0 |
| h4 | `clamp(1.125rem, 2vw, 1.25rem)` | 600 | 1.4 | 0 |
| h5 | `clamp(1rem, 1.5vw, 1.125rem)` | 500 | 1.5 | 0 |
| h6 | `clamp(0.875rem, 1vw, 1rem)` | 500 | 1.5 | 0 |
| button | `clamp(0.875rem, 1vw, 1rem)` | 600 | 1.5 | 0.01em |
| label | `clamp(0.75rem, 0.8vw, 0.875rem)` | 500 | 1.4 | 0.01em |
| body-lg | `clamp(1.25rem, 2.5vw, 1.5rem)` | 400 | 1.6 | 0 |
| body | `clamp(1rem, 1.5vw, 1.125rem)` | 400 | 1.625 | 0 |
| body-sm | `clamp(0.875rem, 1vw, 1rem)` | 400 | 1.5 | 0 |
| caption | `clamp(0.75rem, 0.8vw, 0.875rem)` | 400 | 1.4 | 0.01em |

Display max = 5rem = 80px. Hero max = 4rem = 64px.

---

## 4. Font system

**Optimized pairings (self-hosted):**
- Sora / Inter (default)
- Inter / Inter
- DM Sans / DM Sans
- Sora / DM Sans
- Playfair Display / Inter
- DM Sans / Inter
- Playfair Display / DM Sans

**Google Fonts on-demand:**
- Bricolage Grotesque / Inter
- Space Grotesk / DM Sans
- DM Serif Display / Inter
- Raleway / Open Sans
- Manrope / Inter
- Rubik / Inter

**Fallback:** `pickFontFromOnboarding()` returns `Sora / Inter` regardless of input. Prior tone-based logic archived.

**Loading:** Editor renderer injects Google Fonts via dynamic `<link>` tags (16 families, weights 400–700). Published renderer assumes fonts loaded by page shell.

---

## 5. Color token system

`generateColorTokens()` inputs: `baseColor`, `accentColor`, `accentCSS`, `sectionBackgrounds{primary,secondary,neutral}`, `storedTextColors`.

**Token groups emitted:**

| Group | Tokens |
|---|---|
| CTA / interactive | `accent`, `accentHover`, `accentBorder`, `ctaBg`, `ctaHover`, `ctaText` |
| Links | `link` = `text-${accentColor}-600`, `linkHover` = `text-${accentColor}-700` |
| Section bgs | `bgPrimary`, `bgSecondary`, `bgNeutral` |
| Text (computed) | `textOnLight`, `textOnDark`, `textOnAccent`, `textPrimary`, `textSecondary`, `textMuted`, `textOnPrimary`, `textOnSecondary`, `textOnNeutral` |
| Text (static) | `textInverse` = `"text-white"` |
| Surfaces | `surfaceCard` = `"bg-white"`, `surfaceElevated` = `bg-${baseColor}-50`, `surfaceSection` = `bg-${baseColor}-100`, `surfaceOverlay` = `"bg-black/20"` |
| Borders | `borderDefault` = `border-${baseColor}-200`, `borderSubtle` = `border-${baseColor}-100`, `borderFocus` = `border-${accentColor}-500` |
| Semantic (static) | `success` = `bg-green-500` / `successText` = `text-green-700`; same pattern for `warning` (yellow), `error` (red), `info` (blue) |
| Secondary CTA | `ctaSecondary` = `bg-${baseColor}-100`, `ctaSecondaryHover` = `bg-${baseColor}-200`, `ctaSecondaryText` = `text-${baseColor}-700`, `ctaGhost` = `text-${accentColor}-600`, `ctaGhostHover` = `bg-${accentColor}-50` |
| Per-bg text | `textColors.primary/secondary/neutral = { heading, body, muted }` as hex values |

**Text color computation:** `getSmartTextColor()` computes hex against target bg, then passes through a 12-entry hex→Tailwind map. Non-matching hex falls back to `text-gray-900`.

**Hex→Tailwind map (only gray-scale):**
```
#ffffff → text-white
#f9fafb → text-gray-50
#f3f4f6 → text-gray-100
#e5e7eb → text-gray-200
#d1d5db → text-gray-300
#9ca3af → text-gray-400
#6b7280 → text-gray-500
#4b5563 → text-gray-600
#374151 → text-gray-700
#1f2937 → text-gray-800
#111827 → text-gray-900
#000000 → text-black
```

Any non-gray hex returned by `getSmartTextColor()` resolves to `text-gray-900`.

---

## 6. Accent options

`accentOptions.ts`: 63 entries across 15 base color families: amber, blue, cyan, emerald, gray, green, indigo, orange, purple, sky, slate, teal, zinc, rose, pink, red.

Each entry: `baseColor`, `accentColor`, `tailwind` (solid `bg-X-500` or gradient `bg-gradient-to-r from-X-500 to-Y-500`), `tags`.

Tag dimensions: relationship (analogous / complementary / triadic), contrast level, temperature, use-case, emotion, style (solid / gradient).

Roughly 70% of accents are solid single-color, 30% are two-stop left-to-right gradients.

---

## 7. UIBlock theme enum

`uiBlockTheme.ts`: `type UIBlockTheme = 'warm' | 'cool' | 'neutral'`. Derived from accent hue; passed to card styling and pricing/urgency badges.

---

## 8. Button shapes

`buttonShape.ts` — 4 shape names, no CSS value mappings stored here.

| Tone profile | Shape |
|---|---|
| confident-playful | rounded |
| minimal-technical | sharp |
| bold-persuasive | soft |
| friendly-helpful | rounded |
| luxury-expert | soft |

No file translates `'rounded'` → `border-radius: 9999px`. Names are stored/referenced as labels only.

---

## 9. Card styles

`getCardStyles(sectionBackgroundCSS, theme, highlighted?)` — uses `analyzeBackground()` to compute luminance (0–1), then selects from 5 buckets.

| Luminance | bg (normal) | bg (highlighted) | blur | border | shadow | textHeading | textBody | textMuted |
|---|---|---|---|---|---|---|---|---|
| 0–0.25 | `bg-white/15` | `bg-white/20` | `backdrop-blur-lg` | `border-white/10` | `shadow-xl` | `text-white` | `text-gray-200` | `text-gray-300` |
| 0.25–0.45 | `bg-white/10` | `bg-white/15` | `backdrop-blur-md` | `border-white/10` | `shadow-lg` | `text-white` | `text-gray-200` | `text-gray-300` |
| 0.45–0.55 | `bg-gray-50/80` | `bg-white` | none | `border-gray-200` | `shadow-md` | `text-gray-900` | `text-gray-700` | `text-gray-500` |
| 0.55–0.75 | `bg-white/95` | `bg-white` | none | `border-gray-100` | `shadow-sm` / `md` | `text-gray-900` | `text-gray-700` | `text-gray-500` |
| 0.75–1.0 | `bg-white` | `bg-white` | none | `border-gray-200` | `shadow-md` | `text-gray-900` | `text-gray-700` | `text-gray-500` |

**Icon container** (theme × darkness):
- warm dark: `bg-white/40` + `text-white`; warm light: `bg-orange-100` + `text-orange-600`
- cool dark: `bg-white/40` + `text-white`; cool light: `bg-blue-100` + `text-blue-600`
- neutral dark: `bg-white/40` + `text-white`; neutral light: `bg-gray-100` + `text-gray-600`

**Hover shadow** (theme × darkness):
- warm dark: `hover:shadow-orange-400/20 hover:shadow-2xl`
- warm light: `hover:shadow-orange-500/10 hover:shadow-lg`
- cool dark: `hover:shadow-blue-400/20 hover:shadow-2xl`
- cool light: `hover:shadow-blue-500/10 hover:shadow-lg`
- neutral dark: `hover:shadow-white/20 hover:shadow-2xl`
- neutral light: `hover:shadow-gray-500/10 hover:shadow-lg`

**Highlighted card bg override:**
- warm dark: `bg-orange-500/20 backdrop-blur`; warm light: `bg-orange-50`
- cool dark: `bg-blue-500/20 backdrop-blur`; cool light: `bg-blue-50`
- neutral dark: `bg-white/20 backdrop-blur`; neutral light: `bg-gray-50`

**Polish tokens** (`designTokens.ts`):
- `cardEnhancements.hoverLift` = `'hover:-translate-y-1'`
- `cardEnhancements.transition` = `'transition-all duration-300'`
- `cardEnhancements.borderRadius` = `'rounded-2xl'`
- Themed shadows: warm = `shadow-[0_4px_20px_rgba(249,115,22,0.15)]`; cool = `shadow-[0_4px_20px_rgba(37,99,235,0.15)]`; neutral = `shadow-[0_4px_20px_rgba(100,116,139,0.15)]`

---

## 10. Background palettes

30 total. Fields per palette: `id`, `label`, `mode`, `temperature`, `energy`, `colorFamily`, `fontPairing`, `baseColor`, `primary` (CSS), `secondary` (CSS), `neutral` (CSS), `compatibleAccents`.

**Breakdown:**

| Mode | Temperature | Count | Sample IDs |
|---|---|---|---|
| dark | cool | 5 | midnight-slate, deep-indigo, ocean-abyss, arctic-night, steel-midnight |
| dark | neutral | 3 | graphite, obsidian, charcoal |
| dark | warm | 3 | espresso, dark-terracotta, dark-forest |
| light | cool | 7 | ice-blue, trust-blue, soft-lavender, sky-bright, ocean, teal-fresh, emerald-clean |
| light | neutral | 5 | cloud-white, pearl-gray, steel, soft-stone, zinc-modern |
| light | warm | 7 | warm-sand, coral, sunset, blush, rose-soft, mint-warm, golden-hour |

**Sample concrete values:**
- `midnight-slate` (dark/cool): primary = `linear-gradient(135deg, #0f172a, #1e3a5f)`, secondary = `#1a2332`, neutral = `#0f172a`
- `ice-blue` (light/cool): primary = `linear-gradient(135deg, #3b82f6, #2563eb)`, secondary = `rgba(219,234,254,0.85)`, neutral = `#f8fafc`
- `coral` (light/warm): primary = `linear-gradient(135deg, #f97316, #ea580c)`, secondary = `rgba(255,247,237,0.8)`, neutral = `#fffbf5`
- `soft-lavender` (light/cool): primary = `linear-gradient(135deg, #7c3aed, #6d28d9)`, secondary = `rgba(245,243,255,0.8)`, neutral = `#fafafe`

**Font pairing labels** used in palettes: `sora-inter`, `inter-inter`, `dm-sans-dm-sans`, `playfair-inter`, `sora-dm-sans`. Label strings only — not programmatically linked to `fontThemes.ts`.

---

## 11. Textures

5 overlays: `dot-grid`, `line-grid`, `paper`, `noise`, `none`.

**Compatibility matrix:**

| Texture | dark primary | dark secondary | light primary | light secondary | neutral |
|---|---|---|---|---|---|
| none | y | y | y | y | y |
| dot-grid | y | y | y | n | n |
| line-grid | y | n | n | n | n |
| paper | n | n | y | n | n |
| noise | y | n | y | n | n |

**CSS values:**
- `dot-grid/dark`: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px) 0 0/20px 20px`
- `dot-grid/light`: `radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px) 0 0/20px 20px`
- `line-grid/dark`: two `repeating-linear-gradient` layers, 30px spacing, `rgba(255,255,255,0.06)`. Light: empty string.
- `noise/dark` and `noise/light`: 3-layer radial gradient composites at 8px and 12px grid. Dark opacities 0.06/0.04/0.03; light 0.05/0.04/0.03.

`compileBackground()` prepends texture CSS to palette CSS with comma separator.

---

## 12. Spacing in UIBlocks

**Top 10 Tailwind spacing classes by occurrence** (excluding editor-chrome `px-1` / `py-1`):

| Class | Count | Pixel |
|---|---|---|
| `space-x-2` | 80 | 8 |
| `p-6` | 60 | 24 |
| `p-4` | 60 | 16 |
| `px-4` | 56 | 16 |
| `p-8` | 50 | 32 |
| `gap-4` | 38 | 16 |
| `py-3` | 36 | 12 |
| `py-4` | 35 | 16 |
| `py-2` | 35 | 8 |
| `px-6` | 35 | 24 |

---

## 13. Section padding (`LayoutSection.tsx`)

Applied via `getSpacingClass()` on `<section>`, horizontal `px-4` always unless `noPadding`.

| Spacing name | Tailwind | Effective px (mobile / md / lg) |
|---|---|---|
| CTA sections (hardcoded) | `py-20 md:py-24 lg:py-32` | 80 / 96 / 128 |
| `compact` | `py-4 md:py-4 lg:py-4` | 16 / 16 / 16 |
| `spacious` | `py-12 md:py-16 lg:py-20` | 48 / 64 / 80 |
| `extra` | `py-20 md:py-24 lg:py-32` | 80 / 96 / 128 |
| `normal` (default) | `py-16 md:py-20 lg:py-24` | 64 / 80 / 96 |

CTA section types triggering the 80/96/128 pattern: `cta`, `CenteredHeadlineCTA`, `ValueStackCTA`, `VisualCTAWithMockup`.

---

## 14. Hardcoded UIBlock values

### 14.1 Hero / LeftCopyRightImage

- Grid: `lg:grid-cols-2 gap-12 lg:gap-16`
- Height: `h-[clamp(600px,85vh,900px)]`
- Container: `max-w-7xl`
- Image: `rounded-2xl shadow-2xl`
- Decorative gradient blob behind image: inline style `linear-gradient(135deg, ${accent}40 0%, transparent 50%, ${accent}20 100%)`, `rounded-3xl blur-2xl opacity-30`
- Primary CTA: `shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200`
- Trust icon: `text-green-500`
- Stars: filled `text-yellow-400`, empty `text-gray-300`, `w-4 h-4`
- Avatar fallback: `w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white`
- Supporting text: `text-sm opacity-75`
- Mockup placeholder: `from-blue-50 via-indigo-50 to-purple-100`, stat cards `bg-blue-50 / bg-emerald-50 / bg-violet-50`, browser chrome `bg-gray-50`

### 14.2 Features / IconGrid

- Card radius: `rounded-xl` (12px)
- Card padding: `p-6` (24px)
- Icon container: `w-12 h-12 rounded-lg`, hover `scale-110 transition-all duration-300`
- Icon size: `text-2xl`
- Feature count max: 9
- Header: `text-center mb-12`
- Badge text: `text-sm font-semibold uppercase tracking-wider opacity-80`, color inline from `colorTokens.accent`
- Supporting text: `mt-10 text-center max-w-2xl mx-auto opacity-90`
- Add-feature button per theme:
  - warm: `bg-orange-50 hover:bg-orange-100 border-orange-200`
  - cool: `bg-blue-50 hover:bg-blue-100 border-blue-200`
  - neutral: `bg-gray-50 hover:bg-gray-100 border-gray-200`
  - Shared: `rounded-xl border-2 px-4 py-3`

### 14.3 Pricing / TierCards

- Card: `rounded-2xl` (16px), `p-8`, `border-2`, `transition-all duration-300`
- Highlighted tier: `transform scale-105 z-10`
- Highlight badge: `px-4 py-2 rounded-full text-sm font-semibold shadow-lg`, `absolute -top-4 left-1/2 -translate-x-1/2`
- Badge colors by theme:
  - warm: `bg-orange-600 text-white`
  - cool: `bg-blue-600 text-white`
  - neutral: `bg-gray-700 text-white`
- Checkmark (`w-5 h-5 mr-3 mt-0.5 flex-shrink-0`):
  - warm: `text-orange-500`
  - cool: `text-blue-500`
  - neutral: `text-green-500`
- Feature list: `space-y-3`, max 8 per tier
- Tier count: min 2, max 4
- Price size: `text-4xl font-bold`
- Headline inline: `fontSize: '2.25rem'` (36px)
- Small badge text inline: `fontSize: '0.6875rem'` (11px), `textTransform: 'uppercase'`, `letterSpacing: '0.22em'`, color from `theme.colors.accentColor`, bg = `${accentColor}15`
- CTA button: `w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200`
- Grid gap: `gap-8`
- Column widths: 1 tier → `max-w-md`; 2 → `md:grid-cols-2 max-w-4xl`; 3 → `md:grid-cols-3 max-w-6xl`; 4 → `md:grid-cols-2 lg:grid-cols-4 max-w-7xl`
- Header margin: `mb-20`

### 14.4 CTA / CenteredHeadlineCTA

- Container: `max-w-4xl mx-auto text-center`
- Primary + secondary CTA buttons: `text-xl px-12 py-6 shadow-2xl hover:shadow-3xl`
- Urgency badge: `animate-pulse`, wrapped `mb-8`
- Urgency badge colors by theme:
  - warm: `bg-orange-100 text-orange-800 border-orange-300`
  - cool: `bg-blue-100 text-blue-800 border-blue-300`
  - neutral: `bg-gray-100 text-gray-800 border-gray-300`
- Trust icon: `text-green-500`
- Stars: `w-4 h-4 text-yellow-400 fill-current` (5 filled, static)
- Stat number: `text-3xl font-bold`
- Stat label: `text-sm ${colorTokens.textMuted} mt-1`
- Section padding: overridden by LayoutSection CTA rule → 80 / 96 / 128px

---

## 15. Strategy prompt (`promptsV3.ts`)

`buildSimplifiedStrategyPrompt()` emits no CSS, font, or color values.

**Design-relevant outputs:**
- Single `vibe` string (one of the 5 vibes)
- `sectionDecisions` — boolean flags for section inclusion
- `uiblockDecisions` — UIBlock component names (e.g., `"IconGrid"`, `"TierCards"`), no styling data

---

## 16. Copy prompt (`copyPromptV3.ts`)

`buildCopyPromptV3()` emits no design tokens. Uses `vibe` to derive a `toneProfile` via `getToneProfileForVibe`, then maps to a prose-style description:
- `minimal-technical` → "precise, direct, no fluff"
- `friendly-helpful` → "warm but professional"
- (etc.)

**Content roles emitted:**

| Role | Purpose |
|---|---|
| `headline` | Section heading |
| `subheadline` | Supporting headline |
| `supporting_text` | Body paragraph |
| `badge_text` | Eyebrow / label |
| `cta_text` | Primary button |
| `secondary_cta_text` | Secondary button |
| `urgency_text` | Urgency badge |
| `trust_items[]` | Trust indicators |
| `billing_note`, `guarantee_text` | Pricing footnotes |
| `features[]`, `faq_items[]`, `steps[]`, `tiers[]`, `testimonial_cards[]`, `pain_items[]`, `before_points[]`, `after_points[]` | Per-layout collections |

No roles named `eyebrow`, `lede`, `quote`, or `meta`. Closest analogues: `badge_text` ≈ eyebrow, `subheadline` ≈ lede.

---

## 17. Element schema (`layoutElementSchema.ts`)

Two schema versions (V1, V2). V2 `UIBlockSchemaV2` structure:

```ts
{
  sectionType: string,
  elements: Record<string, ElementDef>,           // flat fields
  collections?: Record<string, CollectionDef>     // array fields w/ { min, max } constraints
}
```

**GenerationType values:** `ai_generated`, `manual_preferred`, `ai_generated_needs_review`, `system`, `hybrid`.

**Sample collection constraints:**
- `AccordionFAQ.faq_items`: min 3, max 10
- `TwoColumnFAQ.faq_items`: min 4, max 10
- `InlineQnAList.faq_items`: min 2, max 8
- `SideBySideBlocks.before_points` / `after_points`: min 0, max 5

---

## 18. Renderer split

**File count:** 48 editor `.tsx` + 48 published `.published.tsx` UIBlock files. Total 20 section subdirectories + 2 index files.

**Structural diff (LeftCopyRightImage example):**

| Aspect | Editor `.tsx` | Published `.published.tsx` |
|---|---|---|
| Hooks | `useLayoutComponent`, `useEditStore`, `useTypography`, `useImageToolbar` | None |
| State | Zustand store (sections, content, theme) | Props only, flat |
| Interactivity | `contentEditable`, click handlers, toolbars, edit overlays | Static HTML |
| Background | CSS from store via `useLayoutComponent` | CSS from `sectionBackgroundCSS` prop, pre-computed |
| Text colors | `dynamicTextColors` hook + `colorTokens` | `getPublishedTextColors(backgroundType, theme, sectionBackgroundCSS)` — pure function |
| Typography | `useTypography()` hook returning CSSProperties | `getPublishedTypographyStyles(variant, theme)` — pure function, same scale constants |
| Accent | `colorTokens.accent` (Tailwind class string) | `theme?.colors?.accentColor` (hex) |
| Badge | `<AccentBadge>` component w/ `colorTokens` | Inline `<span style={{color: accentColor, backgroundColor: \`${accentColor}15\`}}>` |

Published renderer is server-safe: no `useEffect`, `useState`, browser APIs. All derived styling computed from props.

### 18.1 Editor renderer (`LandingPageRenderer.tsx`)

- `generateCompleteBackgroundSystem()` — onboarding data → palette lookup → BackgroundSystem
- `getColorTokens()` — from Zustand store, wraps `generateColorTokens()`
- `assignEnhancedBackgroundsToAllSections()` — section type → background type:
  - `hero`, `cta`, `closesection` → `primary`
  - `header`, `footer` → `neutral`
  - all others → alternating `secondary` / `neutral` by content index (even → secondary, odd → neutral)
- Manual override: `content[sectionId].backgroundType` wins over auto-calculated
- Background CSS applied as inline `style={{ background: value }}` on wrapper div (not Tailwind class)
- Google Fonts injected via dynamic `<link>` (16 families, weights 400–700)
- `VariableThemeInjector` imported; active when `shouldUseVariableSystem` feature flag is true

### 18.2 Published renderer (`LandingPagePublishedRenderer.tsx`)

- No background assignment logic — backgrounds pre-stored in `content[sectionId].backgroundType`
- Background CSS resolved from `theme.colors.sectionBackgrounds.primary/secondary/neutral`
- Custom solid: `customBg.custom.solid`
- Custom gradient: reconstructed as `linear-gradient(${angle}deg, ${stops})` from stored stop data
- `sectionBackgroundCSS` passed as prop string to each UIBlock
- Mode passed: `"published"` (vs `"edit"` and `"preview"`)
- No font loading; assumes page shell provides

---

## 19. Inactive / stub code

- `buttonShape.ts` — 4 shape names have no CSS value mapping anywhere
- `palettes.ts` font pairing labels (`sora-inter` etc.) — not programmatically linked to `fontThemes.ts`
- `ColorSystem/VariableBackgroundRenderer.disabled`, `VariableColorControls.disabled`, `variableColorTokens.disabled`, `MigrationStatusDashboard.disabled` — not active
- `pickFontFromOnboarding()` — always returns Sora/Inter default; function body is a stub
- `colorTokens.ts` hex→Tailwind map — covers only 12 gray-scale values; non-gray hex falls to `text-gray-900`
- `spacing-config.ts` `UIBLOCK_SPACING` — named levels per block type; used via `getUIBlockSpacing()` helper; not verified as called universally
- No central border-radius token — `rounded-xl` / `rounded-2xl` / `rounded-full` hardcoded per UIBlock. Only centralized reference: `cardEnhancements.borderRadius = 'rounded-2xl'` in `designTokens.ts`
