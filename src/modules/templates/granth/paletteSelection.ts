// src/modules/templates/granth/paletteSelection.ts
// Granth is seeded white-glove (no generation/understanding). The picker/registry
// contract still expects inferDefaultPalette(...) — it always returns sinduri.

import type { GranthPalette } from '@/types/service';
import { defaultGranthPalette } from './palettes';

export function inferDefaultPalette(_understanding?: unknown): GranthPalette {
  return defaultGranthPalette; // 'sinduri' — ivory + maroon
}
