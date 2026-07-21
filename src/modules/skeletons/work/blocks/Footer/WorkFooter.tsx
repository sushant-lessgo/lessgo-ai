'use client';

// WorkFooter — EDIT wrapper (~10 lines). Layout lives in WorkFooter.core.tsx.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkFooterCore, type WorkFooterContent } from './WorkFooter.core';

/** Unwrap a stored element ({content}/{value} wrap or plain). */
function unwrap(v: any): any {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    if ('content' in v) return (v as any).content;
    if ('value' in v) return (v as any).value;
  }
  return v;
}

export default function WorkFooter({ sectionId }: { sectionId: string }) {
  const { blockContent, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkFooterContent>({ sectionId });
  // The Wave-2 derived footer keys (footer_nav_mode / nav_columns / contact_*) are
  // STAMPED into stored content, not declared in the footer contract schema — so
  // useWorkBlock's schema-driven extractLayoutContent drops them (the published
  // renderer passes elements through wholesale, so it keeps them → an edit-only
  // divergence). Surface them here from the raw stored elements (single stable ref
  // selector, no churn) so BOTH renderers feed the core the SAME derived data.
  const rawElements = useEditStore((s: any) => s?.content?.[sectionId]?.elements);
  const mode = unwrap(rawElements?.footer_nav_mode);
  const content: WorkFooterContent =
    mode === 'derived'
      ? {
          ...blockContent,
          footer_nav_mode: 'derived',
          nav_columns: unwrap(rawElements?.nav_columns),
          contact_location: unwrap(rawElements?.contact_location),
          contact_reach: unwrap(rawElements?.contact_reach),
        }
      : blockContent;
  const ctx = useWorkEditCtx(sectionId, content, handleContentUpdate, handleCollectionUpdate);
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkFooterCore content={content} E={editPrimitives} sectionId={sectionId} />
    </WorkEditProvider>
  );
}
