// src/modules/collections/registry.ts — Collection definitions (Phase 3).
//
// A "collection" is a set of repeatable content pages (e.g. products): one
// catalog singleton page that auto-lists them + N collectionItem pages, each
// holding one structured record. This module is PURE DATA (no store/template
// imports) — the firewall convention shared with audience/*/elementSchema.ts.
//
// Categories (controllers/control/monitors for naayom) are NOT defined here —
// they live as editable content on the catalog block (`categories[]`) so they
// stay renamable/reorderable per project. This registry only fixes the page
// topology: base path, archetypes, and which section types carry the data.

export interface CollectionDef {
  key: string; // 'products'
  basePath: string; // '/products' — item slugs are basePath + '/' + slug
  label: string; // 'Products' (UI label)
  itemArchetypeKey: string; // archetypeKey stamped on item pages
  catalogArchetypeKey: string; // archetypeKey stamped on the catalog singleton
  catalogSectionType: string; // section type of the auto-listing block ('catalog')
  itemSectionType: string; // section type of the per-item record block ('productdetail')
}

export const COLLECTIONS: Record<string, CollectionDef> = {
  products: {
    key: 'products',
    basePath: '/products',
    label: 'Products',
    itemArchetypeKey: 'product-detail',
    catalogArchetypeKey: 'product-catalog',
    catalogSectionType: 'catalog',
    itemSectionType: 'productdetail',
  },
};

export function getCollectionDef(collectionKey: string): CollectionDef | undefined {
  return COLLECTIONS[collectionKey];
}
