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
// JOIN LAW: group → entry is joined by the group's STABLE SLUG —
// `group.slug ?? slugify(group.name)` — NEVER by index. The board seeds
// `group.slug` (slugify(name)) on first save and PRESERVES it across a rename,
// so the `/works/<slug>` item page + gallery href survive a rename; pre-board
// facts (no `slug`) fall back to `slugify(name)`, keeping today's name→slug join
// valid for untouched projects. parseCopy preserves group names verbatim (facts
// law), so the slug is a stable key even after AI polishes the framing copy.
//
// HIDE LAW (work-library-board): `deriveWorksEntries` is the SINGLE choke point
// that drops `hidden:true` photo refs — before cap/cover — so a dashboard-hidden
// photo never reaches covers/entries/item pages. Every render-surface seeder
// (stampWorkGalleryBinding, buildCollectionCatalogSlice, multiPageAssembly item
// seeding, chrome cards) consumes THIS function's output, so none re-implement
// the filter.

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
 * and NOT expanded here. `hidden:true` photo refs are dropped FIRST (the single
 * hide-not-destroy choke point), then url-less refs are dropped and the
 * remainder clamped to 24 per group (D11 belt). Slug is the group's STABLE slug
 * (`group.slug ?? slugify(group.name)`) so it survives a board rename.
 * Absent/empty facts ⇒ [].
 */
export function deriveWorksEntries(facts: WorkFacts | null | undefined): CollectionEntry[] {
  const groups = facts?.groups ?? [];
  const out: CollectionEntry[] = [];
  for (const g of groups) {
    const name = typeof g?.name === 'string' ? g.name.trim() : '';
    if (!name) continue;
    const photos = (g.photos ?? [])
      .filter((p) => !p?.hidden) // hide-not-destroy: drop hidden refs before cap/cover
      .map(toEntryPhoto)
      .filter((p): p is CollectionEntryPhoto => p !== null)
      .slice(0, WORKS_PHOTOS_PER_GROUP_CAP);
    // JOIN LAW: stable slug survives a rename; pre-board facts fall back to name.
    const slug = (typeof g.slug === 'string' && g.slug.trim()) ? g.slug.trim() : slugify(name);
    const entry: CollectionEntry = { name, slug };
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
/**
 * FIRST-GEN-ONLY hero-slides auto-derive (Wave 2 hero lane). Build one hero slide
 * per works-group cover (the SAME `deriveWorksEntries` → `pickCover` pipeline the
 * gallery covers use, so a dashboard-hidden photo never becomes a slide) and stamp
 * them onto every `hero-…` section that has no slides yet. PURE (mutates fc in
 * place, returns nothing). Zero authoring for photographers; the user overrides a
 * slide via the editor picker.
 *
 * NEVER overwrites user-edited slides: a hero that ALREADY carries a non-empty
 * `slides` array is skipped (so a per-slide picker edit + a resume re-run are both
 * safe / idempotent). No entries with covers ⇒ no-op (single-portrait hero stays
 * byte-identical). Slide id is derived from the group's STABLE slug so it is
 * deterministic across a re-stamp.
 *
 * SLIDES INVARIANT (section-background D8 / R4, the WRITE-side door): a `slides`
 * array is either absent/empty or has ≥2 entries — NEVER exactly 1. The renderer
 * forks at `>= 2`, so a length-1 stamp renders the stale scalar `portrait_image`
 * anyway while occupying the `slides` key (which then blocks a later legitimate
 * stamp and confuses the editor panel). A single-cover collection therefore leaves
 * the hero BYTE-IDENTICAL. Today's `length === 0` early-return is not enough.
 */
export function stampHeroSlides(fc: any, entries: readonly CollectionEntry[]): void {
  if (!fc || !entries || entries.length === 0) return;
  const slides = entries
    .map((e) => ({ id: `slide-${e.slug}`, image: pickCover(e.photos) }))
    .filter((s) => !!s.image); // one slide per group that actually has a cover
  if (slides.length < 2) return; // the ≥2 invariant (never stamp a lone slide)

  const stampTree = (content: Record<string, any> | undefined): void => {
    if (!content || typeof content !== 'object') return;
    for (const sec of Object.values(content)) {
      const id = (sec as any)?.id;
      if (typeof id !== 'string' || !id.startsWith('hero-')) continue;
      const el = (sec as any).elements;
      if (!el || typeof el !== 'object') continue;
      if (Array.isArray(el.slides) && el.slides.length > 0) continue; // never clobber user slides
      el.slides = slides.map((s) => ({ ...s }));
    }
  };
  stampTree(fc.content);
  const pages = fc.pages && typeof fc.pages === 'object' ? fc.pages : {};
  for (const page of Object.values(pages)) stampTree((page as any)?.content);
}

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
