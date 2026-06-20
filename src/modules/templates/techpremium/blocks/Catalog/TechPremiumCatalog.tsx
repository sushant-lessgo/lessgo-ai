'use client';

// src/modules/templates/techpremium/blocks/Catalog/TechPremiumCatalog.tsx
// TechPremium product catalog (collection-list). Edit mode. Page-head (breadcrumb,
// headline, lede, jump nav) + one category group per `categories[]`, each
// auto-listing materialized product `items[]` as cards. Cards are READ-ONLY here
// (managed via the Products panel); only the heads + categories are editable.
// Ported from design_handoff_naayom Naayom - Catalog.html. Reference: .pline/.pcard.

import React from 'react';
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
        {item.image ? <img src={item.image} alt={item.name} /> : <span className="tp-pshot__ph">{item.model || 'Product photo'}</span>}
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

export const STYLES = `
.tp-cat { padding: var(--pad-y) var(--pad-x); }
.tp-cat__inner { max-width: var(--max-w); margin: 0 auto; }
.tp-cat-head { display:flex; flex-direction:column; gap:16px; margin-bottom:48px; max-width:72ch; }
.tp-crumb { font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); }
.tp-crumb .tp-sep { margin:0 6px; color:var(--line-2); }
.tp-cat-h1 { font-family:var(--font-display); font-weight:600; font-size:clamp(32px,5vw,52px); letter-spacing:-0.02em; line-height:1.05; color:var(--ink); margin:0; }
.tp-cat-lede { font-family:var(--font-body); font-size:18px; line-height:1.7; color:var(--ink-2); margin:0; }
.tp-cat-jump { display:flex; flex-wrap:wrap; gap:10px; margin-top:4px; }
.tp-cat-jump a { font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-2); border:1px solid var(--line-2); border-radius:999px; padding:8px 15px; text-decoration:none; transition:all .15s ease; }
.tp-cat-jump a:hover { border-color:var(--forest); color:var(--forest); }
.tp-pline + .tp-pline { margin-top:clamp(40px,5vw,64px); }
.tp-pline-head { display:flex; align-items:baseline; justify-content:space-between; gap:16px; padding-bottom:16px; margin-bottom:28px; border-bottom:1px solid var(--line-2); }
.tp-pline-h3 { font-family:var(--font-display); font-weight:600; font-size:clamp(22px,2.6vw,30px); letter-spacing:-0.018em; color:var(--ink); margin:0; }
.tp-pline-meta { display:flex; align-items:center; gap:12px; }
.tp-lbl { font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-3); }
.tp-cat-x { width:22px; height:22px; background:transparent; border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; }
.tp-pcards { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.tp-pcard { background:var(--paper); border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; display:flex; flex-direction:column; text-decoration:none; color:inherit; transition:border-color .16s ease, transform .16s ease, box-shadow .16s ease; }
.tp-pcard:hover { border-color:var(--line-2); transform:translateY(-2px); box-shadow:0 16px 40px -28px oklch(0.30 0.04 158 / 0.5); }
.tp-pshot { aspect-ratio:4/3; border-bottom:1px solid var(--line); background:var(--paper-2); display:grid; place-items:center; overflow:hidden; }
.tp-pshot img { width:100%; height:100%; object-fit:cover; }
.tp-pshot__ph { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.06em; color:var(--ink-3); text-align:center; padding:8px; }
.tp-pbody { padding:20px 20px 18px; display:flex; flex-direction:column; gap:8px; flex:1; }
.tp-pmodel { font-family:var(--font-mono); font-size:11px; font-weight:600; letter-spacing:0.12em; color:var(--lime-d); }
.tp-ph4 { font-family:var(--font-display); font-weight:600; font-size:19px; letter-spacing:-0.015em; color:var(--ink); margin:0; }
.tp-pp { margin:0; color:var(--ink-2); font-size:14px; line-height:1.55; }
.tp-pfoot { margin-top:auto; padding-top:16px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.tp-pspecs { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.06em; color:var(--ink-3); }
.tp-penq { font-family:var(--font-display); font-weight:600; font-size:13.5px; color:var(--forest); }
.tp-pcard:hover .tp-penq { color:var(--lime-d); }
.tp-collection-empty { border:1px dashed var(--line-2); border-radius:var(--r-lg); padding:48px 32px; text-align:center; background:var(--paper); }
.tp-ce-ico { width:46px; height:46px; border-radius:10px; background:var(--paper-2); display:grid; place-items:center; margin:0 auto 16px; color:var(--ink-3); }
.tp-collection-empty h3 { font-family:var(--font-display); font-weight:600; font-size:19px; color:var(--ink); margin:0 0 8px; }
.tp-collection-empty p { color:var(--ink-2); font-size:15px; max-width:42ch; margin:0 auto; }
.tp-cat-toolbar { margin-top:28px; display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
.tp-cat-manage { background:var(--forest); color:var(--paper); font-family:var(--font-display); font-weight:600; font-size:14px; padding:11px 20px; border:none; border-radius:var(--r-lg); cursor:pointer; }
.tp-cat-manage:hover { filter:brightness(1.08); }
.tp-cat-addcat { border:1px dashed var(--line-2); background:transparent; color:var(--ink-3); font-family:var(--font-body); font-size:14px; padding:11px 18px; border-radius:var(--r-lg); cursor:pointer; }
.tp-cat-addcat:hover { border-color:var(--forest); color:var(--forest); }
@media (max-width:760px){ .tp-pcards { grid-template-columns:1fr 1fr; } }
@media (max-width:520px){ .tp-pcards { grid-template-columns:1fr; } }
`;
