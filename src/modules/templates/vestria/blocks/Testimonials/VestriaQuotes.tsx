'use client';

// Vestria Testimonials — EDIT wrapper. Layout lives in VestriaQuotes.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaQuotesCore, type VestriaQuotesContent } from './VestriaQuotes.core';

export default function VestriaQuotes({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaQuotesContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaQuotesCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
