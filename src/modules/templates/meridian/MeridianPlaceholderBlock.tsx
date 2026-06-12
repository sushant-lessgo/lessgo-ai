// src/modules/templates/meridian/MeridianPlaceholderBlock.tsx
// P0 placeholder rendered for any Meridian section until the real block library
// ships (P2). Dark-styled so it's visible on the --ink surface; the visible label
// + section-type tag let dev verify the product→meridian dispatch path is reached.

import React from 'react';

interface Props {
  sectionId?: string;
  layout?: string;
  [key: string]: any;
}

export function MeridianPlaceholderBlock({ sectionId, layout }: Props) {
  return (
    <section
      style={{
        width: '100%',
        background: 'var(--ink, #0b0b0f)',
        color: 'var(--bone, #fafafa)',
        borderTop: '1px solid var(--line, rgba(255,255,255,0.08))',
        borderBottom: '1px solid var(--line, rgba(255,255,255,0.08))',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: 768, margin: '0 auto', textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent, #6ee7b7)',
            margin: '0 0 8px',
          }}
        >
          Meridian block — coming soon
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            fontSize: 13,
            color: 'var(--bone-2, #b8b8c0)',
            margin: 0,
          }}
        >
          {sectionId || 'unknown-section'}
          {layout ? ` · ${layout}` : ''}
        </p>
      </div>
    </section>
  );
}

export default MeridianPlaceholderBlock;
