'use client';

// Atelier Hero — EDIT wrapper. Layout lives in AtelierHero.core.tsx.

import React from 'react';
import { useAtelierBlock } from '../../hooks/useAtelierBlock';
import { AtelierEditProvider, editPrimitives, useAtelierEditCtx } from '../editPrimitives';
import { AtelierHeroCore, type AtelierHeroContent } from './AtelierHero.core';

export default function AtelierHero({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useAtelierBlock<AtelierHeroContent>({ sectionId });
  const ctx = useAtelierEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <AtelierEditProvider ctx={ctx}>
      <AtelierHeroCore content={blockContent} E={editPrimitives} />
    </AtelierEditProvider>
  );
}
