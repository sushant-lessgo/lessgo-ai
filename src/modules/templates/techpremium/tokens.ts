// src/modules/templates/techpremium/tokens.ts
// TechPremium design tokens — palette-invariant + variant-invariant base.
// Source of truth: TechPremium.html :root (the "Naayom" control-room system).
// Per-palette accent overrides (forest + signal-lime hue knobs) live in
// ./palettes.ts; TechPremium ships a single variant so ./variants.ts emits no
// per-variant rescale block.
//
// Unlike Meridian (dark-native, one --ink surface), TechPremium is light-native
// warm paper with TWO dark "forest" sections (cta + footer). Surface tones:
//   paper / paper-2  → light bands       (header, hero, features, testimonials, pricing)
//   forest / forest-d → dark brand bands  (cta, footer)
// The renderer wraps each section in [data-surface]; blocks never paint their
// own full-bleed background. Dark-section blocks set their own light text colors.

export interface TechPremiumBaseTokens {
  // Light surfaces — warm neutral paper
  paper: string;
  paper2: string;
  paper3: string;

  // Text — warm charcoal
  ink: string;
  ink2: string;
  ink3: string;

  // Hairlines
  line: string;
  line2: string;
  lineDk: string; // on forest (dark sections)

  // Status
  ok: string;
  okBg: string;
  warn: string;
  warnBg: string;

  // Type
  fontDisplay: string;
  fontBody: string;
  fontMono: string;

  // Rhythm
  padY: string;
  padX: string;
  maxW: string;

  // Radius
  r: string;
  rLg: string;

  // Default accent trios (forest brand + signal-lime + teal) — :root fallback;
  // [data-palette] overrides win. Kept here so a bare page still renders on-brand.
  forest: string;
  forestD: string;
  forest2: string;
  lime: string;
  limeD: string;
  limeDim: string;
  teal: string;
  tealDim: string;
}

export const techPremiumBaseTokens: TechPremiumBaseTokens = {
  paper:  'oklch(0.978 0.005 95)',
  paper2: 'oklch(0.958 0.007 95)',
  paper3: 'oklch(0.935 0.010 92)',

  ink:  'oklch(0.265 0.018 160)',
  ink2: 'oklch(0.445 0.018 162)',
  ink3: 'oklch(0.600 0.016 162)',

  line:   'oklch(0.885 0.010 120)',
  line2:  'oklch(0.815 0.014 130)',
  lineDk: 'oklch(0.470 0.045 158)',

  ok:    'oklch(0.660 0.150 150)',
  okBg:  'oklch(0.660 0.150 150 / 0.14)',
  warn:  'oklch(0.730 0.150 75)',
  warnBg:'oklch(0.730 0.150 75 / 0.14)',

  fontDisplay: '"Inter Tight", system-ui, -apple-system, sans-serif',
  fontBody:    '"Inter", system-ui, -apple-system, sans-serif',
  fontMono:    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',

  padY: 'clamp(72px, 8.5vw, 120px)',
  padX: 'clamp(20px, 5vw, 64px)',
  maxW: '1200px',

  r:    '4px',
  rLg:  '8px',

  forest:  'oklch(0.325 0.045 158)',
  forestD: 'oklch(0.255 0.038 159)',
  forest2: 'oklch(0.405 0.050 157)',
  lime:    'oklch(0.855 0.185 128)',
  limeD:   'oklch(0.660 0.150 132)',
  limeDim: 'oklch(0.855 0.185 128 / 0.16)',
  teal:    'oklch(0.700 0.095 192)',
  tealDim: 'oklch(0.700 0.095 192 / 0.14)',
};

/**
 * Serialize palette/variant-invariant tokens into a `:root { ... }` CSS block,
 * followed by:
 *   - `[data-surface=...]` rules → the renderer wraps each section in a div with
 *     this neutral attribute (single source of truth: sectionRules.ts). paper/
 *     paper-2 are light; forest/forest-d are the dark brand bands.
 *   - `[data-palette] em` rule → TechPremium's accent-`<em>` convention. Any `<em>`
 *     becomes upright + forest-2 on light bands, and signal-lime on dark (forest)
 *     bands for contrast. Scoped under `[data-palette]` so it never leaks to legacy
 *     product pages.
 *
 * The accent hue knobs (--forest* / --lime* / --teal*) are re-emitted by
 * serializePaletteOverrides() per palette; the single variant adds no rescale.
 */
export function serializeBaseTokens(t: TechPremiumBaseTokens = techPremiumBaseTokens): string {
  return `:root{
  --paper:${t.paper};
  --paper-2:${t.paper2};
  --paper-3:${t.paper3};
  --ink:${t.ink};
  --ink-2:${t.ink2};
  --ink-3:${t.ink3};
  --line:${t.line};
  --line-2:${t.line2};
  --line-dk:${t.lineDk};
  --ok:${t.ok};
  --ok-bg:${t.okBg};
  --warn:${t.warn};
  --warn-bg:${t.warnBg};
  --font-display:${t.fontDisplay};
  --font-body:${t.fontBody};
  --font-mono:${t.fontMono};
  --pad-y:${t.padY};
  --pad-x:${t.padX};
  --max-w:${t.maxW};
  --r:${t.r};
  --r-lg:${t.rLg};
  --forest:${t.forest};
  --forest-d:${t.forestD};
  --forest-2:${t.forest2};
  --lime:${t.lime};
  --lime-d:${t.limeD};
  --lime-dim:${t.limeDim};
  --teal:${t.teal};
  --teal-dim:${t.tealDim};
}
[data-surface="paper"]{background:var(--paper);}
[data-surface="paper-2"]{background:var(--paper-2);}
[data-surface="forest"]{background:var(--forest);}
[data-surface="forest-d"]{background:var(--forest-d);}
[data-palette] em{font-style:normal;color:var(--forest-2);}
[data-surface="forest"] em,[data-surface="forest-d"] em{color:var(--lime);}`;
}
