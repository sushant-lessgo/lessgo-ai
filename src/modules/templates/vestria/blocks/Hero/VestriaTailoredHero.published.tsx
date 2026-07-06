// Vestria Hero — PUBLISHED wrapper (server-safe). Layout in
// VestriaTailoredHero.core.tsx / VestriaFullBleedHero.core.tsx; branches on the
// stored layout string (content[heroId].layout — the authoritative field, read
// off the full content map the published renderer passes). Default/unknown →
// tailored. Identical branch to the edit wrapper — parity.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaTailoredHeroCore, type VestriaHeroContent } from './VestriaTailoredHero.core';
import { VestriaFullBleedHeroCore, type VestriaFullBleedHeroContent } from './VestriaFullBleedHero.core';

interface Props extends VestriaFullBleedHeroContent {
  sectionId: string;
  content?: any;
}

export default function VestriaTailoredHeroPublished(props: Props) {
  const E = makePublishedPrimitives();
  const layout = props.content?.[props.sectionId]?.layout;
  const isFullBleed = layout === 'VestriaFullBleedHero';
  return isFullBleed
    ? <VestriaFullBleedHeroCore content={props} E={E} />
    : <VestriaTailoredHeroCore content={props as VestriaHeroContent} E={E} />;
}
