// WorkHeroImage — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. All layout/markup lives in WorkHeroImage.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkHeroImageCore } from './WorkHeroImage.core';
import type { WorkHeroSliderContent } from './WorkHeroSlider.core';

interface Props extends WorkHeroSliderContent {
  sectionId: string;
  content?: any;
}

export default function WorkHeroImagePublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkHeroImageCore content={props} E={E} sectionId={props.sectionId} />;
}
