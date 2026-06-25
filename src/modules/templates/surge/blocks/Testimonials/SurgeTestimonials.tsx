'use client';

// Surge testimonials DISPATCHER (edit). The renderer resolves blocks by section
// type only, so a section with two possible layouts (single PullQuoteWithMark vs
// multi ReviewGrid — chosen once at generation) is dispatched here by the stored
// layout name.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import PullQuoteWithMark from './PullQuoteWithMark';
import ReviewGrid from './ReviewGrid';

export default function SurgeTestimonials({ sectionId }: { sectionId: string }) {
  const { layout } = useServiceBlock({ sectionId });
  return layout === 'ReviewGrid'
    ? <ReviewGrid sectionId={sectionId} />
    : <PullQuoteWithMark sectionId={sectionId} />;
}
