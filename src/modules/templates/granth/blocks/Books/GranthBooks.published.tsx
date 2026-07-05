// Granth Books — PUBLISHED wrapper (server-safe). Layout in GranthBooks.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { GranthBooksCore, type GranthBooksContent } from './GranthBooks.core';

interface Props extends GranthBooksContent {
  sectionId: string;
  content?: any;
}

export default function GranthBooksPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <GranthBooksCore content={props} E={E} />;
}
