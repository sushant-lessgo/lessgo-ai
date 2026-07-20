'use client';

// src/app/edit/[token]/components/cms/ItemEditor.tsx
//
// t19 — the item editor. One control per schema field, driven by the field's
// TYPE (never its name), plus group assignment, permalink and save.
//
// ── RULINGS APPLIED VERBATIM (scout §E) ──────────────────────────────────────
//  #3  `text_long` is a PLAIN <textarea>. No rich-text toolbar (no such control
//      exists in components/ui and rich text is not one of the closed 9).
//  #7  Group assignment IS the per-item "Category" select, including an
//      "Ungrouped" option (the null group).
//  #8  NO Draft/Published status pill — per-item status does not exist in v1;
//      shipping the pill would be a lie.
//  #9  NO "✨ Write with AI" — the spec puts AI authoring of item content out of
//      scope.
//  #10 `link` → the url+label pair (`link-pair-field`).
//  #11 `video`/`audio` → the upload/link toggle (`media-or-link-field`), whose
//      upload side asks US to open the shared MediaPickerModal.
//
// ── ⚠️ THE EMPTY-VALUE → `null` CONTRACT (the phase-5 carry) ─────────────────
// This component is THE caller the primitives' JSDoc warns about. The Zod value
// schemas REJECT empty strings:
//     DateValueSchema  — regex, "" never matches
//     LinkValueSchema  — url: z.string().min(1)
//     MediaValueSchema — url: z.string().min(1)
//     ImageValueSchema — url: z.string().min(1)
// …and the item PATCH deletes a key ONLY on an explicit `v === null`
// (`items/[itemId]/route.ts` — the merge). So a cleared date sent as `""`, a
// cleared link sent as `{url:"",label:""}` or a media toggle sent as
// `{kind:'upload',url:""}` is a **400, not a clear**. `normalizeValue()` below
// maps every empty shape to `null`, and `buildValuesPayload()` decides whether
// that null must actually be SENT (only when the stored item still holds the
// key — sending nulls for never-filled fields would be pure noise).
// `tags` is the one exemption: `[]` validates, so an empty tag list is sent as
// `[]` and simply renders nothing.
//
// ── ⚠️ `stored` COMES FROM THE SERVER'S LAST ANSWER, NOT FROM THE PROP ───────
// The delete sentinel above is only emitted when the STORED row still holds the
// key — so `stored` being stale is a silent data-divergence bug, not a cosmetic
// one. The `item` prop freshens only when the host's `refreshCmsCollection`
// lands, and that refresh is fire-and-forget (its failure is swallowed to a
// `logger.warn`, leaving the previous bundle cached). Sequence that used to
// lose a clear: fill X → save → refresh fails → clear X → save → X is absent
// from the stale `stored`, so NO null is sent, the server keeps the old value,
// and the editor shows it cleared. Editor↔published divergence — exactly what
// this feature is architected to prevent.
// So `storedRef` is seeded from the prop but then advanced from each write's
// RESPONSE row (`data.item.values`), which is what the server actually holds.
//
// ── ⚠️ THE PERMALINK NEVER CHASES THE TITLE (founder ruling) ────────────────
// An item slug is derived from the title at CREATE only (the phase-1 items
// route does that). After creation it NEVER moves unless the user edits the
// permalink field by hand. Rationale: `materializePublish` never re-derives
// slugs, so this editor is the ONLY thing that can move an item slug — a
// title typo-fix used to relocate a LIVE detail page's URL, 404ing the old
// `/collection/old-slug` with no redirect. A manual edit still PATCHes the
// slug and the server still sets `slugLocked: true`.
// `slugLocked` is read here for PROVENANCE copy only (did the user choose this
// permalink, or did creation derive it?) — never to gate a rename, because no
// rename can move it any more.
// (`slugLocked` is deliberately NOT sent in the body: `ItemPatchSchema` has no
// such key, so Zod would strip it — the SLUG edit is what sets the flag, on the
// server. Sending a stripped key would be a decorative lie.)
//
// APP-CHROME ONLY — nothing here imports from `modules/templates/**`,
// `modules/generatedLanding/**` or `components/published/**`.

import React from 'react';

import type {
  CmsCollection,
  CmsGroup,
  CmsItem,
  FieldDef,
  FieldType,
  ImageValue,
} from '@/modules/cms/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/icon';
import { DateField } from '@/components/ui/date-field';
import { TagInput } from '@/components/ui/tag-input';
import { LinkPairField } from '@/components/ui/link-pair-field';
import { MediaOrLinkField } from '@/components/ui/media-or-link-field';
import { EditableSlugInput } from '@/components/ui/slug-input';
import { ItemPager } from '@/components/ui/item-pager';
import { MediaPickerModal } from '../ui/MediaPickerModal';

/** The "no group" option value in the Category select (ruling #7). */
export const UNGROUPED = '__ungrouped__';

/** Draft values are per-field working copies; shapes mirror the stored ones. */
type Draft = Record<string, unknown>;

/* ------------------------------------------------------------------ values */

/**
 * Map one field's DRAFT value to what may be STORED, or `null` when the field is
 * empty. `null` is the API's delete sentinel — see the empty-value contract note
 * at the top of this file. Exported for the tests, which assert each type.
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
      return kept.length ? kept.map((v) => (v.assetId ? { url: v.url, assetId: v.assetId } : { url: v.url })) : null;
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
    case 'tags': {
      // EXEMPT from the null contract: TagsValueSchema accepts `[]`, so an empty
      // list is a legal stored value and needs no delete sentinel.
      return Array.isArray(draft) ? draft.filter((t) => typeof t === 'string' && t.trim()) : [];
    }
    default:
      return null;
  }
}

/**
 * Build the `values` map for the write.
 *
 *  - a non-empty field is always sent;
 *  - an EMPTY field is sent as explicit `null` **only when the stored item still
 *    holds that key** — that null is the delete. Sending nulls for fields that
 *    were never filled would bloat every payload for no effect;
 *  - on CREATE there is nothing to delete, so empties are simply omitted.
 */
export function buildValuesPayload(
  fields: readonly FieldDef[],
  draft: Draft,
  stored: Record<string, unknown> | null
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const next = normalizeValue(f.type, draft[f.id]);
    if (next !== null) {
      out[f.id] = next;
      continue;
    }
    if (stored && Object.prototype.hasOwnProperty.call(stored, f.id)) {
      out[f.id] = null; // the delete sentinel — see the header contract note
    }
  }
  return out;
}

/** Seed the draft from a stored item (or empty defaults for a new one). */
function seedDraft(fields: readonly FieldDef[], item: CmsItem | null): Draft {
  const draft: Draft = {};
  for (const f of fields) {
    const stored = item?.values?.[f.id];
    switch (f.type) {
      case 'image':
        draft[f.id] = (stored as ImageValue) ?? { url: '' };
        break;
      case 'gallery':
        draft[f.id] = Array.isArray(stored) ? [...(stored as ImageValue[])] : [];
        break;
      case 'video':
      case 'audio':
        draft[f.id] = (stored as { kind: string; url: string }) ?? { kind: 'upload', url: '' };
        break;
      case 'link':
        draft[f.id] = (stored as { url: string; label: string }) ?? { url: '', label: '' };
        break;
      case 'tags':
        draft[f.id] = Array.isArray(stored) ? [...(stored as string[])] : [];
        break;
      default:
        draft[f.id] = typeof stored === 'string' ? stored : '';
    }
  }
  return draft;
}

/* ------------------------------------------------------------- the editor */

export interface ItemEditorProps {
  tokenId: string;
  collection: CmsCollection;
  groups: readonly CmsGroup[];
  /** Every item in the collection — the pager's universe. */
  items: readonly CmsItem[];
  /** The item being edited; `null` = CREATE a new one. */
  item: CmsItem | null;
  /** Pager navigation (zero-based index into `items`). */
  onIndexChange?: (index: number) => void;
  /** Fired after a successful write so the host can refresh `cmsData`. */
  onSaved?: (item: CmsItem) => void;
  onClose?: () => void;
}

export function ItemEditor({
  tokenId,
  collection,
  groups,
  items,
  item,
  onIndexChange,
  onSaved,
  onClose,
}: ItemEditorProps) {
  const fields = React.useMemo(
    () => (collection.fieldSchema || []) as FieldDef[],
    [collection]
  );
  const isCreate = !item;

  const [draft, setDraft] = React.useState<Draft>(() => seedDraft(fields, item));
  const [groupId, setGroupId] = React.useState<string | null>(item?.groupId ?? null);
  const [slug, setSlug] = React.useState(item?.slug ?? '');
  // Local mirror of the stored flag — PROVENANCE only (see the header note):
  // `true` = the user chose this permalink, `false` = creation derived it.
  const [slugLocked, setSlugLocked] = React.useState(!!item?.slugLocked);
  // What the SERVER holds for this row, advanced from each write's response.
  // NOT the `item` prop — see the `stored` note in the header.
  const storedRef = React.useRef<Record<string, unknown> | null>(item?.values ?? null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  // Which field id (if any) is waiting on the shared media picker.
  const [picking, setPicking] = React.useState<{ fieldId: string; type: FieldType } | null>(
    null
  );

  // Re-seed whenever the edited row changes (pager move, new-item, collection swap).
  const seedKey = `${collection.id}:${item?.id ?? 'new'}`;
  const lastSeed = React.useRef(seedKey);
  React.useEffect(() => {
    if (lastSeed.current === seedKey) return;
    lastSeed.current = seedKey;
    setDraft(seedDraft(fields, item));
    setGroupId(item?.groupId ?? null);
    setSlug(item?.slug ?? '');
    setSlugLocked(!!item?.slugLocked);
    storedRef.current = item?.values ?? null;
    setError(null);
    setSavedAt(null);
  }, [seedKey, fields, item]);

  const setFieldValue = (field: FieldDef, value: unknown) => {
    // The title is JUST a field. It does not touch the permalink — see the
    // "never chases the title" note in the header.
    setDraft((prev) => ({ ...prev, [field.id]: value }));
  };

  const editSlug = (next: string) => {
    setSlug(next);
    // A manual permalink edit LOCKS it — mirroring the route, which sets
    // `slugLocked: true` on any slug PATCH.
    setSlugLocked(true);
  };

  const index = React.useMemo(
    () => (item ? items.findIndex((i) => i.id === item.id) : -1),
    [item, items]
  );

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);

    const values = buildValuesPayload(fields, draft, storedRef.current);
    const body: Record<string, unknown> = { tokenId, values, groupId };
    // The permalink only travels when the user can see and change it.
    if (!isCreate && collection.detailPages && slug && slug !== item!.slug) {
      body.slug = slug;
    }

    const url = isCreate
      ? `/api/collections/${encodeURIComponent(collection.id)}/items`
      : `/api/collections/${encodeURIComponent(collection.id)}/items/${encodeURIComponent(item!.id)}`;

    try {
      const res = await fetch(url, {
        method: isCreate ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // ⚠️ Item CREATE has no top-level-slug shadow guard server-side (the
        // phase-4 carry): a created item can mint a path that collides with a real
        // page, and that only surfaces as a 409 at publish. Whatever the server
        // says — 409 included — is shown verbatim rather than swallowed.
        setError(data?.error || `Could not save this item (${res.status})`);
        setSaving(false);
        return;
      }
      setSaving(false);
      setSavedAt(Date.now());
      if (data?.item) {
        setSlug(data.item.slug ?? slug);
        setSlugLocked(!!data.item.slugLocked);
        // Advance server-truth ONLY on a real values object. A response without
        // one is ambiguous, and treating that as "the row is empty" would drop
        // the next clear — the very bug this ref exists to close.
        if (data.item.values && typeof data.item.values === 'object') {
          storedRef.current = data.item.values as Record<string, unknown>;
        }
        onSaved?.(data.item as CmsItem);
      } else {
        onSaved?.(item as CmsItem);
      }
    } catch {
      setError('Network error — this item was not saved.');
      setSaving(false);
    }
  };

  const applyPick = (url: string) => {
    if (!picking) return;
    const { fieldId, type } = picking;
    setDraft((prev) => {
      if (type === 'gallery') {
        const list = Array.isArray(prev[fieldId]) ? (prev[fieldId] as ImageValue[]) : [];
        return { ...prev, [fieldId]: [...list, { url }] };
      }
      if (type === 'image') return { ...prev, [fieldId]: { url } };
      // video / audio — an uploaded asset is always the `upload` kind.
      return { ...prev, [fieldId]: { kind: 'upload', url } };
    });
    setPicking(null);
  };

  return (
    <div className="flex min-h-0 w-full flex-col font-app-sans" data-cms-item-editor="">
      {/* Header — breadcrumb + close. Ruling #8: NO status pill. */}
      <div className="flex flex-none items-center gap-2 border-b border-app-divider px-4 py-3">
        {onClose ? (
          <button
            type="button"
            data-item-back=""
            aria-label="Back to collection"
            onClick={onClose}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-app-ctl-sm text-app-icon-muted hover:bg-app-hover hover:text-app-ink"
          >
            <AppIcon name="arrow_back" size={18} />
          </button>
        ) : null}
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-app-ink">
          {collection.name}
          <span className="text-app-muted"> / </span>
          <span className="text-app-muted">{isCreate ? 'New item' : slug || 'Item'}</span>
        </p>
      </div>

      {items.length > 0 && !isCreate ? (
        <div className="flex-none px-4 pt-3">
          <ItemPager
            index={Math.max(0, index)}
            total={items.length}
            onIndexChange={(next) => onIndexChange?.(next)}
          />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {fields.length === 0 ? (
          <p className="rounded-app-ctl border border-dashed border-app-border px-3 py-4 text-center text-[12px] text-app-muted">
            This collection has no fields yet — edit its schema first.
          </p>
        ) : (
          fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5" data-cms-field={field.id}>
              <label className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
                {field.name}
              </label>
              <FieldControl
                field={field}
                value={draft[field.id]}
                onChange={(v) => setFieldValue(field, v)}
                onPickRequest={() => setPicking({ fieldId: field.id, type: field.type })}
              />
            </div>
          ))
        )}

        {/* GROUP — ruling #7: the per-item "Category" select, "Ungrouped" included.
            A NATIVE <select> on app-chrome tokens rather than the Radix `select`
            primitive: this panel lives inside a Radix Dialog, and the portalled
            Radix listbox needs pointer-event capabilities jsdom does not provide,
            which would make the group-assignment contract untestable. */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint"
            htmlFor="cms-item-group"
          >
            Category
          </label>
          <select
            id="cms-item-group"
            data-item-group=""
            value={groupId ?? UNGROUPED}
            onChange={(e) =>
              setGroupId(e.target.value === UNGROUPED ? null : e.target.value)
            }
            className="h-10 w-full rounded-app-input border border-app-border-input bg-app-surface px-3 text-sm text-app-ink focus-visible:border-app-primary focus-visible:outline-none"
          >
            <option value={UNGROUPED}>Ungrouped</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* PERMALINK — only when this collection publishes detail pages. With
            detailPages OFF there is no item URL, so showing one would be fiction. */}
        {collection.detailPages && !isCreate ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
              Permalink
            </label>
            <EditableSlugInput
              prefix={`/${collection.slug}/`}
              value={slug}
              onValueChange={editSlug}
              aria-label="Item permalink"
            />
            {/* PROVENANCE, not behaviour. Both states end in the same warning
                because both behave identically: nothing but an edit here moves
                this item's address. The old copy ("Follows the title until you
                edit it" / "Custom permalink") described an auto-follow that no
                longer exists and labelled derived slugs "custom". */}
            <p className="text-[11px] text-app-muted">
              {slugLocked ? 'You set this permalink. ' : 'Made from the title when this item was created. '}
              Changing it changes this item’s link — the old one stops working.
            </p>
          </div>
        ) : null}

        {error ? (
          <p role="alert" data-cms-item-error="" className="text-[12px] text-app-danger">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-none items-center justify-between gap-2 border-t border-app-divider px-4 py-3">
        <span className="truncate text-[11.5px] text-app-muted" data-item-saved="">
          {savedAt ? 'Saved just now' : ''}
        </span>
        <div className="flex flex-none items-center gap-2">
          {onClose ? (
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            data-item-save=""
            disabled={saving}
            onClick={handleSave}
          >
            {isCreate ? 'Create item' : 'Save'}
          </Button>
        </div>
      </div>

      {/* The SHARED picker — image/gallery/video/audio uploads all route here
          (`onPick(url)` → we store `{url}`), so the CMS never grows a second
          media surface. */}
      <MediaPickerModal
        open={!!picking}
        onOpenChange={(next) => {
          if (!next) setPicking(null);
        }}
        tokenId={tokenId}
        initialTab="library"
        onPick={applyPick}
      />
    </div>
  );
}

/* ------------------------------------------------------- control per TYPE */

/**
 * The control is chosen by field TYPE and NOTHING else — never by field name.
 * A `text_short` called "Price" is an input; a field called "cover" that happens
 * to be `text_long` is a textarea. Name-sniffing is how a CMS grows a hidden,
 * undocumented second schema.
 */
function FieldControl({
  field,
  value,
  onChange,
  onPickRequest,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
  onPickRequest: () => void;
}) {
  switch (field.type) {
    case 'image': {
      const v = (value as ImageValue) || { url: '' };
      return (
        <ImageControl
          fieldId={field.id}
          value={v}
          onPickRequest={onPickRequest}
          onRemove={() => onChange({ url: '' })}
        />
      );
    }

    case 'gallery': {
      const list = Array.isArray(value) ? (value as ImageValue[]) : [];
      return (
        <div className="flex flex-wrap gap-2" data-control="gallery">
          {list.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              className="relative h-16 w-16 overflow-hidden rounded-app-ctl-sm border border-app-border bg-app-thumb-bg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                data-gallery-thumb={String(i)}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                data-gallery-remove={String(i)}
                aria-label={`Remove image ${i + 1}`}
                onClick={() => onChange(list.filter((_, j) => j !== i))}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-app-badge bg-white/90 text-app-icon-muted hover:text-app-delete"
              >
                <AppIcon name="close" size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            data-gallery-add=""
            aria-label={`Add an image to ${field.name}`}
            onClick={onPickRequest}
            className="flex h-16 w-16 items-center justify-center rounded-app-ctl-sm border border-dashed border-app-border text-app-icon-faint hover:bg-app-hover"
          >
            <AppIcon name="add" size={18} />
          </button>
        </div>
      );
    }

    case 'video':
    case 'audio': {
      const v = (value as { kind: 'upload' | 'link'; url: string }) || {
        kind: 'upload',
        url: '',
      };
      return (
        <div data-control={field.type}>
          <MediaOrLinkField
            value={v}
            onValueChange={onChange}
            onPickRequest={onPickRequest}
            aria-label={`${field.name} source`}
          />
        </div>
      );
    }

    case 'text_short':
      return (
        <Input
          type="text"
          data-control="text_short"
          aria-label={field.name}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    // Ruling #3 — a PLAIN textarea. No toolbar.
    case 'text_long':
      return (
        <Textarea
          rows={4}
          data-control="text_long"
          aria-label={field.name}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'link': {
      const v = (value as { url: string; label: string }) || { url: '', label: '' };
      return (
        <div data-control="link">
          <LinkPairField value={v} onValueChange={onChange} />
        </div>
      );
    }

    case 'date':
      return (
        <DateField
          data-control="date"
          aria-label={field.name}
          value={typeof value === 'string' ? value : ''}
          onValueChange={onChange}
        />
      );

    case 'tags':
      return (
        <div data-control="tags">
          <TagInput
            value={Array.isArray(value) ? (value as string[]) : []}
            onValueChange={onChange}
            inputAriaLabel={`Add a tag to ${field.name}`}
          />
        </div>
      );

    default:
      return null;
  }
}

function ImageControl({
  fieldId,
  value,
  onPickRequest,
  onRemove,
}: {
  fieldId: string;
  value: ImageValue;
  onPickRequest: () => void;
  onRemove: () => void;
}) {
  if (!value.url) {
    return (
      <button
        type="button"
        data-control="image"
        data-image-add={fieldId}
        onClick={onPickRequest}
        className="flex h-24 w-full items-center justify-center gap-1.5 rounded-app-ctl border border-dashed border-app-border text-[12px] font-semibold text-app-label hover:bg-app-hover"
      >
        <AppIcon name="add" size={16} />
        Choose an image
      </button>
    );
  }
  return (
    <div data-control="image" className="flex items-center gap-2">
      <span className="h-16 w-16 flex-none overflow-hidden rounded-app-ctl-sm border border-app-border bg-app-thumb-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value.url}
          alt=""
          data-image-thumb={fieldId}
          className="h-full w-full object-cover"
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Provenance, per the handoff: fields POINT at library assets. */}
        <span className="truncate text-[11px] text-app-muted">
          from Media library · {value.url.split('/').pop()}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-image-replace={fieldId}
            onClick={onPickRequest}
          >
            Replace
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-image-remove={fieldId}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ItemEditor;
