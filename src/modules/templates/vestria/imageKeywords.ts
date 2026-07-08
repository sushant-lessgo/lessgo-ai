// src/modules/templates/vestria/imageKeywords.ts
// Template-scoped palette mood phrase (registry contract). Vestria v1 images are
// customer-uploaded (manual_preferred), so this is a minimal hint tuned to the
// manufacturing / trade vertical — no dependency on any audience query helper.

import type { VestriaPalette } from '@/types/product';

export const PALETTE_IMAGE_KEYWORDS: Record<VestriaPalette, string> = {
  cobalt:    'manufacturing workshop editorial clean industrial teams',
  brass:     'manufacturing atelier editorial warm craft workmanship',
  emerald:   'manufacturing facility editorial clean sustainable production',
  safety:    'manufacturing floor editorial hi-vis industrial workwear',
  claret:    'manufacturing heritage editorial tailoring craft workshop',
  teal:      'manufacturing lab editorial clean technical production',
  aubergine: 'manufacturing studio editorial refined textile craft',
  indigo:    'manufacturing plant editorial denim textile industrial',
};

/**
 * Palette → scoring scalars for `pickBestImage` (fetchImages.ts). Hand-authored so
 * scoring is deterministic and reviewable (no runtime OKLCH→HSL conversion). Vestria
 * pages are bone/light throughout → every entry is `mode:'light'`. Temperature follows
 * the accent family; `baseColor` is a hex approximation of each accent.
 */
export const PALETTE_IMAGE_PROFILES: Record<
  VestriaPalette,
  { mode: 'light' | 'dark'; temperature: 'cool' | 'neutral' | 'warm'; baseColor: string }
> = {
  cobalt:    { mode: 'light', temperature: 'cool',    baseColor: '#2f5fe0' },
  brass:     { mode: 'light', temperature: 'warm',    baseColor: '#b08a3c' },
  emerald:   { mode: 'light', temperature: 'cool',    baseColor: '#1f8a5b' },
  safety:    { mode: 'light', temperature: 'warm',    baseColor: '#e8632a' },
  claret:    { mode: 'light', temperature: 'warm',    baseColor: '#8f2d3f' },
  teal:      { mode: 'light', temperature: 'cool',    baseColor: '#14807f' },
  aubergine: { mode: 'light', temperature: 'neutral', baseColor: '#5b3a5a' },
  indigo:    { mode: 'light', temperature: 'cool',    baseColor: '#3a3f8f' },
};

export function getVestriaImageQuery(query: string, paletteId?: VestriaPalette): string {
  const phrase = paletteId ? PALETTE_IMAGE_KEYWORDS[paletteId] ?? '' : '';
  return [query, phrase].filter(Boolean).join(' ').trim();
}
