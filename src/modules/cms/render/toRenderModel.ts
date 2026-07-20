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
  | LinkValue;        // link

export interface CmsItemRender {
  itemId: string;
  slug: string;
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

/** Resolved role → field id (after explicit-role validation + fallbacks). */
export interface CmsResolvedRoles {
  title: string | null;
  cover: string | null;
  primaryLink: string | null;
}

export interface CmsRenderModel {
  collectionId: string;
  collectionName: string;
  collectionSlug: string;
  detailPages: boolean;
  /** Reserved seam for per-template group layouts; v1 renders stacked groups. */
  layoutHint: string | null;
  roles: CmsResolvedRoles;
  groups: CmsGroupRender[];
}

// ── Role resolution ─────────────────────────────────────────────────────────

const ROLE_TYPES: Record<keyof CmsResolvedRoles, readonly FieldType[]> = {
  title: ['text_short'],
  cover: ['image', 'gallery'],
  primaryLink: ['link'],
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
  return { itemId: item.id, slug: item.slug, fields: rendered };
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
    collectionSlug: collection.slug,
    detailPages: !!collection.detailPages,
    layoutHint: collection.layoutHint ?? null,
    roles: {
      title: resolveRole('title', fields, roleInput.title),
      cover: resolveRole('cover', fields, roleInput.cover),
      primaryLink: resolveRole('primaryLink', fields, roleInput.primaryLink),
    },
    groups: rendered,
  };
}

// ── Reader helpers (used by the core walker) ────────────────────────────────

export function fieldById(item: CmsItemRender, fieldId: string | null): CmsFieldRender | null {
  if (!fieldId) return null;
  return item.fields.find((f) => f.fieldId === fieldId) ?? null;
}

/** Fields that are NOT already consumed by a role, in schema order. */
export function nonRoleFields(item: CmsItemRender, roles: CmsResolvedRoles): CmsFieldRender[] {
  const taken = new Set([roles.title, roles.cover, roles.primaryLink].filter(Boolean) as string[]);
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
