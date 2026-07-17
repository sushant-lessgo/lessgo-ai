// src/modules/skeletons/work/blocks/Catalog/WorkCatalog.core.tsx
// SINGLE-SOURCE work-catalog layout (granth .core pattern). PLAIN server-safe
// module — layout lives here once, renders through injected primitives `E`.
//
// This is the `/works` INDEX (COLLECTIONS.works.catalogSectionType = 'workcatalog').
// It renders the catalog slice's `items` — one cover cell per project, each a cover
// image + name linking to that project's `/works/<slug>` detail page. Its `items`
// are seeded at assemble time from the works entries (name + cover + href) —
// buildCollectionCatalogSlice (hooks/editStore/archetypes.ts). Same covers-grid
// grammar as the home WorkGalleryGrid so the two read as one family.
//
// Head scalars are keyed `headline`/`lede` (the generic catalog-slice field names),
// NOT `heading`/`lead`.
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries `data-sid`
// (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_CATALOG_STYLES } from './styles';

export interface WorkCatalogItem { id: string; name?: string; cover?: string; href?: string }

export interface WorkCatalogContent {
  eyebrow?: string;
  headline?: string;
  lede?: string;
  items?: WorkCatalogItem[];
}

const ITEM_PH = <div className="wk-catalog__ph" aria-hidden="true">Cover</div>;

export function WorkCatalogCore({
  content, E, sectionId,
}: { content: WorkCatalogContent; E: WorkPrimitives; sectionId: string }) {
  const items = content.items || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_CATALOG_STYLES }} />
      <section className="wk-catalog" data-sid={sectionId} data-section-id={sectionId} data-wk-catalog="">
        <div className="wk-catalog__in">
          <div className="wk-catalog__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-catalog__eyebrow" placeholder="Works" />
            <E.Txt elementKey="headline" value={content.headline} as="h2"
              className="wk-catalog__heading" placeholder="Every project" />
            <E.Txt elementKey="lede" value={content.lede} as="p"
              className="wk-catalog__lead" multiline placeholder="The full index of work." />
          </div>

          <E.List collectionKey="items" items={items} className="wk-catalog__grid"
            itemClassName="wk-catalog__group"
            makeItem={() => ({ name: '', cover: '', href: '' })} min={0} max={99} addLabel="+ Project"
            render={(item: WorkCatalogItem) => (
              <E.Link hrefKey={`items.${item.id}.href`} href={item.href || '#'} className="wk-catalog__link">
                <E.Img elementKey={`items.${item.id}.cover`} src={item.cover} alt={item.name}
                  className="wk-catalog__media" placeholder={ITEM_PH} />
                <E.Txt elementKey={`items.${item.id}.name`} value={item.name} as="span"
                  className="wk-catalog__name" placeholder="Project name" />
              </E.Link>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default WorkCatalogCore;
