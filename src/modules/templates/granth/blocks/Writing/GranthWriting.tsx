'use client';

// Granth Writing — EDIT wrapper. Layout lives in GranthWriting.core.tsx.

import React from 'react';
import { useGranthBlock } from '../../hooks/useGranthBlock';
import { GranthEditProvider, editPrimitives, useGranthEditCtx } from '../editPrimitives';
import { GranthWritingCore, type GranthWritingContent } from './GranthWriting.core';

export default function GranthWriting({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useGranthBlock<GranthWritingContent>({ sectionId });
  const ctx = useGranthEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <GranthEditProvider ctx={ctx}>
      <GranthWritingCore content={blockContent} E={editPrimitives} />
    </GranthEditProvider>
  );
}
