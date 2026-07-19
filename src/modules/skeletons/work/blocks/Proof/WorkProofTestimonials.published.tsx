// WorkProofTestimonials — PUBLISHED wrapper (server-safe). Flat props → static
// primitives → shared core.

import React from 'react';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkProofTestimonialsCore, type WorkProofContent } from './WorkProofTestimonials.core';

interface Props extends WorkProofContent {
  sectionId: string;
  content?: any;
}

export default function WorkProofTestimonialsPublished(props: Props) {
  const E = makePublishedPrimitives();
  return <WorkProofTestimonialsCore content={props} E={E} sectionId={props.sectionId} editable={false} />;
}
