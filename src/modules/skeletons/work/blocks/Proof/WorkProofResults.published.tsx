// WorkProofResults — PUBLISHED wrapper (server-safe). Flat props → static
// primitives → shared core. Layout lives in WorkProofResults.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkProofResultsCore, type WorkProofResultsContent } from './WorkProofResults.core';

interface Props extends WorkProofResultsContent {
  sectionId: string;
  content?: any;
}

export default function WorkProofResultsPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkProofResultsCore content={props} E={E} sectionId={props.sectionId} />;
}
