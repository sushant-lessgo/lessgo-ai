// src/modules/templates/atelier2/skin.ts
// Atelier SKIN #1 for the work skeleton — DATA ONLY (zero markup/components;
// enforced by the phase-7 purity test). Supplies tokens/palettes/selections/
// variants; the work skeleton owns ALL markup. Consumed by the barrel
// (index.ts → makeWorkSkeletonModule(atelierSkin)).
//
// Tokens harvested from the approved Atelier×Kontur design:
//   src/modules/templates/atelier/tokens.ts (atelierBaseTokens) +
//   template-design/designer-workspace/atelier/ (styles.css :root, index.html).
// Palettes reuse the four curated Kontur accents (atelier/palettes.ts). Bounded
// numerics collapse the design's clamp()/calc() token expressions to a single
// representative value inside tokenContract's ranges (assertSkinTokens gate).

import type { WorkSkinDef } from '@/modules/skeletons/work/skin';

export const atelierSkin: WorkSkinDef = {
  id: 'atelier2',

  // Palette-INVARIANT base (warm paper / ink / dark editorial band). Colours are
  // the real Atelier×Kontur oklch values (atelier/tokens.ts atelierBaseTokens).
  tokens: {
    paper:      'oklch(0.978 0.004 95)',
    paper2:     'oklch(0.945 0.006 95)',
    ink:        'oklch(0.165 0.010 60)',
    inkSoft:    'oklch(0.385 0.012 60)',
    inkMute:    'oklch(0.560 0.012 62)',
    line:       'oklch(0.165 0.010 60 / 0.16)',
    lineSoft:   'oklch(0.165 0.010 60 / 0.09)',
    dark:       'oklch(0.165 0.010 60)',
    onDark:     'oklch(0.978 0.004 95)',
    onDarkSoft: 'oklch(0.82 0.008 90)',
    lineDark:   'oklch(0.978 0.004 95 / 0.20)',

    fontDisplay: "'Bricolage Grotesque', 'Arial Narrow', system-ui, sans-serif",
    fontBody:    "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
    fontMono:    "'JetBrains Mono', ui-monospace, monospace",

    // Bounded numerics (design clamp/calc → representative in-range value).
    fsBodyPx:  16,   // --fs-body 16px
    lhBody:    1.6,  // --lh-body 1.6
    wrapPx:    1380, // --wrap 1380px
    gutterPx:  64,   // --gutter clamp(20,5vw,76) → representative
    secPadYPx: 120,  // --sec-y clamp(72,10vw,150) → representative
    radiusPx:  0,    // --atl-btn-radius 0px (square buttons/inputs — Atelier DNA)
    displayWeight: 700, // .atl h2 rule-header weight (bold editorial)

    // Hero-composition knobs → Atelier "cover" signature (styles.css .atl-cover h1
    // + .atl-ph-num). Bold, tight, giant, centered, with the background numeral on.
    heroAlign: 'center',        // centered full-bleed cover
    heroDisplayScaleMax: 138,   // clamp(52,9vw,138px)
    heroDisplayLineHeight: 0.9, // line-height:0.9
    heroDisplayTracking: -0.045,// letter-spacing:-0.045em
    heroDisplayWeight: 700,     // h1 font-weight:700
    heroNumeral: true,          // oversized .atl-ph-num background numeral

    // Wave 2A signatures.
    sectionHeaderStyle: 'rule', // Kontur .atl-rule section heads (rule + index + meta)
    footerWordmark: true,       // giant .atl-footer-big wordmark + accent dot
  },

  // Four curated Kontur accents (atelier/palettes.ts). accentInk = on-accent text
  // (accent used as a CTA fill → white). accentDeep = design --accent-d.
  palettes: {
    vermilion: { accent: 'oklch(0.585 0.205 31)',  accentInk: '#fff', accentDeep: 'oklch(0.535 0.210 31)' },
    cobalt:    { accent: 'oklch(0.585 0.170 262)', accentInk: '#fff', accentDeep: 'oklch(0.490 0.180 262)' },
    moss:      { accent: 'oklch(0.600 0.135 150)', accentInk: '#fff', accentDeep: 'oklch(0.500 0.135 150)' },
    ochre:     { accent: 'oklch(0.680 0.140 70)',  accentInk: '#fff', accentDeep: 'oklch(0.540 0.130 66)' },
  },

  selections: {
    // section type → default stored layout (built work-skeleton block variants).
    // Phase 3 builds hero only; the rest resolve to the placeholder until their
    // phase and are listed here as the intended defaults (data — harmless now).
    defaultLayoutBySection: {
      hero: 'WorkHeroSlider',
      // Centered wordmark editorial header (Atelier nav) + masonry gallery collage.
      header: 'WorkHeaderCentered',
      work: 'WorkGalleryMasonry',
    },
    // Surface override over the skeleton default (sectionRules.ts). The Atelier
    // cover is a full-bleed DARK hero (old atelier sectionRules hero='dark'); the
    // work skeleton default for hero is 'paper', so override it here. Proof reads as
    // a dark band; Experiences/packages is the alt paper surface (designer parity).
    surfaceBySection: {
      hero: 'dark',
      proof: 'dark',
      packages: 'paper-2',
    },
    // Atelier nav is a normal (non-fixed) editorial bar by default.
    headerMode: 'static',
  },

  // Typeface/spacing feel. `editorial` IS the :root baseline (no overrides);
  // `compact` swaps the display face (Fraunces) + tightens rhythm (atelier parity).
  variants: [
    { id: 'editorial', label: 'Editorial', blurb: 'Bricolage Grotesque display, generous rhythm — the Atelier baseline.' },
    {
      id: 'compact',
      label: 'Compact',
      blurb: 'Fraunces display, tighter rhythm — denser, gallery-forward.',
      tokenOverrides: {
        '--wk-ff-display': "'Fraunces', Georgia, serif",
        '--wk-sec-y': '96px',
      },
    },
  ],
  defaultVariantId: 'editorial',
  defaultPaletteId: 'vermilion',

  // paletteId → editor image-search mood phrase (also enables the dev-stage palette
  // switcher, which lists Object.keys(paletteImageKeywords)).
  imageKeywords: {
    vermilion: 'warm editorial studio portrait, natural light',
    cobalt:    'cool modern architectural photography',
    moss:      'organic green natural editorial photography',
    ochre:     'golden hour warm documentary photography',
  },
};
