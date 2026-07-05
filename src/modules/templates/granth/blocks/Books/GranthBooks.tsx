'use client';

// Granth Books — EDIT wrapper. Layout lives in GranthBooks.core.tsx.

import React from 'react';
import { useGranthBlock } from '../../hooks/useGranthBlock';
import { GranthEditProvider, editPrimitives, useGranthEditCtx } from '../editPrimitives';
import { GranthBooksCore, type GranthBooksContent } from './GranthBooks.core';

export default function GranthBooks({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useGranthBlock<GranthBooksContent>({ sectionId });
  const ctx = useGranthEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <GranthEditProvider ctx={ctx}>
      <GranthBooksCore content={blockContent} E={editPrimitives} />
    </GranthEditProvider>
  );
}
