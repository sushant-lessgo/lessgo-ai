// src/modules/brief/collections.ts
// Brief-carried collection data — PURE module (scale-10 phase 1).
// `Brief.facts.collections` holds the per-collection entry lists scraped
// verbatim (phase 2) and edited at the 7b structure gate (phase 4). This file
// only defines the shape + safe reader/writer; `facts` is a loose
// z.record(z.unknown()) so NO brief.schema.ts change is needed.
//
// Firewall: no 'use client', no template/store imports — importable from server
// routes AND client components (mirror of getEntryFacts in ./classify.ts).
//
// Slug law ("slugs never AI"): entry slugs are ALWAYS code-derived from the
// entry name via slugify — never taken from AI output.

import type { Brief } from '@/types/brief';
import type { CollectionKey } from '@/modules/collections/registry';
import { COLLECTIONS } from '@/modules/collections/registry';
import { slugify } from '@/lib/normalize';

/** A single bound photo reference carried on a collection entry (work-onboarding
 *  E2 / D6). Mirrors the `workdetailContract.photos` field shape (workSections.ts)
 *  so a works entry's photos seed the item page's `photos` collection VERBATIM.
 *  `url` is required (a photo with no url can't render); `id`/`alt`/`cover` are
 *  optional. Non-works collections never carry photos. */
export interface CollectionEntryPhoto {
  id?: string;
  url: string;
  alt?: string;
  cover?: boolean;
}

/** One repeatable item within a collection. `name` is the source of `slug`. */
export interface CollectionEntry {
  name: string;
  slug: string; // code-derived from name via slugify — never AI
  oneLiner?: string;
  imageUrl?: string;
  /** Bound photos (work-onboarding E2 / D6) — carried through toEntry /
   *  makeCollectionEntry / setCollections so `buildCollectionItemSlice`'s works
   *  branch can seed them into the `workdetail` `photos` collection. Optional;
   *  only the `works` collection populates it. */
  photos?: CollectionEntryPhoto[];
}

/** The `brief.facts.collections` payload: entry lists keyed by CollectionKey. */
export type CollectionsFacts = Partial<Record<CollectionKey, CollectionEntry[]>>;

const COLLECTION_KEYS = Object.keys(COLLECTIONS) as CollectionKey[];

function isCollectionKey(key: string): key is CollectionKey {
  return (COLLECTION_KEYS as string[]).includes(key);
}

/** Coerce a loose array into a normalized photo list (drops non-objects and
 *  entries without a string `url`). Absent/malformed ⇒ undefined (field omitted). */
function toPhotos(raw: unknown): CollectionEntryPhoto[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: CollectionEntryPhoto[] = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    const pr = p as Record<string, unknown>;
    const url = typeof pr['url'] === 'string' ? pr['url'] : '';
    if (!url) continue; // a photo with no url can't render — drop it
    const photo: CollectionEntryPhoto = { url };
    if (typeof pr['id'] === 'string') photo.id = pr['id'];
    if (typeof pr['alt'] === 'string') photo.alt = pr['alt'];
    if (typeof pr['cover'] === 'boolean') photo.cover = pr['cover'];
    out.push(photo);
  }
  return out.length ? out : undefined;
}

/** Coerce one loose record into a CollectionEntry (name required, slug re-derived). */
function toEntry(raw: unknown): CollectionEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r['name'] === 'string' ? r['name'].trim() : '';
  if (!name) return null;
  const entry: CollectionEntry = { name, slug: slugify(name) };
  if (typeof r['oneLiner'] === 'string') entry.oneLiner = r['oneLiner'];
  if (typeof r['imageUrl'] === 'string') entry.imageUrl = r['imageUrl'];
  const photos = toPhotos(r['photos']);
  if (photos) entry.photos = photos;
  return entry;
}

/**
 * Safe reader for `brief.facts.collections` (facts is a loose record). Tolerates
 * missing/malformed facts, unknown keys, and non-entry array members — returns a
 * normalized map with re-derived slugs. Absent/empty ⇒ `{}`.
 */
export function getCollections(brief: Brief | null | undefined): CollectionsFacts {
  const raw = brief?.facts?.['collections'];
  if (!raw || typeof raw !== 'object') return {};
  const out: CollectionsFacts = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isCollectionKey(key) || !Array.isArray(value)) continue;
    const entries = value.map(toEntry).filter((e): e is CollectionEntry => e !== null);
    out[key] = entries;
  }
  return out;
}

/** Convenience: entries for one collection key (empty array if absent). */
export function getCollectionEntries(
  brief: Brief | null | undefined,
  key: CollectionKey
): CollectionEntry[] {
  return getCollections(brief)[key] ?? [];
}

/** Build a normalized entry from a name (+ optional fields), deriving the slug. */
export function makeCollectionEntry(
  name: string,
  extra?: Pick<CollectionEntry, 'oneLiner' | 'imageUrl' | 'photos'>
): CollectionEntry {
  const trimmed = name.trim();
  const entry: CollectionEntry = { name: trimmed, slug: slugify(trimmed) };
  if (extra?.oneLiner !== undefined) entry.oneLiner = extra.oneLiner;
  if (extra?.imageUrl !== undefined) entry.imageUrl = extra.imageUrl;
  const photos = toPhotos(extra?.photos);
  if (photos) entry.photos = photos;
  return entry;
}

/**
 * Pure writer: return a new Brief with `facts.collections` set to the given map
 * (slugs re-derived, invalid entries dropped). Sibling `facts` keys preserved.
 * Empty entry lists are kept (empty collection = index ships empty-state).
 */
export function setCollections(brief: Brief, collections: CollectionsFacts): Brief {
  const normalized: CollectionsFacts = {};
  for (const key of COLLECTION_KEYS) {
    const entries = collections[key];
    if (!entries) continue;
    normalized[key] = entries
      .map((e) => makeCollectionEntry(e.name, { oneLiner: e.oneLiner, imageUrl: e.imageUrl, photos: e.photos }))
      .filter((e) => e.name.length > 0);
  }
  return {
    ...brief,
    facts: {
      ...brief.facts,
      collections: normalized,
    },
  };
}
