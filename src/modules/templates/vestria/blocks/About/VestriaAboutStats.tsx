'use client';

// Vestria About — EDIT wrapper. Layout lives in VestriaAboutStats.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaAboutStatsCore, type VestriaAboutContent } from './VestriaAboutStats.core';

export default function VestriaAboutStats({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaAboutContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaAboutStatsCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
