'use client';

// Granth hero — EDIT wrapper (~10 lines). Wires the store into edit primitives and
// renders the shared core. All layout/markup lives in GranthHero.core.tsx.

import React from 'react';
import { useGranthBlock } from '../../hooks/useGranthBlock';
import { GranthEditProvider, editPrimitives, useGranthEditCtx } from '../editPrimitives';
import { GranthHeroCore, type GranthHeroContent } from './GranthHero.core';

export default function GranthHero({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useGranthBlock<GranthHeroContent>({ sectionId });
  const ctx = useGranthEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <GranthEditProvider ctx={ctx}>
      <GranthHeroCore content={blockContent} E={editPrimitives} />
    </GranthEditProvider>
  );
}
