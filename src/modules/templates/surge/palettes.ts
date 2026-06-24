// src/modules/templates/surge/palettes.ts
// Surge palette configs — 9 accent hues. The palette knob swaps ONLY the accent
// hue: each palette sets --h (and, for visual balance, an explicit --accent and
// occasionally --accent-on). The base :root derives --accent-deep / --accent-soft
// from --h, so they follow automatically. Held green/red + slate base never move.
// Source of truth: Surge HTML (lines 514-523).

import { surgePalettes, type SurgePalette } from '@/types/service';

export interface PaletteConfig {
  /** Accent hue (--h) */
  hue: string;
  /** Primary accent — fills, links, charts */
  accent: string;
  /** Deeper accent — hover/press (derived from --h via the :root formula) */
  accentDeep: string;
  /** Soft accent wash — pills, tags, chart fills */
  accentSoft: string;
  /** Override for text/icons ON the accent fill (only where contrast needs it) */
  accentOn?: string;
}

/**
 * Configs keyed by palette ID. `accentDeep`/`accentSoft` mirror the :root
 * formulas for swatch display; serialization only emits --h / --accent / --accent-on.
 */
export const surgePaletteConfigs: Record<SurgePalette, PaletteConfig> = {
  volt:    { hue: '265', accent: 'oklch(0.605 0.18 265)', accentDeep: 'oklch(0.50 0.20 265)', accentSoft: 'oklch(0.93 0.055 265)' },
  azure:   { hue: '245', accent: 'oklch(0.6 0.16 245)',   accentDeep: 'oklch(0.50 0.20 245)', accentSoft: 'oklch(0.93 0.055 245)' },
  cyan:    { hue: '215', accent: 'oklch(0.66 0.13 215)',  accentDeep: 'oklch(0.50 0.20 215)', accentSoft: 'oklch(0.93 0.055 215)' },
  teal:    { hue: '185', accent: 'oklch(0.64 0.12 185)',  accentDeep: 'oklch(0.50 0.20 185)', accentSoft: 'oklch(0.93 0.055 185)' },
  violet:  { hue: '295', accent: 'oklch(0.58 0.19 295)',  accentDeep: 'oklch(0.50 0.20 295)', accentSoft: 'oklch(0.93 0.055 295)' },
  magenta: { hue: '350', accent: 'oklch(0.62 0.2 350)',   accentDeep: 'oklch(0.50 0.20 350)', accentSoft: 'oklch(0.93 0.055 350)' },
  coral:   { hue: '30',  accent: 'oklch(0.66 0.17 30)',   accentDeep: 'oklch(0.50 0.20 30)',  accentSoft: 'oklch(0.93 0.055 30)' },
  amber:   { hue: '75',  accent: 'oklch(0.74 0.15 75)',   accentDeep: 'oklch(0.50 0.20 75)',  accentSoft: 'oklch(0.93 0.055 75)',  accentOn: 'oklch(0.26 0.05 75)' },
  lime:    { hue: '135', accent: 'oklch(0.72 0.17 135)',  accentDeep: 'oklch(0.50 0.20 135)', accentSoft: 'oklch(0.93 0.055 135)', accentOn: 'oklch(0.24 0.05 135)' },
};

/**
 * Picker enablement list — all 9 hues offered.
 */
export const pilotEnabledPalettes: SurgePalette[] = [...surgePalettes];

/**
 * Default palette when one is not yet picked or persisted.
 */
export const defaultSurgePalette: SurgePalette = 'volt';

/**
 * Serialize per-palette overrides as `[data-palette="x"] { --h: ...; --accent: ... }`
 * blocks. Mounted on the SSR wrapper div / <html> — selector matches the data
 * attribute set by SurgeThemeInjector / SurgeSSRTokens.
 */
export function serializePaletteOverrides(
  configs: Record<SurgePalette, PaletteConfig> = surgePaletteConfigs
): string {
  return surgePalettes
    .map((id) => {
      const c = configs[id];
      const accentOn = c.accentOn ? `--accent-on:${c.accentOn};` : '';
      return `[data-palette="${id}"]{--h:${c.hue};--accent:${c.accent};${accentOn}}`;
    })
    .join('\n');
}
