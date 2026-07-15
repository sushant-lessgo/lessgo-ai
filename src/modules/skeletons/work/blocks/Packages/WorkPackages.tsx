'use client';

// WorkPackages — EDIT wrapper. Layout lives in WorkPackages.core.tsx.

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkPackagesCore, type WorkPackagesContent } from './WorkPackages.core';

export default function WorkPackages({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkPackagesContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkPackagesCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
