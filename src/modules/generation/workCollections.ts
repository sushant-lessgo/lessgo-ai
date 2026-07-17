// src/modules/generation/workCollections.ts
// work-onboarding-ingestion (E2) phase 1 — PURE binding helpers for the work
// vertical. Two pure functions, no store / template / react imports (firewall,
// mirror of brief/collections.ts):
//
//   1. deriveWorksEntries(facts)      — facts.work.groups[] → CollectionEntry[]
//      (name, code-derived slug, photos clamped to 24 per group per D11). Feeds
//      the dormant collections fan-out (runCollectionFanOut) so each group gets a
//      /works/<slug> item page carrying the user's VERBATIM photos.
//
//   2. stampWorkGalleryBinding(fc, entries) — stamp each home `work`-section
//      group card's cover_image (D5) + href (D5 + D7a guard) from the entries.
//
// D5  — the gallery holds group REFERENCES (frozen `groups` contract:
//       {id,name,cover_image,href}), NOT a flat photo list. Photos bind as covers
//       here + as /works/<slug> item pages via the fan-out.
// D7a — href is stamped ONLY when the /works/<slug> item page exists in fc.pages;
//       on a non-flipped template (no `works` capability ⇒ no item pages) href is
//       left as-is, which is what makes the engine-wide gallery safe there.
// D11 — photos clamped to 24 per group (belt; the real cap lands in phase 3).
//
// JOIN LAW: group → entry is joined by NAME → slugify(name), NEVER by index.
// parseCopy preserves group names verbatim (facts law), so the slug is a stable
// key even after AI polishes the gallery framing copy.

import { slugify } from '@/lib/normalize';
import type { CollectionEntry, CollectionEntryPhoto } from '@/modules/brief/collections';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';

/** D11 belt: max photos carried per group into an entry (contract max = 24). */
export const WORKS_PHOTOS_PER_GROUP_CAP = 24;

/** The `works` collection key (single source with COLLECTIONS.works). */
const WORKS_KEY = 'works';
/** Item page key for a works entry slug (mirror of assembleCollectionPages). */
const worksItemPageKey = (slug: string): string => `page-${slug}`;

/** Cover url for a set of photos: the `cover:true` photo, else the first, else ''. */
function pickCover(photos: readonly CollectionEntryPhoto[] | undefined): string {
  if (!photos || photos.length === 0) return '';
  return (photos.find((p) => p.cover) ?? photos[0])?.url ?? '';
}

/** Normalize one WorkPhotoRef → CollectionEntryPhoto, dropping url-less refs. */
function toEntryPhoto(p: {
  id?: string;
  url?: string;
  alt?: string;
  cover?: boolean;
}): CollectionEntryPhoto | null {
  const url = typeof p.url === 'string' ? p.url : '';
  if (!url) return null; // a photo with no url can't render or cover
  const photo: CollectionEntryPhoto = { url };
  if (p.id) photo.id = p.id;
  if (p.alt) photo.alt = p.alt;
  if (p.cover) photo.cover = p.cover;
  return photo;
}

/**
 * Derive the `works` collection entries from the Brief's work facts. Flat groups
 * only — the second `items` level (story-seller shoots) is carry-only per spec
 * and NOT expanded here. Photos are clamped to 24 per group (D11 belt) and
 * url-less refs are dropped. Slug is ALWAYS code-derived from the group name.
 * Absent/empty facts ⇒ [].
 */
export function deriveWorksEntries(facts: WorkFacts | null | undefined): CollectionEntry[] {
  const groups = facts?.groups ?? [];
  const out: CollectionEntry[] = [];
  for (const g of groups) {
    const name = typeof g?.name === 'string' ? g.name.trim() : '';
    if (!name) continue;
    const photos = (g.photos ?? [])
      .map(toEntryPhoto)
      .filter((p): p is CollectionEntryPhoto => p !== null)
      .slice(0, WORKS_PHOTOS_PER_GROUP_CAP);
    const entry: CollectionEntry = { name, slug: slugify(name) };
    if (photos.length) entry.photos = photos;
    out.push(entry);
  }
  return out;
}

/** Stamp cover_image + href on every group card in one content tree (mutates). */
function stampTree(
  content: Record<string, any> | undefined,
  bySlug: Map<string, CollectionEntry>,
  hasItemPage: (slug: string) => boolean
): void {
  if (!content || typeof content !== 'object') return;
  for (const sec of Object.values(content)) {
    const groups = (sec as any)?.elements?.groups;
    if (!Array.isArray(groups)) continue; // only the work gallery carries `groups`
    for (const g of groups) {
      if (!g || typeof g.name !== 'string') continue;
      const entry = bySlug.get(slugify(g.name)); // JOIN by name→slug, never index
      if (!entry) continue;
      const cover = pickCover(entry.photos);
      if (cover) g.cover_image = cover; // else leave as-is ('')
      // D7a guard: only link when the item page actually exists.
      if (hasItemPage(entry.slug)) g.href = `/${WORKS_KEY}/${entry.slug}`;
    }
  }
}

/**
 * Stamp the home work-gallery group cards from the derived entries (D5). PURE
 * (mutates fc in place, returns nothing). For every `work`-section group card in
 * every content tree (flat home + each page + chrome), join by name→slug and set:
 *   • cover_image = the cover photo (else first, else left as-is), and
 *   • href = /works/<slug> ONLY when that item page exists in fc.pages (D7a).
 * No entries ⇒ no-op. Non-flipped templates (no /works pages) get covers stamped
 * but hrefs left alone — a visual no-op on old atelier (no `groups` consumers).
 */
export function stampWorkGalleryBinding(fc: any, entries: readonly CollectionEntry[]): void {
  if (!fc || !entries || entries.length === 0) return;
  const bySlug = new Map<string, CollectionEntry>();
  for (const e of entries) bySlug.set(e.slug, e);
  const pages = fc.pages && typeof fc.pages === 'object' ? fc.pages : {};
  const hasItemPage = (slug: string): boolean => !!pages[worksItemPageKey(slug)];

  stampTree(fc.content, bySlug, hasItemPage);
  for (const page of Object.values(pages)) {
    stampTree((page as any)?.content, bySlug, hasItemPage);
  }
  if (fc.chrome?.header?.data) stampTree({ _: fc.chrome.header.data }, bySlug, hasItemPage);
  if (fc.chrome?.footer?.data) stampTree({ _: fc.chrome.footer.data }, bySlug, hasItemPage);
}
