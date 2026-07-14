// src/modules/templates/atelier/imageKeywords.ts
// Template-scoped palette mood phrase (registry contract). Atelier images are
// customer-uploaded (manual_preferred), so this is a minimal hint tuned to the
// visual-portfolio / photography vertical.

import type { AtelierPalette } from '@/types/service';

export const PALETTE_IMAGE_KEYWORDS: Record<AtelierPalette, string> = {
  vermilion: 'photography portfolio editorial warm gallery craft',
  cobalt:    'photography portfolio editorial cool gallery refined',
  moss:      'photography portfolio editorial natural gallery muted',
  ochre:     'photography portfolio editorial golden gallery earthy',
};

export function getAtelierImageQuery(query: string, paletteId?: AtelierPalette): string {
  const phrase = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return [query, phrase].filter(Boolean).join(' ').trim();
}
