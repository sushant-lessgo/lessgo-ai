// src/modules/templates/granth/palettes.ts
// Granth palette config. Unlike Lumen (one accent knob), a Granth palette swaps
// EVERY colour — paper, ink, accent, hairline, ornament gold — so the whole
// design re-tones (warm ivory+maroon ⇄ cool grey+blue). Source of truth:
// template-design/WRDirection1Granth.html (:root = सिंदूरी, html[data-alt] = नील, lines 11-32).
//
// Family designed for growth (like hearth/lex 9-palette families) — add `van`
// (forest-green) etc. later by extending granthPalettes in @/types/service.

import { granthPalettes, type GranthPalette } from '@/types/service';

export interface PaletteConfig {
  paper: string;     // base background surface
  paper2: string;    // raised / alternate band surface
  ink: string;       // primary text
  inkSoft: string;   // secondary text
  accent: string;    // links, buttons, ornaments (maroon / deep blue)
  accentInk: string; // text on accent
  hairline: string;  // rules / borders
  gold: string;      // ornament only, NEVER text
}

export const granthPaletteConfigs: Record<GranthPalette, PaletteConfig> = {
  // सिंदूरी — warm ivory paper + maroon (default)
  sinduri: {
    paper:     '#f8f3e9',
    paper2:    '#f0e8d8',
    ink:       '#2b2118',
    inkSoft:   '#6f604f',
    accent:    '#8a2f2b',
    accentInk: '#f8f3e9',
    hairline:  'rgba(43,33,24,.22)',
    gold:      '#a3762a',
  },
  // नील — cool grey study + deep blue (alternate)
  neel: {
    paper:     '#f2f4f3',
    paper2:    '#e7ebe9',
    ink:       '#1d2430',
    inkSoft:   '#5a6472',
    accent:    '#2b4a7a',
    accentInk: '#f2f4f3',
    hairline:  'rgba(29,36,48,.22)',
    gold:      '#7a8aa8',
  },
};

/** Picker enablement — both palettes (bespoke template, picker-absent anyway). */
export const pilotEnabledPalettes: GranthPalette[] = [...granthPalettes];

/** Default palette when one is not yet persisted. */
export const defaultGranthPalette: GranthPalette = 'sinduri';

/**
 * Serialize per-palette overrides as `[data-palette="x"] { --paper: ...; ... }`
 * blocks, mounted on the SSR wrapper div / <html> by GranthThemeInjector /
 * GranthSSRTokens. The `[data-surface]` rules (tokens.ts) + every block reference
 * these vars.
 */
export function serializePaletteOverrides(
  configs: Record<GranthPalette, PaletteConfig> = granthPaletteConfigs
): string {
  return granthPalettes
    .map((id) => {
      const c = configs[id];
      return `[data-palette="${id}"]{--paper:${c.paper};--paper-2:${c.paper2};--ink:${c.ink};--ink-soft:${c.inkSoft};--accent:${c.accent};--accent-ink:${c.accentInk};--hairline:${c.hairline};--gold:${c.gold};}`;
    })
    .join('\n');
}
