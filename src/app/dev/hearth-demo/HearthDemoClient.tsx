'use client';

// src/app/dev/hearth-demo/HearthDemoClient.tsx
// Demo body: palette switcher + sample surfaces / type / accent / spacing.
// Verifies HearthThemeInjector resolves all CSS vars correctly.

import { useState } from 'react';
import {
  HearthThemeInjector,
  hearthPaletteConfigs,
  defaultHearthPalette,
} from '@/modules/templates/hearth';
import { hearthPalettes, type HearthPalette } from '@/types/service';

export function HearthDemoClient() {
  const [paletteId, setPaletteId] = useState<HearthPalette>(defaultHearthPalette);

  return (
    <HearthThemeInjector paletteId={paletteId}>
      <div
        style={{
          background: 'var(--cream)',
          color: 'var(--ink)',
          fontFamily: 'var(--font-body)',
          minHeight: '100vh',
          padding: 'var(--s-7) var(--sec-pad-x)',
        }}
      >
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--s-8)' }}>
            <Eyebrow>Phase 1 · Hearth tokens</Eyebrow>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: 72,
                lineHeight: 0.98,
                letterSpacing: '-0.015em',
                margin: 'var(--s-4) 0 var(--s-3)',
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Brand identity that <em style={accentItalic}>stays with you</em>.
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 22,
                color: 'var(--ink-2)',
                maxWidth: '58ch',
                margin: 0,
              }}
            >
              Verifying CSS vars resolve, fonts load, surfaces alternate, accent
              tracks data-palette.
            </p>
          </header>

          <PaletteSwitcher current={paletteId} onPick={setPaletteId} />

          <SurfaceBand surface="cream" label="--cream · default surface">
            <SurfaceSamples />
          </SurfaceBand>

          <SurfaceBand surface="cream-1" label="--cream-1 · raised / cards">
            <SurfaceSamples />
          </SurfaceBand>

          <SurfaceBand surface="cream-2" label="--cream-2 · secondary section">
            <SurfaceSamples />
          </SurfaceBand>

          <ColorSwatches />
          <SpacingRuler />
        </div>
      </div>
    </HearthThemeInjector>
  );
}

const accentItalic: React.CSSProperties = {
  fontStyle: 'italic',
  fontWeight: 500,
  color: 'var(--accent-deep)',
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'var(--accent-deep)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ width: 18, height: 1, background: 'var(--accent)' }} />
      {children}
    </div>
  );
}

function PaletteSwitcher({
  current,
  onPick,
}: {
  current: HearthPalette;
  onPick: (id: HearthPalette) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--s-2)',
        marginBottom: 'var(--s-7)',
        padding: 'var(--s-4)',
        background: 'var(--cream-1)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--line)',
      }}
    >
      {hearthPalettes.map((id) => {
        const cfg = hearthPaletteConfigs[id];
        const active = id === current;
        return (
          <button
            key={id}
            onClick={() => onPick(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 500,
              color: active ? 'var(--accent-ink)' : 'var(--ink)',
              background: active ? 'var(--accent)' : 'var(--cream)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--sand)'}`,
              borderRadius: 'var(--r-md)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: cfg.accent,
                border: '1px solid var(--line)',
              }}
            />
            {id}
          </button>
        );
      })}
    </div>
  );
}

function SurfaceBand({
  surface,
  label,
  children,
}: {
  surface: 'cream' | 'cream-1' | 'cream-2';
  label: string;
  children: React.ReactNode;
}) {
  const bgVar =
    surface === 'cream' ? 'var(--cream)' : surface === 'cream-1' ? 'var(--cream-1)' : 'var(--cream-2)';
  return (
    <section
      style={{
        background: bgVar,
        padding: 'var(--s-7) var(--s-7)',
        borderRadius: 'var(--r-xl)',
        marginBottom: 'var(--s-6)',
        border: '1px solid var(--sand)',
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      <div style={{ marginTop: 'var(--s-5)' }}>{children}</div>
    </section>
  );
}

function SurfaceSamples() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 'var(--s-6)' }}>
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 36,
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
            margin: '0 0 var(--s-3)',
            fontVariationSettings: '"opsz" 72',
          }}
        >
          Strategy-first, founder-collaborative <em style={accentItalic}>process</em>.
        </h2>
        <p style={{ color: 'var(--ink-2)', maxWidth: '60ch', margin: 0, lineHeight: 1.6 }}>
          A six-week studio engagement for founders who want their brand to feel
          as deliberate as their product. We design quietly. The work speaks loud.
        </p>

        <div style={{ display: 'flex', gap: 'var(--s-3)', marginTop: 'var(--s-5)' }}>
          <button
            style={{
              padding: '12px 22px',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 500,
              border: '1px solid var(--accent)',
              borderRadius: 'var(--r-md)',
              cursor: 'pointer',
            }}
          >
            Book a call
          </button>
          <button
            style={{
              padding: '12px 22px',
              background: 'transparent',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 500,
              border: '1px solid var(--sand)',
              borderRadius: 'var(--r-md)',
              cursor: 'pointer',
            }}
          >
            See work
          </button>
        </div>
      </div>

      <aside
        style={{
          background: 'var(--cream)',
          padding: 'var(--s-5)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
            marginBottom: 'var(--s-2)',
          }}
        >
          Card · --shadow-card
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)' }}>
          $5,000 <span style={{ color: 'var(--ink-3)', fontSize: 14 }}>· 4–6 weeks</span>
        </div>
        <ul style={{ margin: 'var(--s-3) 0 0', paddingLeft: 18, color: 'var(--ink-2)', fontSize: 14 }}>
          <li>Brand strategy</li>
          <li>Visual identity</li>
          <li>Packaging system</li>
        </ul>
      </aside>
    </div>
  );
}

function ColorSwatches() {
  const swatches = [
    { name: '--accent', value: 'var(--accent)' },
    { name: '--accent-deep', value: 'var(--accent-deep)' },
    { name: '--accent-ink', value: 'var(--accent-ink)' },
    { name: '--accent-wash', value: 'var(--accent-wash)' },
    { name: '--ink', value: 'var(--ink)' },
    { name: '--ink-2', value: 'var(--ink-2)' },
    { name: '--ink-3', value: 'var(--ink-3)' },
    { name: '--sand', value: 'var(--sand)' },
    { name: '--sage', value: 'var(--sage)' },
    { name: '--clay', value: 'var(--clay)' },
  ];
  return (
    <section style={{ marginTop: 'var(--s-7)' }}>
      <Eyebrow>Color tokens</Eyebrow>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 'var(--s-3)',
          marginTop: 'var(--s-4)',
        }}
      >
        {swatches.map((s) => (
          <div
            key={s.name}
            style={{
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ height: 80, background: s.value }} />
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--cream-1)',
                fontSize: 11,
                color: 'var(--ink-2)',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {s.name}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SpacingRuler() {
  const steps = ['s-1', 's-2', 's-3', 's-4', 's-5', 's-6', 's-7', 's-8', 's-9', 's-10'];
  return (
    <section style={{ marginTop: 'var(--s-7)' }}>
      <Eyebrow>Spacing scale</Eyebrow>
      <div style={{ marginTop: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        {steps.map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
                color: 'var(--ink-3)',
                width: 60,
              }}
            >
              --{s}
            </span>
            <span
              style={{
                height: 10,
                background: 'var(--accent-wash)',
                borderLeft: '2px solid var(--accent)',
                width: `var(--${s})`,
              }}
            />
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--ink-2)' }}>
              {/* runtime resolution shown by browser; we just label */}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
