// src/modules/templates/granth/sectionRules.ts
// Granth section surface rhythm. Ivory-paper system with paper-2 raised bands for
// About / Writing (the "page" card sits on paper-2 per the HTML). The published
// renderer wraps each section in `<div data-surface="...">`; blocks must NOT paint
// their own full-bleed section background (let the surface wrapper do it).
// Source of truth: template-design/WRDirection1Granth.html section backgrounds.

export type GranthSurface = 'paper' | 'paper-2';

/**
 * Section type → background surface. Covers all 6 Granth section types.
 * Lowercase single-token keys (§3g casing rule). Alternation from the HTML:
 *   hero(paper) · about(paper-2) · books(paper) · writing(paper-2) · praise(paper) · footer(paper)
 */
export const granthSectionSurfaces: Record<string, GranthSurface> = {
  hero:    'paper',
  about:   'paper-2',
  books:   'paper',
  writing: 'paper-2',
  praise:  'paper',
  footer:  'paper',
};

const surfaceVarMap: Record<GranthSurface, string> = {
  'paper':   'var(--paper)',
  'paper-2': 'var(--paper-2)',
};

/** Resolve a GranthSurface to its CSS variable expression. */
export function surfaceToVar(surface: GranthSurface): string {
  return surfaceVarMap[surface];
}

/** Default surface for a section type. Falls back to `paper` when unknown. */
export function getSurfaceForSection(sectionType: string): GranthSurface {
  return granthSectionSurfaces[sectionType] ?? 'paper';
}
