// src/modules/templates/techpremium/palettes.ts
// TechPremium palette configs — the two brand "hue knobs" (forest + signal-lime).
// TechPremium ships a SINGLE palette ('forest') since the product flow is
// pilot-locked (no palette picker). The config is still emitted as a
// `[data-palette="forest"]` block so the contract (and any future palette) works
// identically to Meridian/Hearth.
//
// Selectors are authored BARE (`[data-palette="x"]`) so they apply whether the
// attribute lands on <html> (client ThemeInjector) or a wrapping <div> (server
// SSRTokens).

import { techPremiumPalettes, type TechPremiumPalette } from '@/types/product';

export interface TechPremiumPaletteConfig {
  /** Brand fill — nav CTA, dark sections, button fills, headings highlight. */
  forest: string;
  forestD: string;
  forest2: string;
  /** Signal-lime — data accent, primary action on dark, status, one hero highlight. */
  lime: string;
  limeD: string;
  limeDim: string;
}

/** Accent configs keyed by palette ID (single 'forest' palette for now). */
export const techPremiumPaletteConfigs: Record<TechPremiumPalette, TechPremiumPaletteConfig> = {
  forest: {
    forest:  'oklch(0.325 0.045 158)',
    forestD: 'oklch(0.255 0.038 159)',
    forest2: 'oklch(0.405 0.050 157)',
    lime:    'oklch(0.855 0.185 128)',
    limeD:   'oklch(0.660 0.150 132)',
    limeDim: 'oklch(0.855 0.185 128 / 0.16)',
  },
};

/** Palettes the (future) picker offers — all of them for now. */
export const pilotEnabledPalettes: TechPremiumPalette[] = ['forest'];

/** Default palette re-exported for convenience (canonical home: types/product). */
export { defaultTechPremiumPalette } from '@/types/product';

function paletteBlock(selector: string, c: TechPremiumPaletteConfig): string {
  return `${selector}{--forest:${c.forest};--forest-d:${c.forestD};--forest-2:${c.forest2};--lime:${c.lime};--lime-d:${c.limeD};--lime-dim:${c.limeDim};}`;
}

/** Serialize per-palette overrides as bare-attribute selector blocks. */
export function serializePaletteOverrides(
  base: Record<TechPremiumPalette, TechPremiumPaletteConfig> = techPremiumPaletteConfigs,
): string {
  return techPremiumPalettes
    .map((id) => paletteBlock(`[data-palette="${id}"]`, base[id]))
    .join('\n');
}
