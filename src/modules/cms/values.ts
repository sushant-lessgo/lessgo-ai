// src/modules/cms/values.ts
//
// The CMS empty-value → `null` contract, in ONE place.
//
// ── ⚠️ WHY EMPTY MAPS TO `null` (do not "simplify" this away) ────────────────
// The Zod value schemas (`src/lib/schemas/collection.schema.ts`) REJECT empty
// strings:
//     DateValueSchema  — regex, "" never matches
//     LinkValueSchema  — url: z.string().min(1)
//     MediaValueSchema — url: z.string().min(1)
//     ImageValueSchema — url: z.string().min(1)
// …and the item PATCH deletes a key ONLY on an explicit `v === null`
// (`src/app/api/collections/[collectionId]/items/[itemId]/route.ts` — the merge).
//
// So a cleared field sent in its EMPTY shape is a **400, not a clear**: a cleared
// date as `""`, a cleared link as `{url:"",label:""}`, a cleared media toggle as
// `{kind:'upload',url:""}`. And a cleared field simply OMITTED is a silent no-op,
// because the PATCH is a merge — the server keeps the old value while the UI shows
// it cleared. `normalizeValue()` maps every empty shape to `null`;
// `buildValuesPayload()` decides whether that null must actually be SENT (only when
// the stored row still holds the key — nulls for never-filled fields are pure noise).
//
// `tags` is the one exemption: `TagsValueSchema` accepts `[]`, so an empty tag list
// is legal stored data and needs no delete sentinel.
//
// ── ⚠️ WHY THIS IS ITS OWN MODULE ────────────────────────────────────────────
// TWO surfaces owe this contract: the site editor's `ItemEditor` and the dashboard
// `CmsBoardClient`. They used to carry a copy each, and two copies of a
// clear-semantics mapping drift invisibly — a user clears a field on one surface,
// it clears; on the other it 400s or silently reverts.
//
// The dashboard board MUST NOT import (even transitively) from
// `src/hooks/editStore/**`, which is what stopped it importing this from
// `ItemEditor` (→ `MediaPickerModal` → `useEditStore`). So this module is
// deliberately **store-free and prisma-free**: its only imports are `import type`,
// which TypeScript erases — it has ZERO runtime dependencies. Keep it that way; a
// value import here would become a back door into the dashboard bundle.
// (Pinned by an assertion in `CmsBoardClient.test.tsx`.)

import type { FieldDef, FieldType, ImageValue } from './types';

/** Draft values are per-field working copies; shapes mirror the stored ones. */
export type Draft = Record<string, unknown>;

/**
 * Map one field's DRAFT value to what may be STORED, or `null` when the field is
 * empty. `null` is the API's delete sentinel — see the contract note above.
 */
export function normalizeValue(type: FieldType, draft: unknown): unknown | null {
  switch (type) {
    case 'image': {
      const v = draft as ImageValue | undefined;
      if (!v || !v.url) return null;
      return v.assetId ? { url: v.url, assetId: v.assetId } : { url: v.url };
    }
    case 'gallery': {
      const list = Array.isArray(draft) ? (draft as ImageValue[]) : [];
      const kept = list.filter((v) => v && v.url);
      return kept.length
        ? kept.map((v) => (v.assetId ? { url: v.url, assetId: v.assetId } : { url: v.url }))
        : null;
    }
    case 'video':
    case 'audio': {
      const v = draft as { kind?: string; url?: string } | undefined;
      if (!v || !v.url) return null;
      return { kind: v.kind === 'link' ? 'link' : 'upload', url: v.url };
    }
    case 'text_short':
    case 'text_long': {
      const s = typeof draft === 'string' ? draft : '';
      return s.trim() ? s : null;
    }
    case 'link': {
      const v = draft as { url?: string; label?: string } | undefined;
      if (!v || !v.url) return null;
      return { url: v.url, label: v.label ?? '' };
    }
    case 'date': {
      const s = typeof draft === 'string' ? draft : '';
      return s ? s : null;
    }
    case 'stat': {
      // `StatValueSchema` ACCEPTS `{key:'',value:''}` (every CMS value is
      // optional-empty), so an all-empty pair would be STORED rather than
      // rejected — a quieter failure than link/date/media, and the reason `stat`
      // still needs the empty→null mapping. A half-filled pair is kept: a spec
      // name with no number (or the reverse) is still something the user typed.
      const v = draft as { key?: string; value?: string } | undefined;
      const key = typeof v?.key === 'string' ? v.key.trim() : '';
      const value = typeof v?.value === 'string' ? v.value.trim() : '';
      if (!key && !value) return null;
      return { key, value };
    }
    case 'tags': {
      // EXEMPT from the null contract: TagsValueSchema accepts `[]`, so an empty
      // list is a legal stored value and needs no delete sentinel.
      return Array.isArray(draft) ? draft.filter((t) => typeof t === 'string' && t.trim()) : [];
    }
    default:
      return null;
  }
}

export interface BuildValuesOptions {
  /**
   * Restrict the payload to these field types. Fields of any OTHER type are skipped
   * ENTIRELY — not normalized, not deleted.
   *
   * This exists for the dashboard board, which cannot edit media (no media picker
   * without the edit store) and therefore never drafts it. Without the skip, an
   * un-drafted media field would normalize to `null` and that null would be sent as
   * a DELETE — the board would silently wipe images it can't even show. Omitting
   * the key is safe: the PATCH is a merge, so untouched keys survive.
   *
   * Omit this option to process every field (the site editor, which drafts all types).
   */
  editableTypes?: readonly FieldType[];
}

/**
 * Build the `values` map for the write.
 *
 *  - a non-empty field is always sent;
 *  - an EMPTY field is sent as explicit `null` **only when the stored item still
 *    holds that key** — that null is the delete. Sending nulls for fields that
 *    were never filled would bloat every payload for no effect;
 *  - on CREATE there is nothing to delete (`stored === null`), so empties are
 *    simply omitted.
 */
export function buildValuesPayload(
  fields: readonly FieldDef[],
  draft: Draft,
  stored: Record<string, unknown> | null,
  options: BuildValuesOptions = {}
): Record<string, unknown> {
  const { editableTypes } = options;
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (editableTypes && !editableTypes.includes(f.type)) continue;
    const next = normalizeValue(f.type, draft[f.id]);
    if (next !== null) {
      out[f.id] = next;
      continue;
    }
    if (stored && Object.prototype.hasOwnProperty.call(stored, f.id)) {
      out[f.id] = null; // the delete sentinel — see the contract note above
    }
  }
  return out;
}
