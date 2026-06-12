'use client';

// src/app/dev/meridian/blocks/MeridianBlocksStage.tsx
// Client-only store subtree for the Meridian block gallery: EditProvider →
// EditStoreGate → StoreSeed → all 7 edit+published blocks. Imported via
// next/dynamic({ ssr:false }) from MeridianBlocksClient so the store never
// server-renders (keeps the gallery directly loadable on a fresh URL). The
// palette/variant theming lives in the parent (MeridianThemeInjector); blocks
// read the html data-palette/data-variant it sets.

import { useEffect, useState } from 'react';
import { EditProvider, EditStoreGate } from '@/components/EditProvider';
import { useEditStoreLegacy } from '@/hooks/useEditStoreLegacy';
import { resolveMeridianBlock } from '@/modules/templates/meridian/resolveMeridianBlock';
import { MERIDIAN_BLOCK_MOCKS } from './mockContent';

const SECTIONS = MERIDIAN_BLOCK_MOCKS.map((m) => ({
  ...m,
  sectionId: `${m.sectionType}-mrd`,
}));

function buildMockDraft() {
  const sections: string[] = [];
  const sectionLayouts: Record<string, string> = {};
  const content: Record<string, any> = {};

  for (const s of SECTIONS) {
    sections.push(s.sectionId);
    sectionLayouts[s.sectionId] = s.layout;
    const elements: Record<string, any> = {};
    for (const [key, value] of Object.entries(s.content)) {
      elements[key] = { value, content: value };
    }
    content[s.sectionId] = { elements, layout: s.layout, backgroundType: 'neutral' };
  }

  return { finalContent: { sections, sectionLayouts, content } };
}

/** Seeds the edit store with all 7 sections, then renders children. */
function StoreSeed({ children }: { children: React.ReactNode }) {
  const { loadFromDraft, setMode } = useEditStoreLegacy();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadFromDraft(buildMockDraft(), 'dev-meridian-blocks');
      setMode('edit');
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, [loadFromDraft, setMode]);

  if (!ready) return <div style={{ padding: 32, color: 'var(--bone-3)', fontFamily: 'var(--font-mono)' }}>Seeding store…</div>;
  return <>{children}</>;
}

function BandLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--bone-3)',
        padding: '10px var(--sec-pad-x)', borderTop: '1px solid var(--line)',
        background: 'var(--ink-1)',
      }}
    >
      {children}
    </div>
  );
}

export default function MeridianBlocksStage() {
  return (
    <EditProvider tokenId="dev-meridian-blocks" options={{ showLoadingState: false, showErrorBoundary: false }}>
      <EditStoreGate fallback={<div style={{ padding: 32, color: 'var(--bone-3)' }}>Loading editor…</div>}>
        <StoreSeed>
          <div style={{ background: 'var(--ink)', color: 'var(--bone)', fontFamily: 'var(--font-body)', minHeight: '100vh', paddingTop: 64 }}>
            {SECTIONS.map((s) => {
              const Edit = resolveMeridianBlock(s.sectionType, 'edit');
              const Published = resolveMeridianBlock(s.sectionType, 'published');
              return (
                <section key={s.sectionId} style={{ borderBottom: '1px solid var(--line-strong)' }}>
                  <BandLabel>{s.layout} · {s.sectionType} · edit</BandLabel>
                  {Edit && <Edit sectionId={s.sectionId} />}
                  <BandLabel>{s.layout} · {s.sectionType} · published</BandLabel>
                  {Published && <Published sectionId={s.sectionId} {...s.content} />}
                </section>
              );
            })}
          </div>
        </StoreSeed>
      </EditStoreGate>
    </EditProvider>
  );
}
