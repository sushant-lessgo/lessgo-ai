'use client';

// Granth Praise — EDIT wrapper. Layout lives in GranthPraise.core.tsx.

import React from 'react';
import { useGranthBlock } from '../../hooks/useGranthBlock';
import { GranthEditProvider, editPrimitives, useGranthEditCtx } from '../editPrimitives';
import { GranthPraiseCore, type GranthPraiseContent } from './GranthPraise.core';

export default function GranthPraise({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useGranthBlock<GranthPraiseContent>({ sectionId });
  const ctx = useGranthEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <GranthEditProvider ctx={ctx}>
      <GranthPraiseCore content={blockContent} E={editPrimitives} />
    </GranthEditProvider>
  );
}
