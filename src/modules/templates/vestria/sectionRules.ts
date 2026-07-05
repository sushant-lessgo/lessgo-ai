// src/modules/templates/vestria/sectionRules.ts
// Vestria section surface rhythm. Paper system with paper-2 raised bands and two
// dark editorial bands (about, testimonials) + the dark-2 footer. The published
// renderer wraps each section in `<div data-surface="...">`; blocks must NOT
// paint their own full-bleed section background. Source of truth:
// "Vestria - Uniform Manufacturing (Cobalt).html" section backgrounds.

export type VestriaSurface = 'paper' | 'paper-2' | 'dark' | 'dark-2';

/**
 * Section type → background surface. Covers all 12 Vestria section types.
 * Lowercase single-token keys (§3g casing rule). From the mock:
 *   header/hero/industries/features/process/contact → paper
 *   trust(.clients) / catalog(.pad-sm paper-2) / materials(.fabric) → paper-2
 *   about(.about) / testimonials(.testi) → dark · footer(.foot) → dark-2
 */
export const vestriaSectionSurfaces: Record<string, VestriaSurface> = {
  header:       'paper',
  hero:         'paper',
  trust:        'paper-2',
  industries:   'paper',
  about:        'dark',
  features:     'paper',
  catalog:      'paper-2',
  materials:    'paper-2',
  process:      'paper',
  testimonials: 'dark',
  contact:      'paper',
  footer:       'dark-2',
};

const surfaceVarMap: Record<VestriaSurface, string> = {
  'paper':   'var(--paper)',
  'paper-2': 'var(--paper-2)',
  'dark':    'var(--dark)',
  'dark-2':  'var(--dark-2)',
};

/** Resolve a VestriaSurface to its CSS variable expression. */
export function surfaceToVar(surface: VestriaSurface): string {
  return surfaceVarMap[surface];
}

/** Default surface for a section type. Falls back to `paper` when unknown. */
export function getSurfaceForSection(sectionType: string): VestriaSurface {
  return vestriaSectionSurfaces[sectionType] ?? 'paper';
}
