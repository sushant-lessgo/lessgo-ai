# newUI.md — Design System Architecture

Implementation spec for replacing current vibe/palette/accent combinatorial tokens with named, art-directed design system families (Meridian, Hearth, …).

---

## 1. Mental model

**Generation** delivers an art-directed starting point. **Edit** lets the user customize freely on top. No locked room.

Stack, outermost → innermost at render:

```
Family defaults  →  Palette  →  Variant  →  User overrides  →  Inline content
(Hearth tokens)     (moss)      (editorial) (purple accent,    (copy, images)
                                              4px radius)
```

All four style layers emit as CSS variables on the page root. Component code references variables only — no per-family branching inside UIBlocks.

---

## 2. Core primitive: `DesignSystemFamily`

Replaces vibe + palette + accent + buttonShape.

```ts
type DesignSystemFamily = {
  id: string;                    // 'hearth' | 'meridian' | ...
  label: string;
  icp: string;
  nativeMode: 'dark' | 'light';  // meridian='dark', hearth='light'

  identity: {
    fonts: { display: string; body: string; mono?: string };
    typeRoles: Record<TypeRole, TypeStyle>;   // see §4
    decorativeMotifs: MotifSpec[];             // swoop, hairline-grid, arc, etc.
    componentSpec: ComponentSpec;              // button, card, badge, input, icon
    copyVoice: CopyVoiceSpec;                  // tone, lexicon, cadence (see §8)
    sectionRules: Record<SectionType, SurfaceToken>;  // section → surface mapping
  };

  tokens: {
    neutrals: NeutralLadder;       // ink/ink-1/ink-2 OR cream/cream-1/cream-2
    accent:   AccentSpec;          // chroma, lightness baked; hue comes from palette
    fonts: FontVars;
    space: SpaceVars;              // s-1..s-10, sec-pad-y, sec-pad-x, max-w
    radius: RadiusVars;            // sm, md, lg, xl, pill, extras (r-petal for Hearth)
    elevation: ElevationVars;      // only what the family allows
    line: LineVars;                // hairlines
  };

  palettes: Palette[];             // 9 per family
  variants: Variant[];             // 3 per family
  defaultPalette: string;
  defaultVariant: string;
};
```

Live in `src/modules/Design/systems/<id>/index.ts`. Registered in `systems/registry.ts`.

---

## 3. Palettes — 9 per family, family-specific names

From designer delivery:

| Family | Palette IDs |
|---|---|
| Meridian | mint, cyan, blue, violet, rose, orange, amber, lime, bone |
| Hearth | terracotta, ochre, rose, moss, sage, plum, indigo, teal, charcoal |

```ts
type Palette = {
  id: string;
  label: string;
  accent: string;       // oklch(...)
  accentDeep?: string;  // hearth has deep; meridian doesn't
  accentInk: string;    // text on accent fill
  accentDim: string;    // hairline tint
  neutralOverrides?: Partial<NeutralLadder>;  // rare — palette can nudge neutrals
};
```

**Names are not universal across families.** "Hearth moss" and "Meridian lime" both sit in the green band, but their labels differ because they express different characters. Earlier plan to use shared Green/Blue/Brown labels is dropped.

Palettes can also modulate when composed with a mode variant (e.g. `html[data-variant="light"][data-palette="mint"]` in Meridian shifts accent lightness to survive on light surface). Expressed in CSS, not JS.

---

## 4. Variants — 3 per family, restructuring + token overrides

| Family | Variants |
|---|---|
| Meridian | developer (default), marketing, light |
| Hearth | classic (default), condensed, editorial |

```ts
type Variant = {
  id: string;
  label: string;
  description: string;
  tokenOverrides: Partial<Tokens>;                      // radius, spacing, etc.
  typeRoleOverrides?: Partial<Record<TypeRole, TypeStyle>>;
  componentOverrides?: Partial<ComponentSpec>;
  uiBlockOverrides?: Record<UIBlockId, UIBlockRenderer>; // per-variant block renderers
  motifOverrides?: { hide?: string[]; add?: MotifSpec[] };
};
```

**Variants are not tweaks — they can restructure.** Hearth `editorial` collapses radius to 4px, switches features to drop-caps + border-top, kills card fills. That's per-variant UIBlock rendering, not a token swap. See §6 for UIBlock override resolution.

Meridian `light` is a mode inversion folded into a variant slot (designer's choice). Keep as-is for v1; split into an orthogonal `mode` axis only if a family needs both modes × multiple variants.

---

## 5. Typography — semantic roles, not fixed h1..h6

Current `landingTypography.ts` has 14 size/weight variants. Replace with semantic roles that each family maps to its own type.

```ts
type TypeRole =
  | 'display-1' | 'display-2' | 'display-3' | 'display-4'
  | 'eyebrow'    // 11-12px mono/sans, tracked
  | 'lede'       // intro para under display
  | 'body-xl' | 'body-lg' | 'body' | 'body-sm'
  | 'quote'      // large pullquote
  | 'meta';      // captions, labels

type TypeStyle = {
  fontFamily: 'display' | 'body' | 'mono';
  fontSize: { desktop: string; mobile: string };
  fontWeight: number;
  lineHeight: number | string;
  letterSpacing?: string;
  fontStyle?: 'normal' | 'italic';
  fontVariationSettings?: string;   // "opsz" 144, "SOFT" 50  for Fraunces
  textTransform?: 'none' | 'uppercase';
};
```

UIBlock asks for roles (`<h1 data-type="display-1">`), never pixel sizes. `useTypography(role)` resolves through active family + variant.

Copy prompt schema (see §8) shifts to role-named fields (`eyebrow`, `lede`, `quote`, `meta`).

---

## 6. UIBlock architecture — three-tier override resolution

Base UIBlocks stay structurally the same (48 blocks today). What changes: they reference tokens only, and families/variants can override rendering.

**Resolution order (last wins):**

```
1. src/modules/UIBlocks/<Section>/<Block>.tsx                                (base)
2. src/modules/Design/systems/<family>/uiBlocks/<Section>/<Block>.tsx        (family override)
3. src/modules/Design/systems/<family>/variants/<variant>/uiBlocks/<Section>/<Block>.tsx  (variant override)
```

**Resolver:** `getUIBlockRenderer(blockId, family, variant)` walks the three levels and returns the first hit going inward-out.

**What must change inside base UIBlocks:**
- Strip hardcoded Tailwind classes (`rounded-2xl`, `shadow-xl`, `text-gray-900`, `bg-orange-500`).
- Replace with CSS variables (`rounded-[var(--r-lg)]`, `shadow-[var(--shadow-card)]`, `text-[color:var(--fg-1)]`).
- Stop computing luminance-based card styles; use `var(--card-bg)`, `var(--card-border)` exposed per family.
- Remove inline gradient blobs, themed drop-shadows, per-theme checkmark colors, badge color maps. All of that is family/variant responsibility now.

**Content schema stays uniform across systems.** Same `headline`, `lede`, `image`, `features[]` — each renderer consumes what applies. Fields that don't fit (e.g. a terminal mockup's code block when switching to Hearth's photo collage) are tolerated, not validated-against.

**Authoring cost:** base UIBlocks become visually generic, family overrides provide family flavor, variant overrides provide mood shifts. Most variants override 4–6 UIBlocks max (hero, features, cards, CTA, pricing, testimonials). Rest inherit cleanly.

---

## 7. Token delivery — CSS variables, not Tailwind strings

Current `generateColorTokens()` returns ~40 Tailwind class strings. This cannot represent `oklch(...)`, hairline rgba, warm-tinted shadows. Drop the Tailwind-string path.

**New pipeline:**

1. Resolve `{ family, palette, variant, overrides }` from project.
2. Compose CSS variable block: family defaults → palette → variant → overrides.
3. Inject as `<style>:root { ... }</style>` on page shell.
4. Set `<html data-family="…" data-palette="…" data-variant="…">` on root for CSS cascade selectors.
5. Tailwind `theme.extend` gets parallel mapping so `text-fg-1`, `bg-surface`, `rounded-lg` resolve to variables — authoring stays ergonomic.

Revive the `.disabled` variable pipeline (`VariableThemeInjector`, `variableColorTokens`) as canonical, not feature-flagged. Retire `VariableModeIndicators`, `HybridModeCompatibility`, `migrationAdapter` after cutover.

---

## 8. Copy prompt — family-scoped voice + role schema

Current `copyPromptV3.ts` maps `vibe → toneProfile`. Replace with family-scoped voice.

```ts
type CopyVoiceSpec = {
  toneProfile: string;            // "engineer-to-engineer" | "warm-unhurried" | ...
  cadenceRules: string[];         // "one long sentence, one short"
  lexicon: {
    preferred: string[];          // "preview", "ship", "plant"
    forbidden: string[];          // "unlock", "empower", "revolutionize"
  };
  examples: { hero: string[]; eyebrow: string[]; lede: string[] };
  roleNotes: Partial<Record<TypeRole, string>>;
    // eyebrow: "numeric prefix in accent, then mono label"
    // quote: "preceded by italic mark glyph"
};
```

**Copy schema change:** `badge_text` → `eyebrow`, `subheadline` stays but coexists with `lede`, add `quote`, `meta`. Update:

- `src/modules/sections/layoutElementSchema.ts` — add new roles, keep old as aliases during migration
- `src/modules/copy/copyPromptV3.ts` — emit new roles, pull `copyVoice` from family

---

## 9. Section surface assignment — family-declared

Current `assignEnhancedBackgroundsToAllSections()` alternates secondary/neutral. Families declare their own rules.

```ts
sectionRules: {
  hero:      'surface',       // Hearth: cream; Meridian: ink
  features:  'surface',       // Meridian keeps ink single-surface
  pricing:   'surface-2',     // Hearth: cream-2 band
  cta:       'surface',
  footer:    'surface-2',
  header:    'surface',
  // ...
}
```

Manual per-section overrides (today's `content[sectionId].backgroundType`) still win. But default = family-owned, not alternation.

---

## 10. Decorative SVG pattern — mask-based, accent-driven

Designer's Hearth uses SVG data URIs with hardcoded stroke colors, recolored at runtime via CSS masks:

```css
.swoop::after {
  background: var(--accent-deep);
  mask: url("data:image/svg+xml;...") no-repeat center / 100% 100%;
  -webkit-mask: url("data:image/svg+xml;...") no-repeat center / 100% 100%;
}
```

**Mandatory pattern for all decorative SVGs that need to track accent:**
- Never inline `<svg stroke="#xxx">` — accent won't flow.
- Always use CSS mask + `background: var(--accent-*)`.
- Motif SVG data URIs live in `systems/<family>/motifs.ts` and are referenced by class names the UIBlocks attach.

---

## 11. User customization layer

Project stores:

```ts
Project {
  familyId: string;
  paletteId: string;
  variantId: string;
  projectOverrides: {
    tokens?: Partial<Tokens>;            // accent hue, radius, spacing, fonts
    typeRoles?: Partial<TypeRoleMap>;    // per-role size/weight overrides
    sectionOverrides?: Record<SectionId, { surface?: SurfaceToken; /* ... */ }>;
  };
}
```

At render, `projectOverrides.tokens` emits as a **second `:root` block** after family/palette/variant. Cascade wins naturally. No branching in components.

**Swap rules:**
- Family swap → warn (large visual shift), keep `projectOverrides` (they're portable at the token level).
- Palette swap → **reset accent override** to new palette's baked hue.
- Variant swap → keep overrides. Component-specific content (e.g. block-specific fields) dropped if target variant's renderer doesn't consume them.
- "Keep my accent" checkbox on family swap — v2.

**Reset affordance:** per-token "reset to default" in Customize panel; per-section "reset section" in section toolbar; visual dot indicator when a section has any customization.

---

## 12. Edit surface changes

### Theme panel (replaces today's base/accent/palette/font pickers)

```
Family:  [Hearth ▾]
Palette: [Terracotta] [Ochre] [Rose] [Moss] [Sage] [Plum] [Indigo] [Teal] [Charcoal]
Variant: [Classic] [Condensed] [Editorial]
─────
Customize... (opens token override panel)
```

### Text toolbar

- **Color swatches** collapse to roles: `fg-1 | fg-2 | fg-3 | accent`. Hex input behind a "Custom" flyout.
- **Size picker** collapses to semantic roles: `display-1..4 | lede | body-xl..sm | quote | meta | eyebrow`. Freeform px behind "Custom".
- Alignment, bold/italic, lists — unchanged.

### Section toolbar

- **Surface picker** — only shows surfaces the family allows (Hearth: cream / cream-1 / cream-2; Meridian: locked single surface).
- Custom gradient/solid behind a "Custom" affordance, family decides whether to offer it.

### Element toolbar, image toolbar, form toolbar

Unchanged in scope. Image picker and form builder stay.

---

## 13. Onboarding flow

Replaces today's vibe/accent auto-selection step.

1. User completes field confirmation (as today).
2. **New step:** `{ family, palette, variant }` pickers. Pre-filled from onboarding signals via derivation table:
   - ICP (B2B infra/dev-tools → Meridian; agency/service/coaching → Hearth) → `familyId`
   - tone/personality → `variantId`
   - industry convention → `paletteId`
3. "Skip" button → apply derived defaults.
4. Generation proceeds with `{ family, palette, variant }` on `Project`.

Derivation table lives in `src/modules/Design/systems/derivation.ts`. Authored by PM + designer, not AI.

`useOnboardingStore` deprecates `vibe` field. Add `familyId`, `paletteId`, `variantId`.

---

## 14. Renderer changes

### Editor (`LandingPageRenderer.tsx`)

- Remove `generateCompleteBackgroundSystem`, per-section background alternation logic — replaced by family's `sectionRules`.
- Remove Google Fonts dynamic injection of 16 families — each family declares only its own fonts.
- Set `<html data-family data-palette data-variant>` on mount.
- Compose + inject `<style>:root { ... }</style>` block from resolved tokens + overrides.
- Resolve UIBlock renderer via `getUIBlockRenderer(blockId, family, variant)`.

### Published (`LandingPagePublishedRenderer.tsx`)

- Same token composition as editor, no hooks, no dynamic state.
- Page shell emits `:root` style block inline + sets data-attributes.
- Published HTML is smaller (no per-block inline styles for accent, no hex-to-tailwind fallback).
- Font loading: page shell `<link>`s family-declared fonts only.

---

## 15. Files: delete / refactor / retire

**Delete after migration:**

- `src/modules/Design/buttonShape.ts` — stub, no CSS mappings. Family owns radius.
- `src/modules/Design/cardStyles.ts` — 5-bucket luminance logic replaced by family-declared card spec.
- `src/modules/Design/ColorSystem/uiBlockTheme.ts` — warm/cool/neutral derivation gone.
- `src/modules/Design/ColorSystem/accentOptions.ts` (63 entries) — replaced by per-family 9-palette list.
- `src/modules/Design/background/palettes.ts` (30 palettes) — replaced by family neutral ladder.
- `src/modules/Design/background/textures.ts` — textures are per-family decorative motifs, declared in-family.
- `.disabled` stubs — either revive (`variableColorTokens`, `VariableBackgroundRenderer`) or delete.
- Hex→Tailwind 12-entry map in `colorTokens.ts`.

**Refactor:**

- `src/modules/Design/ColorSystem/colorTokens.ts` — `generateColorTokens()` signature stays, body rewrites to emit CSS variables composed from family + palette + variant + overrides.
- `src/modules/Design/ColorSystem/VariableThemeInjector.tsx` — becomes canonical token injector, not feature-flagged.
- `src/modules/Design/background/backgroundIntegration.ts` — section-to-surface mapping moves into `family.sectionRules`.
- `src/modules/Design/fontSystem/*` — replaced by family-declared fonts. Keep file, shrink surface.
- `src/modules/Design/vibeDesignTokens.ts` — deprecate vibe, keep as alias layer mapping vibe → family for back-compat (or remove if onboarding cuts over cleanly).
- `src/modules/sections/layoutElementSchema.ts` — extend with role-named copy fields (`eyebrow`, `lede`, `quote`, `meta`).
- `src/modules/copy/copyPromptV3.ts` — pull `copyVoice` from active family; emit new role fields.
- `src/hooks/useTypography.ts` — resolve roles through active family/variant.
- `src/hooks/useLayoutComponent.ts` — resolve UIBlock renderer via three-tier lookup.

**Keep unchanged:**

- Prisma schema (add 3 fields: `familyId`, `paletteId`, `variantId` on `Project`; `overrides` JSON).
- Form builder, form submission, draft save/load, publish flow.
- Content editing hooks (contenteditable, inline toolbars, image toolbar).
- PostHog integration.

---

## 16. New files / directories

```
src/modules/Design/systems/
├── registry.ts                  # family registration
├── resolver.ts                  # token composition, UIBlock lookup
├── derivation.ts                # onboarding signals → defaults
├── types.ts                     # DesignSystemFamily, Palette, Variant, ...
├── meridian/
│   ├── index.ts                 # family identity + tokens
│   ├── palettes.ts              # 9 palettes
│   ├── variants/
│   │   ├── developer.ts
│   │   ├── marketing.ts
│   │   └── light.ts
│   ├── motifs.ts                # decorative SVG data URIs
│   ├── copyVoice.ts
│   └── uiBlocks/                # family-level overrides (sparse)
│       └── Hero/LeftCopyRightImage.tsx   # e.g., terminal mockup version
└── hearth/
    ├── index.ts
    ├── palettes.ts
    ├── variants/
    │   ├── classic.ts
    │   ├── condensed.ts
    │   └── editorial.ts         # heavy variant, multiple UIBlock overrides
    │       └── uiBlocks/
    │           ├── Hero/LeftCopyRightImage.tsx   # asymmetric hero
    │           ├── Features/IconGrid.tsx          # drop-caps, border-top
    │           └── Pricing/TierCards.tsx          # transparent, ruled
    ├── motifs.ts                # swoop, laurel, mask data URIs
    ├── copyVoice.ts
    └── uiBlocks/
```

---

## 17. Database migration

Add to `Project`:

```prisma
model Project {
  // existing fields...
  familyId        String?   // 'meridian' | 'hearth'
  paletteId       String?   // family-specific palette id
  variantId       String?   // family-specific variant id
  overrides       Json?     // projectOverrides shape
}
```

Back-fill existing projects: null-safe code paths render legacy vibe/palette system until user opts in, or batch-migrate to `{ familyId: 'legacy', paletteId: <derived>, variantId: 'default' }`.

A `legacy` pseudo-family emulates the current output (keeps published pages rendering identically). Not user-selectable in the new onboarding.

---

## 18. Migration sequence

1. **Types + registry skeleton.** Land `systems/` directory, types, registry. No behavior change.
2. **Port Meridian + Hearth families.** Translate each HTML spec into a `DesignSystemFamily` config. No UIBlock changes yet.
3. **CSS variable injector.** Revive `VariableThemeInjector` as canonical. Inject family+palette+variant as CSS vars + data attributes. Behind feature flag initially.
4. **Legacy pseudo-family.** Emulate current output via a `legacy` family config so flag-off renders identically.
5. **Typography roles.** Extend `layoutElementSchema.ts` + `copyPromptV3.ts` with role-named fields. Migrate `useTypography` to resolve via family.
6. **Token migration of base UIBlocks.** Convert 6 high-impact blocks first (Hero LeftCopyRightImage, Features IconGrid, Pricing TierCards, CTA CenteredHeadlineCTA, Testimonials, Footer) to CSS-var-only. Test under legacy + Meridian + Hearth.
7. **Per-family UIBlock overrides.** Ship Meridian terminal hero + Hearth photo-collage hero as first overrides. Prove the resolver.
8. **Per-variant UIBlock overrides.** Ship Hearth editorial variant — this forces the restructuring override path through pricing/features/testimonials.
9. **Onboarding update.** Replace vibe picker with family/palette/variant + skip. Derivation table.
10. **Editor surface changes.** Theme panel redesign, text toolbar role collapse, section surface picker.
11. **Backfill remaining UIBlocks.** Token migration for the other 42 base blocks.
12. **Delete retired files.** `cardStyles`, `accentOptions`, `buttonShape`, old `palettes.ts`, etc.
13. **Remove feature flag.** Cutover.

Estimated: 2–3 weeks for steps 1–7 (infra + 2 families at minimum feature set); further 2–3 weeks for variants + onboarding + remaining UIBlocks.

---

## 19. Risks

- **Variant authoring cost.** Hearth editorial restructures 4–5 UIBlocks. Each new variant that restructures is real design + code work, not config. If designer ships aggressive variants per family, authoring cost grows linearly with `families × aggressive_variants`.
- **User customization × variant swap.** A user who overrode `--r-lg: 4px` and then swaps variant to one that also overrides `--r-lg: 6px` — whose value wins? Per §11: user override always wins. Risk: user-locked tokens prevent variant from expressing its intent. Mitigation: warn on variant swap if user has overridden tokens that the variant itself would override.
- **Published pages back-compat.** If we can't cleanly emulate current output via `legacy` family, already-published pages visually shift on republish. Mitigation: exhaustive comparison testing, freeze legacy path if needed.
- **Copy schema migration.** `badge_text → eyebrow` breaks existing projects unless aliased. Maintain alias layer through v1; remove in v2.
- **Font loading cost.** Each family declares its own fonts. If we ship Meridian (Inter Tight + Inter + JetBrains Mono) and Hearth (Fraunces + DM Sans), that's 5 font families. Self-hosting reduces jank; Google Fonts is fine for v1.

---

## 20. Open questions (to resolve before coding)

1. **Variant names** — ship designer's labels as-is (Developer / Marketing / Light, Classic / Condensed / Editorial), or marketing-friendly rewrites?
2. **Mode axis** — fold light/dark into variant (as designer did), or split `mode: light|dark` orthogonal to variant before family #3?
3. **Per-variant UIBlock overrides** — directory layout as proposed (`systems/<family>/variants/<variant>/uiBlocks/`), or co-locate with base block via manifest?
4. **Derivation table authorship** — PM + designer jointly, or PM alone from designer spec?
5. **Legacy pseudo-family** — ship as migration crutch, or hard-cutover with republish warning?
6. **Customization panel scope at launch** — expose all token overrides (radius, spacing, fonts, shadows), or start with accent hue + fonts only and expand?
7. **"Keep my accent" on family swap** — v1 or v2?
8. **Copy schema aliasing** — keep `badge_text` as alias for `eyebrow` forever, or remove after 6 months?
9. **SVG motif inventory** — designer delivers all mask data URIs per family, or we extract from HTML files?
10. **Variant default per family** — designer's pick (Developer for Meridian, Classic for Hearth), or derive from onboarding?
