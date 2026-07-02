// src/modules/templates/surge/imageKeywords.ts
// Template-scoped (Surge) palette mood phrases, layered on top of the type-scoped
// service hint. Surge skews data-forward / modern / kinetic regardless of hue.

import type { SurgePalette } from '@/types/service';
import { getServiceImageQuery } from '@/modules/audience/service/imageKeywords';

export const PALETTE_IMAGE_KEYWORDS: Record<SurgePalette, string> = {
  volt:    'electric modern data-driven',
  azure:   'confident blue corporate modern',
  cyan:    'fresh analytical clean tech',
  teal:    'calm growth modern',
  violet:  'premium modern creative',
  magenta: 'bold creative vibrant',
  coral:   'warm energetic dynamic',
  amber:   'optimistic bright energetic',
  lime:    'fresh kinetic high-growth',
};

export function getSurgeImageQuery(
  query: string,
  serviceType?: string,
  paletteId?: SurgePalette,
): string {
  const palettePhrase = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return getServiceImageQuery(query, serviceType, palettePhrase);
}
