// src/modules/templates/techpremium/sectionRules.ts
// TechPremium section surfaces. Unlike Meridian's uniform dark --ink, TechPremium
// is light-native warm paper with two dark "forest" brand bands (cta + footer).
// The renderer wraps each section in `<div data-surface={...}>`; the surface rules
// (tokens.ts) paint the background, so blocks must NOT paint their own full-bleed bg.

export type TechPremiumSurface = 'paper' | 'paper-2' | 'forest' | 'forest-d';

/**
 * Section type → background surface. The product audience's 7 sections, mapped to
 * TechPremium's light/dark rhythm: most on warm paper, the closing cta + footer on
 * dark forest. Explicit (not just a default) so per-section overrides have a home.
 */
export const techPremiumSectionSurfaces: Record<string, TechPremiumSurface> = {
  header:       'paper',
  hero:         'paper',
  features:     'paper',
  testimonials: 'paper-2',
  pricing:      'paper-2',
  cta:          'forest',
  footer:       'forest-d',
};

const surfaceVarMap: Record<TechPremiumSurface, string> = {
  'paper':    'var(--paper)',
  'paper-2':  'var(--paper-2)',
  'forest':   'var(--forest)',
  'forest-d': 'var(--forest-d)',
};

/** Resolve a TechPremiumSurface to its CSS variable expression. */
export function surfaceToVar(surface: TechPremiumSurface): string {
  return surfaceVarMap[surface];
}

/** Default surface for a section type. Falls back to `paper` when unknown. */
export function getSurfaceForSection(sectionType: string): TechPremiumSurface {
  return techPremiumSectionSurfaces[sectionType] ?? 'paper';
}
