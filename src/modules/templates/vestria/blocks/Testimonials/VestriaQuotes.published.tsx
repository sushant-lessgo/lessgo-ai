// Vestria Testimonials — PUBLISHED wrapper (server-safe). Layout in VestriaQuotes.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaQuotesCore, type VestriaQuotesContent } from './VestriaQuotes.core';

interface Props extends VestriaQuotesContent {
  sectionId: string;
  content?: any;
}

export default function VestriaQuotesPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaQuotesCore content={props} E={E} />;
}
