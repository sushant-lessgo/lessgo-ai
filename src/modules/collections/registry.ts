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

import { businessTypes, type BusinessTypeKey } from '@/modules/businessTypes/config';

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

// ===== Extraction → collection-key families (entry-capture phase 1) =====
// Single source of truth for "which collection key(s) does each extraction
// engine family extract". The extraction engine modules
// (src/lib/schemas/extraction/{thing,trust,work,manufacturer}.ts) consume THIS
// map instead of each keeping a duplicate local `*_COLLECTIONS` const — one
// place declares the family→keys mapping (D9: union built from declarations).
//
// The family keys are typed locally as a plain string-literal union (mirror of
// extraction's `ExtractionSchemaKey`) so this PURE-DATA registry never imports
// from src/lib/schemas/extraction — which imports back — avoiding a
// registry↔extraction runtime cycle.

/** Extraction engine families — mirror of ExtractionSchemaKey, kept local to avoid a cycle. */
export type ExtractionFamilyKey = 'thing' | 'trust' | 'work' | 'manufacturer';

export const extractionCollections: Record<ExtractionFamilyKey, readonly CollectionKey[]> = {
  thing: ['products'],
  trust: ['services', 'case-studies'],
  work: ['services', 'works'],
  manufacturer: ['products'],
};

/** Deduped flat union of every extraction family's collection keys (first-seen order). */
export const allEntryCollectionKeys: readonly CollectionKey[] = (() => {
  const seen = new Set<CollectionKey>();
  const out: CollectionKey[] = [];
  for (const keys of Object.values(extractionCollections)) {
    for (const k of keys) {
      if (!seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    }
  }
  return out;
})();

/**
 * The collection key(s) an engine-declared businessType extracts, resolved via
 * its `extractionSchemaKey` → `extractionCollections`. Unknown/undefined bt ⇒ [].
 * Pure registry lookup — used by the 7b structure node to render an empty
 * collection state for collection-capable business types (serve gate untouched).
 */
export function collectionKeysForBusinessType(
  bt: string | null | undefined
): readonly CollectionKey[] {
  if (!bt || !(bt in businessTypes)) return [];
  const key = businessTypes[bt as BusinessTypeKey].extractionSchemaKey;
  return (extractionCollections as Record<string, readonly CollectionKey[]>)[key] ?? [];
}

/**
 * May an EMPTY (0-item) collection node surface at the 7b structure gate for
 * this businessType? True only for CATALOG-SHAPED businessTypes — those whose
 * extraction family is `manufacturer` (a manufacturer page is expected to carry
 * a Products catalogue, so an empty Products node + `+ Add` is meaningful), OR
 * any businessType that declares a non-empty `requiredCollections` (dormant
 * today, but future-proofs the rule so a newly-required collection auto-surfaces
 * its empty node).
 *
 * For the `thing` (SaaS/app) extraction family the discriminator is FALSE: a
 * SaaS site has no catalogue, so a phantom "Products · 0 items" node is noise
 * (F19). Keys that DO have items always render regardless of this predicate —
 * the caller only gates EMPTY keys on it. Unknown/undefined bt ⇒ false.
 */
export function emptyCollectionNodeAllowed(
  bt: string | null | undefined
): boolean {
  if (!bt || !(bt in businessTypes)) return false;
  const entry = businessTypes[bt as BusinessTypeKey];
  if (entry.extractionSchemaKey === 'manufacturer') return true;
  return !!entry.requiredCollections && entry.requiredCollections.length > 0;
}
