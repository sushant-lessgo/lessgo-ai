'use client';

// WorkGalleryMasonry — EDIT wrapper. Layout lives in WorkGalleryMasonry.core.tsx.

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkGalleryMasonryCore } from './WorkGalleryMasonry.core';
import type { WorkGalleryContent } from './WorkGalleryGrid.core';

export default function WorkGalleryMasonry({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkGalleryContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkGalleryMasonryCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
