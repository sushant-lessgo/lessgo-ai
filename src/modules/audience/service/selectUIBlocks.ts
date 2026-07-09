// src/modules/service/uiblock/selectUIBlocksService.ts
// Deterministic UIBlock selection for the service route.
// Pilot scope: hardcoded mapping from PILOT_LAYOUT_NAMES.
//
// Phase 7+ replaces this with the full per-section heuristics from
// docs/architecture/newServiceOnboarding.md §3 Step 9 (asset signals + LLM uiblockDecisions
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
 *
 * Surge registers two testimonials blocks (ReviewGrid, PullQuoteWithMark).
 * Selection is DETERMINISTIC (no Math.random): pick by testimonial count when a
 * hint is available, else the fixed default `ReviewGrid` (multi-proof suits the
 * growth archetype). The full manifest-driven default + eligibility filter lands
 * in later scale-09 phases; this only removes nondeterminism.
 */
const SURGE_TESTIMONIALS_DEFAULT = 'ReviewGrid';

function pickTemplateLayout(templateId: TemplateId | null | undefined, sectionType: string): string | null {
  if (templateId === 'surge' && sectionType === 'testimonials') {
    return SURGE_TESTIMONIALS_DEFAULT;
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
