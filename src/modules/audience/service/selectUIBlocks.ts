// src/modules/service/uiblock/selectUIBlocksService.ts
// Deterministic UIBlock selection for the service route.
// Pilot scope: hardcoded mapping from PILOT_LAYOUT_NAMES.
//
// Phase 7+ replaces this with the full per-section heuristics from
// docs/architecture/newServiceOnboarding.md §3 Step 9 (asset signals + LLM uiblockDecisions
// hints + service-type / awareness rhythm).

import { PILOT_LAYOUT_NAMES } from './elementSchema';
import type { TemplateId } from '@/types/service';
import { selectEligibleBlock, type AssetFacts } from '@/modules/generation/blockEligibility';

export interface SelectServiceUIBlocksInput {
  sections: string[];
  /**
   * The chosen template. Used ONLY to pick among multiple UIBlocks a template
   * registers for the same section type. FIREWALL-SAFE: this runs at generation
   * (assembleServiceStrategy / mock), upstream of and never inside a prompt
   * builder. The chosen layout is persisted in the stored section content.
   */
  templateId?: TemplateId | null;
  /**
   * scale-09 phase 4 — OPTIONAL deterministic selection signals. When a manifest
   * entry exists for (templateId, section) the eligibility filter uses these;
   * absent ⇒ the section's declared default.
   */
  cardCountHints?: Record<string, number>;
  assetFacts?: AssetFacts;
}

export interface SelectServiceUIBlocksOutput {
  uiblocks: Record<string, string>;
}

/**
 * Deterministic UIBlock selection. When the block manifest declares blocks for
 * (templateId, section) the eligibility filter picks one (default unless a
 * signal makes it ineligible — see blockEligibility.selectEligibleBlock); else
 * the legacy PILOT_LAYOUT_NAMES map. Surge testimonials resolve through the
 * manifest default (`ReviewGrid`) — deterministic, no Math.random.
 */
export function selectServiceUIBlocks(
  input: SelectServiceUIBlocksInput
): SelectServiceUIBlocksOutput {
  const uiblocks: Record<string, string> = {};

  for (const sectionType of input.sections) {
    // Manifest-driven pick when a declaration exists; else the legacy name map.
    const manifestPick = selectEligibleBlock(input.templateId, sectionType, {
      cardCountHint: input.cardCountHints?.[sectionType],
      assetFacts: input.assetFacts,
    });
    const layout =
      manifestPick ?? PILOT_LAYOUT_NAMES[sectionType as keyof typeof PILOT_LAYOUT_NAMES];
    if (layout) {
      uiblocks[sectionType] = layout;
    }
    // Unknown section types are skipped.
  }

  return { uiblocks };
}
