// src/modules/templates/hearth/imageKeywords.ts
// Template-scoped (Hearth) palette mood phrases, layered on top of the
// type-scoped service hint. Each future template ships its own palette map
// without touching audience-level code.

import type { HearthPalette } from '@/types/service';
import { getServiceImageQuery } from '@/modules/audience/service/imageKeywords';

export const PALETTE_IMAGE_KEYWORDS: Record<HearthPalette, string> = {
  terracotta: 'warm earthy natural',
  ochre:      'warm golden artisanal',
  rose:       'soft pink natural minimal',
  moss:       'earthy green natural',
  sage:       'soft green calm natural',
  plum:       'rich muted moody',
  indigo:     'cool muted professional',
  teal:       'cool muted modern',
  charcoal:   'moody muted refined',
};

export function getHearthImageQuery(
  query: string,
  serviceType?: string,
  paletteId?: HearthPalette,
): string {
  const palettePhrase = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return getServiceImageQuery(query, serviceType, palettePhrase);
}
