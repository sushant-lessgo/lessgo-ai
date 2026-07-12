'use client';

// Atelier Header — EDIT wrapper. Layout lives in AtelierNavHeader.core.tsx.

import React from 'react';
import { useAtelierBlock } from '../../hooks/useAtelierBlock';
import { AtelierEditProvider, editPrimitives, useAtelierEditCtx } from '../editPrimitives';
import { AtelierNavHeaderCore, type AtelierHeaderContent } from './AtelierNavHeader.core';

export default function AtelierNavHeader({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useAtelierBlock<AtelierHeaderContent>({ sectionId });
  const ctx = useAtelierEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <AtelierEditProvider ctx={ctx}>
      <AtelierNavHeaderCore content={blockContent} E={editPrimitives} />
    </AtelierEditProvider>
  );
}
