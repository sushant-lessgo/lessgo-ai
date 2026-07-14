'use client';

// Atelier Packages — EDIT wrapper. Layout in AtelierPackages.core.tsx.

import React from 'react';
import { useAtelierBlock } from '../../hooks/useAtelierBlock';
import { AtelierEditProvider, editPrimitives, useAtelierEditCtx } from '../editPrimitives';
import { AtelierPackagesCore, type AtelierPackagesContent } from './AtelierPackages.core';

export default function AtelierPackages({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useAtelierBlock<AtelierPackagesContent>({ sectionId });
  const ctx = useAtelierEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <AtelierEditProvider ctx={ctx}>
      <AtelierPackagesCore content={blockContent} E={editPrimitives} />
    </AtelierEditProvider>
  );
}
