// src/modules/audience/product/sectionSelection.ts
// Fixed pilot section list for Meridian product pages (P3).
//
// Mirror of audience/service/sectionSelection.ts, but FLAT for the pilot: no
// awareness routing, no asset gating — the 7 Meridian blocks always render in
// this order (docs/tracks/meridianPlan.md: "Fixed now, awareness-engine later"). The
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

// Vestria (GA manufacturing/trade lead-gen) home — full mock order. Flat like
// the Meridian pilot; the Phase-2 sitemap gate makes this per-page/editable.
export const VESTRIA_PILOT_SECTIONS = [
  'header',
  'hero',
  'trust',
  'industries',
  'about',
  'features',
  'catalog',
  'materials',
  'process',
  'testimonials',
  'contact',
  'footer',
] as const;

export interface SelectProductSectionsOptions {
  templateId?: string;
}

export function selectProductSections(opts?: SelectProductSectionsOptions): string[] {
  if (opts?.templateId === 'vestria') return [...VESTRIA_PILOT_SECTIONS];
  return [...MERIDIAN_PILOT_SECTIONS];
}
