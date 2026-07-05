// src/modules/templates/vestria/blocks/Catalog/VestriaCatalogueGrid.core.tsx
// SINGLE-SOURCE catalogue layout. PLAIN server-safe module (no client directive,
// no hooks/stores) — renders only through injected primitives (E). Ported from
// the Vestria mock (#catalogue): cat-head (tag + h2 · ghost CTA) · 4-col product
// cards (4/5 hatched image area with code chip + glyph · title + mono category).
// GRID-ONLY v1: items are plain content — no detail-page links, no collections
// machinery, no materialization.

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { CATALOG_STYLES } from './styles';

export interface VestriaCatalogueItem {
  id: string;
  code: string;
  title: string;
  category: string;
  glyph: string;
  image?: string;
}

export interface VestriaCatalogueContent {
  eyebrow?: string;
  headline?: string;
  cta_text?: string;
  cta_href?: string;
  items?: VestriaCatalogueItem[];
}

export function VestriaCatalogueGridCore({ content, E }: { content: VestriaCatalogueContent; E: VestriaPrimitives }) {
  const items = content.items || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CATALOG_STYLES }} />
      <section className="vs-pad-sm">
        <div className="vs-wrap">
          <div className="vs-cat-head">
            <div>
              <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
                className="vs-tag" placeholder="The Catalogue" />
              <E.Txt elementKey="headline" value={content.headline} as="h2"
                className="vs-heading vs-cat-head__h2" placeholder="A style for every station." />
            </div>
            {(content.cta_text !== undefined) && (
              <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="vs-btn vs-ghost">
                <E.Txt elementKey="cta_text" value={content.cta_text} isButton placeholder="Request full catalogue" />
                <span className="vs-arw">→</span>
              </E.Link>
            )}
          </div>
          <E.List collectionKey="items" items={items} className="vs-prod-grid" itemClassName="vs-prod"
            makeItem={() => ({ code: '', title: '', category: '', glyph: '', image: '' })}
            min={4} max={8} addLabel="+ Item"
            render={(item: VestriaCatalogueItem) => (
              <>
                <div className="vs-prod__ph">
                  <span className="vs-prod__art">
                    <E.Txt elementKey={`items.${item.id}.code`} value={item.code} as="span" placeholder="C-01" />
                  </span>
                  <E.Img elementKey={`items.${item.id}.image`} src={item.image} alt={item.title}
                    className="vs-prod__slot" imgClassName="vs-prod__img"
                    placeholder={
                      <span className="vs-ph">
                        <E.Txt elementKey={`items.${item.id}.glyph`} value={item.glyph} as="span"
                          className="vs-prod__glyph" placeholder="Item type" />
                      </span>
                    }
                  />
                </div>
                <div className="vs-prod__meta">
                  <E.Txt elementKey={`items.${item.id}.title`} value={item.title} as="h3"
                    className="vs-heading vs-prod__h3" placeholder="Product name" />
                  <E.Txt elementKey={`items.${item.id}.category`} value={item.category} as="span"
                    className="vs-prod__cat" placeholder="Category · Material" />
                </div>
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default VestriaCatalogueGridCore;
