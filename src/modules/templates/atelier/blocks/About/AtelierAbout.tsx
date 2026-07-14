'use client';

// Atelier About — EDIT wrapper. Layout in AtelierAbout.core.tsx.

import React from 'react';
import { useAtelierBlock } from '../../hooks/useAtelierBlock';
import { AtelierEditProvider, editPrimitives, useAtelierEditCtx } from '../editPrimitives';
import { AtelierAboutCore, type AtelierAboutContent } from './AtelierAbout.core';

export default function AtelierAbout({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useAtelierBlock<AtelierAboutContent>({ sectionId });
  const ctx = useAtelierEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <AtelierEditProvider ctx={ctx}>
      <AtelierAboutCore content={blockContent} E={editPrimitives} />
    </AtelierEditProvider>
  );
}
