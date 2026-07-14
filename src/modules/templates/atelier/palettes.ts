// src/modules/templates/atelier/palettes.ts
// Atelier palette config. A palette swaps ONLY the accent duo (--accent /
// --accent-deep = design's --atl-accent / --atl-accent-d); the paper/ink/dark
// system is palette-invariant (tokens.ts). Values are the REAL Kontur accents
// (styles.css L40-42). `vermilion` is the default.
//
// The design ships FOUR curated accents — vermilion (default), cobalt, moss,
// ochre — with exact-to-design oklch duos (styles.css L40-42). The AtelierPalette
// union (src/types/service.ts) was renamed in 9b to these four ids.

import { atelierPalettes, type AtelierPalette } from '@/types/service';

export interface PaletteConfig {
  accent: string;     // tags, marks, hover accents (--atl-accent)
  accentDeep: string; // primary CTA fill, em accents, links (--atl-accent-d)
}

export const atelierPaletteConfigs: Record<AtelierPalette, PaletteConfig> = {
  vermilion: { accent: 'oklch(0.585 0.205 31)',  accentDeep: 'oklch(0.535 0.210 31)' },
  cobalt:    { accent: 'oklch(0.585 0.170 262)', accentDeep: 'oklch(0.490 0.180 262)' },
  moss:      { accent: 'oklch(0.600 0.135 150)', accentDeep: 'oklch(0.500 0.135 150)' },
  ochre:     { accent: 'oklch(0.680 0.140 70)',  accentDeep: 'oklch(0.540 0.130 66)' },
};

/** Picker enablement — all accents live. */
export const pilotEnabledPalettes: AtelierPalette[] = [...atelierPalettes];

/** Default palette when one is not yet persisted. */
export const defaultAtelierPalette: AtelierPalette = 'vermilion';

/**
 * Serialize per-palette overrides as `[data-palette="x"] { --accent: ...; ... }`
 * blocks, mounted by AtelierThemeInjector / AtelierSSRTokens.
 */
export function serializePaletteOverrides(
  configs: Record<AtelierPalette, PaletteConfig> = atelierPaletteConfigs
): string {
  return atelierPalettes
    .map((id) => {
      const c = configs[id];
      return `[data-palette="${id}"]{--accent:${c.accent};--accent-deep:${c.accentDeep};}`;
    })
    .join('\n');
}
