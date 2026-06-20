// hooks/editStore/archetypes.ts — page-slice builders for Phase 3 collections.
//
// Phase 1's addPage only CLONES the home slice; collections need purpose-built
// pages. These builders emit body-only PageSlices of freshly-id'd sections seeded
// with sensible defaults. Layout names are the Meridian product schema keys
// (audience-level, shared by all product templates). Phase 4 swaps the section
// lists / seeds for the fully designed blocks — this file is the single swap point.

import type { PageSlice, SectionData } from '@/types/store';

const rid = (p: string): string => `${p}${Math.random().toString(36).slice(2, 8)}`;
const sectionId = (type: string): string => `${type}-${Math.random().toString(36).slice(2, 10)}`;

/** Minimal section-data factory (renderer needs id/type/layout/elements). */
function section(id: string, type: string, layout: string, elements: Record<string, any>): SectionData {
  return {
    id,
    type,
    layout,
    elements,
    isVisible: true,
    backgroundType: 'theme',
    aiMetadata: { aiGenerated: false, lastGenerated: Date.now(), isCustomized: false, aiGeneratedElements: [], excludedElements: [] },
  } as unknown as SectionData;
}

/** Default catalog categories (naayom's three lines; renamable/reorderable in-editor). */
export const DEFAULT_PRODUCT_CATEGORIES = [
  { id: 'controllers', title: 'Growing-room controllers', label: 'Full-room automation' },
  { id: 'control', title: 'Control systems', label: 'Equipment drive & switching' },
  { id: 'monitors', title: 'Monitors', label: 'Sense & alert' },
];

function ctaSection(): { id: string; data: SectionData } {
  const id = sectionId('cta');
  return {
    id,
    data: section(id, 'cta', 'ArcCTA', {
      eyebrow: 'Talk to us',
      headline: 'Spec it for your <em>farm.</em>',
      body: 'Tell us your setup — we’ll confirm the wiring, commission on site, and walk through the numbers. No pricing pressure, just a plan.',
      cta_text: 'Book a demo',
      secondary_cta_text: 'Chat on WhatsApp',
    }),
  };
}

function slice(secs: Array<{ id: string; data: SectionData }>): PageSlice {
  const sections = secs.map((s) => s.id);
  const sectionLayouts: Record<string, string> = {};
  const content: Record<string, SectionData> = {};
  for (const s of secs) {
    sectionLayouts[s.id] = (s.data as any).layout;
    content[s.id] = s.data;
  }
  return { sections, sectionLayouts, sectionSpacing: {}, content };
}

/** Catalog singleton page: one `catalog` section (seeded categories) + closing cta. */
export function buildCatalogSlice(): PageSlice {
  const catId = sectionId('catalog');
  const catalog = {
    id: catId,
    data: section(catId, 'catalog', 'ProductCatalogList', {
      eyebrow: 'Products',
      headline: 'The product <em>catalog.</em>',
      lede: 'Everything on one platform — every unit talks to the same dashboard.',
      categories: DEFAULT_PRODUCT_CATEGORIES.map((c) => ({ ...c })),
      items: [],
    }),
  };
  return slice([catalog, ctaSection()]);
}

/** Product-detail (collection item) page: one `productdetail` record section + closing cta. */
export function buildProductDetailSlice(opts: { title?: string; categoryId?: string } = {}): PageSlice {
  const name = opts.title?.trim() || 'New product';
  const pdId = sectionId('productdetail');
  const detail = {
    id: pdId,
    data: section(pdId, 'productdetail', 'ProductDetailRecord', {
      model: '',
      name,
      category: opts.categoryId || DEFAULT_PRODUCT_CATEGORIES[0].id,
      oneLiner: '',
      lede: '',
      cardSpec: '',
      enquireText: `Enquire about ${name}`,
      whatsappText: 'Ask on WhatsApp',
      note: 'Sales-led — we spec the unit to your rooms. No online pricing.',
      images: [{ id: rid('img'), src: '', tag: `${name} — product photo` }],
      badges: [],
      features: [],
      specs: [],
      related: [],
    }),
  };
  return slice([detail, ctaSection()]);
}
