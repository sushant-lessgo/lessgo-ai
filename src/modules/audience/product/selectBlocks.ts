// src/modules/audience/product/selectBlocks.ts
// Section type → Meridian block layout name (P3, pilot = fixed 1:1 map).
// Mirror of audience/service/selectUIBlocks.ts. The map itself is the single
// source of truth MERIDIAN_LAYOUT_NAMES, already declared next to the element
// schema (audience/product/elementSchema.ts). Heuristic/awareness block choice
// is a later phase.

import { MERIDIAN_LAYOUT_NAMES, VESTRIA_LAYOUT_NAMES } from './elementSchema';
import { selectEligibleBlock, type AssetFacts } from '@/modules/generation/blockEligibility';

export interface SelectProductBlocksInput {
  sections: string[];
  templateId?: string;
  /**
   * scale-09 phase 4 — OPTIONAL deterministic selection signals. When a manifest
   * entry exists for (templateId, section) the eligibility filter uses these;
   * absent ⇒ the section's declared default (identical to the legacy name map).
   */
  cardCountHints?: Record<string, number>;
  assetFacts?: AssetFacts;
}

export interface SelectProductBlocksOutput {
  uiblocks: Record<string, string>;
}

// Template dispatch as DATA (scale-08 phase 2 — no `===` literal): section→
// layout map per product template. Any template without an entry defaults to
// the Meridian pilot map below.
const LAYOUTS_BY_TEMPLATE: Record<string, Record<string, string>> = {
  vestria: VESTRIA_LAYOUT_NAMES as Record<string, string>,
};

export function selectProductBlocks(
  input: SelectProductBlocksInput
): SelectProductBlocksOutput {
  const map =
    (input.templateId ? LAYOUTS_BY_TEMPLATE[input.templateId] : undefined) ??
    (MERIDIAN_LAYOUT_NAMES as Record<string, string>);
  const uiblocks: Record<string, string> = {};
  for (const section of input.sections) {
    // Manifest-driven pick when a declaration exists; else the legacy name map.
    const manifestPick = selectEligibleBlock(input.templateId, section, {
      cardCountHint: input.cardCountHints?.[section],
      assetFacts: input.assetFacts,
    });
    const layout = manifestPick ?? map[section];
    if (layout) uiblocks[section] = layout;
  }
  return { uiblocks };
}
