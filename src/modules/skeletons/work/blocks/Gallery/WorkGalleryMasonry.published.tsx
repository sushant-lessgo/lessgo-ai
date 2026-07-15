// WorkGalleryMasonry — PUBLISHED wrapper (server-safe). Flat props → static
// primitives → shared core. NO edit-only affordances.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkGalleryMasonryCore } from './WorkGalleryMasonry.core';
import type { WorkGalleryContent } from './WorkGalleryGrid.core';

interface Props extends WorkGalleryContent {
  sectionId: string;
  content?: any;
}

export default function WorkGalleryMasonryPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkGalleryMasonryCore content={props} E={E} sectionId={props.sectionId} />;
}
