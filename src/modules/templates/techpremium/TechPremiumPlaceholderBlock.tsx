// src/modules/templates/techpremium/TechPremiumPlaceholderBlock.tsx
// Fallback rendered for any unmapped TechPremium section type. Light-styled so it's
// visible on the warm-paper surface; the visible label + section tag let dev verify
// the product→techpremium dispatch path is reached. Should never appear on a real
// page (all 7 product sections are mapped in resolveTechPremiumBlock).

import React from 'react';

interface Props {
  sectionId?: string;
  layout?: string;
  [key: string]: any;
}

export function TechPremiumPlaceholderBlock({ sectionId, layout }: Props) {
  return (
    <section
      style={{
        width: '100%',
        background: 'var(--paper, #f7f6f2)',
        color: 'var(--ink, #2b2b2b)',
        borderTop: '1px solid var(--line, #e6e4dd)',
        borderBottom: '1px solid var(--line, #e6e4dd)',
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
            color: 'var(--lime-d, #4f8a2e)',
            margin: '0 0 8px',
          }}
        >
          TechPremium block — coming soon
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            fontSize: 13,
            color: 'var(--ink-2, #5a5a5a)',
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

export default TechPremiumPlaceholderBlock;
