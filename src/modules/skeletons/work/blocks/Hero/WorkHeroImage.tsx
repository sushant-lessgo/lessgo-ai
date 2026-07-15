'use client';

// WorkHeroImage — EDIT wrapper (~10 lines). Wires the store into edit primitives and
// renders the shared core. All layout/markup lives in WorkHeroImage.core.tsx. No
// runtime behavior (still-image cover — the slider effect is WorkHeroSlider-only).

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkHeroImageCore } from './WorkHeroImage.core';
import type { WorkHeroSliderContent } from './WorkHeroSlider.core';

export default function WorkHeroImage({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkHeroSliderContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkHeroImageCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
