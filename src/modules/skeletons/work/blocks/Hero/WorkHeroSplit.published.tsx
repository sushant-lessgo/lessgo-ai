// WorkHeroSplit — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. Layout lives in WorkHeroSplit.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkHeroSplitCore } from './WorkHeroSplit.core';
import type { WorkHeroSliderContent } from './WorkHeroSlider.core';

interface Props extends WorkHeroSliderContent {
  sectionId: string;
  content?: any;
}

export default function WorkHeroSplitPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkHeroSplitCore content={props} E={E} sectionId={props.sectionId} />;
}
