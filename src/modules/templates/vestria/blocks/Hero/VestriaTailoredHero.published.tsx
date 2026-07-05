// Vestria Hero — PUBLISHED wrapper (server-safe). Layout in VestriaTailoredHero.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaTailoredHeroCore, type VestriaHeroContent } from './VestriaTailoredHero.core';

interface Props extends VestriaHeroContent {
  sectionId: string;
  content?: any;
}

export default function VestriaTailoredHeroPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaTailoredHeroCore content={props} E={E} />;
}
