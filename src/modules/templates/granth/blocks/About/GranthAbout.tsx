'use client';

// Granth About — EDIT wrapper. Layout lives in GranthAbout.core.tsx.

import React from 'react';
import { useGranthBlock } from '../../hooks/useGranthBlock';
import { GranthEditProvider, editPrimitives, useGranthEditCtx } from '../editPrimitives';
import { GranthAboutCore, type GranthAboutContent } from './GranthAbout.core';

export default function GranthAbout({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useGranthBlock<GranthAboutContent>({ sectionId });
  const ctx = useGranthEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  return (
    <GranthEditProvider ctx={ctx}>
      <GranthAboutCore content={blockContent} E={editPrimitives} />
    </GranthEditProvider>
  );
}
