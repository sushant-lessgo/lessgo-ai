// Surge testimonials DISPATCHER (published). Reads the stored layout from
// content[sectionId].layout and renders the matching view, forwarding flat props.

import React from 'react';
import PullQuoteWithMarkPublished from './PullQuoteWithMark.published';
import ReviewGridPublished from './ReviewGrid.published';

export default function SurgeTestimonialsPublished(props: any) {
  const layout = props?.content?.[props?.sectionId]?.layout;
  return layout === 'ReviewGrid'
    ? <ReviewGridPublished {...props} />
    : <PullQuoteWithMarkPublished {...props} />;
}
