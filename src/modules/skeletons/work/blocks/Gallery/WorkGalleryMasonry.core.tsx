// src/modules/skeletons/work/blocks/Gallery/WorkGalleryMasonry.core.tsx
// SINGLE-SOURCE work-gallery layout (granth .core pattern) — the MASONRY shape:
// a CSS-columns collage of group covers (varied heights). PLAIN server-safe module.
//
// Binds the SAME frozen `work` contract as WorkGalleryGrid (workElementContract.work):
//   scalars — eyebrow · heading · lead
//   collection — groups[] { id, name, cover_image, href }
// ⚠️ AC L120 — renders GROUP REFERENCES ONLY (cover + name → group href), NEVER a
// flat photo list. A lossless swap ALTERNATE of the grid (same `groups` collection).
//
// LIGHTBOX (phase 6). The section opts into the published `work.v1.js` gallery
// lightbox via `data-wk-gallery-lightbox`; each cover carries `data-wk-lightbox`.
// The hooks are inert data attributes in BOTH renderers (zero pixels); only the
// published asset binds the overlay (independently guarded — no-op without JS).
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries `data-sid`
// (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_GALLERY_MASONRY_STYLES } from './styles';
import type { WorkGalleryContent, WorkGalleryGroup } from './WorkGalleryGrid.core';

const GROUP_PH = <div className="wk-gallery-masonry__ph" aria-hidden="true">Cover</div>;

export function WorkGalleryMasonryCore({
  content, E, sectionId,
}: { content: WorkGalleryContent; E: WorkPrimitives; sectionId: string }) {
  const groups = content.groups || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_GALLERY_MASONRY_STYLES }} />
      <section className="wk-gallery-masonry" data-sid={sectionId} data-section-id={sectionId}
        data-wk-gallery-masonry="" data-wk-gallery-lightbox="">
        <div className="wk-gallery-masonry__in">
          <div className="wk-gallery-masonry__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-gallery-masonry__eyebrow" placeholder="Selected work" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-gallery-masonry__heading" placeholder="The work" />
            <E.Txt elementKey="lead" value={content.lead} as="p"
              className="wk-gallery-masonry__lead" multiline placeholder="A cut of recent commissions." />
          </div>

          <E.List collectionKey="groups" items={groups} className="wk-gallery-masonry__grid"
            itemClassName="wk-gallery-masonry__group"
            makeItem={() => ({ name: '', cover_image: '', href: '' })} min={1} max={12} addLabel="+ Group"
            render={(item: WorkGalleryGroup) => (
              <E.Link hrefKey={`groups.${item.id}.href`} href={item.href || '#work'} className="wk-gallery-masonry__link">
                <span className="wk-gallery-masonry__media" data-wk-lightbox="">
                  <E.Img elementKey={`groups.${item.id}.cover_image`} src={item.cover_image} alt={item.name}
                    className="wk-gallery-masonry__img" placeholder={GROUP_PH} />
                </span>
                <E.Txt elementKey={`groups.${item.id}.name`} value={item.name} as="span"
                  className="wk-gallery-masonry__name" placeholder="Group name" />
              </E.Link>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default WorkGalleryMasonryCore;
