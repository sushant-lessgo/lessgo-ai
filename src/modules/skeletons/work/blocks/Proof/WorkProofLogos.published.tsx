// WorkProofLogos — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. Layout lives in WorkProofLogos.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkProofLogosCore, type WorkProofLogosContent } from './WorkProofLogos.core';

interface Props extends WorkProofLogosContent {
  sectionId: string;
  content?: any;
}

export default function WorkProofLogosPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkProofLogosCore content={props} E={E} sectionId={props.sectionId} />;
}
