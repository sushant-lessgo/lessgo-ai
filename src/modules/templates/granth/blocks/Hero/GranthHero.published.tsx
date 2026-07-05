// Granth hero — PUBLISHED wrapper (~10 lines, server-safe). Flat props → static
// primitives → shared core. All layout/markup lives in GranthHero.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { GranthHeroCore, type GranthHeroContent } from './GranthHero.core';

interface Props extends GranthHeroContent {
  sectionId: string;
  content?: any;
}

export default function GranthHeroPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <GranthHeroCore content={props} E={E} />;
}
