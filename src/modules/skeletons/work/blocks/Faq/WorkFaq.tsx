'use client';

// WorkFaq — EDIT wrapper. Layout lives in WorkFaq.core.tsx.

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkFaqCore, type WorkFaqContent } from './WorkFaq.core';

export default function WorkFaq({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkFaqContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkFaqCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
