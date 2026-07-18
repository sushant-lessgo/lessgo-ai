'use client';

// WorkFooter — EDIT wrapper (~10 lines). Layout lives in WorkFooter.core.tsx.

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkFooterCore, type WorkFooterContent } from './WorkFooter.core';

export default function WorkFooter({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkFooterContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkFooterCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
