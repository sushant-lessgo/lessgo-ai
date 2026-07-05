// Granth Footer — PUBLISHED wrapper (server-safe). Layout in GranthFooter.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { GranthFooterCore, type GranthFooterContent } from './GranthFooter.core';

interface Props extends GranthFooterContent {
  sectionId: string;
  content?: any;
}

export default function GranthFooterPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <GranthFooterCore content={props} E={E} />;
}
