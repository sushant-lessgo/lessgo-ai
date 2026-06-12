'use client';

// src/app/dev/meridian/MeridianDemoClient.tsx
// Demo body: palette × variant switcher + sample surfaces / type / accent /
// radius / spacing. Verifies MeridianThemeInjector resolves all CSS vars, loads
// all three fonts, and that variant switching rescales tokens (radii on
// marketing, full inversion on light) and accent tracks palette + light overrides.

import { useState } from 'react';
import { MeridianThemeInjector } from '@/modules/templates/meridian/ThemeInjector';
import { meridianPaletteConfigs } from '@/modules/templates/meridian/palettes';
import {
  meridianPalettes,
  meridianVariants,
  defaultMeridianPalette,
  defaultMeridianVariant,
  type MeridianPalette,
  type MeridianVariant,
} from '@/types/product';

export function MeridianDemoClient() {
  const [paletteId, setPaletteId] = useState<MeridianPalette>(defaultMeridianPalette);
  const [variantId, setVariantId] = useState<MeridianVariant>(defaultMeridianVariant);

  return (
    <MeridianThemeInjector paletteId={paletteId} variantId={variantId}>
      <div
        style={{
          background: 'var(--ink)',
          color: 'var(--bone)',
          fontFamily: 'var(--font-body)',
          minHeight: '100vh',
          padding: 'var(--s-8) var(--sec-pad-x)',
        }}
      >
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
          <header style={{ marginBottom: 'var(--s-8)' }}>
            <Eyebrow>Phase 1 · Meridian tokens</Eyebrow>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(48px, 7vw, 88px)',
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                margin: 'var(--s-4) 0 var(--s-3)',
                color: 'var(--bone)',
              }}
            >
              Ship like it was <em>art-directed</em>.
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 21,
                lineHeight: 1.5,
                color: 'var(--bone-2)',
                maxWidth: '56ch',
                margin: 0,
              }}
            >
              Verifying CSS vars resolve, the three fonts load, palette tracks{' '}
              <code style={monoInline}>data-palette</code>, and variants rescale via{' '}
              <code style={monoInline}>data-variant</code>.
            </p>
          </header>

          <Controls
            paletteId={paletteId}
            variantId={variantId}
            onPalette={setPaletteId}
            onVariant={setVariantId}
          />

          <SurfaceSamples />
          <TypeScale />
          <ColorSwatches />
          <RadiusRuler />
          <SpacingRuler />
        </div>
      </div>
    </MeridianThemeInjector>
  );
}

const monoInline: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.85em',
  background: 'var(--ink-1)',
  border: '1px solid var(--line)',
  borderRadius: 4,
  padding: '1px 6px',
  color: 'var(--bone)',
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--bone-3)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 10px var(--accent)',
        }}
      />
      {children}
    </div>
  );
}

function Controls({
  paletteId,
  variantId,
  onPalette,
  onVariant,
}: {
  paletteId: MeridianPalette;
  variantId: MeridianVariant;
  onPalette: (id: MeridianPalette) => void;
  onVariant: (id: MeridianVariant) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--s-6)',
        marginBottom: 'var(--s-7)',
        padding: 'var(--s-5)',
        background: 'var(--ink-1)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--line)',
      }}
    >
      <div>
        <Label>Palette</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'var(--s-3)' }}>
          {meridianPalettes.map((id) => {
            const active = id === paletteId;
            return (
              <button
                key={id}
                onClick={() => onPalette(id)}
                aria-pressed={active}
                title={id}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: meridianPaletteConfigs[id].accent,
                  border: active ? '2px solid var(--bone)' : '1px solid var(--line)',
                  boxShadow: active ? '0 0 0 2px var(--ink-1), 0 0 0 3px var(--bone)' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <Label>Variant</Label>
        <div style={{ display: 'flex', gap: 6, marginTop: 'var(--s-3)' }}>
          {meridianVariants.map((id) => {
            const active = id === variantId;
            return (
              <button
                key={id}
                onClick={() => onVariant(id)}
                aria-pressed={active}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '9px 14px',
                  textTransform: 'capitalize',
                  color: active ? 'var(--accent-ink)' : 'var(--bone-2)',
                  background: active ? 'var(--accent)' : 'transparent',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                }}
              >
                {id}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--bone-3)',
      }}
    >
      {children}
    </div>
  );
}

function SurfaceSamples() {
  return (
    <section
      style={{
        background: 'var(--ink)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--s-7)',
        marginBottom: 'var(--s-6)',
      }}
    >
      <Eyebrow>Surfaces · buttons · card</Eyebrow>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: 'var(--s-6)',
          marginTop: 'var(--s-5)',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 44,
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
              margin: '0 0 var(--s-3)',
              color: 'var(--bone)',
            }}
          >
            Every line is <em>load-bearing</em>.
          </h2>
          <p style={{ color: 'var(--bone-2)', maxWidth: '60ch', margin: 0, lineHeight: 1.55 }}>
            Hairline geometry, mono annotation, a single accent used with discipline.
            Surfaces step from <code style={monoInline}>--ink</code> to{' '}
            <code style={monoInline}>--ink-2</code> by elevation, not by band.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 'var(--s-5)', alignItems: 'center' }}>
            <button style={btnPrimary}>Start building<span style={{ fontFamily: 'var(--font-mono)' }}>→</span></button>
            <button style={btnGhost}>Read the docs</button>
          </div>
        </div>

        <aside
          style={{
            background: 'linear-gradient(180deg, var(--ink-1), var(--ink))',
            padding: 'var(--s-5)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--line-strong)',
          }}
        >
          <Label>Card · --ink-1 raised</Label>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 40,
              letterSpacing: '-0.03em',
              color: 'var(--bone)',
              marginTop: 'var(--s-3)',
            }}
          >
            <sup style={{ fontSize: 18, color: 'var(--bone-2)' }}>$</sup>29
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--bone-3)' }}> /mo</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--s-4) 0 0' }}>
            {['Unlimited projects', 'Edge deploys', 'Audit log'].map((f) => (
              <li
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13.5,
                  color: 'var(--bone-2)',
                  padding: '8px 0',
                  borderTop: '1px solid var(--line-soft)',
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '1px solid var(--accent)',
                    flexShrink: 0,
                  }}
                />
                {f}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-display)',
  fontWeight: 500,
  fontSize: 14,
  padding: '12px 18px',
  background: 'var(--accent)',
  color: 'var(--accent-ink)',
  border: '1px solid var(--accent)',
  borderRadius: 'var(--r-md)',
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 500,
  fontSize: 14,
  padding: '12px 18px',
  background: 'transparent',
  color: 'var(--bone)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--r-md)',
  cursor: 'pointer',
};

function TypeScale() {
  const rows: Array<{ label: string; family: string; sample: string; size: number; weight: number }> = [
    { label: 'display · Inter Tight', family: 'var(--font-display)', sample: 'Ship on Friday.', size: 40, weight: 600 },
    { label: 'body · Inter', family: 'var(--font-body)', sample: 'A workhorse for a reason; we let it do its job.', size: 18, weight: 400 },
    { label: 'mono · JetBrains Mono', family: 'var(--font-mono)', sample: 'const accent = oklch(0.78 0.17 155);', size: 14, weight: 400 },
  ];
  return (
    <section style={{ marginBottom: 'var(--s-6)' }}>
      <Eyebrow>Type · three fonts must look distinct</Eyebrow>
      <div style={{ marginTop: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
        {rows.map((r) => (
          <div key={r.label}>
            <Label>{r.label}</Label>
            <div
              style={{
                fontFamily: r.family,
                fontSize: r.size,
                fontWeight: r.weight,
                letterSpacing: r.family.includes('display') ? '-0.025em' : '0',
                color: 'var(--bone)',
                marginTop: 6,
              }}
            >
              {r.sample}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ColorSwatches() {
  const swatches = [
    '--accent', '--accent-ink', '--accent-dim',
    '--ink', '--ink-1', '--ink-2',
    '--bone', '--bone-2', '--bone-3', '--line-strong',
  ];
  return (
    <section style={{ marginBottom: 'var(--s-6)' }}>
      <Eyebrow>Color tokens</Eyebrow>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 'var(--s-3)',
          marginTop: 'var(--s-4)',
        }}
      >
        {swatches.map((name) => (
          <div
            key={name}
            style={{
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ height: 64, background: `var(${name})` }} />
            <div
              style={{
                padding: '8px 10px',
                background: 'var(--ink-1)',
                fontSize: 11,
                color: 'var(--bone-2)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {name}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RadiusRuler() {
  const radii = ['--r-sm', '--r-md', '--r-lg', '--r-xl'];
  return (
    <section style={{ marginBottom: 'var(--s-6)' }}>
      <Eyebrow>Radius · grows under the marketing variant</Eyebrow>
      <div style={{ display: 'flex', gap: 'var(--s-4)', marginTop: 'var(--s-4)' }}>
        {radii.map((r) => (
          <div key={r} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                background: 'var(--ink-2)',
                border: '1px solid var(--line-strong)',
                borderRadius: `var(${r})`,
              }}
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--bone-3)', marginTop: 8 }}>
              {r}
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
    <section>
      <Eyebrow>Spacing scale</Eyebrow>
      <div style={{ marginTop: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        {steps.map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--bone-3)', width: 56 }}>
              --{s}
            </span>
            <span
              style={{
                height: 10,
                background: 'var(--accent-dim)',
                borderLeft: '2px solid var(--accent)',
                width: `var(--${s})`,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
