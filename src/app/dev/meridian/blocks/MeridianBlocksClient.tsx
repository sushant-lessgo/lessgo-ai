'use client';

// src/app/dev/meridian/blocks/MeridianBlocksClient.tsx
// SSR-safe shell for the Meridian block gallery: palette + variant switcher and
// MeridianThemeInjector (both fine to prerender). The store-mounting subtree
// (EditProvider → blocks) is dynamic-imported with { ssr:false } so it only
// mounts client-side — this keeps the gallery directly loadable on a fresh URL
// (the store provider is not SSR-safe). ThemeInjector stays here so the switcher
// works immediately; blocks in the stage read the html data-palette/data-variant.

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MeridianThemeInjector } from '@/modules/templates/meridian/ThemeInjector';
import { meridianPalettes, meridianVariants, type MeridianPalette, type MeridianVariant } from '@/types/product';

const MeridianBlocksStage = dynamic(() => import('./MeridianBlocksStage'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 32, paddingTop: 96, color: 'var(--bone-3)', fontFamily: 'var(--font-mono)', background: 'var(--ink)', minHeight: '100vh' }}>
      Loading blocks…
    </div>
  ),
});

export function MeridianBlocksClient() {
  const [paletteId, setPaletteId] = useState<MeridianPalette>('mint');
  const [variantId, setVariantId] = useState<MeridianVariant>('developer');

  return (
    <MeridianThemeInjector paletteId={paletteId} variantId={variantId}>
      <Switcher paletteId={paletteId} variantId={variantId} onPalette={setPaletteId} onVariant={setVariantId} />
      <MeridianBlocksStage />
    </MeridianThemeInjector>
  );
}

function Switcher({
  paletteId, variantId, onPalette, onVariant,
}: {
  paletteId: MeridianPalette;
  variantId: MeridianVariant;
  onPalette: (p: MeridianPalette) => void;
  onVariant: (v: MeridianVariant) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', top: 12, right: 12, zIndex: 100,
        display: 'flex', gap: 16, alignItems: 'center',
        background: 'var(--ink-1)', border: '1px solid var(--line-strong)',
        borderRadius: 12, boxShadow: 'var(--shadow-menu)', padding: '10px 14px',
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--bone-2)',
      }}
    >
      <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        palette
        <select
          value={paletteId}
          onChange={(e) => onPalette(e.target.value as MeridianPalette)}
          style={{ background: 'var(--ink-2)', color: 'var(--bone)', border: '1px solid var(--line-strong)', borderRadius: 6, padding: '4px 6px', fontFamily: 'var(--font-mono)', fontSize: 11 }}
        >
          {meridianPalettes.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <div style={{ display: 'flex', gap: 4 }}>
        {meridianVariants.map((v) => (
          <button
            key={v}
            onClick={() => onVariant(v)}
            style={{
              padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              background: v === variantId ? 'var(--accent)' : 'var(--ink-2)',
              color: v === variantId ? 'var(--accent-ink)' : 'var(--bone-2)',
              border: `1px solid ${v === variantId ? 'var(--accent)' : 'var(--line-strong)'}`,
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
