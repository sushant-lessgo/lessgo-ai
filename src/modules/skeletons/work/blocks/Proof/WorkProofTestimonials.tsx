'use client';

// WorkProofTestimonials — EDIT wrapper (~10 lines). Layout lives in
// WorkProofTestimonials.core.tsx.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkProofTestimonialsCore, type WorkProofContent } from './WorkProofTestimonials.core';

export default function WorkProofTestimonials({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkProofContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  // Preview matches published: with no quotes the whole band is omitted (no
  // "Add a client testimonial" greyed placeholder).
  const mode = useEditStore((s) => s.mode);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkProofTestimonialsCore
        content={blockContent}
        E={editPrimitives}
        sectionId={sectionId}
        editable={mode !== 'preview'}
      />
    </WorkEditProvider>
  );
}
