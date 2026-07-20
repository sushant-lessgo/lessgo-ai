// src/modules/cms/render/toRenderModel.ts
//
// THE single data feed for the CMS block. `toRenderModel()` turns raw table rows
// (collection + groups + items) into the ONE model both renderers consume:
//   - the editor adapter (phase 3, a 'use client' component), and
//   - the publish materializer (phase 3, server-side).
// Because there is exactly ONE shaping path, the two feeds CANNOT diverge — that
// is the data-layer half of the parity guarantee (the markup half is the shared
// `.core.tsx`).
//
// ── BOUNDARY LAW (BLOCKING in review) ──────────────────────────────────────
// This module is PLAIN and CLIENT-SAFE by contract. It MUST NOT import
// `src/lib/publishSanitizer.ts` (server-only: jsdom + dompurify) or anything
// else server-only. URL predicates come from the pure `src/lib/safeUrl.ts`.
//
// ── URL SANITIZATION LIVES HERE ────────────────────────────────────────────
// The publish walker (`sanitizeItemObject`, publishSanitizer.ts) recurses exactly
// ONE level, so it cannot reach a URL nested inside a gallery entry inside an item
// inside a group. Gating here also means the EDITOR shows exactly what publish
// will show. Two predicates, pinned per field type:
//   - NARROW `isSafeURL`          → image / gallery src (must be a fetchable asset)
//   - WIDE   `isSafePublishedUrl` → link / video / audio (CTAs legitimately use
//                                   mailto: / tel: / #anchor — the narrow predicate
//                                   would silently delete "Email me" / "Call us")
// Unsafe → the value is DROPPED (the field disappears), never rewritten to '#':
// a CMS field is content, not a template CTA, so a dead link is worse than none.
//
// ── ⚠️ MODEL KEY NAMES ARE CONSTRAINED — DO NOT "IMPROVE" THEM ────────────
// The publish walker (`sanitizeItemObject` → `sanitizeStringField`, publishSanitizer.ts)
// key-dispatches every STRING prop it reaches by SUFFIX: a key ending in
// `href` / `url` / `link` / `slug` (case-insensitive, `isUrlContentKey`,
// publishSanitizer.ts:173-181) is run through `sanitizePublishedUrl`, which
// rewrites anything that is not a URL to `'#'`.
//
// `elements.cmsModel` is an object, so the walker recurses into it: every
// top-level string prop of the model AND every string prop of the nested `roles`
// object is dispatched. So a model key that merely LOOKS url-ish is silently
// corrupted at publish time only — the editor keeps showing the true value.
// (Real incident: `roles.primaryLink: "buy"` → `'#'` and `collectionSlug:
// "books"` → `'#'`, which emptied every card's CTA on published pages.)
//
// Hence the deliberately non-suffix-matching names:
//   `roles.primaryCta`   (a FIELD ID, not a URL) — never `primaryLink`
//   `collectionRef`      (a collection slug string) — never `collectionSlug`
//   item `itemRef`       (an item slug string) — never `slug`
// This law is LOAD-BEARING, not defensive. On DETAIL pages the walker actively
// reaches both keys: `collectionRef` at depth 2 (`elements.cmsItem.collectionRef`)
// and `itemRef` at depth 3 (`elements.cmsItem.item.itemRef`, hoisted out of
// `groups[].items[]` by `toDetailModel`). Rename either to a `slug`-suffixed name
// and you get `'#'` on every live item page — editor-invisible. Full per-section
// depth table: `src/modules/cms/README.md` › "The naming law is LOAD-BEARING".
//
// The ONLY sanctioned `url`-suffixed keys are the genuine URL values inside
// image / gallery / video / audio / link values (`{url, …}`) — gating those is
// correct and desirable. Any NEW key must not end in href/url/link/slug.
// Guarded permanently by the meta-test in `materializePublish.test.ts`.
//
// ── COERCION-PROOF SHAPE (load-bearing; see the plan's pinned section) ─────
// `coercePublishValue` (layoutElementSchema.ts:380-397) runs over every published
// element value and silently rewrites two shapes:
//   1. any object with BOTH a string `content` and a string `type` key → collapsed
//      to the bare `content` string. Hence per-field shape is `{fieldType, value}`
//      — NEVER `{type, content}`. No object in this model may carry that pair.
//   2. any object whose keys are ALL numeric strings → concatenated into one
//      string. Hence every map here is keyed by letter-prefixed field ids
//      (FIELD_ID_REGEX, enforced in collection.schema.ts) — and ordered data is
//      carried in ARRAYS (arrays are only recursed into, never rewritten).

import { isSafeURL, isSafePublishedUrl } from '@/lib/safeUrl';
import type {
  CmsCollection,
  CmsGroup,
  CmsItem,
  CmsCollectionBundle,
  FieldDef,
  FieldType,
  ImageValue,
  GalleryValue,
  MediaValue,
  LinkValue,
  StatValue,
} from '../types';

/**
 * The element key under which the materialized model is stored on a placed
 * `cmscollection` section (`content[sectionId].elements[CMS_MODEL_ELEMENT_KEY]`).
 * Shared by the publish materializer (phase 3) and the published twin so the key
 * is never spelled twice.
 */
export const CMS_MODEL_ELEMENT_KEY = 'cmsModel';

// ── Model types ─────────────────────────────────────────────────────────────

/** One resolved field of one item. `{fieldType, value}` — coercion-proof rule 1. */
export interface CmsFieldRender {
  fieldId: string;
  /** Human label from the collection's field schema (used for date/tags captions). */
  name: string;
  fieldType: FieldType;
  value: CmsRenderValue;
}

export type CmsRenderValue =
  | string            // text_short, text_long, date
  | string[]          // tags
  | ImageValue        // image
  | GalleryValue      // gallery
  | MediaValue        // video, audio
  | LinkValue         // link
  | StatValue;        // stat — {key, value}; NEITHER name ends in href/url/link/slug

export interface CmsItemRender {
  itemId: string;
  /** The item's slug. NAMED `itemRef`, never `slug` — see the key-name note above. */
  itemRef: string;
  /** Non-empty fields, in collection field-schema order. */
  fields: CmsFieldRender[];
}

export interface CmsGroupRender {
  /** `null` = the ungrouped bucket. */
  groupId: string | null;
  /** `null` = no header rendered (ungrouped bucket). */
  name: string | null;
  items: CmsItemRender[];
}

/**
 * Resolved role → field id (after explicit-role validation + fallbacks).
 *
 * NOTE the key is `primaryCta`, NOT `primaryLink` (the stored `CollectionRoles`
 * key). A `*Link` key would be scheme-gated to `'#'` at publish — see the
 * key-name note at the top of this file. The two vocabularies are bridged in
 * `toRenderModel()`.
 */
export interface CmsResolvedRoles {
  title: string | null;
  cover: string | null;
  primaryCta: string | null;
}

export interface CmsRenderModel {
  collectionId: string;
  collectionName: string;
  /** The collection's slug. NAMED `collectionRef`, never `collectionSlug`. */
  collectionRef: string;
  detailPages: boolean;
  /**
   * Phase 8B — publish also emits a LISTING subpage at `/<collectionRef>`.
   * Carried on the model (like `detailPages`) so the publish materializer decides
   * from the single shaped feed rather than reaching back into the raw row.
   * Nothing in the RENDER branches on it: a listing page is the same block on its
   * own page, not a different block.
   *
   * REQUIRED (tightened once `CollectionSection.published.tsx` came into scope):
   * `toRenderModel` always emits it and `EMPTY_CMS_MODEL` now spells it out, so
   * there is no model in the system without it.
   */
  listingPage: boolean;
  /** Reserved seam for per-template group layouts; v1 renders stacked groups. */
  layoutHint: string | null;
  roles: CmsResolvedRoles;
  groups: CmsGroupRender[];
}

// ── Role resolution ─────────────────────────────────────────────────────────

const ROLE_TYPES: Record<keyof CmsResolvedRoles, readonly FieldType[]> = {
  title: ['text_short'],
  cover: ['image', 'gallery'],
  primaryCta: ['link'],
};

/**
 * Explicit role wins when it points at an existing field of an allowed type;
 * otherwise fall back to the FIRST field of an allowed type in schema order.
 * `null` when the schema has no eligible field at all.
 */
function resolveRole(
  role: keyof CmsResolvedRoles,
  fields: FieldDef[],
  explicit: string | undefined
): string | null {
  const allowed = ROLE_TYPES[role];
  if (explicit) {
    const f = fields.find((x) => x.id === explicit);
    if (f && allowed.includes(f.type)) return f.id;
  }
  return fields.find((f) => allowed.includes(f.type))?.id ?? null;
}

// ── Per-type value normalization + sanitization ─────────────────────────────

const str = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t : null;
};

/** image / gallery entry: NARROW predicate — must be a fetchable asset URL. */
function safeImage(v: unknown): ImageValue | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const raw = v as Record<string, unknown>;
  const url = str(raw.url);
  if (!url || !isSafeURL(url)) return null;
  const assetId = str(raw.assetId);
  return assetId ? { url, assetId } : { url };
}

/** video / audio: WIDE predicate (an audio "link" may legitimately be a #anchor). */
function safeMedia(v: unknown): MediaValue | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const raw = v as Record<string, unknown>;
  const url = str(raw.url);
  if (!url || !isSafePublishedUrl(url)) return null;
  const kind = raw.kind === 'upload' || raw.kind === 'link' ? raw.kind : 'link';
  return { kind, url };
}

/** link: WIDE predicate — mailto:/tel:/#anchor CTAs MUST survive. */
function safeLink(v: unknown): LinkValue | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const raw = v as Record<string, unknown>;
  const url = str(raw.url);
  if (!url || !isSafePublishedUrl(url)) return null;
  return { url, label: str(raw.label) ?? '' };
}

/**
 * stat: a `{key, value}` spec pair. NO url predicate — neither half is a URL, and
 * neither property NAME ends in `href|url|link|slug`, so the publish walker's
 * key-suffix dispatch cannot rewrite either to `'#'` (the phase-3 bug class).
 * Both halves are optional-empty in the schema, so a pair with NEITHER half filled
 * is dropped like any other empty value; a half-filled pair is kept (a spec with a
 * label and no number is still meaningful, and vice-versa).
 */
function safeStat(v: unknown): StatValue | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const raw = v as Record<string, unknown>;
  const key = str(raw.key) ?? '';
  const value = str(raw.value) ?? '';
  if (!key && !value) return null;
  return { key, value };
}

/**
 * Normalize one stored value for one field type. Returns `null` when the value is
 * absent, empty, the wrong shape, or fails its URL predicate — the caller then
 * DROPS the field entirely.
 */
export function normalizeFieldValue(type: FieldType, v: unknown): CmsRenderValue | null {
  switch (type) {
    case 'image':
      return safeImage(v);
    case 'gallery': {
      if (!Array.isArray(v)) return null;
      const entries = v.map(safeImage).filter((e): e is ImageValue => e !== null);
      return entries.length ? entries : null;
    }
    case 'video':
    case 'audio':
      return safeMedia(v);
    case 'link':
      return safeLink(v);
    case 'stat':
      return safeStat(v);
    case 'text_short':
    case 'text_long':
    case 'date':
      return str(v);
    case 'tags': {
      if (!Array.isArray(v)) return null;
      const tags = v.map(str).filter((t): t is string => t !== null);
      return tags.length ? tags : null;
    }
    default:
      return null;
  }
}

// ── Item + group shaping ────────────────────────────────────────────────────

function toItemRender(item: CmsItem, fields: FieldDef[]): CmsItemRender {
  const values = (item.values || {}) as Record<string, unknown>;
  const rendered: CmsFieldRender[] = [];
  for (const f of fields) {
    const value = normalizeFieldValue(f.type, values[f.id]);
    if (value === null) continue; // empty / unsafe → dropped
    rendered.push({ fieldId: f.id, name: f.name, fieldType: f.type, value });
  }
  return { itemId: item.id, itemRef: item.slug, fields: rendered };
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

/**
 * Shape a collection bundle into the render model.
 *
 * Ordering: groups by `order`; items by `order` within their group. Ungrouped
 * items form a nameless bucket — FIRST when the collection has no groups at all
 * (the common single-list case), LAST otherwise (so named sections lead).
 * Groups with no items are dropped (no stray headers).
 */
export function toRenderModel(bundle: CmsCollectionBundle): CmsRenderModel {
  const { collection, groups, items } = bundle;
  const fields: FieldDef[] = Array.isArray(collection.fieldSchema) ? collection.fieldSchema : [];
  const roleInput = collection.roles || {};

  const sortedItems = [...(items || [])].sort(byOrder);
  const sortedGroups = [...(groups || [])].sort(byOrder);

  const rendered: CmsGroupRender[] = [];
  const grouped = new Map<string, CmsItemRender[]>();
  const ungrouped: CmsItemRender[] = [];

  for (const item of sortedItems) {
    const r = toItemRender(item, fields);
    if (item.groupId) {
      const list = grouped.get(item.groupId) || [];
      list.push(r);
      grouped.set(item.groupId, list);
    } else {
      ungrouped.push(r);
    }
  }

  const ungroupedBucket: CmsGroupRender | null = ungrouped.length
    ? { groupId: null, name: null, items: ungrouped }
    : null;

  if (ungroupedBucket && sortedGroups.length === 0) rendered.push(ungroupedBucket);

  for (const g of sortedGroups) {
    const list = grouped.get(g.id);
    if (!list || !list.length) continue; // empty group → no header
    rendered.push({ groupId: g.id, name: g.name, items: list });
  }

  if (ungroupedBucket && sortedGroups.length > 0) rendered.push(ungroupedBucket);

  return {
    collectionId: collection.id,
    collectionName: collection.name,
    collectionRef: collection.slug,
    detailPages: !!collection.detailPages,
    listingPage: !!collection.listingPage,
    layoutHint: collection.layoutHint ?? null,
    roles: {
      title: resolveRole('title', fields, roleInput.title),
      cover: resolveRole('cover', fields, roleInput.cover),
      // stored role key `primaryLink` → model key `primaryCta` (key-name note).
      primaryCta: resolveRole('primaryCta', fields, roleInput.primaryLink),
    },
    groups: rendered,
  };
}

// ── Detail pages (phase 4) ──────────────────────────────────────────────────
//
// A detail page is a per-ITEM view of the SAME render model — no second feed, no
// second DB read. `toDetailModel()` is a pure SELECTOR over `CmsRenderModel`, so
// the listing card and the detail page can never disagree about an item.
//
// KEY-NAME LAW applies here too: `collectionRef` / `itemRef`, never
// `collectionSlug` / `slug`; the only `url`-suffixed keys are the genuine URL
// values inside image/gallery/video/audio/link values.

/**
 * The element key under which a materialized DETAIL model is stored on a
 * fan-out `cmscollectionitem` section
 * (`content[sectionId].elements[CMS_DETAIL_ELEMENT_KEY]`). Distinct from
 * `CMS_MODEL_ELEMENT_KEY` so a listing model can never be mistaken for a detail
 * model (and vice-versa) by either published twin.
 */
export const CMS_DETAIL_ELEMENT_KEY = 'cmsItem';

export interface CmsDetailModel {
  collectionId: string;
  collectionName: string;
  /** The collection's slug. NAMED `collectionRef`, never `collectionSlug`. */
  collectionRef: string;
  /** Resolved roles — identical to the listing model's, so both views agree. */
  roles: CmsResolvedRoles;
  /** The one item this page renders (`itemRef` = its slug). */
  item: CmsItemRender;
}

/**
 * The published path of an item's detail page.
 *
 * PINNED CONVENTION — leading-slash ABSOLUTE bare path, used for BOTH the
 * `content.subpages[…]` key and the listing card's `href`:
 *   `/<collectionRef>/<itemRef>`   e.g. `/books/deep-work`
 * NEVER `/p/<slug>/…` and NEVER slash-less. A slash-less path mismatches KV
 * route derivation and the publish-route locale collision guard, and fails
 * `isSafeURL` in `publishSanitizer.ts` → the href is coerced to `'#'`.
 * Returns `null` when either ref is missing (→ no link, no page).
 */
export function cmsDetailPath(
  collectionRef: string | null | undefined,
  itemRef: string | null | undefined
): string | null {
  if (!collectionRef || !itemRef) return null;
  return `/${collectionRef}/${itemRef}`;
}

/** Every item in the model, in render order, flattened across groups. */
export function allRenderItems(model: CmsRenderModel): CmsItemRender[] {
  return model.groups.flatMap((g) => g.items);
}

/** Narrow the listing model to ONE item's detail model (pure selector). */
export function toDetailModel(model: CmsRenderModel, item: CmsItemRender): CmsDetailModel {
  return {
    collectionId: model.collectionId,
    collectionName: model.collectionName,
    collectionRef: model.collectionRef,
    roles: model.roles,
    item,
  };
}

// ── Reader helpers (used by the core walkers) ───────────────────────────────

export function fieldById(item: CmsItemRender, fieldId: string | null): CmsFieldRender | null {
  if (!fieldId) return null;
  return item.fields.find((f) => f.fieldId === fieldId) ?? null;
}

/** Fields that are NOT already consumed by a role, in schema order. */
export function nonRoleFields(item: CmsItemRender, roles: CmsResolvedRoles): CmsFieldRender[] {
  const taken = new Set([roles.title, roles.cover, roles.primaryCta].filter(Boolean) as string[]);
  return item.fields.filter((f) => !taken.has(f.fieldId));
}

/** First renderable src for a cover field (image → url; gallery → first entry). */
export function coverSrc(field: CmsFieldRender | null): string | undefined {
  if (!field) return undefined;
  if (field.fieldType === 'image') return (field.value as ImageValue).url;
  if (field.fieldType === 'gallery') return (field.value as GalleryValue)[0]?.url;
  return undefined;
}

export type { CmsCollection, CmsGroup, CmsItem, CmsCollectionBundle };
