// Vestria Materials — PUBLISHED wrapper (server-safe). Layout in VestriaMaterials.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaMaterialsCore, type VestriaMaterialsContent } from './VestriaMaterials.core';

interface Props extends VestriaMaterialsContent {
  sectionId: string;
  content?: any;
}

export default function VestriaMaterialsPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaMaterialsCore content={props} E={E} />;
}
