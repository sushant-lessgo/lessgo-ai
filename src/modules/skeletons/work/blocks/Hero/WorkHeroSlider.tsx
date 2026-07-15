'use client';

// WorkHeroSlider — EDIT wrapper (~10 lines). Wires the store into edit primitives
// and renders the shared core. All layout/markup lives in WorkHeroSlider.core.tsx.
// The multi-slide slider EFFECT is DEFERRED to phase 5 — this renders the static
// first-slide state only (mirrors the published band).

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkHeroSliderCore, type WorkHeroSliderContent } from './WorkHeroSlider.core';

export default function WorkHeroSlider({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkHeroSliderContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkHeroSliderCore content={blockContent} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
