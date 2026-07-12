// src/modules/templates/atelier/palettes.ts
// Atelier palette config. A palette swaps ONLY the accent duo (--accent /
// --accent-deep); the paper/ink/dark system is palette-invariant (tokens.ts).
// PROVISIONAL: `vermilion` is the default; `indigo`/`olive` are placeholder
// accents. Final curation is a phase-9 founder taste pass against Kontur HTML.

import { atelierPalettes, type AtelierPalette } from '@/types/service';

export interface PaletteConfig {
  accent: string;     // tags, marks, hover accents
  accentDeep: string; // primary CTA fill, em accents, links
}

export const atelierPaletteConfigs: Record<AtelierPalette, PaletteConfig> = {
  vermilion: { accent: 'oklch(0.66 0.18 34)',  accentDeep: 'oklch(0.55 0.19 32)' },
  indigo:    { accent: 'oklch(0.55 0.15 278)', accentDeep: 'oklch(0.44 0.15 280)' },
  olive:     { accent: 'oklch(0.62 0.11 118)', accentDeep: 'oklch(0.49 0.10 120)' },
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
