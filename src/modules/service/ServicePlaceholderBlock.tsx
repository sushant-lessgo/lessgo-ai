// Phase 0 placeholder rendered for any service section until Phase 3 ships
// the real Hearth UIBlock library. Visible label + section-type tag let dev
// verify the projectType branch is reaching this code path.

import React from 'react';

interface Props {
  sectionId?: string;
  layout?: string;
  [key: string]: any;
}

export function ServicePlaceholderBlock({ sectionId, layout }: Props) {
  return (
    <section className="w-full bg-amber-50 border-y-2 border-amber-200 py-12 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-amber-700 mb-2">
          Service block — coming soon
        </p>
        <p className="text-sm text-amber-900 font-mono">
          {sectionId || 'unknown-section'}
          {layout ? ` · ${layout}` : ''}
        </p>
      </div>
    </section>
  );
}
