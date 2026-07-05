'use client';

// Vestria Process — EDIT wrapper. Layout lives in VestriaProcessRail.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaProcessRailCore, type VestriaProcessContent } from './VestriaProcessRail.core';

export default function VestriaProcessRail({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaProcessContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaProcessRailCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
