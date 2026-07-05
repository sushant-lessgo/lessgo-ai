// Vestria Process — PUBLISHED wrapper (server-safe). Layout in VestriaProcessRail.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaProcessRailCore, type VestriaProcessContent } from './VestriaProcessRail.core';

interface Props extends VestriaProcessContent {
  sectionId: string;
  content?: any;
}

export default function VestriaProcessRailPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaProcessRailCore content={props} E={E} />;
}
