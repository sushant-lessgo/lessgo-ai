// Vestria Trust — PUBLISHED wrapper (server-safe). Layout in VestriaClientStrip.core.tsx.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { VestriaClientStripCore, type VestriaTrustContent } from './VestriaClientStrip.core';

interface Props extends VestriaTrustContent {
  sectionId: string;
  content?: any;
}

export default function VestriaClientStripPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <VestriaClientStripCore content={props} E={E} />;
}
