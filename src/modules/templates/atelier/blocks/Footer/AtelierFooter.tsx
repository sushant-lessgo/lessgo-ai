'use client';

// Atelier Footer — EDIT wrapper. Layout in AtelierFooter.core.tsx.

import React from 'react';
import { useAtelierBlock } from '../../hooks/useAtelierBlock';
import { AtelierEditProvider, editPrimitives, useAtelierEditCtx } from '../editPrimitives';
import { AtelierFooterCore, type AtelierFooterContent } from './AtelierFooter.core';

export default function AtelierFooter({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useAtelierBlock<AtelierFooterContent>({ sectionId });
  const ctx = useAtelierEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <AtelierEditProvider ctx={ctx}>
      <AtelierFooterCore content={blockContent} E={editPrimitives} />
    </AtelierEditProvider>
  );
}
