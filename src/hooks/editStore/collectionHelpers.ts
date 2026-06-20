// hooks/editStore/collectionHelpers.ts — Phase 3 collection materialize.
//
// The catalog block auto-lists products; each product detail page shows a
// "related" strip. Both are MATERIALIZED (derived) from the product pages'
// records, never authored directly — so the dumb dual renderers just render
// frozen content (no live store reads in published mode → no divergence).
//
// CONTRACT: materialize reads each product's record from its STORED page
// (`pages[id].content[...].elements`). So `syncCollection` MUST run only AFTER
// `commitActivePage` has flushed the active page's edits into `pages` — every
// caller honors this. Materialize fully replaces the arrays (never appends), so
// it is idempotent and safe to re-run at the export boundary.

import type { ProjectPageEntry } from '@/types/store';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { getCollectionDef, type CollectionDef } from '@/modules/collections/registry';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? null));

/** A card rendered by the catalog grid + the detail "related" strip. */
export interface CatalogCard {
  id: string;
  model: string;
  name: string;
  oneLiner: string;
  image: string;
  cardSpec: string;
  categoryId: string;
  href: string;
}

type Pages = Record<string, ProjectPageEntry>;

/** Find a body section of a given type within a page entry → its elements map. */
function recordOf(entry: ProjectPageEntry, sectionType: string): Record<string, any> | null {
  for (const sid of entry.sections ?? []) {
    if (extractSectionType(sid) === sectionType) {
      return ((entry.content as any)?.[sid]?.elements as Record<string, any>) ?? {};
    }
  }
  return null;
}

/** Build a catalog card from a product page's record (href derived from live pathSlug). */
function cardFromEntry(entry: ProjectPageEntry, def: CollectionDef): CatalogCard {
  const rec = recordOf(entry, def.itemSectionType) ?? {};
  const images = Array.isArray(rec.images) ? rec.images : [];
  return {
    id: entry.id,
    model: rec.model ?? '',
    name: rec.name ?? entry.title ?? '',
    oneLiner: rec.oneLiner ?? '',
    image: images[0]?.src ?? '',
    cardSpec: rec.cardSpec ?? '',
    categoryId: rec.category ?? '',
    href: entry.pathSlug,
  };
}

/** All item pages of a collection, order-sorted. */
export function collectionItems(pages: Pages, collectionKey: string): ProjectPageEntry[] {
  return Object.values(pages || {})
    .filter((p) => p.kind === 'collectionItem' && p.collectionKey === collectionKey)
    .sort((a, b) => a.order - b.order);
}

/** The catalog singleton page for a collection, if any. */
export function findCatalogPage(pages: Pages, collectionKey: string): ProjectPageEntry | undefined {
  return Object.values(pages || {}).find((p) => p.kind === 'singleton' && p.collectionKey === collectionKey);
}

/** Pure: every product card for the collection, ordered, grouped later by categoryId. */
export function materializeCatalogItems(pages: Pages, collectionKey: string): CatalogCard[] {
  const def = getCollectionDef(collectionKey);
  if (!def) return [];
  return collectionItems(pages, collectionKey).map((p) => cardFromEntry(p, def));
}

/** Pure: same-category sibling cards of `itemPage` (excl. self). v1: auto only. */
export function materializeRelated(pages: Pages, itemPage: ProjectPageEntry, collectionKey: string): CatalogCard[] {
  const def = getCollectionDef(collectionKey);
  if (!def) return [];
  const cat = (recordOf(itemPage, def.itemSectionType) ?? {}).category ?? '';
  return collectionItems(pages, collectionKey)
    .filter((p) => p.id !== itemPage.id)
    .map((p) => cardFromEntry(p, def))
    .filter((c) => !cat || c.categoryId === cat);
}

/**
 * Write `elements[field] = value` into the section of `sectionType` on page
 * `pageId`. Mirror rule: when the page is the active page, write the top-level
 * working copy (`state.content[sid]`) too, so the canvas updates live and stays
 * in lockstep with the stored (body-only) page. Identify by TYPE, never index 0.
 */
function setSectionField(state: any, pageId: string, sectionType: string, field: string, value: any): void {
  const entry: ProjectPageEntry | undefined = state.pages?.[pageId];
  if (entry) {
    const sid = (entry.sections ?? []).find((id: string) => extractSectionType(id) === sectionType);
    const sec = sid ? (entry.content as any)?.[sid] : undefined;
    if (sec) {
      if (!sec.elements) sec.elements = {};
      sec.elements[field] = clone(value);
    }
  }
  if (pageId === state.currentPageId) {
    const sid = (state.sections ?? []).find((id: string) => extractSectionType(id) === sectionType);
    const sec = sid ? state.content?.[sid] : undefined;
    if (sec) {
      if (!sec.elements) sec.elements = {};
      sec.elements[field] = clone(value);
    }
  }
}

/**
 * Immer-draft mutator: re-materialize a collection into the store. Run AFTER
 * commitActivePage (so `state.pages` records are fresh). Writes the catalog
 * `items[]` and each product's `related[]` into the stored pages + active mirror.
 */
export function syncCollection(state: any, collectionKey: string): void {
  const def = getCollectionDef(collectionKey);
  if (!def || !state.pages) return;
  const pages: Pages = state.pages;

  const catalog = findCatalogPage(pages, collectionKey);
  if (catalog) {
    setSectionField(state, catalog.id, def.catalogSectionType, 'items', materializeCatalogItems(pages, collectionKey));
  }
  for (const p of Object.values(pages)) {
    if (p.kind === 'collectionItem' && p.collectionKey === collectionKey) {
      setSectionField(state, p.id, def.itemSectionType, 'related', materializeRelated(pages, p, collectionKey));
    }
  }
}

/**
 * Pure variant for the export boundary: mutate a PLAIN pages object (the
 * `buildPagesForExport` clone — no active mirror to keep in sync). Idempotent.
 */
export function materializeIntoPages(pages: Pages, collectionKey: string): void {
  const def = getCollectionDef(collectionKey);
  if (!def || !pages) return;
  const writeInto = (entry: ProjectPageEntry | undefined, sectionType: string, field: string, value: any) => {
    if (!entry) return;
    const sid = (entry.sections ?? []).find((id: string) => extractSectionType(id) === sectionType);
    const sec = sid ? (entry.content as any)?.[sid] : undefined;
    if (sec) {
      if (!sec.elements) sec.elements = {};
      sec.elements[field] = clone(value);
    }
  };
  writeInto(findCatalogPage(pages, collectionKey), def.catalogSectionType, 'items', materializeCatalogItems(pages, collectionKey));
  for (const p of collectionItems(pages, collectionKey)) {
    writeInto(p, def.itemSectionType, 'related', materializeRelated(pages, p, collectionKey));
  }
}

/** All collection keys present across the pages (for export-boundary sweep). */
export function collectionKeysInPages(pages: Pages): string[] {
  const keys = new Set<string>();
  for (const p of Object.values(pages || {})) {
    if (p.collectionKey) keys.add(p.collectionKey);
  }
  return [...keys];
}
