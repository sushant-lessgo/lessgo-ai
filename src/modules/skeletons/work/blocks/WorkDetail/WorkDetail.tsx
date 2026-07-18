'use client';

// WorkDetail — EDIT wrapper. Layout lives in WorkDetail.core.tsx. Thin wrap:
// resolve store content → inject editPrimitives → render the shared core. No
// edit-only affordance beyond the primitives themselves (the photo list carries
// its own add/remove chrome via E.List).

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkDetailCore, type WorkDetailContent } from './WorkDetail.core';

export default function WorkDetail({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkDetailContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkDetailCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
