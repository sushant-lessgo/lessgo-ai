// src/modules/templates/meridian/imageKeywords.ts
// Template-scoped (Meridian) palette mood phrases for the editor image search.
// Meridian is dark-native modern-tech, so phrases lean technical / high-contrast.
// Self-contained for now; an audience/product hint layer can wrap this in P3
// (mirrors how Hearth layers on getServiceImageQuery).

import type { MeridianPalette } from '@/types/product';

export const PALETTE_IMAGE_KEYWORDS: Record<MeridianPalette, string> = {
  mint:   'dark tech mint accent minimal',
  cyan:   'dark tech cyan accent minimal',
  blue:   'dark tech blue accent minimal',
  violet: 'dark tech violet accent minimal',
  rose:   'dark tech rose accent minimal',
  orange: 'dark tech orange accent minimal',
  amber:  'dark tech amber accent minimal',
  lime:   'dark tech lime accent minimal',
  bone:   'dark tech monochrome minimal',
};

/**
 * Append the palette mood phrase to an image query. Kept simple (no audience
 * hint layer yet) — returns the trimmed combined phrase.
 */
export function getMeridianImageQuery(query: string, paletteId?: MeridianPalette): string {
  const palettePhrase = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return [query, palettePhrase].filter(Boolean).join(' ').trim();
}
