// src/modules/templates/granth/tokens.ts
// Granth design tokens — palette-INVARIANT base (fonts, type scale, spacing).
// Source of truth: WRDirection1Granth.html (:root + type scale, lines 34-63).
//
// Unlike Lumen (one brass accent, fixed surfaces), Granth's PALETTE swaps every
// COLOUR (paper/ink/accent/hairline/gold) — so all colour tokens live in
// ./palettes.ts, emitted under `[data-palette]`. This file holds only the
// palette-invariant axis: the two Devanagari faces, the type scale, and rhythm.
//
// Devanagari-first: Tiro Devanagari Hindi (display + body, single weight 400 —
// hierarchy via size, never faux-bold) · Mukta (captions/labels/buttons). The
// `adhunik` variant swaps the DISPLAY face to Mukta (see serializeVariantOverrides).

export interface GranthBaseTokens {
  // Type — two Devanagari faces
  fontDisplay: string; // headings/display (Tiro; Mukta in `adhunik`)
  fontBody: string;    // body prose (Tiro, always)
  fontCaption: string; // eyebrows/labels/buttons/meta (Mukta, always)

  // Type scale (Devanagari needs generous leading — matras/शिरोरेखा)
  fsDisplay: string;
  lhDisplay: string;
  fsHeading: string;
  lhHeading: string;
  fsBody: string;
  lhBody: string;

  // Display weight — Tiro is single-weight 400; `adhunik` drops to Mukta 300.
  displayWeight: string;

  // Rhythm
  wrap: string;   // standard content column
  narrow: string; // prose/poem column
  padX: string;
  secPadY: string;
  r: string;
}

export const granthBaseTokens: GranthBaseTokens = {
  fontDisplay: "'Tiro Devanagari Hindi', Georgia, serif",
  fontBody:    "'Tiro Devanagari Hindi', Georgia, serif",
  fontCaption: "'Mukta', system-ui, -apple-system, sans-serif",

  fsDisplay: 'clamp(2.6rem, 7vw, 4.6rem)',
  lhDisplay: '1.35',
  fsHeading: 'clamp(1.6rem, 3.4vw, 2.2rem)',
  lhHeading: '1.45',
  fsBody:    '18px',
  lhBody:    '1.85',

  displayWeight: '400',

  wrap:   '960px',
  narrow: '640px',
  padX:   '24px',
  secPadY: 'clamp(72px, 10vw, 120px)',
  r:      '2px',
};

/**
 * Serialize palette-invariant tokens into a `:root { ... }` block, followed by the
 * `[data-surface=...]` rules. The published renderer wraps each section in a
 * `<div data-surface="...">` (single source of truth: sectionRules.ts). Granth
 * has 2 surfaces — paper (base) and paper-2 (raised band) — whose colours are set
 * per-palette in ./palettes.ts.
 *
 * NO accent-`em` italic rule (Lumen has one): Devanagari is never italicised
 * (design rule). Section-local `em` styling (gold award separators) lives in the
 * block CSS.
 */
export function serializeBaseTokens(t: GranthBaseTokens = granthBaseTokens): string {
  return `:root{
  --font-display:${t.fontDisplay};
  --font-body:${t.fontBody};
  --font-caption:${t.fontCaption};
  --fs-display:${t.fsDisplay};
  --lh-display:${t.lhDisplay};
  --fs-heading:${t.fsHeading};
  --lh-heading:${t.lhHeading};
  --fs-body:${t.fsBody};
  --lh-body:${t.lhBody};
  --display-weight:${t.displayWeight};
  --wrap:${t.wrap};
  --narrow:${t.narrow};
  --pad-x:${t.padX};
  --sec-pad-y:${t.secPadY};
  --r:${t.r};
}
[data-surface="paper"]{background:var(--paper);}
[data-surface="paper-2"]{background:var(--paper-2);}
[data-palette]{background:var(--paper);color:var(--ink);font-family:var(--font-body);font-size:var(--fs-body);line-height:var(--lh-body);-webkit-font-smoothing:antialiased;}
[data-palette] ::selection{background:var(--accent);color:var(--accent-ink);}
.gr-wrap{max-width:var(--wrap);margin:0 auto;padding:0 var(--pad-x);}
.gr-narrow{max-width:var(--narrow);margin:0 auto;}
.gr-section{padding:var(--sec-pad-y) 0;}
.gr-display{font-family:var(--font-display);font-weight:var(--display-weight);font-size:var(--fs-display);line-height:var(--lh-display);color:var(--ink);margin:0;}
.gr-heading{font-family:var(--font-display);font-weight:var(--display-weight);font-size:var(--fs-heading);line-height:var(--lh-heading);color:var(--ink);margin:0;}
.gr-caption{font-family:var(--font-caption);font-size:.78rem;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-soft);font-weight:500;}
.gr-caption-hi{font-family:var(--font-caption);font-size:.9rem;letter-spacing:.14em;color:var(--ink-soft);font-weight:500;}
.gr-orn{display:flex;align-items:center;justify-content:center;gap:14px;color:var(--gold);margin:26px 0;}
.gr-orn::before,.gr-orn::after{content:"";height:1px;width:64px;background:var(--hairline);}
.gr-orn span{font-size:.9rem;letter-spacing:.2em;}
.gr-btn{display:inline-block;padding:13px 34px;border-radius:var(--r);background:var(--accent);color:var(--accent-ink);font-family:var(--font-caption);font-size:.95rem;letter-spacing:.08em;font-weight:500;text-decoration:none;cursor:pointer;transition:opacity .2s;}
.gr-btn:hover{opacity:.88;}
.gr-btn-ghost{display:inline-block;padding:13px 26px;color:var(--ink);font-family:var(--font-caption);font-size:.95rem;letter-spacing:.08em;font-weight:500;border-bottom:1px solid var(--hairline);text-decoration:none;}`;
}

/**
 * ===== VARIANTS =====
 * Two font-pairing variants (Decision 4 — font pairing is a variant dimension):
 *   - `granth` (default, serif-led): display = Tiro. The `:root` baseline.
 *   - `adhunik` (sans-led/modern): display = Mukta Light; body stays Tiro.
 * Pure token swap — same layout.
 */
import type { TemplateVariant } from '@/types/template';

export const granthVariants: TemplateVariant[] = [
  { id: 'granth',  label: 'ग्रन्थ',   blurb: 'Serif-led literary — Tiro Devanagari display.' },
  { id: 'adhunik', label: 'आधुनिक',  blurb: 'Sans-led modern — Mukta Light display, Tiro prose.' },
];

export const defaultGranthVariant = 'granth';

export function serializeVariantOverrides(): string {
  // `granth` is the :root baseline (Tiro). `adhunik` swaps the display face to
  // Mukta and drops the display weight to Light (300).
  return `[data-variant="adhunik"]{--font-display:'Mukta', system-ui, sans-serif;--display-weight:300;}`;
}
