// src/modules/templates/atelier/tokens.ts
// Atelier design tokens — palette-INVARIANT base (warm paper/ink, dark editorial
// bands, type, rhythm, shared lg-atelier- utility classes) + typeface/spacing
// variants. Cloned from the vestria single-source pattern with the MOOD axis
// DROPPED (atelier has no neutral-system swap). CSS variables stay GENERIC
// (--paper/--ink/--accent) so data-surface/data-palette remain template-agnostic.
//
// PROVISIONAL: final values are refined in phase 6 (design system) and locked
// against approved Kontur HTML in the phase-9 visual port. Fonts (Bricolage
// Grotesque display + Hanken Grotesk body) are self-hosted globally via
// src/styles/fonts-self-hosted.css (Bricolage net-new in phase 8).
//
// Two orthogonal cosmetic axes (mood dropped):
//   - PALETTE ([data-palette], palettes.ts) — swaps only the accent duo.
//   - VARIANT ([data-variant]) — swaps the display/body typeface + spacing feel.

import type { TemplateVariant } from '@/types/template';

export interface AtelierBaseTokens {
  paper: string;
  paper2: string;
  ink: string;
  inkSoft: string;
  line: string;
  lineSoft: string;
  dark: string;
  dark2: string;
  onDark: string;
  onDarkSoft: string;
  lineDark: string;

  fontDisplay: string; // Bricolage Grotesque (headings; hero em accent)
  fontBody: string;    // Hanken Grotesk
  fontMono: string;    // JetBrains Mono (tags/labels/meta)

  fsBody: string;
  lhBody: string;

  wrap: string;
  gutter: string;
  padY: string;
  padYSm: string;
  r: string;
}

export const atelierBaseTokens: AtelierBaseTokens = {
  paper:      'oklch(0.976 0.006 70)',
  paper2:     'oklch(0.948 0.011 68)',
  ink:        'oklch(0.215 0.014 52)',
  inkSoft:    'oklch(0.45 0.014 54)',
  line:       'oklch(0.215 0.014 52 / 0.16)',
  lineSoft:   'oklch(0.215 0.014 52 / 0.09)',
  dark:       'oklch(0.245 0.016 50)',
  dark2:      'oklch(0.19 0.014 50)',
  onDark:     'oklch(0.95 0.01 78)',
  onDarkSoft: 'oklch(0.73 0.014 72)',
  lineDark:   'oklch(0.95 0.01 78 / 0.16)',

  fontDisplay: "'Bricolage Grotesque', 'Hanken Grotesk', system-ui, sans-serif",
  fontBody:    "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
  fontMono:    "'JetBrains Mono', ui-monospace, monospace",

  fsBody: '17px',
  lhBody: '1.6',

  wrap:   '1200px',
  gutter: 'clamp(20px, 5vw, 68px)',
  padY:   'clamp(64px, 8.5vw, 120px)',
  padYSm: 'clamp(52px, 6vw, 84px)',
  r:      '3px',
};

/**
 * Serialize the palette-invariant tokens into `:root`, the `[data-surface]` band
 * rules (the published renderer wraps each section in `<div data-surface>`;
 * blocks never paint their own full-bleed background), and the shared
 * `lg-atelier-` utility classes.
 *
 * Accent-em rule: atelier's display `em` renders in accent-deep (scoped to the
 * display/heading utility so body copy `em` stays untouched).
 */
export function serializeBaseTokens(t: AtelierBaseTokens = atelierBaseTokens): string {
  return `:root{
  --paper:${t.paper};
  --paper-2:${t.paper2};
  --ink:${t.ink};
  --ink-soft:${t.inkSoft};
  --line:${t.line};
  --line-soft:${t.lineSoft};
  --dark:${t.dark};
  --dark-2:${t.dark2};
  --on-dark:${t.onDark};
  --on-dark-soft:${t.onDarkSoft};
  --line-dark:${t.lineDark};
  --ff-display:${t.fontDisplay};
  --ff-body:${t.fontBody};
  --ff-mono:${t.fontMono};
  --fs-body:${t.fsBody};
  --lh-body:${t.lhBody};
  --wrap:${t.wrap};
  --gutter:${t.gutter};
  --pad-y:${t.padY};
  --pad-y-sm:${t.padYSm};
  --r:${t.r};
}
[data-surface="paper"]{background:var(--paper);color:var(--ink);}
[data-surface="paper-2"]{background:var(--paper-2);color:var(--ink);border-block:1px solid var(--line-soft);}
[data-surface="dark"]{background:var(--dark);color:var(--on-dark);}
[data-surface="dark-2"]{background:var(--dark-2);color:var(--on-dark-soft);}
[data-palette]{background:var(--paper);color:var(--ink);font-family:var(--ff-body);font-size:var(--fs-body);line-height:var(--lh-body);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
[data-palette] ::selection{background:var(--accent);color:#fff;}
.lg-atelier-wrap{max-width:var(--wrap);margin:0 auto;padding-inline:var(--gutter);}
.lg-atelier-pad{padding-block:var(--pad-y);}
.lg-atelier-pad-sm{padding-block:var(--pad-y-sm);}
.lg-atelier-display,.lg-atelier-heading{font-family:var(--ff-display);font-weight:600;line-height:1.05;margin:0;letter-spacing:-0.01em;}
.lg-atelier-display em,.lg-atelier-heading em{font-style:italic;color:var(--accent-deep);font-weight:500;}
[data-surface="dark"] .lg-atelier-display em,[data-surface="dark"] .lg-atelier-heading em{color:var(--accent);}
.lg-atelier-tag{font-family:var(--ff-mono);font-size:0.72rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--accent-deep);display:inline-flex;align-items:center;gap:0.75em;font-weight:500;}
.lg-atelier-eyebrow-block{margin-bottom:clamp(28px,4vw,44px);}
.lg-atelier-eyebrow-block .lg-atelier-h2{font-size:clamp(2.1rem,4.4vw,3.4rem);margin-top:0.4em;max-width:20ch;}
.lg-atelier-eyebrow-block .lg-atelier-lede{margin-top:1.1em;color:var(--ink-soft);max-width:58ch;font-size:1.06rem;}
[data-surface="dark"] .lg-atelier-eyebrow-block .lg-atelier-lede{color:var(--on-dark-soft);}
.lg-atelier-btn{display:inline-flex;align-items:center;gap:0.6em;font-weight:600;font-size:0.96rem;padding:0.92em 1.5em;border-radius:var(--r);border:1.5px solid var(--ink);background:var(--ink);color:var(--paper);cursor:pointer;transition:.18s ease;white-space:nowrap;text-decoration:none;font-family:var(--ff-body);}
.lg-atelier-btn:hover{background:transparent;color:var(--ink);}
.lg-atelier-btn.lg-atelier-accent{background:var(--accent-deep);border-color:var(--accent-deep);color:#fff;}
.lg-atelier-btn.lg-atelier-accent:hover{background:transparent;color:var(--accent-deep);}
.lg-atelier-btn.lg-atelier-ghost{background:transparent;color:var(--ink);}
.lg-atelier-btn.lg-atelier-ghost:hover{background:var(--ink);color:var(--paper);}
.lg-atelier-btn.lg-atelier-on-dark{border-color:var(--on-dark);background:var(--on-dark);color:var(--dark);}
.lg-atelier-btn.lg-atelier-on-dark:hover{background:transparent;color:var(--on-dark);}
.lg-atelier-stitch{border:0;border-top:1.5px solid var(--line);margin:0;}`;
}

/**
 * ===== VARIANTS (typeface + spacing feel) =====
 * `editorial` IS the :root baseline (Bricolage Grotesque display + Hanken body,
 * generous rhythm — id is a hard rule: defaultAtelierVariant, ThemeInjector
 * default, coreParity fixtures + persisted drafts reference it). `compact` swaps
 * the display face (Fraunces) and TIGHTENS the vertical rhythm + tracking. Both
 * overrides are DISTINCT token sets (module-contract requirement; feeds the
 * picker, NOT conformance group (c)).
 */
export const atelierVariantDefs: TemplateVariant[] = [
  { id: 'editorial', label: 'Editorial', blurb: 'Grotesque display over Hanken Grotesk, generous rhythm. The atelier baseline.' },
  { id: 'compact',   label: 'Compact',   blurb: 'Fraunces display, tighter tracking and rhythm — denser, gallery-forward.' },
];

export const defaultAtelierVariant = 'editorial';

export function serializeVariantOverrides(): string {
  // `editorial` IS the :root baseline — no block emitted for it. Emitted AFTER
  // serializeBaseTokens in both injectors so var overrides win the specificity tie.
  return `[data-variant="compact"]{--ff-display:'Fraunces',Georgia,serif;--pad-y:clamp(52px,6.5vw,96px);--pad-y-sm:clamp(40px,5vw,68px);}
[data-variant="compact"] .lg-atelier-display,[data-variant="compact"] .lg-atelier-heading{letter-spacing:-0.02em;font-weight:500;}`;
}
