// WorkHeroCenter — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. Layout lives in WorkHeroCenter.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkHeroCenterCore } from './WorkHeroCenter.core';
import type { WorkHeroSliderContent } from './WorkHeroSlider.core';

interface Props extends WorkHeroSliderContent {
  sectionId: string;
  content?: any;
}

export default function WorkHeroCenterPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkHeroCenterCore content={props} E={E} sectionId={props.sectionId} />;
}
