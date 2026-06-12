// src/modules/templates/lex/sectionRules.ts
// Lex section surface rhythm — alternates paper / paper-1 / paper-2.
// Lex is restrained: subtle band shifts, not bold color changes. Blocks that
// want a dark trust-hue ground (e.g. the engraved CTA) paint it inside their
// own scoped CSS — the wrapper surface stays paper-family.

export type LexSurface = 'paper' | 'paper-1' | 'paper-2';

/**
 * Section type → background surface. Keys cover the service section types;
 * unknown types fall back to `paper`.
 */
export const lexSectionSurfaces: Record<string, LexSurface> = {
  header:           'paper',
  hero:             'paper',
  services:         'paper-1',   // practice grid — band shift
  approach:         'paper',
  process:          'paper-1',
  outcomes:         'paper',
  caseStudies:      'paper-1',
  testimonials:     'paper-2',   // letters of reference
  clientLogos:      'paper',
  teamAndFounder:   'paper',
  industriesServed: 'paper-1',
  packages:         'paper',     // fee schedule
  objectionHandle:  'paper-1',
  faq:              'paper',
  problem:          'paper-1',
  transformation:   'paper-1',
  cta:              'paper-1',    // engraved invitation
  footer:           'paper-2',
};

const surfaceVarMap: Record<LexSurface, string> = {
  'paper':   'var(--paper)',
  'paper-1': 'var(--paper-1)',
  'paper-2': 'var(--paper-2)',
};

/** Resolve a LexSurface to its CSS variable expression. */
export function surfaceToVar(surface: LexSurface): string {
  return surfaceVarMap[surface];
}

/** Default surface for a section type. Falls back to `paper` when unknown. */
export function getSurfaceForSection(sectionType: string): LexSurface {
  return lexSectionSurfaces[sectionType] ?? 'paper';
}
