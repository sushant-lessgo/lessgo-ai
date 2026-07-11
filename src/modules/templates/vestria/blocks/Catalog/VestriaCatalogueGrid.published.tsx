// Vestria Catalogue — PUBLISHED wrapper (server-safe). Layout in VestriaCatalogueGrid.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaCatalogueGridCore, type VestriaCatalogueContent } from './VestriaCatalogueGrid.core';

interface Props extends VestriaCatalogueContent {
  sectionId: string;
  content?: any;
  // editor phase-3 (phase 6): the published renderer spreads the section's
  // elementMetadata into block props (LandingPagePublishedRenderer.extractContentFields).
  // Forward it into the factory so published E.Img resolves per-item alt.
  elementMetadata?: Record<string, { alt?: string | Record<string, string> }>;
}

export default function VestriaCatalogueGridPublished(props: Props) {
  const E = makePublishedPrimitives({ elementMetadata: props.elementMetadata });
  return <VestriaCatalogueGridCore content={props} E={E} />;
}
