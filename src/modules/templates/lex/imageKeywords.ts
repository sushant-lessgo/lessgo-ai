// src/modules/templates/lex/imageKeywords.ts
// Template-scoped (Lex) palette mood phrases, layered on top of the type-scoped
// service hint. Lex leans cool / formal / institutional — the opposite of
// Hearth's warm-earthy moods. Mirrors hearth/imageKeywords.ts shape.

import type { LexPalette } from '@/types/service';
import { getServiceImageQuery } from '@/modules/audience/service/imageKeywords';

export const PALETTE_IMAGE_KEYWORDS: Record<LexPalette, string> = {
  counsel:  'cool navy professional formal',
  heritage: 'rich oxblood traditional refined',
  forest:   'deep green stately natural',
  slate:    'cool grey corporate minimal',
  vellum:   'muted sage understated archival',
  burgundy: 'deep wine premium classic',
  pacific:  'cool teal composed modern',
  court:    'dark monochrome austere formal',
  trust:    'midnight champagne premium refined',
};

export function getLexImageQuery(
  query: string,
  serviceType?: string,
  paletteId?: LexPalette,
): string {
  const palettePhrase = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return getServiceImageQuery(query, serviceType, palettePhrase);
}
