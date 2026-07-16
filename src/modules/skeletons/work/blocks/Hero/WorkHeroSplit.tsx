'use client';

// WorkHeroSplit — EDIT wrapper (~10 lines). Layout lives in WorkHeroSplit.core.tsx.

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkHeroSplitCore } from './WorkHeroSplit.core';
import type { WorkHeroSliderContent } from './WorkHeroSlider.core';

export default function WorkHeroSplit({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkHeroSliderContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkHeroSplitCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
