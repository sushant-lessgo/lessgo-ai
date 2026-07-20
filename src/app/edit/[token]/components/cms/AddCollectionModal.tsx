'use client';

// src/app/edit/[token]/components/cms/AddCollectionModal.tsx
//
// t12 — the schema builder. Create a collection (POST /api/collections) or edit
// an existing one's schema (PATCH /api/collections/:id).
//
// ── RULINGS APPLIED VERBATIM (scout §E; founder/orchestrator decisions) ───────
//  #1  START FROM: `Blank` is enabled; Products / Team / Portfolio / Blog render
//      GREYED + why-tooltip via <Coming>. Not omitted, not enabled. The greyed-
//      placeholder rule is a contract — deleting those chips is a regression, and
//      AddCollectionModal.test.tsx fails if they disappear or become actionable.
//  #2  There is NO `Price` field type. The closed set only; price is `Text — short`.
//  #3  `Text — long` is a PLAIN textarea type — no rich-text toolbar (no such
//      control exists in `components/ui`, and it is not one of the closed set).
//  #4  No mono/SKU variant.
//  #5  Per-row role menu (title / cover / primaryLink), TYPE-FILTERED off
//      ROLE_ALLOWED_TYPES — cover only on image|gallery, primaryLink only on link,
//      title only on text_short. Rendered through field-row-list's `renderTrailing`.
//  #6  detailPages is a `switch`, and the CREATES THESE PAGES tiles are REACTIVE.
//      Phase 8B adds a SECOND switch, `listingPage` (founder ruling: per
//      collection, DEFAULT OFF), and the tiles now react to BOTH: neither on →
//      no tiles + a line saying the collection only renders where it is placed.
//  #9  No "Write with AI" anywhere.
//
// ── DRAFT STATE IS LOCAL, ON PURPOSE ─────────────────────────────────────────
// `field-row-list`'s `onNameChange` fires on EVERY KEYSTROKE (its JSDoc; the
// input is controlled on `item.name`). So the whole schema is held here as draft
// state and written exactly once, on Create/Save. Wiring any of these handlers to
// a PATCH would be one request per character.
//
// ── FIELD IDS ARE GENERATED, NEVER DERIVED FROM THE NAME ─────────────────────
// Ids must match FIELD_ID_REGEX (`^[A-Za-z][A-Za-z0-9_-]*$`) — this is not
// cosmetic: `coercePublishValue` mangles numeric-ish keys at publish only. Ids are
// minted from the field TYPE (`text_short`, `text_short_2`, …) so they are
// letter-prefixed by construction and stable while the user retypes the label.
//
// ⚠️ IDS MUST NEVER BE RECYCLED (the orphan-resurrection bug) ────────────────
// Field deletion is DELIBERATELY NON-DESTRUCTIVE: dropping a field from the
// schema leaves every item's `values[fieldId]` in place (`/api/collections/[id]`
// — "items are deliberately untouched"). So an id that was deleted is still a
// LIVE KEY on the item rows. If a newly added field could take that id back,
// `toRenderModel` (`values[f.id]`) would render the OLD field's text under the
// NEW field's label — in the editor AND in published output.
//
// Two defences, both required:
//  1. `reservedFieldIds` — the clamp set is the UNION of the draft's ids, the
//     STORED schema's ids and every key present in any item's `values`. The item
//     keys are the authoritative record of which orphans exist, and they survive
//     across sessions (the stored schema does not — a saved delete erases it).
//  2. In EDIT mode new fields get a random suffix (`text_short_a3f9`) rather than
//     the next free ordinal, so the invariant does not depend on the item cache
//     being complete/fresh. CREATE mode keeps the readable ordinal ids: there are
//     no items yet, so nothing can be resurrected.
//
// APP-CHROME ONLY — nothing here imports from `modules/templates/**`,
// `modules/generatedLanding/**` or `components/published/**`.

import React from 'react';

import {
  FIELD_TYPES,
  FIELD_ID_REGEX,
  ROLE_ALLOWED_TYPES,
  COLLECTION_PURPOSES,
  type FieldDef,
  type FieldType,
  type RoleKey,
  type CollectionPurpose,
} from '@/lib/schemas/collection.schema';
import type { CmsCollection, CmsItem, CollectionRoles } from '@/modules/cms/types';
import { slugifyName } from '@/modules/cms/slug';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Coming } from '@/components/ui/coming';
import { AppIcon } from '@/components/ui/icon';
import { SlugInput } from '@/components/ui/slug-input';
import { FieldRowList } from '@/components/ui/field-row-list';
import {
  Popover,
  PopoverTrigger,
  AppPopoverMenu,
  AppPopoverItem,
  AppPopoverLabel,
} from '@/components/ui/popover';

/** Human labels for the CLOSED 10. Ruling #2: no Price. Ruling #4: no SKU/mono. */
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  image: 'Image',
  gallery: 'Gallery',
  video: 'Video',
  audio: 'Audio',
  text_short: 'Text — short',
  text_long: 'Text — long',
  link: 'Link / button',
  date: 'Date',
  tags: 'Tags',
  stat: 'Spec / stat',
};

// (Phase 8A's `PICKER_FIELD_TYPES` filter is GONE, as its docblock promised:
// `stat` now has a control (`key-value-field`) and a renderer (`FieldNode`), so
// the picker offers the full closed 10 again.)

const ROLE_LABELS: Record<RoleKey, string> = {
  title: 'Title field',
  cover: 'Cover field',
  primaryLink: 'Primary link',
};

const ROLE_KEYS = Object.keys(ROLE_ALLOWED_TYPES) as RoleKey[];

/** Amendment item 2 — the closed purpose vocabulary, human-labelled. */
const PURPOSE_LABELS: Record<CollectionPurpose, string> = {
  offer: 'What I sell',
  proof: 'Proof / results',
  price: 'Prices',
};

/** Ruling #1 — rendered greyed, never omitted. `blank` is the only live start. */
export const PRESET_CHIPS = [
  { id: 'products', label: 'Products' },
  { id: 'team', label: 'Team' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'blog', label: 'Blog' },
] as const;

/**
 * Mint a field id from the TYPE, clamped past every RESERVED id — which is not
 * just the draft's ids (see the ids header note): it must include the stored
 * schema's ids and every key any item already carries a value under.
 *
 * `unique: true` (edit mode) skips the ordinal ladder entirely and mints a random
 * suffix, so a new field cannot land on an orphan key even if `existing` is
 * incomplete. Always letter-prefixed → always FIELD_ID_REGEX-valid.
 */
export function nextFieldId(
  type: FieldType,
  existing: readonly string[],
  opts?: { unique?: boolean }
): string {
  const used = new Set(existing);
  if (opts?.unique) {
    for (let i = 0; i < 100; i++) {
      // padEnd: Math.random() can produce a short base-36 string (e.g. "0.5").
      const candidate = `${type}_${Math.random().toString(36).slice(2, 6).padEnd(4, '0')}`;
      if (!used.has(candidate)) return candidate;
    }
    return `${type}_${Date.now().toString(36)}`;
  }
  if (!used.has(type)) return type;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${type}_${n}`;
    if (!used.has(candidate)) return candidate;
  }
  // Unreachable in practice (the schema caps at 50 fields); still letter-prefixed.
  return `${type}_${Date.now().toString(36)}`;
}

/**
 * Every id that could already carry an item value: the stored schema's fields
 * PLUS every key present in any item's `values` (orphans included — those are
 * exactly the dangerous ones, and they outlive the schema entry that made them).
 */
export function reservedFieldIds(
  collection?: CmsCollection | null,
  items?: readonly CmsItem[] | null
): Set<string> {
  const out = new Set<string>();
  for (const f of collection?.fieldSchema || []) out.add(f.id);
  for (const item of items || []) {
    for (const key of Object.keys(item?.values || {})) out.add(key);
  }
  return out;
}

/** Ids that at least one item holds a non-empty value under (drives the warning). */
export function fieldIdsWithValues(items?: readonly CmsItem[] | null): Set<string> {
  const out = new Set<string>();
  for (const item of items || []) {
    for (const [key, value] of Object.entries(item?.values || {})) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      out.add(key);
    }
  }
  return out;
}

/** Which roles this field's TYPE may take (ruling #5's type filter). */
export function rolesForType(type: FieldType): RoleKey[] {
  return ROLE_KEYS.filter((role) =>
    (ROLE_ALLOWED_TYPES[role] as readonly FieldType[]).includes(type)
  );
}

/** The role currently assigned to a field, if any. */
function roleOf(roles: CollectionRoles, fieldId: string): RoleKey | null {
  for (const role of ROLE_KEYS) if (roles[role] === fieldId) return role;
  return null;
}

export interface AddCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: string;
  /** Present → EDIT mode (PATCH that collection). Absent → CREATE mode. */
  collection?: CmsCollection | null;
  /**
   * That collection's items. Used for TWO safety properties, never written:
   * reserving orphan-bearing field ids, and warning before a field with values
   * is dropped. Omitting it degrades to a schema-only clamp — the edit-mode
   * random suffix still holds the never-recycle invariant.
   */
  items?: readonly CmsItem[] | null;
  /** Fired after a successful write, before the modal closes. */
  onSaved?: (collection: unknown) => void;
}

export function AddCollectionModal({
  open,
  onOpenChange,
  tokenId,
  collection,
  items,
  onSaved,
}: AddCollectionModalProps) {
  const isEdit = !!collection;

  const [name, setName] = React.useState('');
  const [fields, setFields] = React.useState<FieldDef[]>([]);
  const [roles, setRoles] = React.useState<CollectionRoles>({});
  const [detailPages, setDetailPages] = React.useState(false);
  // Phase 8B, founder ruling: per-collection, DEFAULT OFF (not designer t12's
  // "two pages, always", not omitted).
  const [listingPage, setListingPage] = React.useState(false);
  // Amendment item 2 — STORED, VALIDATED, READ BY NOTHING. See the label copy.
  const [purposes, setPurposes] = React.useState<CollectionPurpose[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);

  // Re-seed the draft whenever the modal is (re)opened, so closing without
  // saving discards edits and reopening never shows a stale schema.
  React.useEffect(() => {
    if (!open) return;
    setName(collection?.name ?? '');
    setFields(collection ? [...(collection.fieldSchema || [])] : []);
    setRoles(collection ? { ...(collection.roles || {}) } : {});
    setDetailPages(collection?.detailPages ?? false);
    setListingPage(collection?.listingPage ?? false);
    setPurposes([...(collection?.purposes ?? [])]);
    setError(null);
    setSaving(false);
  }, [open, collection]);

  // In EDIT mode the slug is immutable here (changing it would move every
  // published item page) — show the stored one, not a live re-derivation.
  const slug = isEdit ? collection!.slug : name.trim() ? slugifyName(name) : '';

  // Ids an item could already hold a value under — the clamp floor for new
  // fields. See the "IDS MUST NEVER BE RECYCLED" note at the top of this file.
  const reserved = React.useMemo(
    () => reservedFieldIds(collection, items),
    [collection, items]
  );
  const withValues = React.useMemo(() => fieldIdsWithValues(items), [items]);

  /**
   * Stored fields the user has removed in this draft that items still hold values
   * for. Surfaced as an inline warning: the values are hidden, never rewritten.
   */
  const droppedWithValues = React.useMemo(() => {
    if (!isEdit) return [] as FieldDef[];
    const draftIds = new Set(fields.map((f) => f.id));
    return (collection?.fieldSchema || []).filter(
      (f) => !draftIds.has(f.id) && withValues.has(f.id)
    );
  }, [isEdit, fields, collection, withValues]);

  const addField = (type: FieldType) => {
    setAddOpen(false);
    setFields((prev) => [
      ...prev,
      {
        id: nextFieldId(type, [...prev.map((f) => f.id), ...reserved], { unique: isEdit }),
        name: FIELD_TYPE_LABELS[type],
        type,
      },
    ]);
  };

  const renameField = (id: string, next: string) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, name: next } : f)));

  const reorderFields = (ids: string[]) =>
    setFields((prev) => ids.map((id) => prev.find((f) => f.id === id)!).filter(Boolean));

  const deleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    // A role pointing at a removed field is rejected by the server's cross-field
    // gate, so prune it here rather than shipping an invalid payload.
    setRoles((prev) => {
      const next = { ...prev };
      for (const role of ROLE_KEYS) if (next[role] === id) delete next[role];
      return next;
    });
  };

  /** Toggle: assigning a role steals it from whichever field held it. */
  const setRole = (fieldId: string, role: RoleKey | null) =>
    setRoles((prev) => {
      const next = { ...prev };
      for (const r of ROLE_KEYS) if (next[r] === fieldId) delete next[r];
      if (role) next[role] = fieldId;
      return next;
    });

  const canSave = name.trim().length > 0 && fields.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    // `layoutHint` is deliberately NOT sent: v1 renders stacked groups only, and
    // an optional field must be cleared with an explicit null, never "".
    const payload = {
      tokenId,
      name: name.trim(),
      fieldSchema: fields,
      roles,
      detailPages,
      listingPage,
      purposes,
    };
    try {
      const res = await fetch(
        isEdit ? `/api/collections/${encodeURIComponent(collection!.id)}` : '/api/collections',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || `Could not save the collection (${res.status})`);
        setSaving(false);
        return;
      }
      onSaved?.(data?.collection);
      setSaving(false);
      onOpenChange(false);
    } catch {
      setError('Network error — the collection was not saved.');
      setSaving(false);
    }
  };

  const listingPath = `/${slug || '…'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[460px] gap-0 p-0"
        data-cms-collection-modal=""
        // Radix Dialog sets `pointer-events:none` on <body>; portalled popover
        // content is a body child, so every menu below restates `auto`.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-app-divider px-5 py-4">
          <DialogTitle className="text-[15px]">
            {isEdit ? 'Edit collection' : 'New collection'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto px-5 py-4">
          {/* NAME + live slug suffix */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
              Name
            </label>
            <SlugInput
              value={name}
              onValueChange={setName}
              slug={slug}
              placeholder="Products, Team, Case studies…"
              data-collection-name=""
              aria-label="Collection name"
            />
          </div>

          {/* START FROM — ruling #1. Blank works; the rest ship greyed + why. */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
              Start from
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-preset-chip="blank"
                data-active=""
                className="inline-flex items-center gap-1.5 rounded-app-pill border border-app-primary bg-app-tint-soft px-2.5 py-1 text-[12px] font-semibold text-app-primary-deep"
              >
                <AppIcon name="add" size={15} />
                Blank
              </button>
              {PRESET_CHIPS.map((preset) => (
                <Coming
                  key={preset.id}
                  what={`the ${preset.label} preset — start from Blank and add fields`}
                  side="top"
                  data-preset-chip={preset.id}
                  className="rounded-app-pill border border-app-border px-2.5 py-1 text-[12px] font-semibold"
                >
                  {preset.label}
                </Coming>
              ))}
            </div>
          </div>

          {/* FIELDS */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
              Fields
            </label>

            {fields.length === 0 ? (
              <p className="rounded-app-ctl border border-dashed border-app-border px-3 py-4 text-center text-[12px] text-app-muted">
                No fields yet — add one below.
              </p>
            ) : (
              <FieldRowList
                items={fields}
                onReorder={reorderFields}
                onNameChange={renameField}
                renderTypeChip={(item) => (
                  <Badge variant="status" data-type-chip={item.id}>
                    {FIELD_TYPE_LABELS[(item as FieldDef).type]}
                  </Badge>
                )}
                renderTrailing={(item) => (
                  <FieldRowTrailing
                    field={item as FieldDef}
                    role={roleOf(roles, item.id)}
                    onSetRole={setRole}
                    onDelete={deleteField}
                  />
                )}
              />
            )}

            {/* Removing a field HIDES its values, it never deletes them (the
                non-destructive delete contract). Say so, and say that re-adding
                the field will not bring them back — the new field gets a fresh
                id precisely so it cannot inherit them. */}
            {droppedWithValues.length > 0 ? (
              <p
                role="status"
                data-cms-field-drop-warning=""
                // No app-warning token exists; danger-bg is the repo's soft alert
                // surface (tailwind.config.js `danger-bg`), paired with ink text
                // so this reads as a caution, not a failure.
                className="mt-1 rounded-app-ctl border border-app-border bg-app-danger-bg px-2.5 py-2 text-[11.5px] leading-[1.45] text-app-ink"
              >
                {droppedWithValues.map((f) => `“${f.name}”`).join(', ')}{' '}
                {droppedWithValues.length === 1 ? 'is' : 'are'} removed — items already
                have values for {droppedWithValues.length === 1 ? 'it' : 'them'}. Those
                values will be hidden, not deleted, and re-adding the field will not
                bring them back.
              </p>
            ) : null}

            <Popover open={addOpen} onOpenChange={setAddOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-add-field-trigger=""
                  className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-app-ctl border border-dashed border-app-border px-3 py-2 text-[12.5px] font-semibold text-app-label transition-colors hover:bg-app-hover"
                >
                  <AppIcon name="add" size={16} />
                  Add field
                  <AppIcon name="expand_more" size={16} className="text-app-icon-faint" />
                </button>
              </PopoverTrigger>
              <AppPopoverMenu width={200} align="start" style={{ pointerEvents: 'auto' }}>
                <AppPopoverLabel>Field type</AppPopoverLabel>
                {FIELD_TYPES.map((type) => (
                  <AppPopoverItem
                    key={type}
                    data-add-field-type={type}
                    onClick={() => addField(type)}
                  >
                    {FIELD_TYPE_LABELS[type]}
                  </AppPopoverItem>
                ))}
              </AppPopoverMenu>
            </Popover>
          </div>

          {/* PURPOSES — amendment item 2. STORED, VALIDATED, READ BY NOTHING.
              Shipping it with a truthful label is the point: the greyed-
              placeholder rule presupposes a destination, and here the destination
              (per-purpose renderers) is explicitly deferred, so the honest thing
              is a working control that says what it does and does not do. Do NOT
              "finish" this by branching rendering on it — that needs a spec. */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
              What is this collection for?
            </span>
            <div className="flex flex-wrap items-center gap-1.5" data-purposes="">
              {COLLECTION_PURPOSES.map((p) => {
                const on = purposes.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    data-purpose-chip={p}
                    aria-pressed={on}
                    onClick={() =>
                      setPurposes((prev) =>
                        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                      )
                    }
                    className={
                      on
                        ? 'rounded-app-pill border border-app-primary bg-app-tint-soft px-2.5 py-1 text-[12px] font-semibold text-app-primary-deep'
                        : 'rounded-app-pill border border-app-border px-2.5 py-1 text-[12px] font-semibold text-app-label hover:bg-app-hover'
                    }
                  >
                    {PURPOSE_LABELS[p]}
                  </button>
                );
              })}
            </div>
            <p className="text-[11.5px] text-app-muted" data-purposes-note="">
              Saved with the collection, but it does not change how the collection
              looks yet — every collection renders the same way in this version.
            </p>
          </div>

          {/* PAGES — ruling #6 (detailPages switch + reactive tiles) plus the
              phase-8B listing switch. BOTH toggles drive the tiles. */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-app-ink">Listing page</p>
                <p className="text-[11.5px] text-app-muted">
                  Publish a page at {listingPath} showing every item.
                </p>
              </div>
              <Switch
                checked={listingPage}
                onCheckedChange={setListingPage}
                data-listing-page=""
                aria-label="Listing page"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-app-ink">Detail pages</p>
                <p className="text-[11.5px] text-app-muted">
                  Give every item its own published page.
                </p>
              </div>
              <Switch
                checked={detailPages}
                onCheckedChange={setDetailPages}
                data-detail-pages=""
                aria-label="Detail pages"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold uppercase tracking-[.09em] text-app-faint">
                Creates these pages
              </span>
              <div className="flex flex-col gap-1">
                {/* Reactive to BOTH toggles. OFF → the tile is GONE, not greyed:
                    there is no "coming soon" here, the user just turned it off.
                    Neither on is a REAL state (the block still renders wherever
                    it is placed) so it gets a line, not an empty box. */}
                {listingPage ? (
                  <PageTile kind="listing" label="Listing" path={listingPath} />
                ) : null}
                {detailPages ? (
                  <PageTile kind="item" label="Item page" path={`${listingPath}/:slug`} />
                ) : null}
                {!listingPage && !detailPages ? (
                  <p
                    data-page-tile-none=""
                    className="rounded-app-ctl border border-dashed border-app-border px-2.5 py-2 text-[11.5px] text-app-muted"
                  >
                    No pages of its own — this collection shows up only where you
                    add it to a page.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {error ? (
            <p role="alert" data-cms-modal-error="" className="text-[12px] text-app-danger">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 border-t border-app-divider px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            data-cms-modal-save=""
            disabled={!canSave}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PageTile({
  kind,
  label,
  path,
}: {
  kind: 'listing' | 'item';
  label: string;
  path: string;
}) {
  return (
    <div
      data-page-tile={kind}
      className="flex items-center gap-2 rounded-app-ctl border border-app-border bg-app-canvas px-2.5 py-1.5"
    >
      <AppIcon name="description" size={16} className="flex-none text-app-primary" />
      <span className="text-[12.5px] font-medium text-app-ink">{label}</span>
      <span className="ml-auto flex-none rounded-[4px] bg-app-track px-1 py-px font-app-mono text-[11px] text-app-muted">
        {path}
      </span>
    </div>
  );
}

/**
 * The row's trailing slot: role menu (type-filtered, ruling #5) + delete.
 * A type with no eligible role (e.g. `date`) simply gets no role trigger — that
 * IS the filter; offering a menu of nothing would be worse than offering none.
 */
function FieldRowTrailing({
  field,
  role,
  onSetRole,
  onDelete,
}: {
  field: FieldDef;
  role: RoleKey | null;
  onSetRole: (fieldId: string, role: RoleKey | null) => void;
  onDelete: (fieldId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const eligible = rolesForType(field.type);

  return (
    <div className="flex items-center gap-1">
      {eligible.length > 0 ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-role-trigger={field.id}
              aria-label={`Role for ${field.name}`}
              className={
                role
                  ? 'inline-flex items-center gap-1 rounded-app-pill bg-app-tint px-2 py-0.5 text-[11px] font-semibold text-app-primary-deep'
                  : 'inline-flex items-center gap-1 rounded-app-pill border border-dashed border-app-border px-2 py-0.5 text-[11px] font-medium text-app-muted hover:bg-app-hover'
              }
            >
              {role ? ROLE_LABELS[role] : 'Role'}
            </button>
          </PopoverTrigger>
          <AppPopoverMenu width={180} align="end" style={{ pointerEvents: 'auto' }}>
            <AppPopoverLabel>Role</AppPopoverLabel>
            {eligible.map((r) => (
              <AppPopoverItem
                key={r}
                active={role === r}
                data-role-option={`${field.id}:${r}`}
                onClick={() => {
                  setOpen(false);
                  onSetRole(field.id, role === r ? null : r);
                }}
              >
                {ROLE_LABELS[r]}
              </AppPopoverItem>
            ))}
            {role ? (
              <AppPopoverItem
                data-role-option={`${field.id}:none`}
                onClick={() => {
                  setOpen(false);
                  onSetRole(field.id, null);
                }}
              >
                No role
              </AppPopoverItem>
            ) : null}
          </AppPopoverMenu>
        </Popover>
      ) : null}

      <button
        type="button"
        data-field-delete={field.id}
        aria-label={`Delete ${field.name}`}
        onClick={() => onDelete(field.id)}
        className="flex h-7 w-7 flex-none items-center justify-center rounded-app-ctl-sm text-app-icon-faint hover:bg-app-delete-bg hover:text-app-delete"
      >
        <AppIcon name="delete" size={17} />
      </button>
    </div>
  );
}

/** Re-exported for the test + CmsPanel: the id regex the payload must satisfy. */
export { FIELD_ID_REGEX };

export default AddCollectionModal;
