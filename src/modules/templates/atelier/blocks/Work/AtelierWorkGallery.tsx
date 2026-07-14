'use client';

// Atelier Work/Gallery — EDIT wrapper. Layout in AtelierWorkGallery.core.tsx.

import React from 'react';
import { useAtelierBlock } from '../../hooks/useAtelierBlock';
import { AtelierEditProvider, editPrimitives, useAtelierEditCtx } from '../editPrimitives';
import { AtelierWorkGalleryCore, type AtelierWorkContent } from './AtelierWorkGallery.core';

export default function AtelierWorkGallery({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useAtelierBlock<AtelierWorkContent>({ sectionId });
  const ctx = useAtelierEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <AtelierEditProvider ctx={ctx}>
      <AtelierWorkGalleryCore content={blockContent} E={editPrimitives} />
    </AtelierEditProvider>
  );
}
