// src/modules/service/design/tokens.ts
// Hearth design tokens — palette-invariant.
// Source of truth: Hearth - Warm Service.html (lines 17-65).
// Per-palette accent overrides live in ./palettes.ts.

export interface HearthBaseTokens {
  // Neutrals — warm-cream surfaces + ink hierarchy
  cream: string;
  cream1: string;
  cream2: string;
  sand: string;
  ink: string;
  ink2: string;
  ink3: string;

  // Baked accents (not user-tunable)
  sage: string;
  clay: string;

  // Lines + shadow
  line: string;
  lineSoft: string;
  shadowCard: string;
  shadowLift: string;

  // Type
  fontDisplay: string;
  fontBody: string;

  // Static accent-ink (uniform across palettes — text/icons on accent fills)
  accentInk: string;

  // Spacing scale (8px base)
  s1: string; s2: string; s3: string; s4: string; s5: string;
  s6: string; s7: string; s8: string; s9: string; s10: string;

  // Radii
  rSm: string;
  rMd: string;
  rLg: string;
  rXl: string;
  rPetal: string;

  // Section rhythm
  secPadY: string;
  secPadX: string;
  maxW: string;
}

export const hearthBaseTokens: HearthBaseTokens = {
  cream:    'oklch(0.97 0.015 80)',
  cream1:   'oklch(0.95 0.02 75)',
  cream2:   'oklch(0.92 0.025 72)',
  sand:     'oklch(0.84 0.03 70)',
  ink:      'oklch(0.22 0.02 40)',
  ink2:     'oklch(0.42 0.015 40)',
  ink3:     'oklch(0.58 0.012 40)',

  sage: 'oklch(0.72 0.045 135)',
  clay: 'oklch(0.78 0.08 55)',

  line:       'oklch(0.22 0.02 40 / 0.10)',
  lineSoft:   'oklch(0.22 0.02 40 / 0.06)',
  shadowCard: '0 20px 40px -24px oklch(0.30 0.04 40 / 0.18), 0 2px 4px -1px oklch(0.30 0.04 40 / 0.06)',
  shadowLift: '0 40px 70px -30px oklch(0.30 0.04 40 / 0.22), 0 6px 14px -4px oklch(0.30 0.04 40 / 0.10)',

  fontDisplay: '"Fraunces", Georgia, "Times New Roman", serif',
  fontBody:    '"DM Sans", ui-sans-serif, system-ui, sans-serif',

  accentInk: 'oklch(0.99 0.01 80)',

  s1: '4px',  s2: '8px',  s3: '12px', s4: '16px', s5: '24px',
  s6: '32px', s7: '48px', s8: '72px', s9: '96px', s10: '140px',

  rSm:    '10px',
  rMd:    '14px',
  rLg:    '20px',
  rXl:    '28px',
  rPetal: '120px 120px 24px 120px',

  secPadY: '140px',
  secPadX: 'clamp(24px, 5vw, 80px)',
  maxW:    '1240px',
};

/**
 * Serialize palette-invariant tokens into a `:root { ... }` CSS block,
 * followed by:
 *   - `[data-surface=...]` rules → parent renderer wraps each section in
 *     a div with this attribute (single source of truth: sectionRules.ts).
 *   - `[data-palette] em` rule → the italic-`<em>` accent convention. Any
 *     `<em>` inside Hearth-rendered text inherits italic + accent-deep color.
 *     Scoped under `[data-palette]` so it never leaks to product pages.
 *
 * Palette-specific (--accent, --accent-deep, --accent-wash) are appended
 * separately via serializePaletteOverrides() in ./palettes.ts.
 */
export function serializeBaseTokens(t: HearthBaseTokens = hearthBaseTokens): string {
  return `:root{
  --cream:${t.cream};
  --cream-1:${t.cream1};
  --cream-2:${t.cream2};
  --sand:${t.sand};
  --ink:${t.ink};
  --ink-2:${t.ink2};
  --ink-3:${t.ink3};
  --sage:${t.sage};
  --clay:${t.clay};
  --line:${t.line};
  --line-soft:${t.lineSoft};
  --shadow-card:${t.shadowCard};
  --shadow-lift:${t.shadowLift};
  --font-display:${t.fontDisplay};
  --font-body:${t.fontBody};
  --accent-ink:${t.accentInk};
  --s-1:${t.s1};--s-2:${t.s2};--s-3:${t.s3};--s-4:${t.s4};--s-5:${t.s5};
  --s-6:${t.s6};--s-7:${t.s7};--s-8:${t.s8};--s-9:${t.s9};--s-10:${t.s10};
  --r-sm:${t.rSm};
  --r-md:${t.rMd};
  --r-lg:${t.rLg};
  --r-xl:${t.rXl};
  --r-petal:${t.rPetal};
  --sec-pad-y:${t.secPadY};
  --sec-pad-x:${t.secPadX};
  --max-w:${t.maxW};
}
[data-surface="cream"]{background:var(--cream);}
[data-surface="cream-1"]{background:var(--cream-1);}
[data-surface="cream-2"]{background:var(--cream-2);}
[data-palette] em{font-style:italic;color:var(--accent-deep);}
:root{--blog-ink:var(--ink);--blog-ink-2:var(--ink-2);--blog-line:var(--line);--blog-accent:var(--accent);--blog-accent-on:var(--accent-ink);}`;
}

/**
 * ===== VARIANTS — token rescale, same DNA =====
 * Source: Hearth - Warm Service.html (lines 855-993). `classic` is the baked
 * default (no override block). Phase 11b ships variant switching.
 *
 * SCOPE NOTE: the HTML reference also retunes per-block layout via class
 * selectors (`.hero h1`, `.feature`, …). Those classes don't exist in our React
 * DOM, so only the **CSS-variable** overrides port (spacing/radii). This is the
 * "pure token rescale" scope (nsoPlan Phase 11b) — variants must NOT touch copy.
 * Emitted under `[data-variant="x"]` (NOT `html[...]`) so they apply on the SSR
 * wrapper div at depth (gap #8).
 */
import type { TemplateVariant } from '@/types/template';

export const hearthVariants: TemplateVariant[] = [
  { id: 'classic', label: 'Classic', blurb: 'Spacious, generous rhythm.' },
  { id: 'condensed', label: 'Condensed', blurb: 'Tighter rhythm, denser layout.' },
  { id: 'editorial', label: 'Editorial', blurb: 'Square corners, magazine spacing.' },
];

export const defaultHearthVariant = 'classic';

export function serializeVariantOverrides(): string {
  return `[data-variant="condensed"]{
  --sec-pad-y:96px;
}
[data-variant="editorial"]{
  --r-sm:2px;
  --r-md:4px;
  --r-lg:4px;
  --r-xl:6px;
  --sec-pad-y:160px;
}`;
}

/**
 * ===== KNOBS — hearth is the first knob-tokenized template (factory phase 8) =====
 *
 * A knob is an ADDITIVE `data-knob-<axis>` layer over the existing base/palette/
 * variant CSS (same wrapper-attr mechanism as `[data-variant]`). Hearth tokenizes
 * TWO axes with real CSS:
 *   - `buttonShape` → the button/control radii `--r-md` + `--r-sm` (hearth's
 *     `.hearth-btn`/inputs read these). Default `rounded` = today's :root
 *     (14px / 10px), so it emits NO block. `square` crisps corners; `pill` rounds
 *     them fully.
 *   - `density` → section rhythm `--sec-pad-y` (every section consumes it via
 *     `--sec-pad-y`). Default `comfortable` = today's :root (140px), emits NO
 *     block. `compact` tightens, `spacious` opens up.
 *
 * The remaining standard axes are DECLARED (conformance requires the full axis
 * set) but hearth supports only their no-op default value — `cardStyle:hairline`
 * and `texture:none` map to the baked :root, and `typePairing` ALIASES the
 * existing variant axis (classic/condensed/editorial === `hearthVariants` ids):
 * a look sets the flat `variantId` directly, so `typePairing` carries no knob CSS
 * (the [data-variant] mechanism already renders it). None of these emit a knob
 * block.
 *
 * BACK-COMPAT BY CONSTRUCTION: every axis default equals hearth's CURRENT :root
 * value and is skipped by `serializeKnobOverrides` (default = :root). A project
 * with no `themeValues.knobs` (or all-default knobs) yields `knobDataAttributes`
 * = `{}` → no `data-knob-*` attr and no appended CSS → byte-identical render.
 */
import type { KnobSelection, TemplateKnobDeclaration } from '@/types/template';
import {
  serializeKnobOverrides,
  knobDataAttributes,
  type KnobTokenMap,
} from '../shared/knobCss';
import { serializePaletteOverrides } from './palettes';

/** Hearth's knob declaration (full standard axis set; only supported values).
 *  Surfaced on the TemplateModule via the barrel — enables the conditional
 *  `assertKnobConformance` rule. */
export const hearthKnobs: TemplateKnobDeclaration = {
  axes: {
    // buttonShape maps to hearth's button/control radii (below).
    buttonShape: ['square', 'rounded', 'pill'],
    // cardStyle: hearth ships only its baked hairline treatment (no-op default).
    cardStyle: ['hairline'],
    // density maps to section rhythm --sec-pad-y (below).
    density: ['compact', 'comfortable', 'spacious'],
    // typePairing ALIASES the variant axis — values === hearthVariants ids. No
    // knob CSS: a look sets the flat variantId, the [data-variant] layer renders.
    typePairing: ['classic', 'condensed', 'editorial'],
    // texture: hearth ships no overlay (no-op default only).
    texture: ['none'],
  },
};

/** Per-axis, per-value CSS the knob layer emits. ONLY non-default values appear
 *  (defaults = :root, skipped by the serializer). buttonShape retunes the control
 *  radii; density retunes section rhythm. Both are already consumed by hearth
 *  blocks/sectionRules, so no block change is needed. */
export const hearthKnobTokenMap: KnobTokenMap = {
  buttonShape: {
    square: { '--r-md': '3px', '--r-sm': '3px' },
    pill: { '--r-md': '999px', '--r-sm': '999px' },
  },
  density: {
    compact: { '--sec-pad-y': '96px' },
    spacious: { '--sec-pad-y': '180px' },
  },
};

/** The constant knob CSS (all non-default blocks for every tokenized axis). The
 *  wrapper's `data-knob-*` attrs select which block applies — exactly the
 *  `serializeVariantOverrides` precedent. */
export function serializeHearthKnobOverrides(): string {
  return serializeKnobOverrides(hearthKnobTokenMap);
}

/**
 * SINGLE source of truth for the full hearth stylesheet, consumed IDENTICALLY by
 * both renderers (`HearthThemeInjector` edit-side, `HearthSSRTokens` published-
 * side) so the knob CSS can never diverge between them.
 *
 * When the knob selection contributes NO active attrs (absent / all-default), the
 * output equals the pre-phase-8 stylesheet EXACTLY (base + palette + variant) —
 * byte-identical, default-emits-nothing. Only a non-default selection appends the
 * knob block(s).
 */
export function buildHearthStylesheet(knobs?: KnobSelection | null): string {
  const base = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;
  const hasActiveKnob = Object.keys(knobDataAttributes(knobs)).length > 0;
  if (!hasActiveKnob) return base;
  const knobCss = serializeHearthKnobOverrides();
  return knobCss ? `${base}\n${knobCss}` : base;
}
