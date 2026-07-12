// Atelier Contact — PUBLISHED wrapper (server-safe). Layout in the core.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { AtelierContactCore, type AtelierContactContent } from './AtelierContact.core';

interface Props extends AtelierContactContent {
  sectionId: string;
  content?: any;
}

export default function AtelierContactPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <AtelierContactCore content={props} E={E} />;
}
