'use client';

// src/modules/templates/surge/components/SurgeAddImageOverlay.tsx
// Edit-mode affordance for an empty Surge image slot. Sits over the gradient/
// dashboard placeholder so the slot reads as "an image goes here". pointer-events:
// none so the parent slot's click/mouseUp still opens the image toolbar.

import React from 'react';

interface SurgeAddImageOverlayProps {
  /** Icon-only (no label) — for small slots like a logo or avatar. */
  compact?: boolean;
}

export function SurgeAddImageOverlay({ compact = false }: SurgeAddImageOverlayProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 0 : 8,
        pointerEvents: 'none',
        color: 'var(--ink-2)',
        background: 'rgba(0,0,0,0.04)',
        borderRadius: 'inherit',
      }}
    >
      <svg
        width={compact ? 18 : 36}
        height={compact ? 18 : 36}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.65 }}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      {!compact && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 500,
            opacity: 0.75,
          }}
        >
          Add image
        </span>
      )}
    </div>
  );
}

export default SurgeAddImageOverlay;
