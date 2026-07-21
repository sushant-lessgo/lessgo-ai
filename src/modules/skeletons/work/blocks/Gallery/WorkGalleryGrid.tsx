'use client';

// WorkGalleryGrid — EDIT wrapper. Layout lives in WorkGalleryGrid.core.tsx. Adds
// the edit-only "manage photos" LINK (a plain link, NOT a toolbar) that jumps to
// the library board where the actual photos of each group are managed. Published
// does NOT render this link.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkGalleryGridCore, type WorkGalleryContent } from './WorkGalleryGrid.core';

/**
 * Library-board target for the gallery's "manage photos" link — the project-scoped
 * "Your work" dashboard board (`/dashboard/<token>/work`). Edit-only: rendered ONLY
 * via `manageSlot`, so the published wrapper (no manageSlot) stays byte-identical.
 */
export function workLibraryBoardHref(tokenId: string | null | undefined): string {
  return tokenId ? `/dashboard/${tokenId}/work` : '/dashboard';
}

export default function WorkGalleryGrid({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkGalleryContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  // One-shot read of the token-scoped store's token → the board deep-link.
  const tokenId = useEditStore((s) => s.tokenId);
  // Preview must look published: no manage-photos link (the published wrapper
  // proves the core renders fine with no manageSlot).
  const mode = useEditStore((s) => s.mode);
  const manageSlot = mode === 'preview' ? undefined : (
    <p className="wk-gallery__manage">
      <a href={workLibraryBoardHref(tokenId)} data-wk-manage-photos="">Manage photos →</a>
    </p>
  );
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkGalleryGridCore content={blockContent} E={editPrimitives} sectionId={sectionId} manageSlot={manageSlot} />
    </WorkEditProvider>
  );
}
