// WorkHeader — PUBLISHED wrapper (~10 lines, server-safe). Flat props → static
// primitives → shared core. All layout/markup lives in WorkHeader.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkHeaderCore, type WorkHeaderContent } from './WorkHeader.core';

interface Props extends WorkHeaderContent {
  sectionId: string;
  content?: any;
}

export default function WorkHeaderPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkHeaderCore content={props} E={E} sectionId={props.sectionId} />;
}
