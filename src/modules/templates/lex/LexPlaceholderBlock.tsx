// src/modules/templates/lex/LexPlaceholderBlock.tsx
// Fallback rendered for any section type Lex doesn't have a block for, so the
// renderer never crashes on an unknown section.

import React from 'react';

interface Props {
  sectionId?: string;
  layout?: string;
  [key: string]: any;
}

export function LexPlaceholderBlock({ sectionId, layout }: Props) {
  return (
    <section className="w-full bg-slate-50 border-y-2 border-slate-200 py-12 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-slate-600 mb-2">
          Lex block — not available
        </p>
        <p className="text-sm text-slate-800 font-mono">
          {sectionId || 'unknown-section'}
          {layout ? ` · ${layout}` : ''}
        </p>
      </div>
    </section>
  );
}
