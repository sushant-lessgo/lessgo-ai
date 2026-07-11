'use client';

// src/app/dev/meridian/blocks/MeridianBlocksStage.tsx
// Thin client wrapper (template-factory phase 7). The Meridian-specific stage was
// generalized into src/app/dev/blocks/TemplateBlocksStage.tsx; this file now just
// dynamic-imports that generic stage with { ssr:false }, pinned to meridian, so
// the historical /dev/meridian/blocks URL (asserted by e2e/render.spec.ts) keeps
// mounting. ssr:false is REQUIRED: the stage pulls in the edit store, whose module
// touches `window` at eval time — it must never enter the server render graph.
// New per-template galleries live at /dev/blocks/<templateId>.

import dynamic from 'next/dynamic';

const TemplateBlocksStage = dynamic(() => import('@/app/dev/blocks/TemplateBlocksStage'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 32, paddingTop: 96, color: 'var(--bone-3)', fontFamily: 'var(--font-mono)', background: 'var(--ink)', minHeight: '100vh' }}>
      Loading blocks…
    </div>
  ),
});

export default function MeridianBlocksStage() {
  return <TemplateBlocksStage templateId="meridian" />;
}
