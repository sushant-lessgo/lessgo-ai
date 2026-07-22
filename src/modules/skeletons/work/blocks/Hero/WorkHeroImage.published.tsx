// WorkHeroImage — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. All layout/markup lives in WorkHeroImage.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkHeroImageCore } from './WorkHeroImage.core';
import type { WorkHeroSliderContent } from './WorkHeroSlider.core';

interface Props extends WorkHeroSliderContent {
  sectionId: string;
  content?: any;
  /** section-background phase 3: THIS section's style tokens (`styleTokens[sectionId]`,
   *  passed by LandingPagePublishedRenderer). `bgMode:'color'` drops media + scrim. */
  styleTokens?: { bgMode?: string } | null;
  /** Direct fallback for stages that pass flat props only (the parity stage). */
  bgMode?: string;
}

export default function WorkHeroImagePublished(props: Props) {
  const E = makePublishedPrimitives();
  const bgMode = props.styleTokens?.bgMode ?? props.bgMode;
  return <WorkHeroImageCore content={props} E={E} sectionId={props.sectionId} bgMode={bgMode} />;
}
