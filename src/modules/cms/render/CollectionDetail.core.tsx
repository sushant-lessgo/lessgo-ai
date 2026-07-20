// src/modules/cms/render/CollectionDetail.core.tsx
//
// SINGLE-SOURCE layout for a CMS item DETAIL page. PLAIN server-safe module — no
// 'use client', no hooks, no store. Same contract as CollectionSection.core: the
// layout lives here ONCE and renders through injected primitives `E`, so the edit
// twin and the published twin are identical trees by construction.
//
// The data is a `CmsDetailModel` — a pure SELECTOR over the very same
// `CmsRenderModel` the listing renders (`toDetailModel`), so a card and its
// detail page can never disagree about an item.
//
// Layout: cover large → title h1 → remaining fields in schema order → primaryCta.
// Field markup is emitted by the SHARED `FieldNode` from CollectionSection.core —
// dispatching types a second time here would be a second markup source.
//
// Self-sets `data-surface="neutral"`; shared blocks resolve before template
// dispatch and never call getSurfaceForSection.
//
// NOTE (plan Deviations #3): detail pages are NOT previewable in the editor in
// v1 — the publish materializer is their sole author. The edit twin exists for
// registry symmetry and the parity gate.

import React from 'react';
import type { CmsPrimitives } from './primitives';
import { FieldNode, CMS_COLLECTION_STYLES } from './CollectionSection.core';
import {
  fieldById,
  nonRoleFields,
  coverSrc,
  type CmsDetailModel,
} from './toRenderModel';
import type { LinkValue } from '../types';

/** Detail-only styles. The `lg-cms__*` field classes come from the shared listing
 *  stylesheet, which this block also emits — one style source, no drift. */
export const CMS_DETAIL_STYLES = `
.lg-cmsd{padding:var(--section-py,64px) 20px;}
.lg-cmsd__in{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:20px;}
.lg-cmsd__cover{display:block;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:var(--radius-md,8px);background:rgba(0,0,0,.05);}
.lg-cmsd__cover img{width:100%;height:100%;object-fit:cover;display:block;}
.lg-cmsd__title{font-size:36px;line-height:1.15;margin:0;}
.lg-cmsd__fields{display:flex;flex-direction:column;gap:16px;}
.lg-cmsd__field{display:flex;flex-direction:column;gap:6px;}
.lg-cmsd__label{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.55;}
.lg-cmsd__empty{font-size:14px;opacity:.55;}
`;

export interface CollectionDetailCoreProps {
  model: CmsDetailModel;
  E: CmsPrimitives;
  sectionId: string;
}

export function CollectionDetailCore({ model, E, sectionId }: CollectionDetailCoreProps) {
  const { item, roles } = model;
  const cover = fieldById(item, roles.cover);
  const title = fieldById(item, roles.title);
  const cta = fieldById(item, roles.primaryCta);
  const src = coverSrc(cover);
  const rest = nonRoleFields(item, roles);
  const hasAnything = !!(src || title || cta || rest.length);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CMS_COLLECTION_STYLES + CMS_DETAIL_STYLES }} />
      <section
        className="lg-cmsd"
        data-surface="neutral"
        data-sid={sectionId}
        data-section-id={sectionId}
        data-cms-collection={model.collectionRef}
        data-cms-item={item.itemRef}
      >
        <div className="lg-cmsd__in" data-cms-detail-body="">
          {src ? (
            <E.Img
              src={src}
              alt={(title?.value as string) || ''}
              className="lg-cmsd__cover"
              eager
            />
          ) : null}
          {title ? (
            <E.Txt value={title.value as string} as="h1" className="lg-cmsd__title" />
          ) : null}
          {rest.length ? (
            <div className="lg-cmsd__fields">
              {rest.map((f) => (
                <div className="lg-cmsd__field" key={f.fieldId} data-cms-field={f.fieldType}>
                  {/* Full-page view labels each field; the compact card does not. */}
                  <E.Txt value={f.name} as="span" className="lg-cmsd__label" />
                  <FieldNode field={f} E={E} />
                </div>
              ))}
            </div>
          ) : null}
          {cta ? (
            <E.Link
              href={(cta.value as LinkValue).url}
              className="lg-cms__cta"
              isPrimaryCta
            >
              {(cta.value as LinkValue).label || cta.name}
            </E.Link>
          ) : null}
          {hasAnything ? null : <p className="lg-cmsd__empty">Nothing here yet.</p>}
        </div>
      </section>
    </>
  );
}

export default CollectionDetailCore;
