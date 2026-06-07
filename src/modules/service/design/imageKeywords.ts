// src/modules/service/design/imageKeywords.ts
// Warm-leaning Pexels keyword suffixes for service projects. Appended to the
// raw user query before /api/images/search call. Phase 7 layered palette
// mood on top of the serviceType-keyed industry hint.
// Reference: newServiceOnboarding.md §5.serviceImageKeywords.

import type { HearthPalette } from '@/types/service';

export const SERVICE_IMAGE_KEYWORDS: Record<string, string> = {
  default:    'warm professional craft natural light',
  agency:     'studio workspace warm natural light',
  consulting: 'professional conversation warm office',
  coaching:   'people conversation warm sunlight',
  freelance:  'craft workspace warm natural light',
  beauty:     'beauty skincare natural minimal warm',
  food:       'food artisan craft natural',
  local:      'local artisan warm community',
};

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

export function getServiceImageQuery(
  query: string,
  serviceType?: string,
  paletteId?: HearthPalette,
): string {
  const serviceSuffix =
    SERVICE_IMAGE_KEYWORDS[serviceType ?? 'default'] ?? SERVICE_IMAGE_KEYWORDS.default;
  const paletteSuffix = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return `${query} ${serviceSuffix} ${paletteSuffix}`.replace(/\s+/g, ' ').trim();
}
