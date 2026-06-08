// src/modules/service/strategy/sectionSelectionService.ts
// Deterministic section selection for the service route.
//
// Phase 8: section order is routed by the LLM-inferred awareness state over the
// 6 pilot blocks (header, hero, services, testimonials, packages, cta, footer).
// No new section types — Problem/Transformation/Approach/CaseStudies/etc. stay
// on the Phase 9 hold (no blocks authored). `sectionDecisions` from the strategy
// LLM (includeProblem / includeTransformation / includeApproach) are preserved
// in the strategy output for analytics + future activation, but are NOT emitted
// here because no renderers exist for those sections yet.
//
// Regression safety: `search-aware-comparing` is held at the exact pilot-validated
// order (Phase 6 passed all gates on it). Only the three non-baseline states diverge
// structurally. The "trust early" intent for comparing is honored at the COPY layer
// via copyPrompt's getEmotionalContext, independent of section order.
//
// CASING CONTRACT (locked Phase 4): sectionType strings are lowercase
// camelCase end-to-end — emitted here, consumed by selectServiceUIBlocks
// (PILOT_LAYOUT_NAMES keys), buildServiceCopyPrompt (LLM is instructed to
// echo the same keys), processServiceCopy (uiblocks key iteration),
// resolveServiceBlock, and the wizard GeneratingStep when assembling
// finalContent. No `.toLowerCase()` defensive layer downstream — the
// authoritative key is whatever this function emits.

import type { ServiceAwareness, ServiceAssetInput, ServiceGoal } from '@/types/service';

export type ServicePresentationFormat = 'packages' | 'quote-only' | 'hybrid';

export interface ServiceSectionSelectionInput {
  awareness: ServiceAwareness;
  goal: ServiceGoal;
  assets: ServiceAssetInput;
  /** servicePresentation.format from strategy — `quote-only` drops the packages section. */
  format?: ServicePresentationFormat;
}

/**
 * Per-awareness ordering of the "middle" sections (between header and footer).
 * `testimonials` and `packages` are conditional and filtered downstream — they
 * appear here only to fix their RELATIVE position when present.
 */
const AWARENESS_MIDDLE_ORDER: Record<ServiceAwareness, string[]> = {
  // Pilot-validated baseline — do not change (regression-gated).
  'search-aware-comparing': ['hero', 'services', 'testimonials', 'packages', 'cta'],
  // Stranger: lead with strongest trust, then explain.
  'search-aware-cold':      ['hero', 'testimonials', 'services', 'packages', 'cta'],
  // Pre-trusted referral: lighter trust, lead toward the offer.
  'referral-driven':        ['hero', 'services', 'packages', 'testimonials', 'cta'],
  // Warm/known: not pitchy, lead with the offer; trust reinforces before CTA.
  'relationship-warming':   ['hero', 'packages', 'services', 'testimonials', 'cta'],
};

/**
 * Section types in render order (camelCase, matches hearthSectionSurfaces keys).
 */
export function selectServiceSections(input: ServiceSectionSelectionInput): string[] {
  const { awareness, assets, format } = input;

  const middle = AWARENESS_MIDDLE_ORDER[awareness] ?? AWARENESS_MIDDLE_ORDER['search-aware-comparing'];

  const showPackages = format !== 'quote-only';

  const body = middle.filter((sectionType) => {
    if (sectionType === 'testimonials') return assets.hasTestimonials;
    if (sectionType === 'packages') return showPackages;
    return true;
  });

  return ['header', ...body, 'footer'];
}
