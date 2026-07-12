'use client';

// Collection panel (Phase 3 collection system, generalized scale-10 phase 6).
// ONE panel, N collections: keyed by `collectionKey`, with label / basePath /
// section-types / labelFields read from the collections registry. Manage a
// collection: add / edit / delete / reorder items and assign their category.
// Each item is a `{def.basePath}/{slug}` page; the catalog auto-lists them.
// Opened from PageSwitcher (products entry point + per-collection entries).
//
// SCOPE GUARD: the panel only opens for collections that are PRESENT in the
// project's pages (PageSwitcher gates via `collectionKeysInPages`, which the
// generation capability gate bounds). It therefore never assumes a resolvable
// block exists for `services`/`case-studies`/`works` defs — those have no live
// template/pages until rung-C block pairs land. recordOf / categories read by
// section TYPE and degrade to {} / [] when the section is absent, so a def with
// no matching pages renders harmlessly.

import React from 'react';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import { extractSectionType } from '@/modules/generatedLanding/componentRegistry';
import { getCollectionDef, type CollectionDef } from '@/modules/collections/registry';
import { confirmDialog, promptDialog } from '@/components/ui/ConfirmDialog';

// Module-scoped "payload" channel: PageSwitcher sets the desired collection key
// before opening the modal (the GlobalModals open path carries no payload). The
// component reads this when no explicit `collectionKey` prop is passed. Defaults
// to 'products' so the grandfathered products flow is unaffected.
let _panelCollectionKey = 'products';
export function setPanelCollectionKey(key: string) { _panelCollectionKey = key; }
export function getPanelCollectionKey(): string { return _panelCollectionKey; }

interface Cat { id: string; title: string; label?: string }

// Display-only singularizer for the item noun (e.g. "Products" → "product").
// Handles the family labels exactly: Products→product, Services→service,
// Works→work, Case Studies→case study. Products yields "product" so the
// products panel copy stays byte-identical to the pre-generalization strings.
function singularNoun(label: string): string {
  return label.toLowerCase().replace(/ies$/, 'y').replace(/s$/, '');
}

function recordOf(entry: any, itemSectionType: string): Record<string, any> {
  for (const sid of entry?.sections ?? []) {
    if (extractSectionType(sid) === itemSectionType) return entry.content?.[sid]?.elements ?? {};
  }
  return {};
}

// Derive an item's display label from the def's ordered labelFields. Generic
// rule that degrades EXACTLY to the old products fallback
// `[rec.model, rec.name || p.title].filter(Boolean).join(' — ') || p.title`:
// the LAST labelField gets the inner `|| p.title` fallback (products' last field
// is `name`), then filter non-empty, join ' — ', outer `|| p.title`. For
// products (labelFields ['model','name']) this is byte-identical.
function deriveLabel(def: CollectionDef, rec: Record<string, any>, title: string): string {
  const parts = def.labelFields.map((f, i) =>
    i === def.labelFields.length - 1 ? (rec[f] || title) : rec[f],
  );
  return parts.filter(Boolean).join(' — ') || title;
}

export function ProductsModal({ onClose, collectionKey }: { onClose: () => void; collectionKey?: string }) {
  // Render-read: pages drives categories/catalog derivation; collection items are
  // derived from pages via getCollectionItems (subscribed reactively). All mutating
  // actions run through storeApi.getState() in handlers.
  const pages = useEditStore((s) => s.pages || {});
  const storeApi = useEditStoreApi();

  const key = collectionKey ?? getPanelCollectionKey();
  const def = getCollectionDef(key);
  if (!def) return null; // no registry def → nothing to manage (guard, should not happen)

  const noun = singularNoun(def.label);
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const labelLower = def.label.toLowerCase();

  // Categories live on the catalog page's catalog section.
  const catalogPage: any = Object.values(pages).find(
    (p: any) => p.kind === 'singleton' && p.collectionKey === key,
  );
  const categories: Cat[] = (() => {
    if (!catalogPage) return [];
    for (const sid of catalogPage.sections ?? []) {
      if (extractSectionType(sid) === def.catalogSectionType) {
        const cats = catalogPage.content?.[sid]?.elements?.categories;
        return Array.isArray(cats) ? cats : [];
      }
    }
    return [];
  })();

  // Derived from `pages` (subscribed above) → recomputes on every pages change.
  const s = storeApi.getState();
  const items: any[] = s.getCollectionItems ? s.getCollectionItems(key) : [];

  const handleAdd = async () => {
    const title = await promptDialog({ title: `${Noun} name`, defaultValue: `New ${noun}` });
    if (title === null) return;
    const id = storeApi.getState().addCollectionItem(key, { title: title.trim() || `New ${noun}` });
    if (id) onClose(); // navigate to the new item to fill its record
  };

  const move = (index: number, dir: -1 | 1) => {
    const order = items.map((p) => p.id);
    const j = index + dir;
    if (j < 0 || j >= order.length) return;
    [order[index], order[j]] = [order[j], order[index]];
    storeApi.getState().reorderCollection(key, order);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{def.label}</h2>
            <p className="text-sm text-gray-500">Each {noun} is a <code>{def.basePath}/…</code> page; the catalog lists them automatically.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700">+ Add {noun}</button>
            <button onClick={onClose} aria-label="Close" className="rounded-md px-2 py-1.5 text-gray-400 hover:bg-gray-100">✕</button>
          </div>
        </div>

        <div className="p-4">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
              No {labelLower} yet. Click <strong>+ Add {noun}</strong> to create one.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((p, i) => {
                const rec = recordOf(p, def.itemSectionType);
                const label = deriveLabel(def, rec, p.title);
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
                        onChange={(e) => storeApi.getState().setCollectionItemCategory(key, p.id, e.target.value)}
                        className="rounded-md border px-2 py-1 text-sm"
                      >
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    )}
                    <button onClick={() => { storeApi.getState().setCurrentPage(p.id); onClose(); }} className="rounded-md border px-2.5 py-1 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                    <button onClick={async () => { if (await confirmDialog({ title: `Delete ${noun}`, message: `Delete this ${noun}?`, confirmLabel: 'Delete', destructive: true })) storeApi.getState().deletePage(p.id); }} className="rounded-md px-2 py-1 text-sm text-gray-400 hover:text-red-600">Delete</button>
                  </li>
                );
              })}
            </ul>
          )}

          <CategoriesSection storeApi={storeApi} categories={categories} collectionKey={key} />
        </div>
      </div>
    </div>
  );
}

function CategoriesSection({ storeApi, categories, collectionKey }: { storeApi: any; categories: Cat[]; collectionKey: string }) {
  const [cats, setCats] = React.useState<Cat[]>(categories);
  // Re-seed when the structural signature changes (e.g. edited inline on the page).
  const sig = categories.map((c) => c.id).join('|');
  React.useEffect(() => { setCats(categories); /* eslint-disable-next-line */ }, [sig]);

  const apply = (next: Cat[]) => { setCats(next); storeApi.getState().setCollectionCategories(collectionKey, next); };
  const editLocal = (id: string, key: 'title' | 'label', v: string) =>
    setCats((cs) => cs.map((c) => (c.id === id ? { ...c, [key]: v } : c)));
  const commit = () => storeApi.getState().setCollectionCategories(collectionKey, cats);
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
              <button onClick={async () => { if (cats.length > 1 && await confirmDialog({ title: 'Delete category', message: 'Delete this category?', confirmLabel: 'Delete', destructive: true })) remove(c.id); }} disabled={cats.length <= 1} className="rounded-md px-2 py-1 text-sm text-gray-400 hover:text-red-600 disabled:opacity-30">Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
