'use client';

// Atelier Quote band — EDIT wrapper. Layout in AtelierQuoteBand.core.tsx.

import React from 'react';
import { useAtelierBlock } from '../../hooks/useAtelierBlock';
import { AtelierEditProvider, editPrimitives, useAtelierEditCtx } from '../editPrimitives';
import { AtelierQuoteBandCore, type AtelierQuoteContent } from './AtelierQuoteBand.core';

export default function AtelierQuoteBand({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useAtelierBlock<AtelierQuoteContent>({ sectionId });
  const ctx = useAtelierEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <AtelierEditProvider ctx={ctx}>
      <AtelierQuoteBandCore content={blockContent} E={editPrimitives} />
    </AtelierEditProvider>
  );
}
