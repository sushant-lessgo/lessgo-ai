'use client';

// Vestria Industries — EDIT wrapper. Layout lives in VestriaIndustriesGrid.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaIndustriesGridCore, type VestriaIndustriesContent } from './VestriaIndustriesGrid.core';

export default function VestriaIndustriesGrid({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaIndustriesContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaIndustriesGridCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
