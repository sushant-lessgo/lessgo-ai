// src/modules/generation/workLibrarySync.ts
// work-library-board (phase 2) — PURE save-time resync: work FACTS → stored
// `Project.content`. Mirrors the workCollections.ts firewall (zod / plain types
// only — NO react, NO stores, NO prisma, NO template runtime), so the board's
// PUT route can call it server-side against fresh stored content.
//
// ── WHAT IT DOES ─────────────────────────────────────────────────────────────
// `resyncWorkContent(storedContent, facts)` returns a NEW content tree (the input
// is never mutated) in which every GROUP-REFERENCE SURFACE has been rebuilt from
// `deriveWorksEntries(facts)` — facts order = surface order; name verbatim; cover
// = the entry's cover photo. The three surfaces (all seeded originally by the
// generation path, whose exact shapes we mirror):
//
//   (a) GALLERY / CHROME CARDS — every section carrying `elements.groups[]` in the
//       flat home (`content`), every page (`pages[*].content`), and the chrome
//       header/footer (`chrome.{header,footer}.data`) — the SAME trees
//       stampWorkGalleryBinding walks. Card shape `{id,name,cover_image,href}`
//       (frozen work-core gallery contract; galleryGroups.test.tsx). `href` is set
//       to `/works/<slug>` ONLY when the `page-<slug>` item page exists (D7a).
//
//   (b) THE `workcatalog` SINGLETON's `items[]` — the third group-reference surface
//       (the `/works` index). Located by section type `workcatalog` inside a
//       `collectionKey:'works'` page. Item shape `{id,name,cover,href}` — the SAME
//       shape buildCollectionCatalogSlice (archetypes.ts) seeds; same order / prune
//       / id-stability rules as the cards.
//
//   (c) EACH ITEM PAGE's `workdetail` `photos[]` — for every entry with a
//       `page-<slug>` page, the `workdetail` section's `photos` is set from
//       `entry.photos`. Photo shape `{id,url,alt,cover}` — VERBATIM the shape
//       buildCollectionItemSlice's works branch seeds (VERBATIM_ITEM_FIELDS
//       contract, multiPageAssembly.ts).
//
// PLUS: item pages whose group no longer exists in facts (a board MERGE absorbed
// it) are PRUNED — the `page-<slug>` entry is removed. Every other page / copy
// field is left untouched.
//
// ── ID STABILITY (E.List) ────────────────────────────────────────────────────
// A rebuilt card/item reuses an existing card/item's `id` when its slug matches
// (slug read from its `/works/<slug>` href, falling back to `slugify(name)`);
// otherwise it gets a fresh id. So a rename (slug preserved) keeps the React key
// stable while updating the visible name.
//
// ── HIDE-NOT-DESTROY ─────────────────────────────────────────────────────────
// Covers/photos come from `deriveWorksEntries(facts)`, which already drops
// `hidden:true` refs at the single choke point — so a hidden photo never reaches
// any surface here. `cover_image`/`cover` are ALWAYS set from the entry cover
// (including '' when a group has no visible photo) so hiding a group's only cover
// photo clears the stale cover rather than resurrecting it. FACTS ARE NEVER
// TOUCHED (this module takes facts read-only and returns content).
//
// ── GRACEFUL DEGRADE (decision #7, defense in depth) ─────────────────────────
// The primary eligibility guard is the works-CAPABLE template check on the route.
// This module additionally NEVER THROWS on non-works content: if the stored tree
// has no `workcatalog` section and/or no `page-<slug>` item pages (e.g. a
// live-`atelier` project that slipped a guard, or pre-fan-out content), the
// per-surface steps are natural no-ops — the catalog rewrite is skipped (no
// section found), the item-page rewrites are skipped (no pages), the prune finds
// nothing, and the gallery/chrome cards are rebuilt with name + cover + order but
// NO href (the per-slug D7a guard emits an href only when the item page exists).
// So bare/dead hrefs are never written and nothing else is disturbed.
//
// ── IDEMPOTENT ───────────────────────────────────────────────────────────────
// Re-running with unchanged facts is a no-op diff: every rebuilt card/item keeps
// its id via the slug match, and names/covers/hrefs are deterministic from facts.
// AI copy fields are never read or written.

import { slugify } from '@/lib/normalize';
import type { CollectionEntry, CollectionEntryPhoto } from '@/modules/brief/collections';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import { deriveWorksEntries } from './workCollections';
import { stampWorkFooterNav } from './workFooterDerive';

/** The `works` collection key + item-page key (mirror of workCollections.ts). */
const WORKS_KEY = 'works';
const worksItemPageKey = (slug: string): string => `page-${slug}`;

/** Fresh id for a brand-new card/item (no slug match). Random, not crypto — this
 *  module stays a pure leaf; ids are opaque and never asserted for a NEW entry. */
const freshId = (p: string): string => `${p}-${Math.random().toString(36).slice(2, 10)}`;

/** Cover url for a set of (already hidden-filtered) photos: `cover:true`, else the
 *  first, else '' (mirror of workCollections.pickCover / worksEntryCover). */
function pickCover(photos: readonly CollectionEntryPhoto[] | undefined): string {
  if (!photos || photos.length === 0) return '';
  return (photos.find((p) => p.cover) ?? photos[0])?.url ?? '';
}

/** Section type: explicit `type`, else the `${type}-${uuid}` id prefix (mirror of
 *  mergeCollectionItemCopy). */
function sectionTypeOf(sec: any, sid: string): string {
  return (sec && typeof sec.type === 'string' && sec.type) || String(sid).split('-')[0];
}

/** Extract the slug from a `/works/<slug>` href, else null. */
function slugFromWorksHref(href: unknown): string | null {
  if (typeof href !== 'string') return null;
  const m = href.match(/^\/works\/([^/?#]+)/);
  return m ? m[1] : null;
}

/** A card/item's stable slug: from its `/works/<slug>` href, else `slugify(name)`. */
function refSlug(ref: any): string | null {
  const fromHref = slugFromWorksHref(ref?.href);
  if (fromHref) return fromHref;
  return typeof ref?.name === 'string' && ref.name.trim() ? slugify(ref.name) : null;
}

/** One WorkPhotoRef → the frozen `workdetail` photo shape (buildCollectionItemSlice
 *  works branch): `{id,url,alt,cover}`. */
function toWorkdetailPhoto(p: CollectionEntryPhoto): { id: string; url: string; alt: string; cover: boolean } {
  return { id: p.id ?? freshId('ph'), url: p.url, alt: p.alt ?? '', cover: p.cover ?? false };
}

/** Build a slug→existing-id map from an array of cards/items (first-seen wins). */
function idBySlug(existing: readonly any[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const ref of existing) {
    const slug = refSlug(ref);
    if (slug && typeof ref?.id === 'string' && !m.has(slug)) m.set(slug, ref.id);
  }
  return m;
}

/** Rebuild one gallery section's `groups[]` cards from the entries (D5 + D7a). */
function rebuildCards(
  sec: any,
  entries: readonly CollectionEntry[],
  hasItemPage: (slug: string) => boolean
): void {
  if (!sec.elements || typeof sec.elements !== 'object') sec.elements = {};
  const prior = Array.isArray(sec.elements.groups) ? sec.elements.groups : [];
  const ids = idBySlug(prior);
  sec.elements.groups = entries.map((e) => {
    const card: Record<string, any> = {
      id: ids.get(e.slug) ?? freshId('grp'),
      name: e.name,
      cover_image: pickCover(e.photos), // always set → a hidden cover is cleared
    };
    // D7a: link only when the /works/<slug> item page actually exists.
    if (hasItemPage(e.slug)) card.href = `/${WORKS_KEY}/${e.slug}`;
    return card;
  });
}

/** Rebuild the `workcatalog` singleton's `items[]` from the SAME entries. */
function rebuildCatalogItems(
  sec: any,
  entries: readonly CollectionEntry[],
  hasItemPage: (slug: string) => boolean
): void {
  if (!sec.elements || typeof sec.elements !== 'object') sec.elements = {};
  const prior = Array.isArray(sec.elements.items) ? sec.elements.items : [];
  const ids = idBySlug(prior);
  sec.elements.items = entries.map((e) => {
    const item: Record<string, any> = {
      id: ids.get(e.slug) ?? freshId('it'),
      name: e.name,
      cover: pickCover(e.photos),
      // D7a guard, same as the cards (the catalog only rebuilds on works-capable
      // content, so in practice every remaining entry has an item page).
      href: hasItemPage(e.slug) ? `/${WORKS_KEY}/${e.slug}` : '',
    };
    return item;
  });
}

/** Visit every section carrying `elements.groups[]` across flat home + pages +
 *  chrome (the exact trees stampWorkGalleryBinding walks). */
function forEachGallerySection(fc: any, fn: (sec: any) => void): void {
  const visit = (contentMap: any): void => {
    if (!contentMap || typeof contentMap !== 'object') return;
    for (const sec of Object.values(contentMap)) {
      if (sec && typeof sec === 'object' && Array.isArray((sec as any)?.elements?.groups)) fn(sec);
    }
  };
  visit(fc.content);
  const pages = fc.pages && typeof fc.pages === 'object' ? fc.pages : {};
  for (const page of Object.values(pages)) visit((page as any)?.content);
  if (fc.chrome?.header?.data) visit({ _: fc.chrome.header.data });
  if (fc.chrome?.footer?.data) visit({ _: fc.chrome.footer.data });
}

/** Find the `workcatalog` section (the `/works` index singleton), else null. */
function findWorkCatalogSection(fc: any): any {
  const pages = fc.pages && typeof fc.pages === 'object' ? fc.pages : {};
  for (const page of Object.values(pages)) {
    const cm = (page as any)?.content;
    if (!cm || typeof cm !== 'object') continue;
    for (const [sid, sec] of Object.entries(cm)) {
      if (sectionTypeOf(sec, sid) === 'workcatalog') return sec;
    }
  }
  return null;
}

/**
 * Resync the stored `Project.content` tree from the work FACTS. Returns a NEW
 * content object (input is never mutated). Rebuilds all three group-reference
 * surfaces (gallery/chrome cards, the `workcatalog` `items[]`, each item page's
 * `workdetail` `photos[]`) from `deriveWorksEntries(facts)`, prunes item pages
 * whose group no longer exists, and degrades gracefully on non-works content
 * (see the module header). Facts are read-only; AI copy fields are never touched.
 */
export function resyncWorkContent(storedContent: any, facts: WorkFacts | null | undefined): any {
  if (!storedContent || typeof storedContent !== 'object') return storedContent;
  // Deep clone so the input (and any Date fields, e.g. forms.createdAt) survive
  // untouched — the caller compares/persists the returned tree.
  const fc = structuredClone(storedContent);

  const entries = deriveWorksEntries(facts);
  const pages = fc.pages && typeof fc.pages === 'object' ? fc.pages : {};
  const hasItemPage = (slug: string): boolean => !!pages[worksItemPageKey(slug)];

  // (a) gallery + chrome cards — always (degrades: no item page ⇒ no href).
  forEachGallerySection(fc, (sec) => rebuildCards(sec, entries, hasItemPage));

  // (b) the workcatalog singleton's items[] — skipped when absent (degrade).
  const catalog = findWorkCatalogSection(fc);
  if (catalog) rebuildCatalogItems(catalog, entries, hasItemPage);

  // (c) each item page's workdetail photos[] — skipped when the page is absent.
  for (const e of entries) {
    const page = pages[worksItemPageKey(e.slug)];
    const cm = page?.content;
    if (!cm || typeof cm !== 'object') continue;
    for (const [sid, sec] of Object.entries(cm)) {
      if (sectionTypeOf(sec, sid) !== 'workdetail') continue;
      const s = sec as any;
      if (!s.elements || typeof s.elements !== 'object') s.elements = {};
      s.elements.photos = (e.photos ?? []).map(toWorkdetailPhoto);
    }
  }

  // (d) prune orphaned works item pages (a merge absorbed the group). Only touch
  // `works` collectionItem pages; every other page is left alone.
  const slugSet = new Set(entries.map((e) => e.slug));
  for (const [pageKey, page] of Object.entries(pages)) {
    const p = page as any;
    if (p?.collectionKey !== WORKS_KEY || p?.kind !== 'collectionItem') continue;
    const slug = pageKey.startsWith('page-') ? pageKey.slice('page-'.length) : null;
    if (slug && !slugSet.has(slug)) delete pages[pageKey];
  }

  // (e) footer derived columns re-stamp (Wave 2) — AFTER the page-set changes
  // above (item-page add/prune) so the columns reflect the FINAL page set. Gated
  // on the marker being already present: a footer that never opted into the
  // derived shape (Kundius / any pre-Wave-2 draft) is LEFT UNTOUCHED — the derived
  // footer is never retroactively forced on. Facts feed the contact block.
  stampWorkFooterNav(fc, facts, { onlyIfMarked: true });

  return fc;
}
