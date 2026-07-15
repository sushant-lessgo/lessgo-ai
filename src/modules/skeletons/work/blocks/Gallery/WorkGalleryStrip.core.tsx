// src/modules/skeletons/work/blocks/Gallery/WorkGalleryStrip.core.tsx
// SINGLE-SOURCE work-gallery layout (granth .core pattern) — the STRIP shape: a
// horizontal scroll row of group covers (Pulse `.archive-list` horizontal read).
// PLAIN server-safe module.
//
// Binds the SAME frozen `work` contract as WorkGalleryGrid — group REFERENCES ONLY
// (AC L120), a lossless swap ALTERNATE of the grid (same `groups` collection).
//
// LIGHTBOX (phase 6): opts into the published `work.v1.js` gallery lightbox via
// `data-wk-gallery-lightbox`; each cover carries `data-wk-lightbox` (inert data
// attrs in both renderers — zero pixels; only the published asset binds the overlay).
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries `data-sid`
// + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_GALLERY_STRIP_STYLES } from './styles';
import type { WorkGalleryContent, WorkGalleryGroup } from './WorkGalleryGrid.core';

const GROUP_PH = <div className="wk-gallery-strip__ph" aria-hidden="true">Cover</div>;

export function WorkGalleryStripCore({
  content, E, sectionId,
}: { content: WorkGalleryContent; E: WorkPrimitives; sectionId: string }) {
  const groups = content.groups || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_GALLERY_STRIP_STYLES }} />
      <section className="wk-gallery-strip" data-sid={sectionId} data-section-id={sectionId}
        data-wk-gallery-strip="" data-wk-gallery-lightbox="">
        <div className="wk-gallery-strip__in">
          <div className="wk-gallery-strip__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-gallery-strip__eyebrow" placeholder="Selected work" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-gallery-strip__heading" placeholder="The work" />
            <E.Txt elementKey="lead" value={content.lead} as="p"
              className="wk-gallery-strip__lead" multiline placeholder="A cut of recent commissions." />
          </div>

          <E.List collectionKey="groups" items={groups} className="wk-gallery-strip__grid"
            itemClassName="wk-gallery-strip__group"
            makeItem={() => ({ name: '', cover_image: '', href: '' })} min={1} max={12} addLabel="+ Group"
            render={(item: WorkGalleryGroup) => (
              <E.Link hrefKey={`groups.${item.id}.href`} href={item.href || '#work'} className="wk-gallery-strip__link">
                <span className="wk-gallery-strip__media" data-wk-lightbox="">
                  <E.Img elementKey={`groups.${item.id}.cover_image`} src={item.cover_image} alt={item.name}
                    className="wk-gallery-strip__img" placeholder={GROUP_PH} />
                </span>
                <E.Txt elementKey={`groups.${item.id}.name`} value={item.name} as="span"
                  className="wk-gallery-strip__name" placeholder="Group name" />
              </E.Link>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default WorkGalleryStripCore;
