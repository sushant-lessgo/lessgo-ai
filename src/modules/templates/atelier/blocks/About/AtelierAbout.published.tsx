// Atelier About — PUBLISHED wrapper (server-safe). Layout in the core.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { AtelierAboutCore, type AtelierAboutContent } from './AtelierAbout.core';

interface Props extends AtelierAboutContent {
  sectionId: string;
  content?: any;
}

export default function AtelierAboutPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <AtelierAboutCore content={props} E={E} />;
}
