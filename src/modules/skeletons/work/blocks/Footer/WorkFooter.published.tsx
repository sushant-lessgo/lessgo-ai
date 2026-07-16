// WorkFooter — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkFooterCore, type WorkFooterContent } from './WorkFooter.core';

interface Props extends WorkFooterContent {
  sectionId: string;
  content?: any;
}

export default function WorkFooterPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkFooterCore content={props} E={E} sectionId={props.sectionId} />;
}
