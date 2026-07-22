// src/modules/templates/techpremium/imageKeywords.ts
// Template-scoped (TechPremium) palette mood phrases for the editor image search.
// TechPremium is light, warm, industrial-IoT / control-room, so phrases lean
// toward real hardware installs and field photography (not stocky tech gradients).

import type { TechPremiumPalette } from '@/types/product';

export const PALETTE_IMAGE_KEYWORDS: Record<TechPremiumPalette, string> = {
  forest: 'industrial IoT hardware install warm natural light',
  harbor: 'industrial IoT hardware install cool marine daylight',
};

/**
 * Append the palette mood phrase to an image query. Returns the trimmed combined
 * phrase (mirrors getMeridianImageQuery's shape).
 */
export function getTechPremiumImageQuery(query: string, paletteId?: TechPremiumPalette): string {
  const palettePhrase = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return [query, palettePhrase].filter(Boolean).join(' ').trim();
}
