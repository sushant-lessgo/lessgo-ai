// src/modules/templates/atelier/palettes.ts
// Atelier palette config. A palette swaps ONLY the accent duo (--accent /
// --accent-deep = design's --atl-accent / --atl-accent-d); the paper/ink/dark
// system is palette-invariant (tokens.ts). Values are the REAL Kontur accents
// (styles.css L40-42). `vermilion` is the default.
//
// PORT NOTE (9a): the design ships FOUR curated accents — vermilion (default),
// cobalt, moss, ochre. The AtelierPalette union in src/types/service.ts (out of
// 9a's files-touched) currently declares three ids `vermilion | indigo | olive`,
// so the two alternates below carry the design's COBALT and MOSS oklch values
// under the existing `indigo`/`olive` ids, and the 4th accent (ochre) + the
// id-rename to cobalt/moss/ochre are deferred to a follow-up that edits
// types/service.ts. accent duos are exact-to-design.

import { atelierPalettes, type AtelierPalette } from '@/types/service';

export interface PaletteConfig {
  accent: string;     // tags, marks, hover accents (--atl-accent)
  accentDeep: string; // primary CTA fill, em accents, links (--atl-accent-d)
}

export const atelierPaletteConfigs: Record<AtelierPalette, PaletteConfig> = {
  vermilion: { accent: 'oklch(0.585 0.205 31)',  accentDeep: 'oklch(0.535 0.210 31)' },
  // design 'cobalt' values, carried under the existing `indigo` id (see PORT NOTE).
  indigo:    { accent: 'oklch(0.585 0.170 262)', accentDeep: 'oklch(0.490 0.180 262)' },
  // design 'moss' values, carried under the existing `olive` id (see PORT NOTE).
  olive:     { accent: 'oklch(0.600 0.135 150)', accentDeep: 'oklch(0.500 0.135 150)' },
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
