// Fallback rendered for any Granth section type with no registered block. A
// visible label + section-type tag lets dev verify dispatch is reaching here.

import React from 'react';

interface Props {
  sectionId?: string;
  layout?: string;
  [key: string]: any;
}

export function GranthPlaceholderBlock({ sectionId, layout }: Props) {
  return (
    <section className="w-full bg-amber-50 border-y-2 border-amber-200 py-12 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-amber-700 mb-2">
          Granth block — coming soon
        </p>
        <p className="text-sm text-amber-900 font-mono">
          {sectionId || 'unknown-section'}
          {layout ? ` · ${layout}` : ''}
        </p>
      </div>
    </section>
  );
}

export default GranthPlaceholderBlock;
