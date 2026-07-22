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
  /** section-background phase 3: THIS section's style tokens, passed by
   *  `LandingPagePublishedRenderer` (`styleTokens[sectionId]`). Design state, not
   *  content — `bgMode:'color'` drops the media/scrim layers so the chosen surface
   *  shows through. Absent → today's exact markup. */
  styleTokens?: { bgMode?: string } | null;
  /** Direct fallback for stages that pass flat props only (the parity stage). */
  bgMode?: string;
}

export default function WorkHeroSliderPublished(props: Props) {
  const E = makePublishedPrimitives();
  const bgMode = props.styleTokens?.bgMode ?? props.bgMode;
  return <WorkHeroSliderCore content={props} E={E} sectionId={props.sectionId} bgMode={bgMode} />;
}
