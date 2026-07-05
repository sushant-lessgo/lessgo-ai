// Granth Praise — PUBLISHED wrapper (server-safe). Layout in GranthPraise.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { GranthPraiseCore, type GranthPraiseContent } from './GranthPraise.core';

interface Props extends GranthPraiseContent {
  sectionId: string;
  content?: any;
}

export default function GranthPraisePublished(props: Props) {
  const E = makePublishedPrimitives();
  return <GranthPraiseCore content={props} E={E} />;
}
