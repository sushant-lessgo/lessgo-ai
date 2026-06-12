// src/modules/templates/lex/palettes.ts
// Lex palette configs — 9 palettes. Each is a (trust hue + accent) pair plus a
// warm-tinted paper triad. Source of truth: Lex - Trust Professional.html
// (html[data-palette="..."] blocks, lines 1135-1206).

import { lexPalettes, type LexPalette } from '@/types/service';

export interface LexPaletteConfig {
  /** Trust hue — the dominant document color (8-12% of viewport). */
  trust: string;
  trustDeep: string;
  trustSoft: string;
  /** Text/icons on a trust fill. */
  trustInk: string;
  /** Restrained accent (<2%) — seals, italic display emphasis, featured rows. */
  accent: string;
  accentDeep: string;
  /** Text/icons on an accent fill. */
  accentInk: string;
  /** Paper surface triad — never pure white; re-tints per palette. */
  paper: string;
  paper1: string;
  paper2: string;
}

export const lexPaletteConfigs: Record<LexPalette, LexPaletteConfig> = {
  counsel: {
    trust: 'oklch(0.27 0.06 250)', trustDeep: 'oklch(0.18 0.06 250)',
    trustSoft: 'oklch(0.92 0.025 250)', trustInk: 'oklch(0.98 0.005 250)',
    accent: 'oklch(0.74 0.10 80)', accentDeep: 'oklch(0.58 0.11 80)',
    accentInk: 'oklch(0.18 0.04 80)',
    paper: 'oklch(0.985 0.006 80)', paper1: 'oklch(0.965 0.008 80)', paper2: 'oklch(0.94 0.010 80)',
  },
  heritage: {
    trust: 'oklch(0.32 0.13 25)', trustDeep: 'oklch(0.22 0.13 25)',
    trustSoft: 'oklch(0.93 0.03 25)', trustInk: 'oklch(0.98 0.005 25)',
    accent: 'oklch(0.82 0.07 80)', accentDeep: 'oklch(0.62 0.10 80)',
    accentInk: 'oklch(0.18 0.04 80)',
    paper: 'oklch(0.98 0.012 80)', paper1: 'oklch(0.96 0.015 80)', paper2: 'oklch(0.93 0.018 80)',
  },
  forest: {
    trust: 'oklch(0.32 0.07 155)', trustDeep: 'oklch(0.22 0.07 155)',
    trustSoft: 'oklch(0.92 0.025 155)', trustInk: 'oklch(0.98 0.005 155)',
    accent: 'oklch(0.66 0.10 60)', accentDeep: 'oklch(0.50 0.11 60)',
    accentInk: 'oklch(0.98 0.005 60)',
    paper: 'oklch(0.98 0.008 100)', paper1: 'oklch(0.96 0.010 100)', paper2: 'oklch(0.93 0.012 100)',
  },
  slate: {
    trust: 'oklch(0.28 0.015 250)', trustDeep: 'oklch(0.18 0.015 250)',
    trustSoft: 'oklch(0.92 0.008 250)', trustInk: 'oklch(0.98 0.003 250)',
    accent: 'oklch(0.62 0.07 230)', accentDeep: 'oklch(0.48 0.08 230)',
    accentInk: 'oklch(0.98 0.003 230)',
    paper: 'oklch(0.98 0.003 250)', paper1: 'oklch(0.96 0.004 250)', paper2: 'oklch(0.93 0.005 250)',
  },
  vellum: {
    trust: 'oklch(0.22 0.02 200)', trustDeep: 'oklch(0.14 0.02 200)',
    trustSoft: 'oklch(0.92 0.012 200)', trustInk: 'oklch(0.98 0.005 200)',
    accent: 'oklch(0.70 0.06 145)', accentDeep: 'oklch(0.54 0.07 145)',
    accentInk: 'oklch(0.16 0.03 145)',
    paper: 'oklch(0.97 0.014 85)', paper1: 'oklch(0.95 0.016 85)', paper2: 'oklch(0.92 0.018 85)',
  },
  burgundy: {
    trust: 'oklch(0.28 0.10 15)', trustDeep: 'oklch(0.18 0.10 15)',
    trustSoft: 'oklch(0.92 0.025 15)', trustInk: 'oklch(0.98 0.005 15)',
    accent: 'oklch(0.78 0.10 85)', accentDeep: 'oklch(0.58 0.11 85)',
    accentInk: 'oklch(0.18 0.04 85)',
    paper: 'oklch(0.98 0.010 80)', paper1: 'oklch(0.96 0.012 80)', paper2: 'oklch(0.93 0.014 80)',
  },
  pacific: {
    trust: 'oklch(0.30 0.07 215)', trustDeep: 'oklch(0.20 0.07 215)',
    trustSoft: 'oklch(0.92 0.020 215)', trustInk: 'oklch(0.98 0.005 215)',
    accent: 'oklch(0.78 0.07 75)', accentDeep: 'oklch(0.60 0.09 75)',
    accentInk: 'oklch(0.18 0.04 75)',
    paper: 'oklch(0.98 0.008 90)', paper1: 'oklch(0.96 0.010 90)', paper2: 'oklch(0.93 0.012 90)',
  },
  court: {
    trust: 'oklch(0.16 0.005 250)', trustDeep: 'oklch(0.08 0.005 250)',
    trustSoft: 'oklch(0.92 0.006 250)', trustInk: 'oklch(0.98 0.003 250)',
    accent: 'oklch(0.55 0.13 32)', accentDeep: 'oklch(0.42 0.14 32)',
    accentInk: 'oklch(0.98 0.005 32)',
    paper: 'oklch(0.97 0.005 80)', paper1: 'oklch(0.95 0.007 80)', paper2: 'oklch(0.92 0.008 80)',
  },
  trust: {
    trust: 'oklch(0.22 0.05 265)', trustDeep: 'oklch(0.12 0.05 265)',
    trustSoft: 'oklch(0.92 0.020 265)', trustInk: 'oklch(0.98 0.005 265)',
    accent: 'oklch(0.84 0.07 90)', accentDeep: 'oklch(0.66 0.09 90)',
    accentInk: 'oklch(0.18 0.04 90)',
    paper: 'oklch(0.985 0.006 90)', paper1: 'oklch(0.965 0.008 90)', paper2: 'oklch(0.94 0.010 90)',
  },
};

/**
 * Picker enablement list. All 9 Lex palettes ship enabled (picker UI is 11b).
 * Kept as a list (not a boolean) so future restrictions can re-gate cleanly.
 */
export const pilotEnabledPalettes: LexPalette[] = [...lexPalettes];

/** Default palette when one is not yet picked or persisted. */
export const defaultLexPalette: LexPalette = 'counsel';

/**
 * Serialize per-palette overrides as `[data-palette="x"] { --trust: ... }`
 * blocks. Mounted on `:root` (the <html> tag) — selector matches the data
 * attribute set by LexThemeInjector / LexSSRTokens.
 */
export function serializePaletteOverrides(
  configs: Record<LexPalette, LexPaletteConfig> = lexPaletteConfigs
): string {
  return lexPalettes
    .map((id) => {
      const c = configs[id];
      return `[data-palette="${id}"]{--trust:${c.trust};--trust-deep:${c.trustDeep};--trust-soft:${c.trustSoft};--trust-ink:${c.trustInk};--accent:${c.accent};--accent-deep:${c.accentDeep};--accent-ink:${c.accentInk};--paper:${c.paper};--paper-1:${c.paper1};--paper-2:${c.paper2};}`;
    })
    .join('\n');
}
