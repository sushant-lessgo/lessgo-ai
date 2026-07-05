// src/modules/templates/vestria/imageKeywords.ts
// Template-scoped palette mood phrase (registry contract). Vestria v1 images are
// customer-uploaded (manual_preferred), so this is a minimal hint tuned to the
// manufacturing / trade vertical — no dependency on any audience query helper.

import type { VestriaPalette } from '@/types/product';

export const PALETTE_IMAGE_KEYWORDS: Record<VestriaPalette, string> = {
  cobalt: 'manufacturing workshop editorial clean industrial teams',
};

export function getVestriaImageQuery(query: string, paletteId?: VestriaPalette): string {
  const phrase = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return [query, phrase].filter(Boolean).join(' ').trim();
}
