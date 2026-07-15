'use client';

// WorkResults — EDIT wrapper. Layout lives in WorkResults.core.tsx.

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkResultsCore, type WorkResultsContent } from './WorkResults.core';

export default function WorkResults({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkResultsContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkResultsCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
