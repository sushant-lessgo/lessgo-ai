'use client';

// WorkHeroCenter — EDIT wrapper (~10 lines). Layout lives in WorkHeroCenter.core.tsx.

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkHeroCenterCore } from './WorkHeroCenter.core';
import type { WorkHeroSliderContent } from './WorkHeroSlider.core';

export default function WorkHeroCenter({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkHeroSliderContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkHeroCenterCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
