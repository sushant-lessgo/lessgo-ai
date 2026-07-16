// /app/edit/[token]/components/layout/PageSwitcher.tsx
// Multi-page switcher: the t1 page-select PILL (bordered pill + route chip +
// expand_more) opening a page-select DROPDOWN, plus the per-template page
// creation entries and the blog link. Drives the store page-axis actions.
"use client";

// PHASE 8 — t1 page switcher (highest-entanglement file in this track).
//
// WHAT CHANGED (presentation + two authorized founder rulings):
//  - TABS → DROPDOWN (ruling 8b, "Home → page-select dropdown"). t1 draws a
//    bordered pill with `expand_more`, not a tab strip. The rows are the SAME
//    pages the tabs were, and selecting one calls the SAME action
//    (`setCurrentPage`) with the same argument — the markup moved, the handler
//    did not.
//  - "+ Add page" REMOVED (ruling 8b). Only the CHROME goes: the `addPage` /
//    `addArchetypePage` store actions are untouched, and `addArchetypePage`
//    still has its two live callers (+ Gallery / + Contact) below. `handleAdd`
//    (the local wrapper that existed ONLY to feed that one button) went with the
//    button — it had no other caller, and leaving it would be dead code.
//
// PRESERVED VERBATIM — do not "clean up":
//  - every store mutation: setCurrentPage / deletePage / renamePage /
//    addArchetypePage('gallery') / addArchetypePage('contact'), each still
//    reached through `storeApi.getState()` in a handler (never during render);
//  - the capability gating: `usesTemplateModule` (blog) + the techpremium-only
//    Products / Gallery / Contact entries + the catalog/archetype existence
//    checks. Same predicates, same order, same fallbacks;
//  - `BlogButton`'s self-fetch of `published-slug` (className-only touch-up);
//  - `handleDelete` / `handleRename` bodies, including `e.stopPropagation()`.
//
// RENAME AFFORDANCE CHANGED (fix pass) — double-click → hover PENCIL button.
// The old tab strip renamed via `onDoubleClick` on the row. That gesture CANNOT
// work inside this dropdown and was removed rather than left half-working:
// selecting a row calls `setOpen(false)` (phase-4 dismissal requirement), which
// flips the popover to data-state="closed" → AppPopoverMenu's
// `data-[state=closed]:animate-out` (150ms) → Radix Presence UNMOUNTS the row.
// Click 1 of a double-click starts that teardown; click 2 lands 150-300ms later
// and `dblclick` only fires when both clicks hit the same live target — i.e. the
// gesture was a race against the exit animation. Delete never had this problem
// because it is a SIBLING <button> that calls e.stopPropagation(), so the row's
// onClick (and thus setOpen(false)) never fires. Rename now mirrors delete's
// proven shape exactly: sibling button, stopPropagation, hover-revealed, same
// geometry. `handleRename` itself is unchanged.
//
// t18's ⋯ page-row menu (Rename's proper future home) belongs to the (greyed)
// rail Pages tab — NOT built here. Rename/delete therefore keep hover-button
// affordances rather than being folded into a menu phase 8 can't build.

import React from 'react';
import { useParams } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import { showProductsModal } from '../ui/GlobalModals';
import { setPanelCollectionKey } from '../ui/ProductsModal';
import { confirmDialog, promptDialog } from '@/components/ui/ConfirmDialog';
import { usesTemplateModule } from '@/types/service';
import { collectionKeysInPages } from '@/hooks/editStore/collectionHelpers';
import { getCollectionDef } from '@/modules/collections/registry';
import { AppIcon } from '@/components/ui/icon';
import {
  Popover,
  PopoverTrigger,
  AppPopoverMenu,
  AppPopoverItem,
  AppPopoverLabel,
  AppPopoverSeparator,
} from '@/components/ui/popover';

/** t1 route chip: mono 11 on #f1f1f5, radius 4. Used in the pill and in each row. */
function RouteChip({ path, className = '' }: { path: string; className?: string }) {
  return (
    <span
      className={`flex-none rounded-[4px] bg-app-track px-1 py-px font-app-mono text-[11px] leading-[15px] text-app-muted ${className}`}
    >
      {path}
    </span>
  );
}

// Blog (Phase 1): link to the dashboard blog manager for this project's
// published site. Blog-after-publish is a P1 constraint (per-post publish needs
// the PublishedPage: hosts/theme/chrome; dashboard screens are slug-keyed), so
// the entry simply doesn't render until the site has been published once.
// Prefetch on mount → plain anchor: no async-in-click, no popup-blocker race.
function BlogButton() {
  const params = useParams<{ token: string }>();
  const [slug, setSlug] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${params.token}/published-slug`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.published && data?.slug) setSlug(data.slug);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  if (!slug) return null;

  return (
    <a
      href={`/dashboard/blog/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex flex-none items-center gap-1.5 rounded-app-badge px-2 py-[5px] font-app-mono text-[11px] text-app-muted transition-colors hover:bg-app-hover"
      aria-label="Manage blog"
      title="Write and publish blog posts at /blog"
    >
      /blog
    </a>
  );
}

export function PageSwitcher() {
  // Render-read: pages + currentPageId (rows/active), audienceType + templateId
  // (blog/techpremium gating), getPagesList (stable getter, derived from pages).
  // All page-axis mutations are handler-only via storeApi.getState().
  const { pages: pagesRaw, currentPageId, audienceType, templateId, getPagesList } = useEditStore(
    useShallow((s) => ({
      pages: s.pages,
      currentPageId: s.currentPageId,
      audienceType: s.audienceType,
      templateId: s.templateId,
      getPagesList: s.getPagesList,
    })),
  );
  const storeApi = useEditStoreApi();
  const [open, setOpen] = React.useState(false);
  const pages = pagesRaw || {};

  // Blog is a template-module capability (legacy 47-block product pages can't
  // render the shared blog blocks).
  const showBlog = usesTemplateModule(audienceType as any, templateId as any);

  const list = getPagesList ? getPagesList() : Object.values(pages);
  if (list.length <= 1 && Object.keys(pages).length === 0) {
    // No page axis yet (single-page project) — still surface the blog entry.
    return showBlog ? (
      <div className="hidden md:flex items-center gap-1">
        <BlogButton />
      </div>
    ) : null;
  }

  // A collection item (product) page is managed via the Products panel, not shown
  // as an individual row. The catalog singleton + all other pages remain rows.
  const tabs = list.filter((p: any) => p.kind !== 'collectionItem');
  // Products is a TechPremium-only capability. Show a single "+ Products" creation
  // entry ONLY until the catalog page exists; after that the catalog shows as a row
  // and products are managed from that page (no duplicate "Products" in the header).
  const isTechPremium = templateId === 'techpremium';
  const hasCatalog = Object.values(pages).some(
    (p: any) => p.kind === 'singleton' && p.collectionKey === 'products',
  );
  // Gallery + Contact are one-of-a-kind designed pages (Phase 4c). Offer a creation
  // entry only until that page exists; after that it's a normal row.
  const hasArchetype = (key: string) => Object.values(pages).some((p: any) => p.archetypeKey === key);

  // Open the generalized collection panel keyed by `collectionKey`. The GlobalModals
  // open path carries no payload, so we set the module-scoped key on ProductsModal
  // just before opening (defaults to 'products' → grandfathered flow unchanged).
  const openCollectionPanel = (collectionKey: string) => {
    setPanelCollectionKey(collectionKey);
    showProductsModal();
  };

  // Per-collection management entries for any NON-products collection present in the
  // project's pages (products keeps its existing entry points — the "+ Products"
  // creation button below + the catalog-block window event — so its UI stays
  // pixel-identical; adding a duplicate "Manage Products" tab would be a visible
  // change). Today no template births non-products collection pages, so this renders
  // nothing; it wires the mechanism for rung-C without touching the products flow.
  const managedCollectionKeys = collectionKeysInPages(pages).filter((k) => k !== 'products');

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await confirmDialog({
      title: 'Delete page',
      message: 'Delete this page?',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (confirmed) storeApi.getState().deletePage(id);
  };

  const handleRename = async (e: React.MouseEvent, id: string, current: string) => {
    e.stopPropagation();
    const title = await promptDialog({ title: 'Rename page', defaultValue: current });
    if (title) storeApi.getState().renamePage(id, title.trim());
  };

  // (Phase 4c) The "Apply Home layout" button was retired — new TechPremium projects
  // now default to the 12-section naayom Home (deterministic seed at generation).

  // The pill shows the page being edited. Looked up in `list`, not `tabs`: a
  // collectionItem page IS editable (it just has no row of its own), so it must
  // still be named on the pill rather than falling back to Home.
  const current: any = list.find((p: any) => p.id === currentPageId) ?? tabs[0];
  const currentIsHome = current?.pathSlug === '/';
  const currentLabel = currentIsHome ? 'Home' : current?.title || 'Untitled';

  // Creation entries are template capabilities, not pages — they live below a
  // separator so the row list above stays a clean "which page am I editing".
  const hasCreationEntries =
    (isTechPremium && !hasCatalog) ||
    managedCollectionKeys.length > 0 ||
    (isTechPremium && !hasArchetype('gallery')) ||
    (isTechPremium && !hasArchetype('contact'));

  return (
    <div className="hidden md:flex flex-none items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Switch page"
            title={current?.pathSlug}
            className="inline-flex flex-none items-center gap-1.5 rounded-app-ctl-sm border border-app-border-hairline px-2 py-[5px] transition-colors hover:bg-app-hover data-[state=open]:bg-app-hover"
          >
            <AppIcon name="description" size={17} className="flex-none text-app-primary" />
            <span className="max-w-[140px] truncate text-[13px] font-semibold text-app-ink">
              {currentLabel}
            </span>
            {current?.pathSlug && <RouteChip path={current.pathSlug} />}
            <AppIcon name="expand_more" size={17} className="flex-none text-app-icon-faint" />
          </button>
        </PopoverTrigger>

        <AppPopoverMenu width={232} align="start">
          <AppPopoverLabel>Pages</AppPopoverLabel>
          {tabs.map((p: any) => {
            const isActive = p.id === currentPageId;
            const isHome = p.pathSlug === '/';
            return (
              // The row and its delete control are SIBLINGS, not nested: an
              // AppPopoverItem is itself a <button>, and a button inside a
              // button is invalid. Same shape the tab strip used.
              <div key={p.id} className="group relative flex items-center gap-0.5">
                <AppPopoverItem
                  className="min-w-0 flex-1"
                  active={isActive}
                  icon={<AppIcon name="description" size={18} />}
                  trailing={<RouteChip path={p.pathSlug} />}
                  onClick={() => {
                    setOpen(false);
                    storeApi.getState().setCurrentPage(p.id);
                  }}
                  title={p.pathSlug}
                >
                  {isHome ? 'Home' : p.title || 'Untitled'}
                </AppPopoverItem>
                {!isHome && (
                  <button
                    type="button"
                    onClick={(e) => handleRename(e, p.id, p.title)}
                    aria-label={`Rename ${p.title}`}
                    className="hidden h-6 w-6 flex-none items-center justify-center rounded-app-badge text-app-icon-faint transition-colors group-hover:flex hover:bg-app-hover hover:text-app-ink"
                  >
                    <AppIcon name="edit" size={16} />
                  </button>
                )}
                {!isHome && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, p.id)}
                    aria-label={`Delete ${p.title}`}
                    className="mr-0.5 hidden h-6 w-6 flex-none items-center justify-center rounded-app-badge text-app-icon-faint transition-colors group-hover:flex hover:bg-app-delete-bg hover:text-app-delete"
                  >
                    <AppIcon name="delete" size={16} />
                  </button>
                )}
              </div>
            );
          })}

          {hasCreationEntries && (
            <>
              <AppPopoverSeparator />
              <AppPopoverLabel>Add</AppPopoverLabel>
              {isTechPremium && !hasCatalog && (
                <AppPopoverItem
                  icon={<AppIcon name="inventory_2" size={18} />}
                  onClick={() => {
                    setOpen(false);
                    openCollectionPanel('products');
                  }}
                  aria-label="Add products"
                  title="Add a products catalog"
                >
                  Products
                </AppPopoverItem>
              )}
              {managedCollectionKeys.map((key) => {
                const def = getCollectionDef(key);
                if (!def) return null;
                return (
                  <AppPopoverItem
                    key={key}
                    icon={<AppIcon name="category" size={18} />}
                    onClick={() => {
                      setOpen(false);
                      openCollectionPanel(key);
                    }}
                    aria-label={`Manage ${def.label}`}
                    title={`Manage ${def.label}`}
                  >
                    {def.label}
                  </AppPopoverItem>
                );
              })}
              {isTechPremium && !hasArchetype('gallery') && (
                <AppPopoverItem
                  icon={<AppIcon name="photo_library" size={18} />}
                  onClick={() => {
                    setOpen(false);
                    storeApi.getState().addArchetypePage('gallery');
                  }}
                  aria-label="Add gallery page"
                  title="Add the naayom Gallery page"
                >
                  Gallery
                </AppPopoverItem>
              )}
              {isTechPremium && !hasArchetype('contact') && (
                <AppPopoverItem
                  icon={<AppIcon name="call" size={18} />}
                  onClick={() => {
                    setOpen(false);
                    storeApi.getState().addArchetypePage('contact');
                  }}
                  aria-label="Add contact page"
                  title="Add the naayom Contact page"
                >
                  Contact
                </AppPopoverItem>
              )}
            </>
          )}
        </AppPopoverMenu>
      </Popover>

      {showBlog && <BlogButton />}
    </div>
  );
}
