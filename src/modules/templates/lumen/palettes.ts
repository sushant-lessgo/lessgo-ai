// src/modules/templates/lumen/palettes.ts
// Lumen palette config — ONE brass accent (the only user-facing knob, per the
// Lumen HTML §09 "Configure for a client"). Bespoke template ships a single
// `brass` palette; the accent vars are emitted under `[data-palette="brass"]`.
// Source of truth: Lumen HTML (:root --brass*, lines 36-39).

import { lumenPalettes, type LumenPalette } from '@/types/service';

export interface PaletteConfig {
  /** Primary brass — the warm accent (fills, active language, frame-lines) */
  accent: string;
  /** Deeper brass — legible as text/links on paper */
  accentDeep: string;
  /** Light brass — on espresso (dark) surfaces */
  accentLight: string;
  /** Dim brass — translucent wash */
  accentDim: string;
}

export const lumenPaletteConfigs: Record<LumenPalette, PaletteConfig> = {
  brass: {
    accent:      'oklch(0.745 0.066 72)',
    accentDeep:  'oklch(0.565 0.072 64)',
    accentLight: 'oklch(0.815 0.050 74)',
    accentDim:   'oklch(0.745 0.066 72 / 0.18)',
  },
};

/** Picker enablement — single brass palette (bespoke). */
export const pilotEnabledPalettes: LumenPalette[] = [...lumenPalettes];

/** Default palette when one is not yet persisted. */
export const defaultLumenPalette: LumenPalette = 'brass';

/**
 * Serialize per-palette overrides as `[data-palette="x"] { --brass: ...; ... }`
 * blocks. Mounted on the SSR wrapper div / <html> — selector matches the data
 * attribute set by LumenThemeInjector / LumenSSRTokens. The accent-`em` rule and
 * everything else reference these vars.
 */
export function serializePaletteOverrides(
  configs: Record<LumenPalette, PaletteConfig> = lumenPaletteConfigs
): string {
  return lumenPalettes
    .map((id) => {
      const c = configs[id];
      return `[data-palette="${id}"]{--brass:${c.accent};--brass-d:${c.accentDeep};--brass-l:${c.accentLight};--brass-dim:${c.accentDim};}`;
    })
    .join('\n');
}
