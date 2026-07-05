'use client';

// Vestria Services — EDIT wrapper. Layout lives in VestriaServicesGrid.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaServicesGridCore, type VestriaServicesContent } from './VestriaServicesGrid.core';

export default function VestriaServicesGrid({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaServicesContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaServicesGridCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
