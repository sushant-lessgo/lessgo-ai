'use client';

// Granth Footer — EDIT wrapper. Layout lives in GranthFooter.core.tsx.

import React from 'react';
import { useGranthBlock } from '../../hooks/useGranthBlock';
import { GranthEditProvider, editPrimitives, useGranthEditCtx } from '../editPrimitives';
import { GranthFooterCore, type GranthFooterContent } from './GranthFooter.core';

export default function GranthFooter({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useGranthBlock<GranthFooterContent>({ sectionId });
  const ctx = useGranthEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <GranthEditProvider ctx={ctx}>
      <GranthFooterCore content={blockContent} E={editPrimitives} />
    </GranthEditProvider>
  );
}
