// WorkDetail — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. No hooks, no store — byte-identical layout to the edit wrapper.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkDetailCore, type WorkDetailContent } from './WorkDetail.core';

interface Props extends WorkDetailContent {
  sectionId: string;
  content?: any;
}

export default function WorkDetailPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkDetailCore content={props} E={E} sectionId={props.sectionId} />;
}
