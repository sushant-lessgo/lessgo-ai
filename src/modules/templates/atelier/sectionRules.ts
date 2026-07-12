// src/modules/templates/atelier/sectionRules.ts
// Atelier section surface rhythm. Warm paper with a raised paper-2 band and a
// dark editorial quote band + dark-2 footer. The published renderer wraps each
// section in `<div data-surface="...">`; blocks must NOT paint their own
// full-bleed section background. Band alternation covers all 8 grammar section
// types (header/hero/work/packages/about/quote/contact/footer); final surface
// values lock against approved Kontur HTML in the phase-9 visual port.

export type AtelierSurface = 'paper' | 'paper-2' | 'dark' | 'dark-2';

/**
 * Section type → background surface. Lowercase single-token keys (§3g casing
 * rule; hyphen-free so extractSectionType round-trips). Covers all 8 Atelier
 * section types.
 */
export const atelierSectionSurfaces: Record<string, AtelierSurface> = {
  header:   'paper',
  hero:     'paper',
  work:     'paper',
  packages: 'paper-2',
  about:    'paper',
  quote:    'dark',
  contact:  'paper-2',
  footer:   'dark-2',
};

const surfaceVarMap: Record<AtelierSurface, string> = {
  'paper':   'var(--paper)',
  'paper-2': 'var(--paper-2)',
  'dark':    'var(--dark)',
  'dark-2':  'var(--dark-2)',
};

/** Resolve an AtelierSurface to its CSS variable expression. */
export function surfaceToVar(surface: AtelierSurface): string {
  return surfaceVarMap[surface];
}

/** Default surface for a section type. Falls back to `paper` when unknown. */
export function getSurfaceForSection(sectionType: string): AtelierSurface {
  return atelierSectionSurfaces[sectionType] ?? 'paper';
}
