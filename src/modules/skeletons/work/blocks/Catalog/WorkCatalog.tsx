'use client';

// WorkCatalog — EDIT wrapper. Layout lives in WorkCatalog.core.tsx. Thin wrap:
// resolve store content → inject editPrimitives → render the shared core. The
// covers list carries its own add/remove chrome via E.List.

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkCatalogCore, type WorkCatalogContent } from './WorkCatalog.core';

export default function WorkCatalog({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkCatalogContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkCatalogCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
