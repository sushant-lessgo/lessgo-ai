// src/modules/templates/vestria/tokens.ts
// Vestria design tokens — palette-INVARIANT base (paper/ink/dark surfaces, type,
// rhythm, shared utility classes). Source of truth:
// "Vestria - Uniform Manufacturing (Cobalt).html" (:root, lines 12-33).
//
// The PALETTE swaps only the accent duo (--accent / --accent-deep — the mock's
// --brass / --brass-deep); paper/ink/dark are the template's invariant DNA and
// live here. Fonts (Bodoni Moda + Hanken Grotesk + JetBrains Mono) are
// self-hosted globally via src/styles/fonts-self-hosted.css.

export interface VestriaBaseTokens {
  // Surfaces + ink (palette-invariant)
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

  // Type — three faces
  fontDisplay: string; // Bodoni Moda (headings; hero em italic)
  fontBody: string;    // Hanken Grotesk
  fontMono: string;    // JetBrains Mono (tags/labels/meta)

  fsBody: string;
  lhBody: string;

  // Rhythm
  wrap: string;
  gutter: string;
  padY: string;   // .vs-pad
  padYSm: string; // .vs-pad-sm
  r: string;
}

export const vestriaBaseTokens: VestriaBaseTokens = {
  paper:      'oklch(0.975 0.004 252)',
  paper2:     'oklch(0.944 0.007 252)',
  ink:        'oklch(0.235 0.018 258)',
  inkSoft:    'oklch(0.46 0.02 258)',
  line:       'oklch(0.235 0.018 258 / 0.16)',
  lineSoft:   'oklch(0.235 0.018 258 / 0.09)',
  dark:       'oklch(0.27 0.025 260)',
  dark2:      'oklch(0.19 0.02 260)',
  onDark:     'oklch(0.95 0.006 255)',
  onDarkSoft: 'oklch(0.73 0.018 255)',
  lineDark:   'oklch(0.95 0.006 255 / 0.16)',

  fontDisplay: "'Bodoni Moda', Georgia, serif",
  fontBody:    "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
  fontMono:    "'JetBrains Mono', ui-monospace, monospace",

  fsBody: '17px',
  lhBody: '1.6',

  wrap:   '1200px',
  gutter: 'clamp(20px, 5vw, 68px)',
  padY:   'clamp(64px, 8.5vw, 120px)',
  padYSm: 'clamp(52px, 6vw, 84px)',
  r:      '2px',
};

/**
 * Serialize the palette-invariant tokens into `:root { ... }`, the
 * `[data-surface=...]` rules (paper / paper-2 / dark / dark-2 — the published
 * renderer wraps each section in `<div data-surface>`; blocks never paint their
 * own full-bleed section background), and the shared `vs-` utility classes
 * ported from the mock (.wrap/.tag/.btn/.eyebrow-block/.stitch/.pad).
 *
 * Accent-em rule: Vestria's hero `em` IS italic (Bodoni Moda italic 500) +
 * accent-deep — unlike Meridian's upright em. Scoped to .vs-display/.vs-heading
 * so body copy `em` stays untouched.
 */
export function serializeBaseTokens(t: VestriaBaseTokens = vestriaBaseTokens): string {
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
.vs-wrap{max-width:var(--wrap);margin:0 auto;padding-inline:var(--gutter);}
.vs-pad{padding-block:var(--pad-y);}
.vs-pad-sm{padding-block:var(--pad-y-sm);}
.vs-display,.vs-heading{font-family:var(--ff-display);font-weight:600;line-height:1.04;margin:0;letter-spacing:-0.01em;}
.vs-display em,.vs-heading em{font-style:italic;color:var(--accent-deep);font-weight:500;}
[data-surface="dark"] .vs-display em,[data-surface="dark"] .vs-heading em{color:var(--accent);}
.vs-tag{font-family:var(--ff-mono);font-size:0.72rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--accent-deep);display:inline-flex;align-items:center;gap:0.75em;font-weight:500;}
.vs-tag::before{content:"";width:30px;height:0;border-top:1.5px dashed var(--accent);flex:none;}
.vs-tag.vs-center::after{content:"";width:30px;height:0;border-top:1.5px dashed var(--accent);flex:none;}
.vs-tag.vs-on-dark{color:var(--accent);}
.vs-eyebrow-block{margin-bottom:clamp(28px,4vw,44px);}
.vs-eyebrow-block .vs-h2{font-size:clamp(2.1rem,4.4vw,3.5rem);margin-top:0.5em;max-width:18ch;}
.vs-eyebrow-block .vs-lede{margin-top:1.1em;color:var(--ink-soft);max-width:56ch;font-size:1.06rem;}
[data-surface="dark"] .vs-eyebrow-block .vs-lede{color:var(--on-dark-soft);}
.vs-btn{display:inline-flex;align-items:center;gap:0.6em;font-weight:600;font-size:0.96rem;padding:0.92em 1.5em;border-radius:var(--r);border:1.5px solid var(--ink);background:var(--ink);color:var(--paper);cursor:pointer;transition:.18s ease;white-space:nowrap;letter-spacing:0.005em;text-decoration:none;font-family:var(--ff-body);}
.vs-btn:hover{background:transparent;color:var(--ink);}
.vs-btn.vs-accent{background:var(--accent-deep);border-color:var(--accent-deep);color:#fff;}
.vs-btn.vs-accent:hover{background:transparent;color:var(--accent-deep);}
.vs-btn.vs-ghost{background:transparent;color:var(--ink);}
.vs-btn.vs-ghost:hover{background:var(--ink);color:var(--paper);}
.vs-btn.vs-on-dark{border-color:var(--on-dark);background:var(--on-dark);color:var(--dark);}
.vs-btn.vs-on-dark:hover{background:transparent;color:var(--on-dark);}
.vs-btn .vs-arw{transition:transform .18s ease;}
.vs-btn:hover .vs-arw{transform:translateX(3px);}
.vs-stitch{border:0;border-top:1.5px dashed var(--line);margin:0;}`;
}

/**
 * ===== VARIANTS =====
 * Single variant v1 — `tailored` (the mock's `data-theme="tailored"` feel is the
 * :root baseline). Placeholder hook kept so a future spacing/mood variant is a
 * pure token swap, matching every other template module's contract.
 */
import type { TemplateVariant } from '@/types/template';

export const vestriaVariantDefs: TemplateVariant[] = [
  { id: 'tailored', label: 'Tailored', blurb: 'Editorial paper + dark bands — the atelier baseline.' },
];

export const defaultVestriaVariant = 'tailored';

export function serializeVariantOverrides(): string {
  // `tailored` IS the :root baseline — no overrides yet.
  return '';
}
