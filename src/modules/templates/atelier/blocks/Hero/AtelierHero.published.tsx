// Atelier Hero — PUBLISHED wrapper (server-safe). Layout in AtelierHero.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { AtelierHeroCore, type AtelierHeroContent } from './AtelierHero.core';

interface Props extends AtelierHeroContent {
  sectionId: string;
  content?: any;
}

export default function AtelierHeroPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <AtelierHeroCore content={props} E={E} />;
}
