// src/modules/templates/vestria/paletteSelection.ts
// Single palette v1 — the picker/registry contract still expects
// inferDefaultPalette(...); it always returns cobalt until the family grows.

import type { VestriaPalette } from '@/types/product';
import { defaultVestriaPalette } from './palettes';

export function inferDefaultPalette(_understanding?: unknown): VestriaPalette {
  return defaultVestriaPalette; // 'cobalt'
}
