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
//
// i18n-phase-1 (3a) VERDICT (deliverable #1): every write here (catalog `items`,
// per-item `related`, home `lineup`/`gallerypreview`) is DERIVED, locale-SHARED
// structure — materialized read-only from base product/gallery records into base
// `content`, never an authored text edit. They are therefore NOT locale-branched
// and always target base, regardless of `activeLocale` (D1: structure/media are
// locale-shared).
//
// i18n-phase-1 (3b) READ-SIDE VERDICT: LEAVE (base) — the card text
// (`name`/`oneLiner`/`cardSpec`) is materialized into a nested `items[]`/`related[]`
// object array. Per-collection-item text CANNOT be localized with the current
// overlay shape: `resolveLocaleElements` merges per whole TOP-LEVEL elementKey and
// will not patch an item inside an object array from a dotted overlay key (Phase-1
// documented limitation, restated in the 3a audit). So `recordOf`/`cardFromEntry`
// intentionally read BASE records only; the catalog/related/home-teaser cards
// render default-locale text in every locale in v1. Localizing collection-item
// text requires extending the overlay type (a later phase), NOT a read change here.

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

// ===== "Pin to home": derive the home teaser sections from flagged source content =====
// The home `lineup` (products) + `gallerypreview` (gallery images) are MATERIALIZED
// read-only views — a sibling of the catalog/related materialization above. Source
// content carries a boolean flag (`featuredOnHome` on a product record, `onHome` on a
// gallery image); when none are flagged we fall back to the first-N (order-sorted).

const LINEUP_CAP = 4;      // home lineup shows up to N products
const LINEUP_FALLBACK = 3; // when nothing flagged, first 3
const GALLERY_CAP = 6;     // home gallery-preview shows up to N images (flagged or fallback)

/** A home lineup card (subset of CatalogCard — the ProductLineup item shape). */
export interface LineupCard { id: string; model: string; name: string; oneLiner: string; image: string; cardSpec: string; href: string }
/** A home gallery-preview image. */
export interface PreviewImage { id: string; src: string; tag: string; category: string }

const findHomePage = (pages: Pages): ProjectPageEntry | undefined =>
  Object.values(pages || {}).find((p) => p.pathSlug === '/');

const sectionElements = (entry: ProjectPageEntry | undefined, sectionType: string): Record<string, any> | undefined => {
  if (!entry) return undefined;
  const sid = (entry.sections ?? []).find((id) => extractSectionType(id) === sectionType);
  return sid ? ((entry.content as any)?.[sid]?.elements as Record<string, any>) : undefined;
};

/** Pure: products flagged `featuredOnHome` (or first-N fallback), as lineup cards. */
export function materializeHomeLineup(pages: Pages): LineupCard[] {
  const def = getCollectionDef('products');
  if (!def) return [];
  const items = collectionItems(pages, 'products'); // order-sorted collectionItem pages
  const flagged = items.filter((p) => (recordOf(p, def.itemSectionType) ?? {}).featuredOnHome === true);
  const chosen = flagged.length > 0 ? flagged.slice(0, LINEUP_CAP) : items.slice(0, LINEUP_FALLBACK);
  return chosen.map((p) => {
    const c = cardFromEntry(p, def); // {id,model,name,oneLiner,image,cardSpec,categoryId,href}
    return { id: c.id, model: c.model, name: c.name, oneLiner: c.oneLiner, image: c.image, cardSpec: c.cardSpec, href: c.href };
  });
}

/** Pure: gallery-page images flagged `onHome` (or first-N fallback), as preview images. */
export function materializeHomeGallery(pages: Pages): PreviewImage[] {
  const galleryPage = Object.values(pages || {}).find((p) => (p.sections ?? []).some((sid) => extractSectionType(sid) === 'gallery'));
  const images = sectionElements(galleryPage, 'gallery')?.images;
  const arr: any[] = Array.isArray(images) ? images : [];
  const flagged = arr.filter((im) => im?.onHome === true);
  const chosen = (flagged.length > 0 ? flagged : arr).slice(0, GALLERY_CAP);
  return chosen.map((im) => ({ id: im.id, src: im.src ?? '', tag: im.tag ?? '', category: im.category ?? '' }));
}

/**
 * Pure export-boundary variant: write the home page's lineup `items[]` +
 * gallerypreview `images[]` from the flagged sources. No-op when the home page
 * lacks those sections (other templates) → safe to call generically.
 */
export function materializeHomeTeasers(pages: Pages): void {
  if (!pages) return;
  const home = findHomePage(pages);
  if (!home) return;
  const writeInto = (sectionType: string, field: string, value: any) => {
    const sid = (home.sections ?? []).find((id) => extractSectionType(id) === sectionType);
    const sec = sid ? (home.content as any)?.[sid] : undefined;
    if (sec) { if (!sec.elements) sec.elements = {}; sec.elements[field] = clone(value); }
  };
  writeInto('lineup', 'items', materializeHomeLineup(pages));
  writeInto('gallerypreview', 'images', materializeHomeGallery(pages));
}

/**
 * Immer-draft mutator (mirrors syncCollection): re-derive the home teasers into
 * the store — writes both the stored home page AND the active mirror when Home is
 * the current page. Run AFTER commitActivePage so source records are fresh.
 */
export function syncHomeTeasers(state: any): void {
  if (!state?.pages) return;
  const home = findHomePage(state.pages);
  if (!home) return;
  setSectionField(state, home.id, 'lineup', 'items', materializeHomeLineup(state.pages));
  setSectionField(state, home.id, 'gallerypreview', 'images', materializeHomeGallery(state.pages));
}
