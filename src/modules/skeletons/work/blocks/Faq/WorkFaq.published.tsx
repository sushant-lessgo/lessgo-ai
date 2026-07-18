// WorkFaq — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. Layout lives in WorkFaq.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkFaqCore, type WorkFaqContent } from './WorkFaq.core';

interface Props extends WorkFaqContent {
  sectionId: string;
  content?: any;
}

export default function WorkFaqPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkFaqCore content={props} E={E} sectionId={props.sectionId} />;
}
