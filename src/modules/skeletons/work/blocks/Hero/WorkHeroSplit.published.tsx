// WorkHeroSplit — PUBLISHED wrapper (server-safe). Flat props → static primitives →
// shared core. Layout lives in WorkHeroSplit.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkHeroSplitCore } from './WorkHeroSplit.core';
import type { WorkHeroSliderContent } from './WorkHeroSlider.core';

interface Props extends WorkHeroSliderContent {
  sectionId: string;
  content?: any;
  /** section-background phase 3: THIS section's style tokens (`styleTokens[sectionId]`,
   *  passed by LandingPagePublishedRenderer). `bgMode:'color'` omits the media COLUMN
   *  and collapses the grid to one column (`.wk-hero-split--no-media`). */
  styleTokens?: { bgMode?: string } | null;
  /** Direct fallback for stages that pass flat props only (the parity stage). */
  bgMode?: string;
}

export default function WorkHeroSplitPublished(props: Props) {
  const E = makePublishedPrimitives();
  const bgMode = props.styleTokens?.bgMode ?? props.bgMode;
  return <WorkHeroSplitCore content={props} E={E} sectionId={props.sectionId} bgMode={bgMode} />;
}
