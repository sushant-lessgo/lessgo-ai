// WorkCatalog — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. No hooks, no store — byte-identical layout to the edit wrapper.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkCatalogCore, type WorkCatalogContent } from './WorkCatalog.core';

interface Props extends WorkCatalogContent {
  sectionId: string;
  content?: any;
}

export default function WorkCatalogPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkCatalogCore content={props} E={E} sectionId={props.sectionId} />;
}
