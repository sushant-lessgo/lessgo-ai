// src/modules/cms/render/CollectionDetail.published.tsx
//
// CMS item detail block — PUBLISHED twin. Server-safe: no 'use client', no hooks,
// no store, flat props. Imports ONLY the shared core + plain modules (the
// published/client boundary law — importing anything 'use client' here yields the
// classic "F is not a function" 500 at static-export time).
//
// ⚠️ It therefore imports `makeCmsPublishedPrimitives` from
// `CollectionSection.published` (a plain module), NEVER the edit factory.
//
// Props arrive FLAT: `LandingPagePublishedRenderer`'s `extractContentFields`
// spreads `content[sectionId].elements` onto props, so the materialized detail
// model lands on `props[CMS_DETAIL_ELEMENT_KEY]`.

import React from 'react';
import { makeCmsPublishedPrimitives } from './CollectionSection.published';
import { CollectionDetailCore } from './CollectionDetail.core';
import { CMS_DETAIL_ELEMENT_KEY, type CmsDetailModel } from './toRenderModel';

/** An empty-but-valid detail model: a deleted item renders an empty page rather
 *  than failing the publish. */
export const EMPTY_CMS_DETAIL_MODEL: CmsDetailModel = {
  collectionId: '',
  collectionName: '',
  collectionRef: '',
  roles: { title: null, cover: null, primaryCta: null },
  item: { itemId: '', itemRef: '', fields: [] },
};

interface Props {
  sectionId: string;
  /** The materialized detail model. Key MUST equal CMS_DETAIL_ELEMENT_KEY. */
  cmsItem?: CmsDetailModel;
  [key: string]: any;
}

export default function CollectionDetailPublished(props: Props) {
  const E = makeCmsPublishedPrimitives();
  const model = (props[CMS_DETAIL_ELEMENT_KEY] as CmsDetailModel) || EMPTY_CMS_DETAIL_MODEL;
  return <CollectionDetailCore model={model} E={E} sectionId={props.sectionId} />;
}
