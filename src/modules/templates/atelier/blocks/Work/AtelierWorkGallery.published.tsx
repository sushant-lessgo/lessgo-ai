// Atelier Work/Gallery — PUBLISHED wrapper (server-safe). Layout in the core.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { AtelierWorkGalleryCore, type AtelierWorkContent } from './AtelierWorkGallery.core';

interface Props extends AtelierWorkContent {
  sectionId: string;
  content?: any;
}

export default function AtelierWorkGalleryPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <AtelierWorkGalleryCore content={props} E={E} />;
}
