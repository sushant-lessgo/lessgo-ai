// src/modules/templates/meridian/palettes.ts
// Meridian palette configs — 9 accent hues (accent + accent-ink + accent-dim).
// Source of truth: "Meridian - Modern Tech.html" lines 710-718 (base) and
// 773-781 (light-variant accent overrides — accents shift lighter for contrast
// on the inverted white surface).
//
// Selectors are authored BARE (`[data-palette="x"]`, not `html[data-palette]`)
// so they apply whether the attribute lands on <html> (client ThemeInjector)
// or a wrapping <div> (server SSRTokens). Mirrors Hearth (palettes.ts).

import { meridianPalettes, type MeridianPalette } from '@/types/product';

export interface MeridianPaletteConfig {
  /** Primary accent — fills, links, marks, active states */
  accent: string;
  /** Text/icons on an accent fill */
  accentInk: string;
  /** Faint accent tint — hairlines, washes */
  accentDim: string;
}

/** Base (dark-variant) accent configs, keyed by palette ID. */
export const meridianPaletteConfigs: Record<MeridianPalette, MeridianPaletteConfig> = {
  mint:   { accent: 'oklch(0.78 0.17 155)', accentInk: 'oklch(0.18 0.02 155)', accentDim: 'oklch(0.78 0.17 155 / 0.14)' },
  cyan:   { accent: 'oklch(0.78 0.14 200)', accentInk: 'oklch(0.18 0.02 200)', accentDim: 'oklch(0.78 0.14 200 / 0.14)' },
  blue:   { accent: 'oklch(0.72 0.16 255)', accentInk: 'oklch(0.98 0.01 255)', accentDim: 'oklch(0.72 0.16 255 / 0.14)' },
  violet: { accent: 'oklch(0.72 0.19 295)', accentInk: 'oklch(0.98 0.01 295)', accentDim: 'oklch(0.72 0.19 295 / 0.14)' },
  rose:   { accent: 'oklch(0.74 0.17 15)',  accentInk: 'oklch(0.18 0.02 15)',  accentDim: 'oklch(0.74 0.17 15 / 0.14)' },
  orange: { accent: 'oklch(0.76 0.16 55)',  accentInk: 'oklch(0.18 0.02 55)',  accentDim: 'oklch(0.76 0.16 55 / 0.14)' },
  amber:  { accent: 'oklch(0.82 0.15 85)',  accentInk: 'oklch(0.18 0.02 85)',  accentDim: 'oklch(0.82 0.15 85 / 0.14)' },
  lime:   { accent: 'oklch(0.86 0.17 125)', accentInk: 'oklch(0.18 0.02 125)', accentDim: 'oklch(0.86 0.17 125 / 0.14)' },
  bone:   { accent: 'oklch(0.92 0.005 260)', accentInk: 'oklch(0.12 0.008 260)', accentDim: 'oklch(0.92 0.005 260 / 0.14)' },
};

/**
 * Light-variant accent overrides. On the inverted (white) surface the high-chroma
 * hues need lower lightness for contrast, so accents shift. Applied only when
 * BOTH `[data-variant="light"]` and the palette are active.
 */
export const meridianLightPaletteConfigs: Record<MeridianPalette, MeridianPaletteConfig> = {
  mint:   { accent: 'oklch(0.58 0.15 155)', accentInk: 'oklch(0.98 0.01 155)', accentDim: 'oklch(0.58 0.15 155 / 0.10)' },
  cyan:   { accent: 'oklch(0.58 0.13 200)', accentInk: 'oklch(0.98 0.01 200)', accentDim: 'oklch(0.58 0.13 200 / 0.10)' },
  blue:   { accent: 'oklch(0.52 0.18 255)', accentInk: 'oklch(0.98 0.01 255)', accentDim: 'oklch(0.52 0.18 255 / 0.10)' },
  violet: { accent: 'oklch(0.52 0.20 295)', accentInk: 'oklch(0.98 0.01 295)', accentDim: 'oklch(0.52 0.20 295 / 0.10)' },
  rose:   { accent: 'oklch(0.58 0.18 15)',  accentInk: 'oklch(0.98 0.01 15)',  accentDim: 'oklch(0.58 0.18 15 / 0.10)' },
  orange: { accent: 'oklch(0.60 0.17 55)',  accentInk: 'oklch(0.98 0.01 55)',  accentDim: 'oklch(0.60 0.17 55 / 0.10)' },
  amber:  { accent: 'oklch(0.68 0.15 85)',  accentInk: 'oklch(0.15 0.02 85)',  accentDim: 'oklch(0.68 0.15 85 / 0.10)' },
  lime:   { accent: 'oklch(0.68 0.19 125)', accentInk: 'oklch(0.15 0.02 125)', accentDim: 'oklch(0.68 0.19 125 / 0.10)' },
  bone:   { accent: 'oklch(0.22 0.008 260)', accentInk: 'oklch(0.98 0.003 260)', accentDim: 'oklch(0.22 0.008 260 / 0.10)' },
};

/** Default palette re-exported for convenience (canonical home: types/product). */
export { defaultMeridianPalette } from '@/types/product';

function paletteBlock(selector: string, c: MeridianPaletteConfig): string {
  return `${selector}{--accent:${c.accent};--accent-ink:${c.accentInk};--accent-dim:${c.accentDim};}`;
}

/**
 * Serialize per-palette overrides as bare-attribute selector blocks:
 *   - `[data-palette="x"]{...}`                         (base / dark)
 *   - `[data-variant="light"][data-palette="x"]{...}`   (light overrides)
 */
export function serializePaletteOverrides(
  base: Record<MeridianPalette, MeridianPaletteConfig> = meridianPaletteConfigs,
  light: Record<MeridianPalette, MeridianPaletteConfig> = meridianLightPaletteConfigs,
): string {
  const baseBlocks = meridianPalettes.map((id) =>
    paletteBlock(`[data-palette="${id}"]`, base[id]),
  );
  const lightBlocks = meridianPalettes.map((id) =>
    paletteBlock(`[data-variant="light"][data-palette="${id}"]`, light[id]),
  );
  return [...baseBlocks, ...lightBlocks].join('\n');
}
