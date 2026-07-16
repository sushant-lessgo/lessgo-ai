// src/modules/skeletons/work/sectionRules.ts
// Work-skeleton surface vocabulary + default section→surface map. A block core
// NEVER paints its own full-bleed section background; the published/edit renderer
// wraps each section in `<div data-surface="...">` and the surface rules
// (tokenContract's `[data-surface]` blocks) paint it. Which surface a given
// section type gets is a SKIN SELECTION (`skin.selections.surfaceBySection`) over
// this vocabulary — `getSurfaceForSection` reads the skin override first, then the
// skeleton default. Follows the granth/atelier `sectionRules.ts` shape.
//
// PURE DATA — no React, no template imports.

export type WorkSurface = 'paper' | 'paper-2' | 'dark' | 'accent';

/** The 4 surfaces the skeleton's token contract paints. */
export const WORK_SURFACES: WorkSurface[] = ['paper', 'paper-2', 'dark', 'accent'];

/**
 * Skeleton default section type → surface. A skin may override any entry via
 * `skin.selections.surfaceBySection`. Lowercase single-token keys. Covers the
 * work-core section types; unknown types fall back to `paper`.
 */
export const defaultWorkSectionSurfaces: Record<string, WorkSurface> = {
  header:   'paper',
  hero:     'paper',
  gallery:  'paper',
  proof:    'paper-2',
  packages: 'paper',
  about:    'paper-2',
  faq:      'paper',
  results:  'paper-2',
  contact:  'dark',
  footer:   'dark',
};

const surfaceVarMap: Record<WorkSurface, string> = {
  'paper':   'var(--wk-paper)',
  'paper-2': 'var(--wk-paper-2)',
  'dark':    'var(--wk-dark)',
  'accent':  'var(--wk-accent)',
};

/** Resolve a WorkSurface to its CSS variable expression. */
export function surfaceToVar(surface: WorkSurface): string {
  return surfaceVarMap[surface];
}

/**
 * Default surface for a section type, honouring a skin's per-section override.
 * Falls back to `paper` for unknown section types.
 */
export function getSurfaceForSection(
  sectionType: string,
  overrides?: Record<string, WorkSurface>,
): WorkSurface {
  const key = (sectionType || '').toLowerCase();
  return overrides?.[key] ?? defaultWorkSectionSurfaces[key] ?? 'paper';
}
