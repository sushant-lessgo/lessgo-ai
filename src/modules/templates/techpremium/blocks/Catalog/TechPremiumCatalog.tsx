'use client';

// src/modules/templates/techpremium/blocks/Catalog/TechPremiumCatalog.tsx
// TechPremium product catalog (collection-list). Edit mode. Page-head (breadcrumb,
// headline, lede, jump nav) + one category group per `categories[]`, each
// auto-listing materialized product `items[]` as cards. Cards are READ-ONLY here
// (managed via the Products panel); only the heads + categories are editable.
// Ported from design_handoff_naayom Naayom - Catalog.html. Reference: .pline/.pcard.

import React from 'react';
import { STYLES } from './styles';
import { PackageOpen } from 'lucide-react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';

interface Category { id: string; title: string; label: string }
interface CatalogItem {
  id: string; model: string; name: string; oneLiner: string;
  image: string; cardSpec: string; categoryId: string; href: string;
}
interface TechPremiumCatalogContent {
  eyebrow: string; headline: string; lede: string;
  categories: Category[]; items: CatalogItem[];
}

interface Props { sectionId: string }

function ProductCard({ item, edit }: { item: CatalogItem; edit: boolean }) {
  const Wrapper: any = edit ? 'div' : 'a';
  const wprops = edit ? {} : { href: item.href };
  return (
    <Wrapper className="tp-pcard" {...wprops}>
      <div className="tp-pshot">
        {item.image ? <img src={item.image} alt={item.name} loading="lazy" decoding="async" /> : <span className="tp-pshot__ph">{item.model || 'Product photo'}</span>}
      </div>
      <div className="tp-pbody">
        {item.model && <span className="tp-pmodel">{item.model}</span>}
        <h4 className="tp-ph4">{item.name || 'Untitled product'}</h4>
        {item.oneLiner && <p className="tp-pp">{item.oneLiner}</p>}
        <div className="tp-pfoot">
          {item.cardSpec ? <span className="tp-pspecs">{item.cardSpec}</span> : <span />}
          <span className="tp-penq">View details →</span>
        </div>
      </div>
    </Wrapper>
  );
}

export default function TechPremiumCatalog({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<TechPremiumCatalogContent>({ sectionId });

  const edit = mode === 'edit';
  const categories = blockContent.categories || [];
  const items = blockContent.items || [];

  const updateCategory = (id: string, key: 'title' | 'label', value: string) =>
    handleCollectionUpdate('categories', categories.map((c) => (c.id === id ? { ...c, [key]: value } : c)));
  const addCategory = () =>
    handleCollectionUpdate('categories', [
      ...categories,
      { id: `cat${Date.now()}`, title: 'New category', label: '' },
    ]);
  const removeCategory = (id: string) =>
    handleCollectionUpdate('categories', categories.filter((c) => c.id !== id));

  // Resolve each card's category, bucketing unknown/empty ids under the first
  // category so a stray categoryId can never silently drop a card.
  const catIds = new Set(categories.map((c) => c.id));
  const effCat = (it: CatalogItem) => (it.categoryId && catIds.has(it.categoryId) ? it.categoryId : categories[0]?.id);
  const itemsFor = (catId: string) => items.filter((it) => effCat(it) === catId);
  const catalogEmpty = items.length === 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-cat" data-section-id={sectionId}>
        <div className="tp-cat__inner">
          {/* page head */}
          <div className="tp-cat-head">
            <div className="tp-crumb"><span>Home</span> <span className="tp-sep">/</span> Products</div>
            <TechPremiumEditable
              as="h1" mode={mode} sectionId={sectionId} elementKey="headline"
              value={blockContent.headline} onSave={(v) => handleContentUpdate('headline', v)}
              enterBehavior="save" className="tp-cat-h1" placeholder="The product catalog."
            />
            {(blockContent.lede || edit) && (
              <TechPremiumEditable
                as="p" mode={mode} sectionId={sectionId} elementKey="lede"
                value={blockContent.lede} onSave={(v) => handleContentUpdate('lede', v)}
                multiline className="lede tp-cat-lede" placeholder="One or two lines introducing the catalog."
              />
            )}
            {categories.length > 0 && (
              <div className="tp-cat-jump">
                {categories.map((c) => (
                  <a key={c.id} href={`#cat-${c.id}`}>{c.title || 'Category'}</a>
                ))}
              </div>
            )}
          </div>

          {/* whole-catalog empty state */}
          {catalogEmpty && !edit && (
            <CatalogEmpty whole />
          )}

          {/* category groups */}
          {categories.map((c) => {
            const list = itemsFor(c.id);
            return (
              <div key={c.id} id={`cat-${c.id}`} className="tp-pline">
                <div className="tp-pline-head">
                  <TechPremiumEditable
                    as="h3" mode={mode} sectionId={sectionId} elementKey={`categories_title_${c.id}`}
                    value={c.title} onSave={(v) => updateCategory(c.id, 'title', v)}
                    enterBehavior="save" className="tp-pline-h3" placeholder="Category"
                  />
                  <div className="tp-pline-meta">
                    {(c.label || edit) && (
                      <TechPremiumEditable
                        as="span" mode={mode} sectionId={sectionId} elementKey={`categories_label_${c.id}`}
                        value={c.label} onSave={(v) => updateCategory(c.id, 'label', v)}
                        enterBehavior="save" className="tp-lbl" placeholder="label"
                      />
                    )}
                    {edit && categories.length > 1 && (
                      <button type="button" className="tp-cat-x" onClick={() => removeCategory(c.id)} aria-label="Remove category">×</button>
                    )}
                  </div>
                </div>
                {list.length > 0 ? (
                  <div className="tp-pcards">
                    {list.map((it) => <ProductCard key={it.id} item={it} edit={edit} />)}
                  </div>
                ) : (
                  <CatalogEmpty />
                )}
              </div>
            );
          })}

          {edit && (
            <div className="tp-cat-toolbar">
              <button
                type="button"
                className="tp-cat-manage"
                onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lessgo:manage-products')); }}
              >
                Manage products
              </button>
              <button type="button" className="tp-cat-addcat" onClick={addCategory}>+ Add category</button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function CatalogEmpty({ whole = false }: { whole?: boolean }) {
  return (
    <div className="tp-collection-empty">
      <span className="tp-ce-ico"><PackageOpen size={24} strokeWidth={1.6} /></span>
      <h3>{whole ? 'No products yet' : 'Nothing here yet'}</h3>
      <p>{whole ? 'Add your first product from the Products panel — it’ll appear here automatically.' : 'Products assigned to this category will list here.'}</p>
    </div>
  );
}

