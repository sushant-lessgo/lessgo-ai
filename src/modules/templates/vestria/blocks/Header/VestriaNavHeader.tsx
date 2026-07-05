'use client';

// Vestria Header — EDIT wrapper. Layout lives in VestriaNavHeader.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaNavHeaderCore, type VestriaHeaderContent } from './VestriaNavHeader.core';

export default function VestriaNavHeader({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaHeaderContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaNavHeaderCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
