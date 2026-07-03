// src/modules/templates/lex/tokens.ts
// Lex design tokens — palette-invariant. Template #2 (trust/professional).
// Source of truth: Lex - Trust Professional.html (:root, lines 17-70).
// Per-palette trust/accent/paper overrides live in ./palettes.ts.
//
// Lex contrasts Hearth deliberately: square corners (~0-2px radii), hairline
// rules instead of shadows, annual-report 128px rhythm, serif display
// (Source Serif 4) on warm paper that is NEVER pure white.

export interface LexBaseTokens {
  // Ink hierarchy (palette-invariant — document ink)
  ink: string;
  ink2: string;
  ink3: string;
  ink4: string;

  // Hairlines — financial-document weight
  rule: string;
  ruleStrong: string;
  ruleW: string;

  // Type — statesman variant (Source Serif 4). Variant overrides (Lora / EB
  // Garamond) ship in Phase 11b along with the variant picker.
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  fontFigure: string;

  // Spacing scale (8px base)
  s1: string; s2: string; s3: string; s4: string; s5: string;
  s6: string; s7: string; s8: string; s9: string; s10: string;

  // Radii — almost none. Lex is square.
  rSm: string;
  rMd: string;
  rLg: string;
  rXl: string;
  rPill: string;

  // Elevation — almost none.
  shadow1: string;
  shadow2: string;

  // Section rhythm
  secPadY: string;
  secPadX: string;
  maxW: string;
  colGap: string;
}

export const lexBaseTokens: LexBaseTokens = {
  ink:   'oklch(0.18 0.015 250)',
  ink2:  'oklch(0.36 0.012 250)',
  ink3:  'oklch(0.55 0.010 250)',
  ink4:  'oklch(0.72 0.008 250)',

  rule:       'oklch(0.78 0.010 250)',
  ruleStrong: 'oklch(0.45 0.014 250)',
  ruleW:      '1px',

  fontDisplay: '"Source Serif 4", "Lora", "Times New Roman", serif',
  fontBody:    '"Inter Tight", -apple-system, system-ui, sans-serif',
  fontMono:    '"JetBrains Mono", ui-monospace, monospace',
  fontFigure:  '"Source Serif 4", "Lora", serif',

  s1: '4px',  s2: '8px',  s3: '12px', s4: '16px', s5: '24px',
  s6: '32px', s7: '48px', s8: '64px', s9: '96px', s10: '128px',

  rSm:   '0',
  rMd:   '2px',
  rLg:   '2px',
  rXl:   '2px',
  rPill: '999px',

  shadow1: '0 1px 0 oklch(0.18 0.015 250 / 0.06)',
  shadow2: '0 1px 2px oklch(0.18 0.015 250 / 0.06), 0 1px 0 oklch(0.18 0.015 250 / 0.04)',

  secPadY: '128px',
  secPadX: 'clamp(24px, 5vw, 64px)',
  maxW:    '1320px',
  colGap:  '32px',
};

/**
 * Serialize palette-invariant tokens into a `:root { ... }` CSS block, followed
 * by:
 *   - `[data-surface=...]` rules → parent renderer wraps each section in a div
 *     with this attribute (single source of truth: sectionRules.ts). The
 *     `--paper*` vars are per-palette, so surfaces re-tint with the palette.
 *   - `[data-palette] em` rule → the italic-`<em>` accent convention shared by
 *     all service templates. Scoped under `[data-palette]` so it never leaks.
 *
 * Per-palette trust/accent/paper (--trust, --accent, --paper…) are appended
 * separately via serializePaletteOverrides() in ./palettes.ts.
 */
export function serializeBaseTokens(t: LexBaseTokens = lexBaseTokens): string {
  return `:root{
  --ink:${t.ink};
  --ink-2:${t.ink2};
  --ink-3:${t.ink3};
  --ink-4:${t.ink4};
  --rule:${t.rule};
  --rule-strong:${t.ruleStrong};
  --rule-w:${t.ruleW};
  --font-display:${t.fontDisplay};
  --font-body:${t.fontBody};
  --font-mono:${t.fontMono};
  --font-figure:${t.fontFigure};
  --s-1:${t.s1};--s-2:${t.s2};--s-3:${t.s3};--s-4:${t.s4};--s-5:${t.s5};
  --s-6:${t.s6};--s-7:${t.s7};--s-8:${t.s8};--s-9:${t.s9};--s-10:${t.s10};
  --r-sm:${t.rSm};
  --r-md:${t.rMd};
  --r-lg:${t.rLg};
  --r-xl:${t.rXl};
  --r-pill:${t.rPill};
  --shadow-1:${t.shadow1};
  --shadow-2:${t.shadow2};
  --sec-pad-y:${t.secPadY};
  --sec-pad-x:${t.secPadX};
  --max-w:${t.maxW};
  --col-gap:${t.colGap};
}
[data-surface="paper"]{background:var(--paper);}
[data-surface="paper-1"]{background:var(--paper-1);}
[data-surface="paper-2"]{background:var(--paper-2);}
[data-palette] em{font-style:italic;color:var(--accent-deep);}
:root{--blog-ink:var(--ink);--blog-ink-2:var(--ink-2);--blog-line:var(--rule);--blog-accent:var(--accent-deep);--blog-accent-on:var(--paper);}`;
}

/**
 * ===== VARIANTS — token rescale, same DNA =====
 * Source: Lex - Trust Professional.html (lines 1208-1270). `statesman` is the
 * baked default (Source Serif 4). `clinical`/`civic` swap display font + paper
 * tint (+ a few radii/rule rescales). Variant fonts load lazily — see
 * ThemeInjector / LexSSRTokens.
 *
 * SCOPE NOTE: the HTML reference also retunes per-block layout via class
 * selectors (`.practice .item`, `.frame`, watermark, …) — those classes don't
 * exist in our React DOM, so only the **CSS-variable** overrides port. This is
 * the "pure token rescale" scope (nsoPlan Phase 11b); variants must NOT touch
 * copy. Emitted under `[data-variant="x"]` so they apply on the SSR wrapper div.
 *
 * Variant `--paper*` deliberately overrides the per-palette paper tint (matches
 * the reference: clinical=cool fog, civic=warm) — variant block is appended
 * after the palette block so it wins on equal specificity.
 */
import type { TemplateVariant } from '@/types/template';

export const lexVariants: TemplateVariant[] = [
  { id: 'statesman', label: 'Statesman', blurb: 'Source Serif — formal, academic.' },
  { id: 'clinical', label: 'Clinical', blurb: 'Lora, cool paper, softer corners.' },
  { id: 'civic', label: 'Civic', blurb: 'EB Garamond, warm paper, heavier rules.' },
];

export const defaultLexVariant = 'statesman';

export function serializeVariantOverrides(): string {
  return `[data-variant="clinical"]{
  --font-display:"Lora","Source Serif 4",serif;
  --paper:oklch(0.985 0.004 220);
  --paper-1:oklch(0.965 0.005 220);
  --paper-2:oklch(0.94 0.006 220);
  --r-md:4px;
  --r-lg:6px;
  --r-xl:8px;
  --sec-pad-y:144px;
}
[data-variant="civic"]{
  --font-display:"EB Garamond","Source Serif 4",serif;
  --paper:oklch(0.97 0.008 85);
  --paper-1:oklch(0.95 0.010 85);
  --paper-2:oklch(0.92 0.012 85);
  --rule:oklch(0.65 0.012 250);
  --rule-w:1px;
}`;
}
