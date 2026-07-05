'use client';

// Vestria Footer — EDIT wrapper. Layout lives in VestriaFooter.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaFooterCore, type VestriaFooterContent } from './VestriaFooter.core';

export default function VestriaFooter({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaFooterContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaFooterCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
