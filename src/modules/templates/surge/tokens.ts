// src/modules/templates/surge/tokens.ts
// Surge design tokens — palette-invariant base.
// Source of truth: "Surge - Growth & Performance Marketing.html" (lines 17-65).
// Per-palette accent-hue overrides live in ./palettes.ts (the palette knob swaps
// only --h / --accent; the cool-slate base + held green/red never move).

export interface SurgeBaseTokens {
  // Cool-slate surfaces
  bg: string;
  bg1: string;
  surface: string;
  tint: string;
  tint2: string;

  // Accent formula inputs (default hue; palettes override --h / --accent)
  hue: string;        // --h
  chroma: string;     // --c

  // Held semantic colors — chart up/down NEVER swap with palette
  pos: string;
  posSoft: string;
  neg: string;

  // Dark dashboard ink
  panel: string;
  panel2: string;
  panelLine: string;

  // Ink hierarchy
  ink: string;
  ink2: string;
  ink3: string;
  ink4: string;

  // Lines
  line: string;
  line2: string;

  // Shadows
  shadowS: string;
  shadowM: string;
  shadowL: string;
  shadowAccent: string;

  // Type
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  fontSerif: string;

  // Radii
  rXs: string;
  rSm: string;
  rMd: string;
  rLg: string;
  rXl: string;
  rPill: string;

  // Section rhythm
  secPadY: string;
  secPadX: string;
  maxW: string;
}

export const surgeBaseTokens: SurgeBaseTokens = {
  bg:      'oklch(0.984 0.004 265)',
  bg1:     'oklch(0.965 0.006 265)',
  surface: 'oklch(1 0 0)',
  tint:    'oklch(0.955 0.022 var(--h))',
  tint2:   'oklch(0.918 0.042 var(--h))',

  hue:    '265',
  chroma: '0.18',

  pos:     'oklch(0.66 0.16 152)',
  posSoft: 'oklch(0.93 0.07 152)',
  neg:     'oklch(0.60 0.19 27)',

  panel:     'oklch(0.205 0.028 265)',
  panel2:    'oklch(0.265 0.03 265)',
  panelLine: 'oklch(0.34 0.025 265)',

  ink:  'oklch(0.22 0.022 265)',
  ink2: 'oklch(0.42 0.02 265)',
  ink3: 'oklch(0.575 0.018 265)',
  ink4: 'oklch(0.74 0.014 265)',

  line:  'oklch(0.905 0.01 265)',
  line2: 'oklch(0.84 0.014 265)',

  shadowS:      '0 1px 2px oklch(0.4 0.03 265 / 0.06), 0 4px 10px -4px oklch(0.4 0.03 265 / 0.07)',
  shadowM:      '0 10px 26px -10px oklch(0.35 0.04 265 / 0.18)',
  shadowL:      '0 30px 64px -22px oklch(0.3 0.05 265 / 0.30)',
  shadowAccent: '0 12px 26px -10px oklch(0.605 var(--c) var(--h) / 0.40)',

  fontDisplay: '"Archivo", -apple-system, system-ui, sans-serif',
  fontBody:    '"Hanken Grotesk", -apple-system, system-ui, sans-serif',
  fontMono:    '"JetBrains Mono", ui-monospace, monospace',
  fontSerif:   '"Instrument Serif", Georgia, serif',

  rXs:   '4px',
  rSm:   '7px',
  rMd:   '11px',
  rLg:   '16px',
  rXl:   '22px',
  rPill: '999px',

  secPadY: '100px',
  secPadX: 'clamp(20px, 4vw, 60px)',
  maxW:    '1280px',
};

/**
 * Serialize palette-invariant tokens into a `:root { ... }` CSS block, followed by:
 *   - `[data-surface=...]` rules → the published renderer wraps each section in a
 *     `<div data-surface="...">` (single source of truth: sectionRules.ts).
 *   - `[data-palette] em` rule → Surge's accent-`<em>` convention. Unlike Hearth
 *     (italic Fraunces), Surge's `<em>` is NON-italic, accent-colored. This is the
 *     TEMPLATE's em rendering and lives here, not in the (template-agnostic) voice
 *     spec. Scoped under `[data-palette]` so it never leaks to product pages.
 *
 * The accent vars are defined via the `--h`/`--c` formula; palette overrides
 * (./palettes.ts) re-set `--h` (and sometimes `--accent`/`--accent-on` directly).
 */
export function serializeBaseTokens(t: SurgeBaseTokens = surgeBaseTokens): string {
  return `:root{
  --h:${t.hue};
  --c:${t.chroma};
  --bg:${t.bg};
  --bg-1:${t.bg1};
  --surface:${t.surface};
  --tint:${t.tint};
  --tint-2:${t.tint2};
  --accent:oklch(0.605 var(--c) var(--h));
  --accent-deep:oklch(0.50 calc(var(--c) + 0.02) var(--h));
  --accent-soft:oklch(0.93 0.055 var(--h));
  --accent-on:oklch(0.99 0.012 var(--h));
  --pos:${t.pos};
  --pos-soft:${t.posSoft};
  --neg:${t.neg};
  --panel:${t.panel};
  --panel-2:${t.panel2};
  --panel-line:${t.panelLine};
  --ink:${t.ink};
  --ink-2:${t.ink2};
  --ink-3:${t.ink3};
  --ink-4:${t.ink4};
  --line:${t.line};
  --line-2:${t.line2};
  --shadow-s:${t.shadowS};
  --shadow-m:${t.shadowM};
  --shadow-l:${t.shadowL};
  --shadow-accent:${t.shadowAccent};
  --font-display:${t.fontDisplay};
  --font-body:${t.fontBody};
  --font-mono:${t.fontMono};
  --font-serif:${t.fontSerif};
  --r-xs:${t.rXs};
  --r-sm:${t.rSm};
  --r-md:${t.rMd};
  --r-lg:${t.rLg};
  --r-xl:${t.rXl};
  --r-pill:${t.rPill};
  --sec-pad-y:${t.secPadY};
  --sec-pad-x:${t.secPadX};
  --max-w:${t.maxW};
}
[data-surface="bg"]{background:var(--bg);}
[data-surface="bg-1"]{background:var(--bg-1);}
[data-surface="surface"]{background:var(--surface);}
[data-surface="panel"]{background:var(--panel);}
[data-palette] em{font-style:normal;color:var(--accent);}`;
}

/**
 * ===== VARIANTS — token rescale + signature class overrides =====
 * Source: Surge HTML (lines 525-575). `performance` is the baked default (no
 * override block). `editorial` brings serif headlines + air; `bold` blocks the
 * accent into the hero and cranks type.
 *
 * Variant overrides reference the `sg-`-prefixed block classes authored in
 * blocks/** (kept byte-aligned with these selectors). Emitted under
 * `[data-variant="x"]` (NOT `html[...]`) so they apply on the SSR wrapper div.
 */
import type { TemplateVariant } from '@/types/template';

export const surgeVariants: TemplateVariant[] = [
  { id: 'performance', label: 'Performance', blurb: 'Dense, charty, sharp — grotesk display.' },
  { id: 'editorial', label: 'Editorial', blurb: 'Serif headlines, airier — premium brand shops.' },
  { id: 'bold', label: 'Bold', blurb: 'Oversized type, accent-blocked hero — launch energy.' },
];

export const defaultSurgeVariant = 'performance';

export function serializeVariantOverrides(): string {
  return `[data-variant="editorial"]{
  --sec-pad-y:120px;
  --r-sm:9px; --r-md:13px; --r-lg:18px; --r-xl:26px;
}
[data-variant="editorial"] .sg-hero__display,
[data-variant="editorial"] .sg-sec-title,
[data-variant="editorial"] .sg-about__lede,
[data-variant="editorial"] .sg-case__headline,
[data-variant="editorial"] .sg-review p{
  font-family:var(--font-serif); font-weight:400; letter-spacing:-0.01em;
}
[data-variant="editorial"] .sg-hero__display em,
[data-variant="editorial"] .sg-sec-title em{ font-style:italic; }
[data-variant="editorial"] .sg-hero{ background:var(--bg-1); }
[data-variant="editorial"] .sg-sec-dek,
[data-variant="editorial"] .sg-hero__lede{ font-weight:400; }
[data-variant="bold"]{
  --sec-pad-y:92px;
}
[data-variant="bold"] .sg-hero__display{ font-size:clamp(46px,7vw,92px); letter-spacing:-0.05em; line-height:0.92; }
[data-variant="bold"] .sg-sec-title{ font-size:clamp(36px,5vw,64px); letter-spacing:-0.045em; }
[data-variant="bold"] .sg-hero{ background:var(--accent); }
[data-variant="bold"] .sg-hero__display,
[data-variant="bold"] .sg-hero__lede{ color:var(--accent-on); }
[data-variant="bold"] .sg-hero__display em{ color:var(--ink); }
[data-variant="bold"] .sg-pill{ background:oklch(1 0 0 / 0.18); color:var(--accent-on); }
[data-variant="bold"] .sg-sec-eyebrow{ background:var(--accent); color:var(--accent-on); padding:6px 12px; border-radius:var(--r-pill); }`;
}
