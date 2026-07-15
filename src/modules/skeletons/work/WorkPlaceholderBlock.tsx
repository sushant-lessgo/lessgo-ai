// src/modules/skeletons/work/WorkPlaceholderBlock.tsx
// Fallback rendered for any work-skeleton section type with no registered block
// (unbuilt / grow-on-demand optional sections). Server-safe (no hooks, no
// 'use client') so it is valid in BOTH the edit and published renderers. A visible
// label + section-type tag lets dev verify dispatch is reaching here. granth
// GranthPlaceholderBlock precedent.

import React from 'react';

interface Props {
  sectionId?: string;
  layout?: string;
  [key: string]: any;
}

export function WorkPlaceholderBlock({ sectionId, layout }: Props) {
  return (
    <section className="w-full bg-neutral-50 border-y border-neutral-200 py-12 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
          Work block — coming soon
        </p>
        <p className="text-sm text-neutral-800 font-mono">
          {sectionId || 'unknown-section'}
          {layout ? ` · ${layout}` : ''}
        </p>
      </div>
    </section>
  );
}

export default WorkPlaceholderBlock;
