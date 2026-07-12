// Atelier Header — PUBLISHED wrapper (server-safe). Layout in AtelierNavHeader.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { AtelierNavHeaderCore, type AtelierHeaderContent } from './AtelierNavHeader.core';

interface Props extends AtelierHeaderContent {
  sectionId: string;
  content?: any;
}

export default function AtelierNavHeaderPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <AtelierNavHeaderCore content={props} E={E} />;
}
