'use client';

// Products panel (Phase 3 collection system). Manage the `products` collection:
// add / edit / delete / reorder products and assign their category. Each product
// is a /products/{slug} page; the catalog auto-lists them. Opened from PageSwitcher.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStoreLegacy';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';

const COLLECTION = 'products';

interface Cat { id: string; title: string; label?: string }

function recordOf(entry: any): Record<string, any> {
  for (const sid of entry?.sections ?? []) {
    if (extractSectionType(sid) === 'productdetail') return entry.content?.[sid]?.elements ?? {};
  }
  return {};
}

export function ProductsModal({ onClose }: { onClose: () => void }) {
  const store = useEditStore();
  const pages = store.pages || {};

  // Categories live on the catalog page's catalog section.
  const catalogPage: any = Object.values(pages).find(
    (p: any) => p.kind === 'singleton' && p.collectionKey === COLLECTION,
  );
  const categories: Cat[] = (() => {
    if (!catalogPage) return [];
    for (const sid of catalogPage.sections ?? []) {
      if (extractSectionType(sid) === 'catalog') {
        const cats = catalogPage.content?.[sid]?.elements?.categories;
        return Array.isArray(cats) ? cats : [];
      }
    }
    return [];
  })();

  const items: any[] = store.getCollectionItems ? store.getCollectionItems(COLLECTION) : [];

  const handleAdd = () => {
    const title = window.prompt('Product name', 'New product');
    if (title === null) return;
    const id = store.addCollectionItem(COLLECTION, { title: title.trim() || 'New product' });
    if (id) onClose(); // navigate to the new product to fill its record
  };

  const move = (index: number, dir: -1 | 1) => {
    const order = items.map((p) => p.id);
    const j = index + dir;
    if (j < 0 || j >= order.length) return;
    [order[index], order[j]] = [order[j], order[index]];
    store.reorderCollection(COLLECTION, order);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <p className="text-sm text-gray-500">Each product is a <code>/products/…</code> page; the catalog lists them automatically.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700">+ Add product</button>
            <button onClick={onClose} aria-label="Close" className="rounded-md px-2 py-1.5 text-gray-400 hover:bg-gray-100">✕</button>
          </div>
        </div>

        <div className="p-4">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
              No products yet. Click <strong>+ Add product</strong> to create one.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((p, i) => {
                const rec = recordOf(p);
                const label = [rec.model, rec.name || p.title].filter(Boolean).join(' — ') || p.title;
                return (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex flex-col">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move up">▲</button>
                      <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move down">▼</button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">{label}</div>
                      <div className="truncate text-xs text-gray-400">{p.pathSlug}</div>
                    </div>
                    {categories.length > 0 && (
                      <select
                        value={rec.category || categories[0]?.id}
                        onChange={(e) => store.setCollectionItemCategory(COLLECTION, p.id, e.target.value)}
                        className="rounded-md border px-2 py-1 text-sm"
                      >
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    )}
                    <button onClick={() => { store.setCurrentPage(p.id); onClose(); }} className="rounded-md border px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                    <button onClick={() => { if (window.confirm('Delete this product?')) store.deletePage(p.id); }} className="rounded-md px-2 py-1 text-sm text-gray-400 hover:text-red-600">Delete</button>
                  </li>
                );
              })}
            </ul>
          )}

          <CategoriesSection store={store} categories={categories} />
        </div>
      </div>
    </div>
  );
}

function CategoriesSection({ store, categories }: { store: any; categories: Cat[] }) {
  const [cats, setCats] = React.useState<Cat[]>(categories);
  // Re-seed when the structural signature changes (e.g. edited inline on the page).
  const sig = categories.map((c) => c.id).join('|');
  React.useEffect(() => { setCats(categories); /* eslint-disable-next-line */ }, [sig]);

  const apply = (next: Cat[]) => { setCats(next); store.setCollectionCategories(COLLECTION, next); };
  const editLocal = (id: string, key: 'title' | 'label', v: string) =>
    setCats((cs) => cs.map((c) => (c.id === id ? { ...c, [key]: v } : c)));
  const commit = () => store.setCollectionCategories(COLLECTION, cats);
  const add = () => apply([...cats, { id: `cat-${Math.random().toString(36).slice(2, 8)}`, title: 'New category', label: '' }]);
  const remove = (id: string) => apply(cats.filter((c) => c.id !== id));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= cats.length) return;
    const next = [...cats]; [next[i], next[j]] = [next[j], next[i]]; apply(next);
  };

  return (
    <div className="mt-6 border-t pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
        <button onClick={add} className="rounded-md border px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-50">+ Add category</button>
      </div>
      <p className="mb-3 text-xs text-gray-400">Deleting a category moves its products to the first category.</p>
      {cats.length === 0 ? (
        <div className="text-sm text-gray-400">No categories.</div>
      ) : (
        <ul className="space-y-2">
          {cats.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move up">▲</button>
                <button onClick={() => move(i, 1)} disabled={i === cats.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move down">▼</button>
              </div>
              <input value={c.title} onChange={(e) => editLocal(c.id, 'title', e.target.value)} onBlur={commit} placeholder="Title" className="flex-1 rounded-md border px-2 py-1 text-sm" />
              <input value={c.label || ''} onChange={(e) => editLocal(c.id, 'label', e.target.value)} onBlur={commit} placeholder="Label (optional)" className="w-40 rounded-md border px-2 py-1 text-sm" />
              <button onClick={() => { if (cats.length > 1 && window.confirm('Delete this category?')) remove(c.id); }} disabled={cats.length <= 1} className="rounded-md px-2 py-1 text-sm text-gray-400 hover:text-red-600 disabled:opacity-30">Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
