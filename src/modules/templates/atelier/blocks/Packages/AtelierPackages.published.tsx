// Atelier Packages — PUBLISHED wrapper (server-safe). Layout in the core.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { AtelierPackagesCore, type AtelierPackagesContent } from './AtelierPackages.core';

interface Props extends AtelierPackagesContent {
  sectionId: string;
  content?: any;
}

export default function AtelierPackagesPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <AtelierPackagesCore content={props} E={E} />;
}
