// src/modules/templates/meridian/sectionRules.ts
// Meridian section surfaces. Unlike Hearth's alternating cream bands, Meridian
// is dark-native and uniform: every section sits on `--ink`, and elevation comes
// from hairlines (--line) + raised card surfaces (--ink-1/--ink-2) inside blocks,
// not from band alternation. Same function shape as Hearth so the renderers'
// `getSurfaceForSection` call sites work unchanged.

export type MeridianSurface = 'ink' | 'ink-1' | 'ink-2';

/**
 * Section type → background surface. Meridian's 7 pilot sections are all on the
 * base `ink` surface; the table is explicit (not just a default) so future
 * per-section overrides have an obvious home.
 */
export const meridianSectionSurfaces: Record<string, MeridianSurface> = {
  header:       'ink',
  hero:         'ink',
  features:     'ink',
  testimonials: 'ink',
  pricing:      'ink',
  cta:          'ink',
  footer:       'ink',
};

const surfaceVarMap: Record<MeridianSurface, string> = {
  'ink':   'var(--ink)',
  'ink-1': 'var(--ink-1)',
  'ink-2': 'var(--ink-2)',
};

/** Resolve a MeridianSurface to its CSS variable expression. */
export function surfaceToVar(surface: MeridianSurface): string {
  return surfaceVarMap[surface];
}

/** Default surface for a section type. Falls back to `ink` when unknown. */
export function getSurfaceForSection(sectionType: string): MeridianSurface {
  return meridianSectionSurfaces[sectionType] ?? 'ink';
}
