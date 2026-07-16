// src/modules/skeletons/work/blocks/Gallery/WorkGalleryGrid.core.tsx
// SINGLE-SOURCE work-gallery layout (granth .core pattern). PLAIN server-safe
// module — layout lives here once, renders through injected primitives `E`.
//
// Binds the FROZEN work-core `work` contract (workElementContract.work):
//   scalars — eyebrow · heading · lead
//   collection — groups[] { id, name, cover_image, href }
//
// ⚠️ AC L120 — this renders GROUP REFERENCES ONLY (each group's cover image +
// name, linking to the group). It NEVER embeds a flat photo list: the frozen
// contract keeps photos in the `works` collection (COLLECTIONS.works), NOT here.
// The gallery seeds only the group frame; individual photos are managed elsewhere
// (the library board — the edit-only "manage photos" link, injected by the wrapper).
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries
// `data-sid` (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_GALLERY_STYLES } from './styles';

export interface WorkGalleryGroup { id: string; name?: string; cover_image?: string; href?: string }

export interface WorkGalleryContent {
  eyebrow?: string;
  heading?: string;
  lead?: string;
  groups?: WorkGalleryGroup[];
}

const GROUP_PH = <div className="wk-gallery__ph" aria-hidden="true">Cover</div>;

export function WorkGalleryGridCore({
  content, E, sectionId, manageSlot,
}: {
  content: WorkGalleryContent; E: WorkPrimitives; sectionId: string;
  /** Edit-only "manage photos" affordance (injected by the .tsx wrapper). */
  manageSlot?: React.ReactNode;
}) {
  const groups = content.groups || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_GALLERY_STYLES }} />
      <section className="wk-gallery" data-sid={sectionId} data-section-id={sectionId} data-wk-gallery-grid="">
        <div className="wk-gallery__in">
          <div className="wk-gallery__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-gallery__eyebrow" placeholder="Selected work" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-gallery__heading" placeholder="The work" />
            <E.Txt elementKey="lead" value={content.lead} as="p"
              className="wk-gallery__lead" multiline placeholder="A cut of recent commissions." />
          </div>

          <E.List collectionKey="groups" items={groups} className="wk-gallery__grid"
            itemClassName="wk-gallery__group"
            makeItem={() => ({ name: '', cover_image: '', href: '' })} min={1} max={12} addLabel="+ Group"
            render={(item: WorkGalleryGroup) => (
              <E.Link hrefKey={`groups.${item.id}.href`} href={item.href || '#work'} className="wk-gallery__link">
                <E.Img elementKey={`groups.${item.id}.cover_image`} src={item.cover_image} alt={item.name}
                  className="wk-gallery__media" placeholder={GROUP_PH} />
                <E.Txt elementKey={`groups.${item.id}.name`} value={item.name} as="span"
                  className="wk-gallery__name" placeholder="Group name" />
              </E.Link>
            )}
          />

          {manageSlot}
        </div>
      </section>
    </>
  );
}

export default WorkGalleryGridCore;
