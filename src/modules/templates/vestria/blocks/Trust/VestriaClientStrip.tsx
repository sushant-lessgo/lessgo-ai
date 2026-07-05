'use client';

// Vestria Trust — EDIT wrapper. Layout lives in VestriaClientStrip.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaClientStripCore, type VestriaTrustContent } from './VestriaClientStrip.core';

export default function VestriaClientStrip({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaTrustContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaClientStripCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
