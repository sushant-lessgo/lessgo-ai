'use client';

// Vestria Hero — EDIT wrapper. Layout lives in VestriaTailoredHero.core.tsx /
// VestriaFullBleedHero.core.tsx; this wrapper branches on the stored layout
// string (content[heroId].layout). Default/unknown → tailored.

import React from 'react';
import { useVestriaBlock } from '../../hooks/useVestriaBlock';
import { VestriaEditProvider, editPrimitives, useVestriaEditCtx } from '../editPrimitives';
import { VestriaTailoredHeroCore, type VestriaHeroContent } from './VestriaTailoredHero.core';
import { VestriaFullBleedHeroCore, type VestriaFullBleedHeroContent } from './VestriaFullBleedHero.core';

export default function VestriaTailoredHero({ sectionId }: { sectionId: string }) {
  const { blockContent, layout, handleContentUpdate, handleCollectionUpdate } =
    useVestriaBlock<VestriaFullBleedHeroContent>({ sectionId });
  const ctx = useVestriaEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  const isFullBleed = layout === 'VestriaFullBleedHero';
  return (
    <VestriaEditProvider ctx={ctx}>
      {isFullBleed
        ? <VestriaFullBleedHeroCore content={blockContent} E={editPrimitives} />
        : <VestriaTailoredHeroCore content={blockContent as VestriaHeroContent} E={editPrimitives} />}
    </VestriaEditProvider>
  );
}
