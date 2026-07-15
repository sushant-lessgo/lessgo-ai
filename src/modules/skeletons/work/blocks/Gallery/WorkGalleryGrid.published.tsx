// WorkGalleryGrid — PUBLISHED wrapper (server-safe). Flat props → static
// primitives → shared core. NO "manage photos" link (edit-only affordance).

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkGalleryGridCore, type WorkGalleryContent } from './WorkGalleryGrid.core';

interface Props extends WorkGalleryContent {
  sectionId: string;
  content?: any;
}

export default function WorkGalleryGridPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkGalleryGridCore content={props} E={E} sectionId={props.sectionId} />;
}
