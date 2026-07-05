// Vestria Footer — PUBLISHED wrapper (server-safe). Layout in VestriaFooter.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaFooterCore, type VestriaFooterContent } from './VestriaFooter.core';

interface Props extends VestriaFooterContent {
  sectionId: string;
  content?: any;
}

export default function VestriaFooterPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaFooterCore content={props} E={E} />;
}
