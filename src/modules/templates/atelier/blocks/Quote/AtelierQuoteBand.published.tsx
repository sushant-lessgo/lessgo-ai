// Atelier Quote band — PUBLISHED wrapper (server-safe). Layout in the core.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { AtelierQuoteBandCore, type AtelierQuoteContent } from './AtelierQuoteBand.core';

interface Props extends AtelierQuoteContent {
  sectionId: string;
  content?: any;
}

export default function AtelierQuoteBandPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <AtelierQuoteBandCore content={props} E={E} />;
}
