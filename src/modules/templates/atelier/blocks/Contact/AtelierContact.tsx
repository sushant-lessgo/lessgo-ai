'use client';

// Atelier Contact — EDIT wrapper. Layout in AtelierContact.core.tsx.

import React from 'react';
import { useAtelierBlock } from '../../hooks/useAtelierBlock';
import { AtelierEditProvider, editPrimitives, useAtelierEditCtx } from '../editPrimitives';
import { AtelierContactCore, type AtelierContactContent } from './AtelierContact.core';

export default function AtelierContact({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useAtelierBlock<AtelierContactContent>({ sectionId });
  const ctx = useAtelierEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <AtelierEditProvider ctx={ctx}>
      <AtelierContactCore content={blockContent} E={editPrimitives} />
    </AtelierEditProvider>
  );
}
