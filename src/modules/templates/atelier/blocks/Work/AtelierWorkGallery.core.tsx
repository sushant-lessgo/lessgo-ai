// src/modules/templates/atelier/blocks/Work/AtelierWorkGallery.core.tsx
// SINGLE-SOURCE work/gallery showcase — the `gallery` capability's evidence
// section (templateMeta.capabilitySections.gallery = 'work'). PLAIN server-safe
// module. Provisional grid; the reorderable image collection is wired via E.List
// (imageField 'image'), so add/remove/reorder + bulk upload work in edit.

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { WORK_STYLES } from './styles';

export interface AtelierWorkItem { id: string; title?: string; caption?: string; image?: string }

export interface AtelierWorkContent {
  eyebrow?: string;
  headline?: string;
  lede?: string;
  works?: AtelierWorkItem[];
}

export function AtelierWorkGalleryCore({ content, E }: { content: AtelierWorkContent; E: AtelierPrimitives }) {
  const works = content.works || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad">
        <div className="lg-atelier-eyebrow-block">
          {content.eyebrow !== undefined && (
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-tag" placeholder="Work" />
          )}
          <E.Txt elementKey="headline" value={content.headline} as="h2" className="lg-atelier-heading lg-atelier-h2" placeholder="Selected work" />
          <E.Txt elementKey="lede" value={content.lede} as="p" className="lg-atelier-lede" placeholder="" multiline />
        </div>
        <E.List
          collectionKey="works"
          items={works}
          className="lg-atelier-work__grid"
          itemClassName="lg-atelier-work__item"
          makeItem={() => ({ title: '', caption: '', image: '' })}
          min={1}
          max={12}
          addLabel="+ Work"
          reorderable
          imageField="image"
          captionField="caption"
          render={(item: AtelierWorkItem) => (
            <>
              <div className="lg-atelier-work__media">
                <E.Img elementKey={`works.${item.id}.image`} src={item.image} alt={item.title || 'work'}
                  className="lg-atelier-work__mediaWrap" imgClassName=""
                  placeholder={<div className="lg-atelier-ph"><span>Image</span></div>} />
              </div>
              <E.Txt elementKey={`works.${item.id}.title`} value={item.title} as="p" className="lg-atelier-work__title" placeholder="Title" />
              <E.Txt elementKey={`works.${item.id}.caption`} value={item.caption} as="p" className="lg-atelier-work__caption" placeholder="Caption" />
            </>
          )}
        />
      </div>
    </>
  );
}

export default AtelierWorkGalleryCore;
