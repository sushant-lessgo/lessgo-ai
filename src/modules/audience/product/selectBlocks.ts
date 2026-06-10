// src/modules/audience/product/selectBlocks.ts
// Section type → Meridian block layout name (P3, pilot = fixed 1:1 map).
// Mirror of audience/service/selectUIBlocks.ts. The map itself is the single
// source of truth MERIDIAN_LAYOUT_NAMES, already declared next to the element
// schema (audience/product/elementSchema.ts). Heuristic/awareness block choice
// is a later phase.

import { MERIDIAN_LAYOUT_NAMES } from './elementSchema';

export interface SelectProductBlocksInput {
  sections: string[];
}

export interface SelectProductBlocksOutput {
  uiblocks: Record<string, string>;
}

export function selectProductBlocks(
  input: SelectProductBlocksInput
): SelectProductBlocksOutput {
  const map = MERIDIAN_LAYOUT_NAMES as Record<string, string>;
  const uiblocks: Record<string, string> = {};
  for (const section of input.sections) {
    const layout = map[section];
    if (layout) uiblocks[section] = layout;
  }
  return { uiblocks };
}
