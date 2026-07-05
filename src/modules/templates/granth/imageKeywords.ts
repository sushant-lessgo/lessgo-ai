// src/modules/templates/granth/imageKeywords.ts
// Template-scoped palette mood phrase. Granth v1 has no AI image generation
// (portraits/covers are uploaded), so this is a minimal self-contained hint for
// the registry contract — no dependency on any audience query helper.

import type { GranthPalette } from '@/types/service';

export const PALETTE_IMAGE_KEYWORDS: Record<GranthPalette, string> = {
  sinduri: 'literary editorial warm ivory portrait',
  neel:    'literary editorial cool study portrait',
};

export function getGranthImageQuery(query: string, paletteId?: GranthPalette): string {
  const phrase = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return [query, phrase].filter(Boolean).join(' ').trim();
}
