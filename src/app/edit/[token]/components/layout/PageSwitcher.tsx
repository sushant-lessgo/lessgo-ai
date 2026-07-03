// /app/edit/[token]/components/layout/PageSwitcher.tsx
// Phase 1 multi-page switcher: tabs for each page (home first), + Add page,
// and delete/rename for non-home pages. Drives the store page-axis actions.
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useEditStore } from '@/hooks/useEditStoreLegacy';
import { showProductsModal } from '../ui/GlobalModals';
import { usesTemplateModule } from '@/types/service';

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
      className="px-3 py-1 rounded-md text-sm text-gray-500 hover:bg-gray-100"
      aria-label="Manage blog"
      title="Write and publish blog posts at /blog"
    >
      /blog
    </a>
  );
}

export function PageSwitcher() {
  const store = useEditStore();
  const pages = store.pages || {};
  const currentPageId = store.currentPageId;

  // Blog is a template-module capability (legacy 47-block product pages can't
  // render the shared blog blocks).
  const showBlog = usesTemplateModule(store.audienceType as any, store.templateId as any);

  const list = store.getPagesList ? store.getPagesList() : Object.values(pages);
  if (list.length <= 1 && Object.keys(pages).length === 0) {
    // No page axis yet (single-page project) — still surface the blog entry.
    return showBlog ? (
      <div className="hidden md:flex items-center gap-1">
        <BlogButton />
      </div>
    ) : null;
  }

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
  // Gallery + Contact are one-of-a-kind designed pages (Phase 4c). Offer a creation
  // entry only until that page exists; after that it's a normal tab.
  const hasArchetype = (key: string) => Object.values(pages).some((p: any) => p.archetypeKey === key);

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

  // (Phase 4c) The "Apply Home layout" button was retired — new TechPremium projects
  // now default to the 12-section naayom Home (deterministic seed at generation).

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
      {isTechPremium && !hasArchetype('gallery') && (
        <button
          onClick={() => store.addArchetypePage('gallery')}
          className="px-3 py-1 rounded-md text-sm text-gray-500 hover:bg-gray-100"
          aria-label="Add gallery page"
          title="Add the naayom Gallery page"
        >
          + Gallery
        </button>
      )}
      {isTechPremium && !hasArchetype('contact') && (
        <button
          onClick={() => store.addArchetypePage('contact')}
          className="px-3 py-1 rounded-md text-sm text-gray-500 hover:bg-gray-100"
          aria-label="Add contact page"
          title="Add the naayom Contact page"
        >
          + Contact
        </button>
      )}
      <button
        onClick={handleAdd}
        className="px-2 py-1 rounded-md text-sm text-gray-500 hover:bg-gray-100"
        aria-label="Add page"
      >
        + Add page
      </button>
      {showBlog && <BlogButton />}
    </div>
  );
}
