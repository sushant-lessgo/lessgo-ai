'use client';

// Vestria Catalogue — EDIT wrapper. Layout lives in VestriaCatalogueGrid.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaCatalogueGridCore, type VestriaCatalogueContent } from './VestriaCatalogueGrid.core';

export default function VestriaCatalogueGrid({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaCatalogueContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaCatalogueGridCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
