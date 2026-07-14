// src/modules/templates/atelier/blocks/Work/AtelierWorkGallery.core.tsx
// SINGLE-SOURCE work/gallery showcase — the `gallery` capability's evidence
// section (templateMeta.capabilitySections.gallery = 'work'). PLAIN server-safe
// module. Ported from the approved design (index.html HOME mosaic + work.html
// masonry; atl-* → lg-atelier-).
//
// TWO MODES, one `works` collection (id/title/caption/image; caption = category):
//   - default (home teaser): `.lg-atelier-mosaic` 6-col dense grid, spans by
//     :nth-child so no per-item class is needed (works with the shared collection
//     primitive) + a "view full portfolio" more-link.
//   - content.mode === 'gallery' (work page): `.lg-atelier-gallery` CSS-columns
//     masonry with per-cell title + category caption.
// Images flow through the block's `works` collection via E.List (reorderable +
// imageField) so add / remove / reorder + bulk upload reuse EditableImageCollection.
//
// PORT DEVIATION (logged in audit): the design's work-page CSS radio FILTER is not
// wired — the shared collection primitive exposes no per-item `data-cat` attribute
// hook, and adding one is outside 9b's files-touched. Enabling it needs a primitive
// enhancement (flag for phase 11/12). The masonry gallery ships without the filter.

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { WORK_STYLES } from './styles';

export interface AtelierWorkItem { id: string; title?: string; caption?: string; image?: string }

export interface AtelierWorkContent {
  eyebrow?: string;
  headline?: string;
  lede?: string;
  works?: AtelierWorkItem[];
  /** optional "view full portfolio" more-link (home teaser only). */
  more_text?: string;
  more_href?: string;
  /** 'gallery' = work-page masonry; default (undefined) = home mosaic teaser. */
  mode?: 'gallery';
}

export function AtelierWorkGalleryCore({ content, E }: { content: AtelierWorkContent; E: AtelierPrimitives }) {
  const works = content.works || [];
  const gallery = content.mode === 'gallery';

  const header = (
    <>
      <div className="lg-atelier-rule">
        {content.eyebrow !== undefined && (
          <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-rule__idx" placeholder="01" />
        )}
        <E.Txt elementKey="headline" value={content.headline} as="h2" className="lg-atelier-heading" placeholder="Selected work" />
        {content.lede !== undefined && (
          <E.Txt elementKey="lede" value={content.lede} as="span" className="lg-atelier-rule__meta" placeholder="A short cut of recent commissions" />
        )}
      </div>
    </>
  );

  if (gallery) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: WORK_STYLES }} />
        <div className="lg-atelier-wrap lg-atelier-pad">
          {header}
          <E.List
            collectionKey="works"
            items={works}
            className="lg-atelier-gallery"
            itemClassName="lg-atelier-gcell"
            makeItem={() => ({ title: '', caption: '', image: '' })}
            min={1}
            max={12}
            addLabel="+ Work"
            reorderable
            imageField="image"
            render={(item: AtelierWorkItem) => (
              <>
                <div className="lg-atelier-gcell__media">
                  <E.Img elementKey={`works.${item.id}.image`} src={item.image} alt={item.title || 'work'}
                    className="lg-atelier-gcell__img" imgClassName=""
                    placeholder={<div className="lg-atelier-ph"><span>Work image</span></div>} />
                </div>
                <div className="lg-atelier-gcap">
                  <E.Txt elementKey={`works.${item.id}.title`} value={item.title} as="span" className="lg-atelier-gcap__t" placeholder="Project title" />
                  <E.Txt elementKey={`works.${item.id}.caption`} value={item.caption} as="span" className="lg-atelier-gcap__c" placeholder="Category" />
                </div>
              </>
            )}
          />
        </div>
      </>
    );
  }

  // ── HOME mosaic teaser ──────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad">
        {header}
        <E.List
          collectionKey="works"
          items={works}
          className="lg-atelier-mosaic"
          itemClassName="lg-atelier-cell"
          makeItem={() => ({ title: '', caption: '', image: '' })}
          min={1}
          max={12}
          addLabel="+ Work"
          reorderable
          imageField="image"
          render={(item: AtelierWorkItem) => (
            <>
              <div className="lg-atelier-cell__media">
                <E.Img elementKey={`works.${item.id}.image`} src={item.image} alt={item.title || 'work'}
                  className="lg-atelier-cell__img" imgClassName=""
                  placeholder={<div className="lg-atelier-ph"><span>Work image</span></div>} />
              </div>
              {/* title kept for semantics/SEO; the design mosaic surfaces only the category cap */}
              <E.Txt elementKey={`works.${item.id}.title`} value={item.title} as="span" className="lg-atelier-vh" placeholder="" />
              <E.Txt elementKey={`works.${item.id}.caption`} value={item.caption} as="span" className="lg-atelier-cap" placeholder="Category" />
            </>
          )}
        />
        <div className="lg-atelier-more">
          <E.Link hrefKey="more_href" href={content.more_href || '#work'} className="lg-atelier-qlink">
            <E.Txt elementKey="more_text" value={content.more_text} as="span" placeholder="View the full portfolio →" />
          </E.Link>
        </div>
      </div>
    </>
  );
}

export default AtelierWorkGalleryCore;
