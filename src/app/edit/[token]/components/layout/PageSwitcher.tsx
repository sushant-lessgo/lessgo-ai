// /app/edit/[token]/components/layout/PageSwitcher.tsx
// Phase 1 multi-page switcher: tabs for each page (home first), + Add page,
// and delete/rename for non-home pages. Drives the store page-axis actions.
"use client";

import React from 'react';
import { useEditStore } from '@/hooks/useEditStoreLegacy';
import { showProductsModal } from '../ui/GlobalModals';

export function PageSwitcher() {
  const store = useEditStore();
  const pages = store.pages || {};
  const currentPageId = store.currentPageId;

  const list = store.getPagesList ? store.getPagesList() : Object.values(pages);
  if (list.length <= 1 && Object.keys(pages).length === 0) return null;

  // A collection item (product) page is managed via the Products panel, not shown
  // as an individual tab. The catalog singleton + all other pages remain tabs.
  const tabs = list.filter((p: any) => p.kind !== 'collectionItem');
  // Products is a TechPremium-only capability. Show a single "+ Products" creation
  // entry ONLY until the catalog page exists; after that the catalog shows as a tab
  // and products are managed from that page (no duplicate "Products" in the header).
  const isTechPremium = store.templateId === 'techpremium';
  const hasCatalog = Object.values(pages).some(
    (p: any) => p.kind === 'singleton' && p.collectionKey === 'products',
  );

  const handleAdd = () => {
    const title = window.prompt('Page name', 'New page');
    if (title === null) return;
    const slug =
      '/' +
      title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    store.addPage({ title: title.trim() || 'New page', pathSlug: slug || `/page-${list.length}` });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this page?')) store.deletePage(id);
  };

  const handleRename = (e: React.MouseEvent, id: string, current: string) => {
    e.stopPropagation();
    const title = window.prompt('Rename page', current);
    if (title) store.renamePage(id, title.trim());
  };

  return (
    <div className="hidden md:flex items-center gap-1" role="tablist" aria-label="Pages">
      {tabs.map((p: any) => {
        const isActive = p.id === currentPageId;
        const isHome = p.pathSlug === '/';
        return (
          <div key={p.id} className="group relative flex items-center">
            <button
              role="tab"
              aria-selected={isActive}
              onClick={() => store.setCurrentPage(p.id)}
              onDoubleClick={(e) => !isHome && handleRename(e, p.id, p.title)}
              title={p.pathSlug}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isHome ? 'Home' : p.title || 'Untitled'}
            </button>
            {!isHome && (
              <button
                onClick={(e) => handleDelete(e, p.id)}
                aria-label={`Delete ${p.title}`}
                className="ml-0.5 hidden group-hover:flex items-center justify-center w-4 h-4 rounded text-gray-400 hover:text-red-600"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      {isTechPremium && !hasCatalog && (
        <button
          onClick={() => showProductsModal()}
          className="px-3 py-1 rounded-md text-sm text-gray-500 hover:bg-gray-100"
          aria-label="Add products"
          title="Add a products catalog"
        >
          + Products
        </button>
      )}
      <button
        onClick={handleAdd}
        className="px-2 py-1 rounded-md text-sm text-gray-500 hover:bg-gray-100"
        aria-label="Add page"
      >
        + Add page
      </button>
    </div>
  );
}
