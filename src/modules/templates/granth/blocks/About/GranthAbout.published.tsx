// Granth About — PUBLISHED wrapper (server-safe). Layout in GranthAbout.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { GranthAboutCore, type GranthAboutContent } from './GranthAbout.core';

interface Props extends GranthAboutContent {
  sectionId: string;
  content?: any;
}

export default function GranthAboutPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <GranthAboutCore content={props} E={E} />;
}
