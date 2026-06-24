// src/modules/templates/surge/sectionRules.ts
// Surge section surface rhythm. Surge is a light cool-slate system with two dark
// `panel` bands (stats + footer) for contrast. The published renderer wraps each
// section in `<div data-surface="...">`; blocks must NOT paint their own full-bleed
// section background.
// Source of truth: Surge HTML section backgrounds.

export type SurgeSurface = 'bg' | 'bg-1' | 'surface' | 'panel';

/**
 * Section type → background surface. Covers all 11 Surge section types (7 shared
 * service + 4 Surge-only delta). Lowercase single-token keys (§3g casing rule).
 */
export const surgeSectionSurfaces: Record<string, SurgeSurface> = {
  // 7 shared service sections
  header:       'surface',
  hero:         'bg',
  services:     'bg',
  testimonials: 'bg',
  packages:     'bg-1',
  cta:          'bg-1',     // book-an-audit band (contact-band → bg-1)
  footer:       'panel',    // dark slate footer
  // 4 Surge-only delta sections
  logos:        'bg-1',     // logo strip band
  about:        'bg',
  casestudies:  'bg',
  stats:        'panel',    // dark stats band — the signature contrast
};

const surfaceVarMap: Record<SurgeSurface, string> = {
  'bg':      'var(--bg)',
  'bg-1':    'var(--bg-1)',
  'surface': 'var(--surface)',
  'panel':   'var(--panel)',
};

/**
 * Resolve a SurgeSurface to its CSS variable expression.
 */
export function surfaceToVar(surface: SurgeSurface): string {
  return surfaceVarMap[surface];
}

/**
 * Default surface for a section type. Falls back to `bg` when unknown.
 */
export function getSurfaceForSection(sectionType: string): SurgeSurface {
  return surgeSectionSurfaces[sectionType] ?? 'bg';
}
