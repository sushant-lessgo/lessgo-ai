// src/modules/service/design/sectionRules.ts
// Hearth section surface rhythm — alternates cream / cream-1 / cream-2.
// Source of truth: newServiceOnboarding.md §5 "Section Rules (Hearth)".

export type HearthSurface = 'cream' | 'cream-1' | 'cream-2';

/**
 * Section type → background surface.
 * Keys cover the 17 service section types in the spec.
 * Editor allows per-section override (existing infra); these are defaults.
 */
export const hearthSectionSurfaces: Record<string, HearthSurface> = {
  header:           'cream',
  hero:             'cream',
  services:         'cream-2',     // band shift
  approach:         'cream',
  process:          'cream-2',
  outcomes:         'cream',
  caseStudies:      'cream-1',     // softer card-like band
  testimonials:     'cream-2',
  clientLogos:      'cream',
  teamAndFounder:   'cream',
  industriesServed: 'cream-2',
  packages:         'cream',
  objectionHandle:  'cream-2',
  faq:              'cream',
  problem:          'cream-2',
  transformation:   'cream-1',
  cta:              'cream',       // hero-like emphasis
  footer:           'cream-2',
};

const surfaceVarMap: Record<HearthSurface, string> = {
  'cream':   'var(--cream)',
  'cream-1': 'var(--cream-1)',
  'cream-2': 'var(--cream-2)',
};

/**
 * Resolve a HearthSurface to its CSS variable expression.
 */
export function surfaceToVar(surface: HearthSurface): string {
  return surfaceVarMap[surface];
}

/**
 * Default surface for a section type. Falls back to `cream` when unknown.
 */
export function getSurfaceForSection(sectionType: string): HearthSurface {
  return hearthSectionSurfaces[sectionType] ?? 'cream';
}
