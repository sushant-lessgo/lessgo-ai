// src/modules/audience/product/sectionSelection.ts
// Fixed pilot section list for Meridian product pages (P3).
//
// Mirror of audience/service/sectionSelection.ts, but FLAT for the pilot: no
// awareness routing, no asset gating — the 7 Meridian blocks always render in
// this order (meridianPlan.md: "Fixed now, awareness-engine later"). The
// awareness → section-sequence engine is re-introduced in P7. Signature kept
// trivial so it can widen without changing call sites.

export const MERIDIAN_PILOT_SECTIONS = [
  'header',
  'hero',
  'features',
  'testimonials',
  'pricing',
  'cta',
  'footer',
] as const;

export function selectProductSections(): string[] {
  return [...MERIDIAN_PILOT_SECTIONS];
}
