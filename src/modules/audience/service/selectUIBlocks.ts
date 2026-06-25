// src/modules/service/uiblock/selectUIBlocksService.ts
// Deterministic UIBlock selection for the service route.
// Pilot scope: hardcoded mapping from PILOT_LAYOUT_NAMES.
//
// Phase 7+ replaces this with the full per-section heuristics from
// newServiceOnboarding.md §3 Step 9 (asset signals + LLM uiblockDecisions
// hints + service-type / awareness rhythm).

import { PILOT_LAYOUT_NAMES } from './elementSchema';
import type { TemplateId } from '@/types/service';

export interface SelectServiceUIBlocksInput {
  sections: string[];
  /**
   * The chosen template. Used ONLY to pick among multiple UIBlocks a template
   * registers for the same section type. FIREWALL-SAFE: this runs at generation
   * (assembleServiceStrategy / mock), upstream of and never inside a prompt
   * builder. The chosen layout is persisted in the stored section content.
   */
  templateId?: TemplateId | null;
}

export interface SelectServiceUIBlocksOutput {
  uiblocks: Record<string, string>;
}

/**
 * Per-template layout choices that override / extend PILOT_LAYOUT_NAMES. Each
 * entry returns the chosen layout for a section type (may pick among variants).
 * Surge registers two testimonials blocks; pick one at generation (random for
 * now — stopgap until count/type-aware selection lands).
 */
function pickTemplateLayout(templateId: TemplateId | null | undefined, sectionType: string): string | null {
  if (templateId === 'surge' && sectionType === 'testimonials') {
    return Math.random() < 0.5 ? 'ReviewGrid' : 'PullQuoteWithMark';
  }
  return null;
}

export function selectServiceUIBlocks(
  input: SelectServiceUIBlocksInput
): SelectServiceUIBlocksOutput {
  const uiblocks: Record<string, string> = {};

  for (const sectionType of input.sections) {
    const override = pickTemplateLayout(input.templateId, sectionType);
    const layout = override || PILOT_LAYOUT_NAMES[sectionType as keyof typeof PILOT_LAYOUT_NAMES];
    if (layout) {
      uiblocks[sectionType] = layout;
    }
    // Unknown section types are skipped.
  }

  return { uiblocks };
}
