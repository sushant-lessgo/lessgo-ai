'use client';

// src/app/edit/[token]/components/cms/CollectionBrowser.tsx
//
// t22 — the collection browser: a 400px card grid of one collection's items on
// the left, the t19 item editor on the right, inside one dialog.
//
// ── RULINGS ──────────────────────────────────────────────────────────────────
//  #8  NO per-item status pill. A card is a thumb + title + grey group label.
//  #7  Groups are managed in the left column (GroupManager); the per-item
//      assignment stays in the editor's "Category" select.
//
// ── PROPS IN, EVENTS OUT — NO STORE ACCESS HERE ──────────────────────────────
// Every collection/group/item comes in as a prop from `CmsPanel`, which owns the
// `cmsData` read and the refresh. That keeps this component pure enough to test
// without a store, and — more importantly — means there is exactly ONE place
// that decides what "fresh" means after a write.
//
// ── LIVE REFRESH ─────────────────────────────────────────────────────────────
// Saving an item calls `onChanged()`, which the host turns into a `cmsData`
// refresh; placed `cmscollection` sections re-render from the refreshed cache
// (the adapter re-runs `toRenderModel`), so the canvas matches the editor
// immediately rather than at the next reload.
//
// APP-CHROME ONLY — nothing here imports from `modules/templates/**`,
// `modules/generatedLanding/**` or `components/published/**`.

import React from 'react';

import type { CmsCollection, CmsGroup, CmsItem, FieldDef } from '@/modules/cms/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/icon';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { ItemEditor } from './ItemEditor';
import { GroupManager } from './GroupManager';

/** The item's display title: the TITLE-role value, else the first text value. */
export function itemTitle(item: CmsItem, collection: CmsCollection): string {
  const titleId = collection.roles?.title;
  const fromRole = titleId ? item.values?.[titleId] : undefined;
  if (typeof fromRole === 'string' && fromRole.trim()) return fromRole;
  for (const f of (collection.fieldSchema || []) as FieldDef[]) {
    if (f.type !== 'text_short') continue;
    const v = item.values?.[f.id];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return item.slug || 'Untitled';
}

/** The card thumb: the COVER-role value (image → url, gallery → first url). */
export function itemThumb(item: CmsItem, collection: CmsCollection): string | null {
  const coverId = collection.roles?.cover;
  if (!coverId) return null;
  const v = item.values?.[coverId] as unknown;
  if (Array.isArray(v)) {
    const first = v.find((g) => g && typeof (g as { url?: string }).url === 'string');
    return (first as { url?: string })?.url || null;
  }
  const url = (v as { url?: string } | undefined)?.url;
  return typeof url === 'string' && url ? url : null;
}

export interface CollectionBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: string;
  collection: CmsCollection;
  groups: readonly CmsGroup[];
  items: readonly CmsItem[];
  /** Fired after any successful write (item or group) → host refreshes cmsData. */
  onChanged?: () => void;
}

export function CollectionBrowser({
  open,
  onOpenChange,
  tokenId,
  collection,
  groups,
  items,
  onChanged,
}: CollectionBrowserProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [showGroups, setShowGroups] = React.useState(false);

  const ordered = React.useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items]
  );

  // Reset the selection each time the dialog opens so it never reopens pointing
  // at an item that was deleted meanwhile.
  React.useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setCreating(false);
    setQuery('');
    setShowGroups(false);
  }, [open, collection.id]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter((i) => itemTitle(i, collection).toLowerCase().includes(q));
  }, [ordered, query, collection]);

  const selected = React.useMemo(
    () => ordered.find((i) => i.id === selectedId) ?? null,
    [ordered, selectedId]
  );

  const groupName = (id: string | null) =>
    id ? groups.find((g) => g.id === id)?.name || 'Ungrouped' : 'Ungrouped';

  const handleDeleteItem = async (item: CmsItem) => {
    const confirmed = await confirmDialog({
      title: `Delete "${itemTitle(item, collection)}"?`,
      message: 'This removes the item and, if detail pages are on, its published page.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    const res = await fetch(
      `/api/collections/${encodeURIComponent(collection.id)}/items/${encodeURIComponent(item.id)}?tokenId=${encodeURIComponent(tokenId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) return;
    if (selectedId === item.id) setSelectedId(null);
    onChanged?.();
  };

  const showEditor = creating || !!selected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[860px] gap-0 p-0"
        data-cms-browser=""
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-app-divider px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            {collection.name}
            <Badge variant="status" data-item-count="">
              {ordered.length} {ordered.length === 1 ? 'item' : 'items'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[60vh] min-h-0">
          {/* LEFT — browser */}
          <div className="flex w-[400px] min-w-0 flex-none flex-col border-r border-app-divider">
            <div className="flex flex-none items-center gap-1.5 px-4 py-3">
              <Input
                type="text"
                value={query}
                aria-label="Search items"
                data-item-search=""
                placeholder="Search items…"
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 min-w-0 flex-1 text-[12.5px]"
              />
              <Button
                type="button"
                size="sm"
                data-item-new=""
                onClick={() => {
                  setSelectedId(null);
                  setCreating(true);
                }}
              >
                + New
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
              {visible.length === 0 ? (
                <p className="rounded-app-ctl border border-dashed border-app-border px-3 py-6 text-center text-[12px] text-app-muted">
                  {ordered.length === 0
                    ? 'No items yet — add your first one with “+ New”.'
                    : 'No items match that search.'}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {visible.map((item) => {
                    const thumb = itemThumb(item, collection);
                    const isSelected = item.id === selectedId;
                    return (
                      <div
                        key={item.id}
                        className={
                          'group relative flex flex-col overflow-hidden rounded-app-ctl border text-left transition-colors ' +
                          (isSelected
                            ? 'border-app-primary ring-2 ring-app-primary/30'
                            : 'border-app-border hover:bg-app-hover')
                        }
                      >
                        <button
                          type="button"
                          data-item-card={item.id}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setCreating(false);
                            setSelectedId(item.id);
                          }}
                          className="flex min-w-0 flex-col text-left"
                        >
                          <span className="flex h-20 w-full items-center justify-center overflow-hidden bg-app-thumb-bg">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumb}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <AppIcon
                                name="image"
                                size={20}
                                className="text-app-icon-faint"
                              />
                            )}
                          </span>
                          <span className="min-w-0 px-2 py-1.5">
                            <span className="block truncate text-[12.5px] font-semibold text-app-ink">
                              {itemTitle(item, collection)}
                            </span>
                            {/* Ruling #8: the sub-label is the GROUP, never a status. */}
                            <span className="block truncate text-[11px] text-app-muted">
                              {groupName(item.groupId)}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          data-item-delete={item.id}
                          aria-label={`Delete ${itemTitle(item, collection)}`}
                          onClick={() => void handleDeleteItem(item)}
                          className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-app-badge bg-white/90 text-app-icon-faint transition-colors group-hover:flex hover:bg-app-delete-bg hover:text-app-delete"
                        >
                          <AppIcon name="delete" size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* GROUPS — collapsed by default; groups are optional in this model. */}
            <div className="flex-none border-t border-app-divider px-4 py-2.5">
              <button
                type="button"
                data-groups-toggle=""
                aria-expanded={showGroups}
                onClick={() => setShowGroups((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-[12px] font-semibold text-app-label hover:text-app-ink"
              >
                <span>Groups ({groups.length})</span>
                <AppIcon
                  name={showGroups ? 'expand_less' : 'expand_more'}
                  size={16}
                  className="text-app-icon-faint"
                />
              </button>
              {showGroups ? (
                <div className="pt-2">
                  <GroupManager
                    tokenId={tokenId}
                    collectionId={collection.id}
                    groups={groups}
                    onChanged={onChanged}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* RIGHT — item editor */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {showEditor ? (
              <ItemEditor
                key={selected?.id ?? 'new'}
                tokenId={tokenId}
                collection={collection}
                groups={groups}
                items={ordered}
                item={creating ? null : selected}
                onIndexChange={(next) => {
                  const target = ordered[next];
                  if (!target) return;
                  setCreating(false);
                  setSelectedId(target.id);
                }}
                onSaved={(saved) => {
                  if (creating && saved?.id) {
                    setCreating(false);
                    setSelectedId(saved.id);
                  }
                  onChanged?.();
                }}
                onClose={() => {
                  setCreating(false);
                  setSelectedId(null);
                }}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <p className="text-[12.5px] text-app-muted">
                  Pick an item to edit it, or add a new one.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CollectionBrowser;
