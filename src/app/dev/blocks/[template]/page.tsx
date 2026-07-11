'use client';

// src/app/dev/blocks/[template]/page.tsx
// Generic per-template block gallery + screenshot-parity stage (template-factory
// phase 7). URL: /dev/blocks/<templateId> (e.g. /dev/blocks/hearth). Client page:
// it dynamic-imports the generic TemplateBlocksStage with { ssr:false } so the
// edit-store subtree (whose module touches `window` at eval time) never enters the
// server render graph — same isolation the meridian gallery gets from its wrapper.
// Internal-only (/dev/* convention; blocked in production by middleware); a client
// page can't export `metadata`, so the noindex header is dropped here (defensible:
// /dev is middleware-blocked in prod anyway).

import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import '@/styles/fonts-self-hosted.css';
import { templateRegistry } from '@/modules/templates/registry';
import type { TemplateId } from '@/types/service';

const TemplateBlocksStage = dynamic(() => import('../TemplateBlocksStage'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 32, paddingTop: 96, color: 'var(--bone-3)', fontFamily: 'var(--font-mono)', background: 'var(--ink)', minHeight: '100vh' }}>
      Loading blocks…
    </div>
  ),
});

export default function TemplateBlocksPage({ params }: { params: { template: string } }) {
  const templateId = params.template as TemplateId;
  if (!(templateId in templateRegistry)) notFound();
  return <TemplateBlocksStage templateId={templateId} />;
}
