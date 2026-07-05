// Granth Writing — PUBLISHED wrapper (server-safe). Layout in GranthWriting.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { GranthWritingCore, type GranthWritingContent } from './GranthWriting.core';

interface Props extends GranthWritingContent {
  sectionId: string;
  content?: any;
}

export default function GranthWritingPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <GranthWritingCore content={props} E={E} />;
}
