// src/modules/skeletons/work/blocks/WorkDetail/WorkDetail.core.tsx
// SINGLE-SOURCE work-detail layout (granth .core pattern). PLAIN server-safe
// module — layout lives here once, renders through injected primitives `E`.
//
// Binds the FROZEN work-core `workdetail` contract (workElementContract.workdetail,
// COLLECTIONS.works.itemSectionType) — the `/works/<slug>` project-story page:
//   scalars — name (title) · client · problem · result (carry-only, may be empty)
//   collection — photos[] { id, url, alt, cover } (a FLAT photo list — correct HERE)
//
// ⚠️ Photos ARE a flat list on THIS surface. The group-references-only invariant
// (galleryGroups.test.tsx) is the HOME GALLERY's, NOT the detail page's — the
// gallery keeps only cover references; the real photos of a group land here. The
// COVER photo (cover:true, else the first) is rendered FIRST.
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries
// `data-sid` (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_DETAIL_STYLES } from './styles';

export interface WorkDetailPhoto { id: string; url?: string; alt?: string; cover?: boolean }

export interface WorkDetailContent {
  name?: string;
  client?: string;
  problem?: string;
  result?: string;
  photos?: WorkDetailPhoto[];
}

const PHOTO_PH = <div className="wk-detail__ph" aria-hidden="true">Photo</div>;

/** Cover-first ordering (stable): the cover photo leads; the rest keep order. */
function coverFirst(photos: WorkDetailPhoto[]): WorkDetailPhoto[] {
  const i = photos.findIndex((p) => p.cover);
  if (i <= 0) return photos;
  return [photos[i], ...photos.slice(0, i), ...photos.slice(i + 1)];
}

export function WorkDetailCore({
  content, E, sectionId,
}: { content: WorkDetailContent; E: WorkPrimitives; sectionId: string }) {
  const photos = coverFirst(content.photos || []);
  const hasStrip = !!(content.client || content.problem || content.result);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_DETAIL_STYLES }} />
      <section className="wk-detail" data-sid={sectionId} data-section-id={sectionId} data-wk-detail="">
        <div className="wk-detail__in">
          <div className="wk-detail__head">
            <E.Txt elementKey="name" value={content.name} as="h1"
              className="wk-detail__title" placeholder="Project name" />

            {hasStrip && (
              <div className="wk-detail__meta">
                <div className="wk-detail__meta-row">
                  <span className="wk-detail__meta-label" aria-hidden="true">Client</span>
                  <E.Txt elementKey="client" value={content.client} as="span"
                    className="wk-detail__meta-value" placeholder="Client" />
                </div>
                <div className="wk-detail__meta-row">
                  <span className="wk-detail__meta-label" aria-hidden="true">The brief</span>
                  <E.Txt elementKey="problem" value={content.problem} as="span"
                    className="wk-detail__meta-value" multiline placeholder="The ask" />
                </div>
                <div className="wk-detail__meta-row">
                  <span className="wk-detail__meta-label" aria-hidden="true">The outcome</span>
                  <E.Txt elementKey="result" value={content.result} as="span"
                    className="wk-detail__meta-value" multiline placeholder="The outcome" />
                </div>
              </div>
            )}
          </div>

          <E.List collectionKey="photos" items={photos} className="wk-detail__grid"
            itemClassName="wk-detail__cell"
            makeItem={() => ({ url: '', alt: '', cover: false })} min={0} max={24} addLabel="+ Photo"
            render={(item: WorkDetailPhoto) => (
              <E.Img elementKey={`photos.${item.id}.url`} src={item.url} alt={item.alt}
                className="wk-detail__media" placeholder={PHOTO_PH} />
            )}
          />
        </div>
      </section>
    </>
  );
}

export default WorkDetailCore;
