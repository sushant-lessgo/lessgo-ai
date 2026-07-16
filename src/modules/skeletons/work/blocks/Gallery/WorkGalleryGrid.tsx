'use client';

// WorkGalleryGrid — EDIT wrapper. Layout lives in WorkGalleryGrid.core.tsx. Adds
// the edit-only "manage photos" LINK (a plain link, NOT a toolbar) that jumps to
// the library board where the actual photos of each group are managed. Published
// does NOT render this link.

import React from 'react';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkGalleryGridCore, type WorkGalleryContent } from './WorkGalleryGrid.core';

/**
 * Library-board target for the gallery's "manage photos" link. Placeholder
 * dashboard route until the library board exists — re-pointed in D2.
 */
export const WORK_LIBRARY_BOARD_HREF = '/dashboard/library';

export default function WorkGalleryGrid({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkGalleryContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  const manageSlot = (
    <p className="wk-gallery__manage">
      <a href={WORK_LIBRARY_BOARD_HREF} data-wk-manage-photos="">Manage photos →</a>
    </p>
  );
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkGalleryGridCore content={blockContent} E={editPrimitives} sectionId={sectionId} manageSlot={manageSlot} />
    </WorkEditProvider>
  );
}
