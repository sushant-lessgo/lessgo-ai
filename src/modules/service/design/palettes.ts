// src/modules/service/design/palettes.ts
// Hearth palette configs — 9 palettes, accent + accent-deep per palette.
// Source of truth: Hearth - Warm Service.html (lines 791-826).
// Pilot ships only `terracotta` enabled in picker UI (Phase 4).

import { hearthPalettes, type HearthPalette } from '@/types/service';

export interface PaletteConfig {
  /** Primary accent — fills, links, active states */
  accent: string;
  /** Deeper accent — hover, italic display text on cream */
  accentDeep: string;
  /** 10% accent wash — hairline tints, highlights */
  accentWash: string;
}

/**
 * Configs keyed by palette ID.
 *
 * Naming note: this Record is intentionally `hearthPaletteConfigs`, NOT
 * `hearthPalettes`, to avoid colliding with `hearthPalettes` in
 * `src/types/service.ts` which is the readonly list of palette IDs.
 */
export const hearthPaletteConfigs: Record<HearthPalette, PaletteConfig> = {
  terracotta: {
    accent:     'oklch(0.62 0.15 40)',
    accentDeep: 'oklch(0.48 0.15 40)',
    accentWash: 'oklch(0.62 0.15 40 / 0.10)',
  },
  ochre: {
    accent:     'oklch(0.68 0.14 75)',
    accentDeep: 'oklch(0.50 0.14 75)',
    accentWash: 'oklch(0.68 0.14 75 / 0.10)',
  },
  rose: {
    accent:     'oklch(0.64 0.14 10)',
    accentDeep: 'oklch(0.48 0.14 10)',
    accentWash: 'oklch(0.64 0.14 10 / 0.10)',
  },
  moss: {
    accent:     'oklch(0.52 0.09 145)',
    accentDeep: 'oklch(0.38 0.09 145)',
    accentWash: 'oklch(0.52 0.09 145 / 0.10)',
  },
  sage: {
    accent:     'oklch(0.60 0.06 155)',
    accentDeep: 'oklch(0.42 0.07 155)',
    accentWash: 'oklch(0.60 0.06 155 / 0.10)',
  },
  plum: {
    accent:     'oklch(0.50 0.12 330)',
    accentDeep: 'oklch(0.36 0.12 330)',
    accentWash: 'oklch(0.50 0.12 330 / 0.10)',
  },
  indigo: {
    accent:     'oklch(0.52 0.13 260)',
    accentDeep: 'oklch(0.38 0.13 260)',
    accentWash: 'oklch(0.52 0.13 260 / 0.10)',
  },
  teal: {
    accent:     'oklch(0.56 0.08 195)',
    accentDeep: 'oklch(0.40 0.09 195)',
    accentWash: 'oklch(0.56 0.08 195 / 0.10)',
  },
  charcoal: {
    accent:     'oklch(0.32 0.02 40)',
    accentDeep: 'oklch(0.22 0.02 40)',
    accentWash: 'oklch(0.32 0.02 40 / 0.10)',
  },
};

/**
 * Pilot whitelist — only terracotta is selectable in the Phase 4 picker.
 * Other palettes ship in code (so the design system is complete) but the
 * picker UI greys them out with a "coming soon" tooltip.
 */
export const pilotEnabledPalettes: HearthPalette[] = ['terracotta'];

/**
 * Default palette when one is not yet picked or persisted.
 */
export const defaultHearthPalette: HearthPalette = 'terracotta';

/**
 * Serialize per-palette overrides as `[data-palette="x"] { --accent: ... }` blocks.
 * Mounted on `:root` (the <html> tag) — selector matches the data attribute set
 * by HearthThemeInjector.
 */
export function serializePaletteOverrides(
  configs: Record<HearthPalette, PaletteConfig> = hearthPaletteConfigs
): string {
  return hearthPalettes
    .map((id) => {
      const c = configs[id];
      return `[data-palette="${id}"]{--accent:${c.accent};--accent-deep:${c.accentDeep};--accent-wash:${c.accentWash};}`;
    })
    .join('\n');
}
