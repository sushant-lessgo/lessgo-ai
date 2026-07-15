// WorkAbout — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. Layout lives in WorkAbout.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkAboutCore, type WorkAboutContent } from './WorkAbout.core';

interface Props extends WorkAboutContent {
  sectionId: string;
  content?: any;
}

export default function WorkAboutPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkAboutCore content={props} E={E} sectionId={props.sectionId} />;
}
