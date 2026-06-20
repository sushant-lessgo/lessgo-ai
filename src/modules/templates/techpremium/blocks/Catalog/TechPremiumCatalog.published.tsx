// src/modules/templates/techpremium/blocks/Catalog/TechPremiumCatalog.published.tsx
// Server-safe published variant of TechPremiumCatalog. Renders the materialized
// items[] grouped by category. Cards are plain <a href> (native cross-page nav).

import React from 'react';
import { PackageOpen } from 'lucide-react';
import { STYLES } from './TechPremiumCatalog';

interface Category { id?: string; title?: string; label?: string }
interface CatalogItem {
  id?: string; model?: string; name?: string; oneLiner?: string;
  image?: string; cardSpec?: string; categoryId?: string; href?: string;
}
interface Props {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  categories?: Category[];
  items?: CatalogItem[];
}

function Card({ item }: { item: CatalogItem }) {
  return (
    <a className="tp-pcard" href={item.href || '#'}>
      <div className="tp-pshot">
        {item.image ? <img src={item.image} alt={item.name || ''} /> : <span className="tp-pshot__ph">{item.model || 'Product'}</span>}
      </div>
      <div className="tp-pbody">
        {item.model && <span className="tp-pmodel">{item.model}</span>}
        {item.name && <h4 className="tp-ph4">{item.name}</h4>}
        {item.oneLiner && <p className="tp-pp">{item.oneLiner}</p>}
        <div className="tp-pfoot">
          {item.cardSpec ? <span className="tp-pspecs">{item.cardSpec}</span> : <span />}
          <span className="tp-penq">View details →</span>
        </div>
      </div>
    </a>
  );
}

function Empty({ whole }: { whole?: boolean }) {
  return (
    <div className="tp-collection-empty">
      <span className="tp-ce-ico"><PackageOpen size={24} strokeWidth={1.6} /></span>
      <h3>{whole ? 'No products yet' : 'Nothing here yet'}</h3>
      <p>{whole ? 'Products will appear here once added.' : 'Products in this category will list here.'}</p>
    </div>
  );
}

export default function TechPremiumCatalogPublished(props: Props) {
  const categories = Array.isArray(props.categories) ? props.categories : [];
  const items = Array.isArray(props.items) ? props.items : [];
  const firstCat = categories[0]?.id;
  const catIds = new Set(categories.map((c) => c.id));
  // Bucket unknown/empty categoryId under the first category (defensive parity with edit).
  const effCat = (it: CatalogItem) => (it.categoryId && catIds.has(it.categoryId) ? it.categoryId : firstCat);
  const itemsFor = (catId?: string) => items.filter((it) => effCat(it) === catId);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-cat">
        <div className="tp-cat__inner">
          <div className="tp-cat-head">
            <div className="tp-crumb"><span>Home</span> <span className="tp-sep">/</span> Products</div>
            {props.headline && <h1 className="tp-cat-h1" dangerouslySetInnerHTML={{ __html: props.headline }} />}
            {props.lede && <p className="lede tp-cat-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />}
            {categories.length > 0 && (
              <div className="tp-cat-jump">
                {categories.map((c, i) => <a key={c.id || i} href={`#cat-${c.id}`}>{c.title || 'Category'}</a>)}
              </div>
            )}
          </div>

          {items.length === 0 && <Empty whole />}

          {categories.map((c, i) => {
            const list = itemsFor(c.id);
            return (
              <div key={c.id || i} id={`cat-${c.id}`} className="tp-pline">
                <div className="tp-pline-head">
                  {c.title && <h3 className="tp-pline-h3">{c.title}</h3>}
                  {c.label && <span className="tp-lbl">{c.label}</span>}
                </div>
                {list.length > 0 ? (
                  <div className="tp-pcards">{list.map((it, k) => <Card key={it.id || k} item={it} />)}</div>
                ) : (
                  <Empty />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
