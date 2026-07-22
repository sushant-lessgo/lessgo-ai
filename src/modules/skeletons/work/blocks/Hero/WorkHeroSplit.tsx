'use client';

// WorkHeroSplit — EDIT wrapper (~10 lines). Layout lives in WorkHeroSplit.core.tsx.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkHeroSplitCore } from './WorkHeroSplit.core';
import type { WorkHeroSliderContent } from './WorkHeroSlider.core';

export default function WorkHeroSplit({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkHeroSliderContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  // Design state (Background layer) — SCALAR selector (D4), absent → today's markup.
  const bgMode = useEditStore(
    (s) => (s as any).themeValues?.styleTokens?.[sectionId]?.bgMode,
  ) as string | undefined;
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkHeroSplitCore content={blockContent} E={editPrimitives} sectionId={sectionId} bgMode={bgMode} />
    </WorkEditProvider>
  );
}
