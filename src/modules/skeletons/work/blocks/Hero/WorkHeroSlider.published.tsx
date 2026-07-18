// WorkHeroSlider — PUBLISHED wrapper (~10 lines, server-safe). Flat props → static
// primitives → shared core. All layout/markup lives in WorkHeroSlider.core.tsx.
// Static first-slide markup; the slider behavior is added at runtime by
// work.v1.js (phase 5) and degrades to this state.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkHeroSliderCore, type WorkHeroSliderContent } from './WorkHeroSlider.core';

interface Props extends WorkHeroSliderContent {
  sectionId: string;
  content?: any;
}

export default function WorkHeroSliderPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkHeroSliderCore content={props} E={E} sectionId={props.sectionId} />;
}
