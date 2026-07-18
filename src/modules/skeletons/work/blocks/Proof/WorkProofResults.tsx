'use client';

// WorkProofResults — EDIT wrapper. Layout lives in WorkProofResults.core.tsx.

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkProofResultsCore, type WorkProofResultsContent } from './WorkProofResults.core';

export default function WorkProofResults({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkProofResultsContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkProofResultsCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
