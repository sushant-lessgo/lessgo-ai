// Vestria Services — PUBLISHED wrapper (server-safe). Layout in VestriaServicesGrid.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaServicesGridCore, type VestriaServicesContent } from './VestriaServicesGrid.core';

interface Props extends VestriaServicesContent {
  sectionId: string;
  content?: any;
}

export default function VestriaServicesGridPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaServicesGridCore content={props} E={E} />;
}
