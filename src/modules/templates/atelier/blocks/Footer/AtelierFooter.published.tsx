// Atelier Footer — PUBLISHED wrapper (server-safe). Layout in the core.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { AtelierFooterCore, type AtelierFooterContent } from './AtelierFooter.core';

interface Props extends AtelierFooterContent {
  sectionId: string;
  content?: any;
}

export default function AtelierFooterPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <AtelierFooterCore content={props} E={E} />;
}
