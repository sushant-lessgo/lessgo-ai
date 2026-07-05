// Vestria Header — PUBLISHED wrapper (server-safe). Layout in VestriaNavHeader.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaNavHeaderCore, type VestriaHeaderContent } from './VestriaNavHeader.core';

interface Props extends VestriaHeaderContent {
  sectionId: string;
  content?: any;
}

export default function VestriaNavHeaderPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaNavHeaderCore content={props} E={E} />;
}
