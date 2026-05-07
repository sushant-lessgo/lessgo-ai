// src/modules/service/strategy/sectionSelectionService.ts
// Deterministic section selection for the service route.
// Pilot scope: hardcoded to a trimmed search-aware-comparing template
// (Header → Hero → Services → [Testimonials?] → Packages → CTA → Footer).
//
// Phase 7+ replaces this with the full 4-template logic from
// newServiceOnboarding.md §3 Step 8 (cold / comparing / referral / warming)
// plus optional-section gating (Problem, Transformation, IndustriesServed,
// Outcomes, CaseStudies, Process, Approach, ClientLogos, FAQ, ObjectionHandle,
// TeamAndFounder placement).
//
// CASING CONTRACT (locked Phase 4): sectionType strings are lowercase
// camelCase end-to-end — emitted here, consumed by selectServiceUIBlocks
// (PILOT_LAYOUT_NAMES keys), buildServiceCopyPrompt (LLM is instructed to
// echo the same keys), processServiceCopy (uiblocks key iteration),
// resolveServiceBlock, and the wizard GeneratingStep when assembling
// finalContent. No `.toLowerCase()` defensive layer downstream — the
// authoritative key is whatever this function emits. Phase 7+ awareness
// templates MUST preserve lowercase camelCase (e.g. 'teamAndFounder',
// 'caseStudies', 'objectionHandle', 'industriesServed', 'clientLogos').

import type { ServiceAwareness, ServiceAssetInput, ServiceGoal } from '@/types/service';

export interface ServiceSectionSelectionInput {
  awareness: ServiceAwareness;
  goal: ServiceGoal;
  assets: ServiceAssetInput;
}

/**
 * Pilot section list — section types in render order (camelCase, matches
 * hearthSectionSurfaces keys).
 */
export function selectServiceSections(input: ServiceSectionSelectionInput): string[] {
  const { assets } = input;

  // TODO Phase 7+: branch on input.awareness across all 4 templates,
  // gate Problem/Transformation/Approach/etc. via sectionDecisions, and
  // place TeamAndFounder per awareness mode.
  const sections: string[] = ['header', 'hero', 'services'];

  if (assets.hasTestimonials) {
    sections.push('testimonials');
  }

  sections.push('packages', 'cta', 'footer');

  return sections;
}
