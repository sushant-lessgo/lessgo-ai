'use client';

// WorkHeader — EDIT wrapper (~10 lines). Wires the store into edit primitives and
// renders the shared core. All layout/markup lives in WorkHeader.core.tsx.
//
// INTERNAL DISPATCH: this ONE component renders all 5 header arrangements. It reads
// the stored layout name off the block (useWorkBlock().layout) and threads it to
// the core, which re-flows the CSS by `data-wk-header-layout` (same DOM). Sticky:
// `headerMode` is read from the project's style tokens (design state; Design ▾ layer
// — no panel UI yet, so today this resolves to 'static'), threaded to the core as
// `data-wk-header-mode`. The attribute-driven `position:fixed` CSS is the editor
// mirror of the published `work.v1.js` fixed-header behavior — same attribute, same
// CSS, so edit == published.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useWorkBlock } from '../../hooks/useWorkBlock';
import { WorkEditProvider, editPrimitives, useWorkEditCtx } from '../editPrimitives';
import { WorkHeaderCore, type WorkHeaderContent } from './WorkHeader.core';

export default function WorkHeader({ sectionId }: { sectionId: string }) {
  const { blockContent, layout, handleContentUpdate, handleCollectionUpdate } =
    useWorkBlock<WorkHeaderContent>({ sectionId });
  const ctx = useWorkEditCtx(sectionId, blockContent, handleContentUpdate, handleCollectionUpdate);
  // Design state (Design ▾ layer), NOT a content-contract key. Absent → 'static'.
  const headerMode = useEditStore(
    (s) => (s as any).themeValues?.styleTokens?.[sectionId]?.headerMode,
  ) as string | undefined;
  return (
    <WorkEditProvider ctx={ctx}>
      <WorkHeaderCore
        content={blockContent}
        E={editPrimitives}
        sectionId={sectionId}
        layoutName={layout}
        headerMode={headerMode}
      />
    </WorkEditProvider>
  );
}
