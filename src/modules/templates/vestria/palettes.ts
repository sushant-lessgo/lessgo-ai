// src/modules/templates/vestria/palettes.ts
// Vestria palette config. A palette swaps ONLY the accent duo (--accent /
// --accent-deep — the mock's --brass / --brass-deep); the paper/ink/dark system
// is palette-invariant (tokens.ts). Source of truth:
// "Vestria - Uniform Manufacturing (Cobalt).html" (:root --brass / --brass-deep).
//
// Family designed for growth — add more accents later by extending
// vestriaPalettes in @/types/product (+ imageKeywords.ts, both Record-keyed).

import { vestriaPalettes, type VestriaPalette } from '@/types/product';

export interface PaletteConfig {
  accent: string;     // tags, dashes, brand marks, hover accents
  accentDeep: string; // primary CTA fill, em accents, links
}

// Accent duos from the mock's html[data-accent=...] blocks
// ("Vestria - Uniform Manufacturing.html" lines 53-59; `brass` = its :root
// default; `cobalt` = the Cobalt mock's :root).
export const vestriaPaletteConfigs: Record<VestriaPalette, PaletteConfig> = {
  cobalt:    { accent: 'oklch(0.60 0.19 262)',  accentDeep: 'oklch(0.48 0.19 264)' },
  brass:     { accent: 'oklch(0.68 0.108 74)',  accentDeep: 'oklch(0.53 0.099 66)' },
  emerald:   { accent: 'oklch(0.60 0.13 160)',  accentDeep: 'oklch(0.47 0.12 162)' },
  safety:    { accent: 'oklch(0.70 0.18 46)',   accentDeep: 'oklch(0.60 0.20 42)' },
  claret:    { accent: 'oklch(0.55 0.16 22)',   accentDeep: 'oklch(0.44 0.16 22)' },
  teal:      { accent: 'oklch(0.63 0.11 205)',  accentDeep: 'oklch(0.50 0.10 210)' },
  aubergine: { accent: 'oklch(0.55 0.15 318)',  accentDeep: 'oklch(0.44 0.15 320)' },
  indigo:    { accent: 'oklch(0.52 0.15 278)',  accentDeep: 'oklch(0.42 0.15 280)' },
};

/** Picker enablement — all 8 accents live. */
export const pilotEnabledPalettes: VestriaPalette[] = [...vestriaPalettes];

/** Default palette when one is not yet persisted. */
export const defaultVestriaPalette: VestriaPalette = 'cobalt';

/**
 * Serialize per-palette overrides as `[data-palette="x"] { --accent: ...; ... }`
 * blocks, mounted by VestriaThemeInjector / VestriaSSRTokens.
 */
export function serializePaletteOverrides(
  configs: Record<VestriaPalette, PaletteConfig> = vestriaPaletteConfigs
): string {
  return vestriaPalettes
    .map((id) => {
      const c = configs[id];
      return `[data-palette="${id}"]{--accent:${c.accent};--accent-deep:${c.accentDeep};}`;
    })
    .join('\n');
}
