'use client';

// Vestria Hero — EDIT wrapper. Layout lives in VestriaTailoredHero.core.tsx.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaTailoredHeroCore, type VestriaHeroContent } from './VestriaTailoredHero.core';

export default function VestriaTailoredHero({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaHeroContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <VestriaEditProvider ctx={ctx}>
      <VestriaTailoredHeroCore content={blockContent} E={editPrimitives} />
    </VestriaEditProvider>
  );
}
