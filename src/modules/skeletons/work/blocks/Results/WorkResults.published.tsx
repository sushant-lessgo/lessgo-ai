// WorkResults — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. Layout lives in WorkResults.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkResultsCore, type WorkResultsContent } from './WorkResults.core';

interface Props extends WorkResultsContent {
  sectionId: string;
  content?: any;
}

export default function WorkResultsPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkResultsCore content={props} E={E} sectionId={props.sectionId} />;
}
