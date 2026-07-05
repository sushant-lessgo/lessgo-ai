'use client';

// Vestria Materials — EDIT wrapper. Layout lives in VestriaMaterials.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaMaterialsCore, type VestriaMaterialsContent } from './VestriaMaterials.core';

export default function VestriaMaterials({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaMaterialsContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaMaterialsCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
