// src/modules/templates/meridian/tokens.ts
// Meridian design tokens — palette-invariant + variant-invariant base.
// Source of truth: "Meridian - Modern Tech.html" :root (lines 18-62).
// Per-palette accent overrides live in ./palettes.ts; per-variant token
// rescales live in ./variants.ts.

export interface MeridianBaseTokens {
  // Neutrals — dark-native surfaces + foreground hierarchy
  ink: string;     // base surface
  ink1: string;    // raised surface
  ink2: string;    // card
  bone: string;    // fg-1
  bone2: string;   // fg-2
  bone3: string;   // fg-3 / meta

  // Hairlines (the elevation system)
  line: string;
  lineStrong: string;
  lineSoft: string;

  // Shadow (rare — floating menus only)
  shadowMenu: string;

  // Type
  fontDisplay: string;
  fontBody: string;
  fontMono: string;

  // Space (8px base) — note s8=64 / s10=120 (Meridian rhythm)
  s1: string; s2: string; s3: string; s4: string; s5: string;
  s6: string; s7: string; s8: string; s9: string; s10: string;

  // Radius
  rSm: string;
  rMd: string;
  rLg: string;
  rXl: string;
  rPill: string;

  // Section rhythm
  secPadY: string;
  secPadX: string;
  maxW: string;

  // Default accent trio (mint) — :root fallback; [data-palette] overrides win.
  accent: string;
  accentInk: string;
  accentDim: string;
}

export const meridianBaseTokens: MeridianBaseTokens = {
  ink:   'oklch(0.09 0.008 260)',
  ink1:  'oklch(0.12 0.008 260)',
  ink2:  'oklch(0.16 0.008 260)',
  bone:  'oklch(0.98 0.004 260)',
  bone2: 'oklch(0.72 0.006 260)',
  bone3: 'oklch(0.50 0.006 260)',

  line:       'oklch(1 0 0 / 0.08)',
  lineStrong: 'oklch(1 0 0 / 0.14)',
  lineSoft:   'oklch(1 0 0 / 0.04)',

  shadowMenu: '0 10px 24px -12px oklch(0 0 0 / 0.6), 0 2px 6px -2px oklch(0 0 0 / 0.4)',

  fontDisplay: '"Inter Tight", ui-sans-serif, system-ui, sans-serif',
  fontBody:    '"Inter", ui-sans-serif, system-ui, sans-serif',
  fontMono:    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',

  s1: '4px',  s2: '8px',  s3: '12px', s4: '16px', s5: '24px',
  s6: '32px', s7: '48px', s8: '64px', s9: '96px', s10: '120px',

  rSm:   '6px',
  rMd:   '8px',
  rLg:   '10px',
  rXl:   '14px',
  rPill: '999px',

  secPadY: '120px',
  secPadX: 'clamp(24px, 4vw, 56px)',
  maxW:    '1200px',

  accent:    'oklch(0.78 0.17 155)',
  accentInk: 'oklch(0.18 0.02 155)',
  accentDim: 'oklch(0.78 0.17 155 / 0.14)',
};

/**
 * Serialize palette/variant-invariant tokens into a `:root { ... }` CSS block,
 * followed by:
 *   - `[data-surface=...]` rules → parent renderer wraps each section in
 *     a div with this neutral attribute (single source of truth: sectionRules.ts).
 *   - `[data-palette] em` rule → Meridian's accent-`<em>` convention. Any `<em>`
 *     in Meridian-rendered text becomes upright + accent-colored. Scoped under
 *     `[data-palette]` so it never leaks to legacy product pages.
 *
 * Palette-specific (--accent / --accent-ink / --accent-dim) come from
 * serializePaletteOverrides(); variant rescales from serializeVariantOverrides().
 */
export function serializeBaseTokens(t: MeridianBaseTokens = meridianBaseTokens): string {
  return `:root{
  --ink:${t.ink};
  --ink-1:${t.ink1};
  --ink-2:${t.ink2};
  --bone:${t.bone};
  --bone-2:${t.bone2};
  --bone-3:${t.bone3};
  --line:${t.line};
  --line-strong:${t.lineStrong};
  --line-soft:${t.lineSoft};
  --shadow-menu:${t.shadowMenu};
  --font-display:${t.fontDisplay};
  --font-body:${t.fontBody};
  --font-mono:${t.fontMono};
  --s-1:${t.s1};--s-2:${t.s2};--s-3:${t.s3};--s-4:${t.s4};--s-5:${t.s5};
  --s-6:${t.s6};--s-7:${t.s7};--s-8:${t.s8};--s-9:${t.s9};--s-10:${t.s10};
  --r-sm:${t.rSm};
  --r-md:${t.rMd};
  --r-lg:${t.rLg};
  --r-xl:${t.rXl};
  --r-pill:${t.rPill};
  --sec-pad-y:${t.secPadY};
  --sec-pad-x:${t.secPadX};
  --max-w:${t.maxW};
  --accent:${t.accent};
  --accent-ink:${t.accentInk};
  --accent-dim:${t.accentDim};
}
[data-surface="ink"]{background:var(--ink);}
[data-surface="ink-1"]{background:var(--ink-1);}
[data-surface="ink-2"]{background:var(--ink-2);}
[data-palette] em{font-style:normal;color:var(--accent);}`;
}
