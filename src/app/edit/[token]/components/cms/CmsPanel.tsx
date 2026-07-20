'use client';

// src/app/edit/[token]/components/cms/CmsPanel.tsx
//
// The CMS entry point in the editor chrome: a bar control next to the page
// switcher listing this project's collections, with "New collection", "Add to
// page" and "Delete" per row.
//
// ── WHY A HEADER CONTROL AND NOT A RAIL ──────────────────────────────────────
// The handoff draws CMS as a tab in a left rail beside Pages. That rail does not
// exist yet and belongs to the ui-redesign track; building one here would be a
// second, competing IA. So CMS mounts where Pages already lives (GlobalAppHeader,
// beside PageSwitcher). Relocating it into the rail later is a move, not a rewrite.
//
// ── NO CAPABILITY GATING ─────────────────────────────────────────────────────
// The collection block is a SHARED block — it renders on every template — so there
// is no `CapabilityId` for it and `templateMeta.ts` is not consulted. The entry is
// available on every project, deliberately (plan Deviations #2).
//
// ── STORE ACCESS: `useEditStore` ONLY, never `useEditStoreApi()` ─────────────
// Deliberate, matching this file's host. GlobalAppHeader reads the store through
// the hook OBJECT (`useEditStore.getState()`), and its test suite mocks
// '@/hooks/useEditStore' with exactly that surface. Importing `useEditStoreApi`
// here would make the header throw inside a test file this phase must not edit —
// and the hook-object path is already the documented pattern in that file.
// Selector reads are optional-chained for the same reason.
//
// ── FIREWALL-SAFE "Manage items" HANDOFF ─────────────────────────────────────
// The placed block (`src/modules/cms/render/CollectionSection.tsx`) is renderer
// code and must not import app chrome, so its Manage button dispatches the window
// event `lessgo:manage-collections` (the `lessgo:manage-products` precedent). This
// panel listens and opens itself on the right collection.

import React from 'react';

import { useEditStore } from '@/hooks/useEditStore';
import type { CmsCollection, CmsCollectionBundle } from '@/modules/cms/types';
import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { AppIcon } from '@/components/ui/icon';
import {
  Popover,
  PopoverTrigger,
  AppPopoverMenu,
  AppPopoverItem,
  AppPopoverLabel,
  AppPopoverSeparator,
} from '@/components/ui/popover';
import { BAR_CTL_CLASS } from '../ui/DesignMenuShell';
import { AddCollectionModal } from './AddCollectionModal';
import { CollectionBrowser } from './CollectionBrowser';

/** The event a placed collection block fires to open this panel. */
export const MANAGE_COLLECTIONS_EVENT = 'lessgo:manage-collections';

export function CmsPanel({ tokenId }: { tokenId: string }) {
  const [open, setOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CmsCollection | null>(null);
  // The collection whose ITEMS are open in the browser. An ID, not the object:
  // "Manage items" can arrive from a placed block BEFORE the refresh that would
  // put that collection in the cache, so the browser resolves late (below).
  const [browsingId, setBrowsingId] = React.useState<string | null>(null);

  const bundles = useEditStore(
    (s) => s.cmsData?.bundles as Record<string, CmsCollectionBundle> | undefined
  );
  const collections = React.useMemo(
    () =>
      Object.values(bundles || {})
        .map((b) => b?.collection)
        .filter((c): c is CmsCollection => !!c)
        .sort((a, b) => a.order - b.order),
    [bundles]
  );
  const itemCounts = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const b of Object.values(bundles || {})) {
      if (b?.collection) out[b.collection.id] = (b.items || []).length;
    }
    return out;
  }, [bundles]);

  // The editing collection's items travel with it: the modal reserves every field
  // id those items hold a value under, so a newly added field can never inherit an
  // orphaned value left behind by a non-destructive delete.
  const editingItems = React.useMemo(
    () => (editing ? bundles?.[editing.id]?.items || [] : []),
    [editing, bundles]
  );

  const browsingBundle = React.useMemo(
    () => (browsingId ? bundles?.[browsingId] : undefined),
    [browsingId, bundles]
  );

  const refresh = React.useCallback(() => {
    // Optional-chained: the store may not carry the cms slice in every host
    // (see the store-access note above).
    void useEditStore.getState().refreshCmsData?.();
  }, []);

  // Fetch when the menu OPENS, never on mount: mounting this panel must not add a
  // request to every editor load, and the header's own test suite stubs no fetch.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) refresh();
  };

  React.useEffect(() => {
    // CONSUME `e.detail` (phase-6 carry): the placed block dispatches
    // `{collectionId}`, and ignoring it made "Manage items" open a generic
    // collection list — the user then had to find, in a menu, the collection they
    // had just clicked ON. With the id we open THAT collection's items directly.
    // No id (a generic caller) still falls back to the list.
    const onManage = (e: Event) => {
      refresh();
      const collectionId = (e as CustomEvent<{ collectionId?: string }>).detail?.collectionId;
      // The list opens either way — it is what the user falls back to when the
      // browser is dismissed, and `CmsPanel.test.tsx` (phase 6, outside this
      // phase's file list) pins it. With an id we ALSO open that collection's
      // items on top, which is the whole point of consuming the detail.
      setOpen(true);
      if (collectionId) setBrowsingId(collectionId);
    };
    window.addEventListener(MANAGE_COLLECTIONS_EVENT, onManage);
    return () => window.removeEventListener(MANAGE_COLLECTIONS_EVENT, onManage);
  }, [refresh]);

  const openCreate = () => {
    setOpen(false);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (collection: CmsCollection) => {
    setOpen(false);
    setEditing(collection);
    setModalOpen(true);
  };

  /** Open the t22 browser (items + groups) for one collection. */
  const openItems = (collectionId: string) => {
    setOpen(false);
    setBrowsingId(collectionId);
  };

  /** A single-collection refresh — item/group saves cannot touch the others. */
  const refreshOne = React.useCallback((collectionId: string) => {
    void useEditStore.getState().refreshCmsCollection?.(collectionId);
  }, []);

  /** Place the collection on the CURRENT page (dual pin lives in addCmsSection). */
  const addToPage = (collectionId: string) => {
    setOpen(false);
    useEditStore.getState().addCmsSection?.(collectionId);
  };

  const handleDelete = async (e: React.MouseEvent, collection: CmsCollection) => {
    e.stopPropagation();
    const confirmed = await confirmDialog({
      title: `Delete "${collection.name}"?`,
      message:
        'This deletes the collection and all of its items. Any place it appears on your site will be removed too.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    const res = await fetch(
      `/api/collections/${encodeURIComponent(collection.id)}?tokenId=${encodeURIComponent(tokenId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) return;
    // The server cascade cannot reach section content — sweep the placements too,
    // or the page keeps a block pointing at a row that no longer exists.
    useEditStore.getState().removeCmsSectionsForCollection?.(collection.id);
    refresh();
  };

  return (
    <div className="hidden md:flex flex-none items-center gap-1">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button type="button" className={BAR_CTL_CLASS} aria-label="Collections">
            <AppIcon name="category" size={18} className="text-app-icon-muted" />
            <span>Collections</span>
            <AppIcon name="expand_more" size={18} className="text-app-icon-faint" />
          </button>
        </PopoverTrigger>

        <AppPopoverMenu width={264} align="start">
          <AppPopoverLabel>Collections</AppPopoverLabel>

          {collections.length === 0 ? (
            <p className="px-2.5 py-2 text-[12px] text-app-muted">
              No collections yet. Create one to add products, team members, projects…
            </p>
          ) : (
            collections.map((c) => (
              <div key={c.id} className="group relative flex items-center gap-0.5">
                <AppPopoverItem
                  className="min-w-0 flex-1"
                  data-collection-row={c.id}
                  icon={<AppIcon name="category" size={18} />}
                  trailing={
                    <span className="font-app-mono text-[11px] text-app-muted">
                      {itemCounts[c.id] ?? 0}·{(c.fieldSchema || []).length}
                    </span>
                  }
                  onClick={() => openEdit(c)}
                  title={`${itemCounts[c.id] ?? 0} items · ${(c.fieldSchema || []).length} fields`}
                >
                  {c.name}
                </AppPopoverItem>
                {/* Siblings, not nested: AppPopoverItem is itself a <button>.
                    Same shape PageSwitcher uses for its row actions. */}
                <button
                  type="button"
                  data-collection-items={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    openItems(c.id);
                  }}
                  aria-label={`Manage ${c.name} items`}
                  className="hidden h-6 w-6 flex-none items-center justify-center rounded-app-badge text-app-icon-faint transition-colors group-hover:flex hover:bg-app-hover hover:text-app-ink"
                >
                  <AppIcon name="list" size={16} />
                </button>
                <button
                  type="button"
                  data-collection-place={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToPage(c.id);
                  }}
                  aria-label={`Add ${c.name} to this page`}
                  className="hidden h-6 w-6 flex-none items-center justify-center rounded-app-badge text-app-icon-faint transition-colors group-hover:flex hover:bg-app-hover hover:text-app-ink"
                >
                  <AppIcon name="add" size={16} />
                </button>
                <button
                  type="button"
                  data-collection-delete={c.id}
                  onClick={(e) => handleDelete(e, c)}
                  aria-label={`Delete ${c.name}`}
                  className="mr-0.5 hidden h-6 w-6 flex-none items-center justify-center rounded-app-badge text-app-icon-faint transition-colors group-hover:flex hover:bg-app-delete-bg hover:text-app-delete"
                >
                  <AppIcon name="delete" size={16} />
                </button>
              </div>
            ))
          )}

          <AppPopoverSeparator />
          <AppPopoverItem
            data-collection-new=""
            icon={<AppIcon name="add" size={18} />}
            onClick={openCreate}
          >
            New collection
          </AppPopoverItem>
        </AppPopoverMenu>
      </Popover>

      <AddCollectionModal
        open={modalOpen}
        onOpenChange={(next) => {
          setModalOpen(next);
          // Reset on close (phase-6 carry). It was harmless while both open paths
          // set `editing` explicitly; with a third surface it is exactly the kind
          // of leak that reopens "New collection" pre-filled with the last edited
          // schema.
          if (!next) setEditing(null);
        }}
        tokenId={tokenId}
        collection={editing}
        items={editingItems}
        onSaved={refresh}
      />

      {/* t22 — resolved from the cache, so a "Manage items" event that arrives
          before the refresh lands simply opens as soon as the bundle appears. */}
      {browsingBundle ? (
        <CollectionBrowser
          open
          onOpenChange={(next) => {
            if (!next) setBrowsingId(null);
          }}
          tokenId={tokenId}
          collection={browsingBundle.collection}
          groups={browsingBundle.groups || []}
          items={browsingBundle.items || []}
          onChanged={() => refreshOne(browsingBundle.collection.id)}
        />
      ) : null}
    </div>
  );
}

export default CmsPanel;
