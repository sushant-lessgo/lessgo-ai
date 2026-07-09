// src/modules/templates/lumen/paletteSelection.ts
// Lumen ships a single brass palette (bespoke). The picker/registry contract
// still expects an inferDefaultPalette(understanding) — it always returns brass.

import type { LumenPalette } from '@/types/service';
import { defaultLumenPalette } from './palettes';
import type { ServiceUnderstanding } from '@/types/service';

export function inferDefaultPalette(
  _understanding: ServiceUnderstanding | null
): LumenPalette {
  return defaultLumenPalette; // 'brass' — the one accent knob
}
