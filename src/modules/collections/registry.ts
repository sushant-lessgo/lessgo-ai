// src/modules/collections/registry.ts — Collection definitions (Phase 3, family: scale-10).
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
//
// FAMILY / FIREWALL (scale-10): the valid collection keys are EXACTLY the
// collection-family capabilityIds — products · services · case-studies · works
// (`locations` is reserved for P3). `CollectionKey` below enumerates them.
// vestria's `catalog` capability is a FLAT GRID, NOT a collection: it is not a
// CollectionKey and there is no def keyed `catalog` here by construction, so
// vestria can never trigger the generation→collections bridge.

/** The closed set of collection keys — 1:1 with the collection-family capabilityIds. */
export type CollectionKey = 'products' | 'services' | 'case-studies' | 'works';

export interface CollectionDef {
  key: CollectionKey; // 'products'
  basePath: string; // '/products' — item slugs are basePath + '/' + slug
  label: string; // 'Products' (UI label)
  itemArchetypeKey: string; // archetypeKey stamped on item pages
  catalogArchetypeKey: string; // archetypeKey stamped on the catalog singleton
  catalogSectionType: string; // section type of the auto-listing block ('catalog')
  itemSectionType: string; // section type of the per-item record block ('productdetail')
  // Ordered item-record field names used to derive an entry's display label
  // (first non-empty joined by ' — '). Lets the editor panel drop hard-coded
  // per-collection fallbacks (e.g. products' rec.model/rec.name). Falls back to
  // the page title when none resolve.
  labelFields: string[];
}

export const COLLECTIONS: Record<CollectionKey, CollectionDef> = {
  products: {
    key: 'products',
    basePath: '/products',
    label: 'Products',
    itemArchetypeKey: 'product-detail',
    catalogArchetypeKey: 'product-catalog',
    catalogSectionType: 'catalog',
    itemSectionType: 'productdetail',
    labelFields: ['model', 'name'],
  },
  services: {
    key: 'services',
    basePath: '/services',
    label: 'Services',
    itemArchetypeKey: 'service-detail',
    catalogArchetypeKey: 'service-catalog',
    catalogSectionType: 'servicecatalog',
    itemSectionType: 'servicedetail',
    labelFields: ['name'],
  },
  'case-studies': {
    key: 'case-studies',
    basePath: '/case-studies',
    label: 'Case Studies',
    itemArchetypeKey: 'casestudy-detail',
    catalogArchetypeKey: 'casestudy-catalog',
    catalogSectionType: 'casestudycatalog',
    itemSectionType: 'casestudydetail',
    labelFields: ['name'],
  },
  works: {
    key: 'works',
    basePath: '/works',
    label: 'Works',
    itemArchetypeKey: 'work-detail',
    catalogArchetypeKey: 'work-catalog',
    catalogSectionType: 'workcatalog',
    itemSectionType: 'workdetail',
    labelFields: ['name'],
  },
};

export function getCollectionDef(collectionKey: string): CollectionDef | undefined {
  return (COLLECTIONS as Record<string, CollectionDef>)[collectionKey];
}
