// src/modules/service/uiblock/selectUIBlocksService.ts
// Deterministic UIBlock selection for the service route.
// Pilot scope: hardcoded mapping from PILOT_LAYOUT_NAMES.
//
// Phase 7+ replaces this with the full per-section heuristics from
// newServiceOnboarding.md §3 Step 9 (asset signals + LLM uiblockDecisions
// hints + service-type / awareness rhythm).

import { PILOT_LAYOUT_NAMES } from '@/modules/service/sections/serviceElementSchema';

export interface SelectServiceUIBlocksInput {
  sections: string[];
}

export interface SelectServiceUIBlocksOutput {
  uiblocks: Record<string, string>;
}

export function selectServiceUIBlocks(
  input: SelectServiceUIBlocksInput
): SelectServiceUIBlocksOutput {
  const uiblocks: Record<string, string> = {};

  for (const sectionType of input.sections) {
    const layout = PILOT_LAYOUT_NAMES[sectionType as keyof typeof PILOT_LAYOUT_NAMES];
    if (layout) {
      uiblocks[sectionType] = layout;
    }
    // Unknown section types are skipped — Phase 7+ adds optional sections.
  }

  return { uiblocks };
}
