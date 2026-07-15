// WorkPackages — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. Layout lives in WorkPackages.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkPackagesCore, type WorkPackagesContent } from './WorkPackages.core';

interface Props extends WorkPackagesContent {
  sectionId: string;
  content?: any;
}

export default function WorkPackagesPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkPackagesCore content={props} E={E} sectionId={props.sectionId} />;
}
