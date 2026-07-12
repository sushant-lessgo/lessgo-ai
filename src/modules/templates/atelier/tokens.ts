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

import type { TemplateVariant, TemplateKnobDeclaration, KnobSelection } from '@/types/template';
import {
  serializeKnobOverrides,
  knobDataAttributes,
  type KnobTokenMap,
} from '../shared/knobCss';
import { serializePaletteOverrides } from './palettes';

export interface AtelierBaseTokens {
  paper: string;
  paper2: string;
  ink: string;
  inkSoft: string; // ink-2 (mid — body copy)
  inkMute: string; // ink-3 (faint — labels/meta)
  line: string;
  lineSoft: string;
  dark: string;
  dark2: string;
  onDark: string;
  onDarkSoft: string;
  lineDark: string;

  fontDisplay: string; // Bricolage Grotesque (headings; hero em accent)
  fontBody: string;    // Hanken Grotesk
  fontMono: string;    // JetBrains Mono (placeholder image tags only)

  fsBody: string;
  lhBody: string;

  wrap: string;
  gutter: string;
  space: string;  // density multiplier (--space; density knob compact → 0.82)
  secY: string;   // section rhythm (× --space)
  padY: string;
  padYSm: string;
  r: string;
}

// Real Atelier×Kontur values ported from
// template-design/designer-workspace/atelier/styles.css :root (L11-37).
// Warm paper / ink / vermilion. Dark surfaces = --ink (design tags .atl-sec.dark
// / .atl-page-head / .atl-footer all paint var(--atl-ink)); the platform keeps a
// dark-2 slot (= ink) so the 4-surface sectionRules mechanism is unchanged.
export const atelierBaseTokens: AtelierBaseTokens = {
  paper:      'oklch(0.978 0.004 95)',
  paper2:     'oklch(0.945 0.006 95)',
  ink:        'oklch(0.165 0.010 60)',
  inkSoft:    'oklch(0.385 0.012 60)',
  inkMute:    'oklch(0.560 0.012 62)',
  line:       'oklch(0.165 0.010 60 / 0.16)',
  lineSoft:   'oklch(0.165 0.010 60 / 0.09)',
  dark:       'oklch(0.165 0.010 60)',
  dark2:      'oklch(0.165 0.010 60)',
  onDark:     'oklch(0.978 0.004 95)',
  onDarkSoft: 'oklch(0.82 0.008 90)',
  lineDark:   'oklch(0.978 0.004 95 / 0.20)',

  fontDisplay: "'Bricolage Grotesque', 'Arial Narrow', system-ui, sans-serif",
  fontBody:    "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
  fontMono:    "'JetBrains Mono', ui-monospace, monospace",

  fsBody: '16px',
  lhBody: '1.6',

  wrap:   '1380px',
  gutter: 'clamp(20px, 5vw, 76px)',
  space:  '1',
  secY:   'calc(clamp(72px, 10vw, 150px) * var(--space))',
  padY:   'var(--sec-y)',
  padYSm: 'calc(clamp(52px, 7vw, 100px) * var(--space))',
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
  --ink-mute:${t.inkMute};
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
  --space:${t.space};
  --sec-y:${t.secY};
  --pad-y:${t.padY};
  --pad-y-sm:${t.padYSm};
  --r:${t.r};
  /* Knob-consumed baselines (default axis values = :root, emit no knob block).
     --btn-r = buttonShape default 'rounded' (design's rounded value = 10px; a
     project selects buttonShape:'square' to reproduce Kontur's 0px default look).
     --card-* = cardStyle default 'hairline'. --space = density default
     'comfortable' (design 'regular'; compact → 0.82). Blocks reference these
     vars so a non-default knob retunes them via the scoped wrapper layer. */
  --btn-r:10px;
  --card-bd:1px solid var(--line);
  --card-shadow:none;
  --card-bg:var(--paper);
}
[data-surface="paper"]{background:var(--paper);color:var(--ink);}
[data-surface="paper-2"]{background:var(--paper-2);color:var(--ink);border-block:1px solid var(--line);}
[data-surface="dark"]{background:var(--dark);color:var(--on-dark);}
[data-surface="dark-2"]{background:var(--dark-2);color:var(--on-dark-soft);}
[data-palette]{background:var(--paper);color:var(--ink);font-family:var(--ff-body);font-weight:400;font-size:var(--fs-body);line-height:var(--lh-body);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
[data-palette] ::selection{background:var(--accent);color:#fff;}
.lg-atelier-wrap{max-width:var(--wrap);margin:0 auto;padding-inline:var(--gutter);}
.lg-atelier-pad{padding-block:var(--pad-y);}
.lg-atelier-pad-sm{padding-block:var(--pad-y-sm);}
.lg-atelier-display,.lg-atelier-heading{font-family:var(--ff-display);font-weight:600;line-height:0.96;margin:0;letter-spacing:-0.02em;}
.lg-atelier-display em,.lg-atelier-heading em{font-style:normal;color:var(--accent-deep);}
[data-surface="dark"] .lg-atelier-display em,[data-surface="dark"] .lg-atelier-heading em{color:var(--accent);}
/* eyebrow label — Kontur .atl-label (sans, tracked, accent dot) */
.lg-atelier-label{font-family:var(--ff-body);font-weight:600;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:var(--ink);display:inline-flex;align-items:center;gap:10px;}
.lg-atelier-label::before{content:"";width:8px;height:8px;background:var(--accent);border-radius:50%;flex:none;}
.lg-atelier-label.lg-atelier-on-dark,[data-surface="dark"] .lg-atelier-label{color:var(--on-dark);}
.lg-atelier-lede{font-weight:300;font-size:clamp(17px,2vw,21px);line-height:1.55;color:var(--ink-soft);}
[data-surface="dark"] .lg-atelier-lede{color:var(--on-dark-soft);}
.lg-atelier-acc{color:var(--accent-deep);}
.lg-atelier-tag{font-family:var(--ff-body);font-weight:600;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink-mute);}
.lg-atelier-eyebrow-block{margin-bottom:clamp(28px,4vw,44px);}
.lg-atelier-eyebrow-block .lg-atelier-h2{font-size:clamp(2.1rem,4.4vw,3.4rem);margin-top:0.4em;max-width:20ch;}
.lg-atelier-eyebrow-block .lg-atelier-lede{margin-top:1.1em;color:var(--ink-soft);max-width:58ch;font-size:1.06rem;}
[data-surface="dark"] .lg-atelier-eyebrow-block .lg-atelier-lede{color:var(--on-dark-soft);}
/* buttons — Kontur .atl-btn family (rename atl-→lg-atelier-) */
.lg-atelier-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;font-family:var(--ff-body);font-weight:600;font-size:13px;letter-spacing:0.04em;padding:calc(15px * var(--space)) calc(26px * var(--space));border:1.5px solid var(--ink);border-radius:var(--btn-r);white-space:nowrap;line-height:1;cursor:pointer;text-decoration:none;transition:background .2s,color .2s,border-color .2s;}
.lg-atelier-btn.lg-atelier-lg{padding:calc(18px * var(--space)) calc(34px * var(--space));font-size:14px;}
.lg-atelier-btn.lg-atelier-fill{background:var(--ink);color:var(--paper);}
.lg-atelier-btn.lg-atelier-fill:hover{background:var(--accent);border-color:var(--accent);color:#fff;}
.lg-atelier-btn.lg-atelier-line{background:transparent;color:var(--ink);}
.lg-atelier-btn.lg-atelier-line:hover{background:var(--ink);color:var(--paper);}
.lg-atelier-btn.lg-atelier-accent{background:var(--accent);border-color:var(--accent);color:#fff;}
.lg-atelier-btn.lg-atelier-accent:hover{background:var(--ink);border-color:var(--ink);color:var(--paper);}
.lg-atelier-btn.lg-atelier-ghost{background:transparent;color:var(--ink);}
.lg-atelier-btn.lg-atelier-ghost:hover{background:var(--ink);color:var(--paper);}
.lg-atelier-btn.lg-atelier-ghost-d{border-color:var(--paper);color:var(--paper);background:transparent;}
.lg-atelier-btn.lg-atelier-ghost-d:hover{background:var(--paper);color:var(--ink);}
.lg-atelier-btn.lg-atelier-on-dark{border-color:var(--on-dark);background:var(--on-dark);color:var(--dark);}
.lg-atelier-btn.lg-atelier-on-dark:hover{background:transparent;color:var(--on-dark);}
.lg-atelier-qlink{font-family:var(--ff-body);font-weight:600;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink);display:inline-flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid var(--accent);text-decoration:none;transition:gap .25s,color .25s;}
.lg-atelier-qlink:hover{gap:16px;color:var(--accent-deep);}
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

/**
 * ===== KNOBS (template-factory standard axes) =====
 * Atelier declares ALL 5 standard axes (rule: declare one ⇒ declare all). REAL
 * alternates on the three spec-named axes — `buttonShape`, `cardStyle`, `density`
 * — surfaced as `data-knob-*` wrapper attrs whose scoped CSS retunes the knob-
 * consumed baselines above. `typePairing` and `texture` ship DEFAULT-ONLY
 * (single-value arrays holding just the axis default): conformance-valid, no knob
 * CSS. LAW: the default value of every axis emits NO attr and NO CSS (default =
 * `:root`), so a knob-unaware project renders byte-identical to the baseline.
 * Blocks NEVER branch on a knob — all effects are CSS via inherited custom props.
 */
export const atelierKnobs: TemplateKnobDeclaration = {
  axes: {
    // buttonShape → --btn-r (button corner radius). default 'rounded' = :root
    // (10px, the design's rounded value); square (0px) reproduces the Kontur
    // baseline look, pill (999px). All three ship in the design.
    buttonShape: ['square', 'rounded', 'pill'],
    // cardStyle → --card-bd/--card-bg. default 'hairline' = :root. The design
    // ships hairline + flat ONLY (no shadow — 'shadow' dropped from phase 6).
    cardStyle: ['hairline', 'flat'],
    // density → `--space` (default 'comfortable' = :root, design 'regular',
    // --space:1). compact = design 'dense': emits --space:0.82 for the DIRECT
    // consumers (button padding, page-head, gaps) AND redeclares the final
    // --sec-y/--pad-y/--pad-y-sm (0.82 baked) so wrapper-scoped published output
    // compresses section rhythm too — see the token-map note. NO 'spacious'.
    density: ['comfortable', 'compact'],
    // typePairing: default-only. ALIASES the [data-variant] axis; a look sets the
    // flat variantId directly, so this carries no knob CSS.
    typePairing: ['classic'],
    // texture: default-only. Atelier ships no surface overlay.
    texture: ['none'],
  },
};

/**
 * Per-axis, per-value CSS the knob layer emits. ONLY non-default values appear
 * (defaults = :root, skipped by `serializeKnobOverrides`). Every declaration is a
 * plain custom-property override on the `[data-knob-*]` wrapper; the knob-consumed
 * baselines in `:root` mean blocks pick these up through inheritance with no block
 * change. typePairing/texture are default-only → no entries.
 */
export const atelierKnobTokenMap: KnobTokenMap = {
  buttonShape: {
    square: { '--btn-r': '0px' },
    pill:   { '--btn-r': '999px' },
  },
  cardStyle: {
    // Kontur flat: transparent border on the raised paper-2 fill (styles.css L48).
    flat: {
      '--card-bd': '1px solid transparent',
      '--card-bg': 'var(--paper-2)',
    },
  },
  density: {
    // Kontur dense (styles.css L47): --space drops to 0.82. `--space` alone is
    // NOT enough — `--sec-y`/`--pad-y`/`--pad-y-sm` are declared at :root, so their
    // `var(--space)` substitution resolves at :root and descendants inherit the
    // already-computed (space:1) value. ThemeInjector sets data-knob-* on :root
    // (documentElement) but AtelierSSRTokens sets them on a wrapper <div> (a :root
    // DESCENDANT) — so a wrapper-scoped `--space:0.82` would recompress rhythm in
    // the editor but NOT in published (dual-renderer parity trap). FIX: redeclare
    // the FINAL section-rhythm vars here (0.82 baked in, NOT via var(--space)) so
    // the wrapper scope carries them for descendants in BOTH renderers. `--space`
    // is still emitted for the DIRECT consumers (button padding, page-head, gaps).
    compact: {
      '--space': '0.82',
      '--sec-y': 'calc(clamp(72px, 10vw, 150px) * 0.82)',
      '--pad-y': 'calc(clamp(72px, 10vw, 150px) * 0.82)',
      '--pad-y-sm': 'calc(clamp(52px, 7vw, 100px) * 0.82)',
    },
  },
};

/** The constant knob CSS (all non-default blocks for every tokenized axis). The
 *  wrapper's `data-knob-*` attrs select which block applies — the
 *  `serializeVariantOverrides` precedent. */
export function serializeAtelierKnobOverrides(): string {
  return serializeKnobOverrides(atelierKnobTokenMap);
}

/**
 * SINGLE source of truth for the full atelier stylesheet, consumed IDENTICALLY by
 * both renderers (`AtelierThemeInjector` edit-side, `AtelierSSRTokens` published-
 * side) so the knob CSS can never diverge between them.
 *
 * When the knob selection contributes NO active attrs (absent / all-default), the
 * output equals base + palette + variant EXACTLY — byte-identical, default-emits-
 * nothing. Only a non-default selection appends the knob block(s).
 */
export function buildAtelierStylesheet(knobs?: KnobSelection | null): string {
  const base = `${serializeBaseTokens()}\n${serializePaletteOverrides()}\n${serializeVariantOverrides()}`;
  const hasActiveKnob = Object.keys(knobDataAttributes(knobs)).length > 0;
  if (!hasActiveKnob) return base;
  return `${base}\n${serializeAtelierKnobOverrides()}`;
}
