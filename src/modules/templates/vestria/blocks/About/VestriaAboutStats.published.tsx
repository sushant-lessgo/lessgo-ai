// Vestria About — PUBLISHED wrapper (server-safe). Layout in VestriaAboutStats.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaAboutStatsCore, type VestriaAboutContent } from './VestriaAboutStats.core';

interface Props extends VestriaAboutContent {
  sectionId: string;
  content?: any;
}

export default function VestriaAboutStatsPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaAboutStatsCore content={props} E={E} />;
}
