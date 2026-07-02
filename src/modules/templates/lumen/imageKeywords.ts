// src/modules/templates/lumen/imageKeywords.ts
// Template-scoped (Lumen) palette mood phrase, layered on the type-scoped service
// hint. Lumen is a photography/creative template — editorial, warm, gallery.

import type { LumenPalette } from '@/types/service';
import { getServiceImageQuery } from '@/modules/audience/service/imageKeywords';

export const PALETTE_IMAGE_KEYWORDS: Record<LumenPalette, string> = {
  brass: 'editorial warm gallery photography',
};

export function getLumenImageQuery(
  query: string,
  serviceType?: string,
  paletteId?: LumenPalette,
): string {
  const palettePhrase = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return getServiceImageQuery(query, serviceType, palettePhrase);
}
