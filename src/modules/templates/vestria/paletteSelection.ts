// src/modules/templates/vestria/paletteSelection.ts
// The picker/registry contract expects inferDefaultPalette(...); it DELIBERATELY
// stays the cobalt stub (Phase 5 decision — conservative: the accent family is
// user-picked cosmetics, not business-context-inferred). Revisit only if a
// heuristic is explicitly requested.

import type { VestriaPalette } from '@/types/product';
import { defaultVestriaPalette } from './palettes';

export function inferDefaultPalette(_understanding?: unknown): VestriaPalette {
  return defaultVestriaPalette; // 'cobalt'
}
