// Vestria Industries — PUBLISHED wrapper (server-safe). Layout in VestriaIndustriesGrid.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaIndustriesGridCore, type VestriaIndustriesContent } from './VestriaIndustriesGrid.core';

interface Props extends VestriaIndustriesContent {
  sectionId: string;
  content?: any;
}

export default function VestriaIndustriesGridPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaIndustriesGridCore content={props} E={E} />;
}
