// src/modules/templates/lumen/sectionRules.ts
// Lumen section surface rhythm. Light warm-paper system with two dark espresso
// bands (process + footer) for contrast. The published renderer wraps each
// section in `<div data-surface="...">`; blocks must NOT paint their own
// full-bleed section background (let the surface wrapper do it).
// Source of truth: Lumen HTML section backgrounds.

export type LumenSurface = 'paper' | 'paper-2' | 'esp' | 'esp-d';

/**
 * Section type → background surface. Covers all 9 Lumen section types.
 * Lowercase single-token keys (§3g casing rule).
 */
export const lumenSectionSurfaces: Record<string, LumenSurface> = {
  header:    'paper',
  hero:      'paper',
  logos:     'paper-2',  // client-type strip band
  services:  'paper',
  process:   'esp',      // dark band — "how a shoot works"
  portfolio: 'paper',
  about:     'paper-2',  // about sits on a subtle band per HTML
  contact:   'paper-2',
  footer:    'esp-d',    // dark footer
};

const surfaceVarMap: Record<LumenSurface, string> = {
  'paper':   'var(--paper)',
  'paper-2': 'var(--paper-2)',
  'esp':     'var(--esp)',
  'esp-d':   'var(--esp-d)',
};

/** Resolve a LumenSurface to its CSS variable expression. */
export function surfaceToVar(surface: LumenSurface): string {
  return surfaceVarMap[surface];
}

/** Default surface for a section type. Falls back to `paper` when unknown. */
export function getSurfaceForSection(sectionType: string): LumenSurface {
  return lumenSectionSurfaces[sectionType] ?? 'paper';
}
