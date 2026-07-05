// src/modules/templates/vestria/palettes.ts
// Vestria palette config. A palette swaps ONLY the accent duo (--accent /
// --accent-deep — the mock's --brass / --brass-deep); the paper/ink/dark system
// is palette-invariant (tokens.ts). Source of truth:
// "Vestria - Uniform Manufacturing (Cobalt).html" (:root --brass / --brass-deep).
//
// Family designed for growth — add 'claret', 'pine', etc. later by extending
// vestriaPalettes in @/types/product.

import { vestriaPalettes, type VestriaPalette } from '@/types/product';

export interface PaletteConfig {
  accent: string;     // tags, dashes, brand marks, hover accents
  accentDeep: string; // primary CTA fill, em accents, links
}

export const vestriaPaletteConfigs: Record<VestriaPalette, PaletteConfig> = {
  cobalt: {
    accent:     'oklch(0.60 0.19 262)',
    accentDeep: 'oklch(0.48 0.19 264)',
  },
};

/** Picker enablement — single palette v1 (product has no picker anyway). */
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
