// Vestria Catalogue — PUBLISHED wrapper (server-safe). Layout in VestriaCatalogueGrid.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaCatalogueGridCore, type VestriaCatalogueContent } from './VestriaCatalogueGrid.core';

interface Props extends VestriaCatalogueContent {
  sectionId: string;
  content?: any;
}

export default function VestriaCatalogueGridPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaCatalogueGridCore content={props} E={E} />;
}
