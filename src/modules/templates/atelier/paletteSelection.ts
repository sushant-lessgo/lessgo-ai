// src/modules/templates/atelier/paletteSelection.ts
// The picker/registry contract expects inferDefaultPalette(...); it stays the
// vermilion stub (the accent family is user-picked cosmetics, not
// business-context-inferred). Revisit only if a heuristic is explicitly requested.

import type { AtelierPalette } from '@/types/service';
import { defaultAtelierPalette } from './palettes';

export function inferDefaultPalette(_understanding?: unknown): AtelierPalette {
  return defaultAtelierPalette; // 'vermilion'
}
