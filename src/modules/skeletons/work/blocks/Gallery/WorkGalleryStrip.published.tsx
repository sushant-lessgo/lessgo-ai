// WorkGalleryStrip — PUBLISHED wrapper (server-safe). Flat props → static
// primitives → shared core. NO edit-only affordances.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkGalleryStripCore } from './WorkGalleryStrip.core';
import type { WorkGalleryContent } from './WorkGalleryGrid.core';

interface Props extends WorkGalleryContent {
  sectionId: string;
  content?: any;
}

export default function WorkGalleryStripPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkGalleryStripCore content={props} E={E} sectionId={props.sectionId} />;
}
