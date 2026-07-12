'use client';

// src/app/dev/blocks/TemplateBlocksStage.tsx
// Generic per-template block gallery + screenshot-parity stage (template-factory
// phase 7). Generalized from the Meridian-only MeridianBlocksStage: takes a
// templateId, async-loads that template's module from the registry, and for every
// enrolled section (from the phase-2 `blockMocks` registry) renders BOTH the EDIT
// block (`resolveBlock(type,'edit')`, driven off a seeded edit store in
// `mode:'preview'`) and the PUBLISHED block (`resolveBlock(type,'published')`,
// flat props) stacked behind stable band labels. A palette / variant / knob
// switcher themes the whole stage via the template's ThemeInjector.
//
// SSR-safety: the heavy subtree (ThemeInjector + EditProvider + store) is gated
// behind the async-loaded module (`mod` state set in an effect), so the server
// only ever renders the "Loading…" placeholder — the store provider never mounts
// server-side (same guarantee the old MeridianBlocksClient got from
// dynamic({ ssr:false }), achieved here by construction so one generic component
// serves every template + both routes).
//
// PARITY HARNESS: each band is wrapped in a node carrying
// `data-parity-section="<type>"` + `data-parity-band="edit|published"` — the
// stable selectors `e2e/parity.spec.ts` screenshots + pixel-diffs edit-vs-published.
// The `?parityBreak=1` dev flag injects a small style divergence into the EDIT
// band ONLY: a PERMANENT negative control the spec asserts the diff catches.
// Data attrs + the (default-off) break are pixel-neutral, so parity holds normally.

import { useEffect, useMemo, useState } from 'react';
import { EditProvider, EditStoreGate } from '@/components/EditProvider';
import { useEditStore } from '@/hooks/useEditStore';
import { preloadTemplate } from '@/modules/templates/registry';
import type { TemplateModule, KnobSelection } from '@/types/template';
import type { TemplateId } from '@/types/service';
import { BLOCK_MOCKS, type BlockMockSection } from '@/modules/templates/blockMocks';

// ── seeded-break negative control (permanent) ────────────────────────────────
// Small, definite style divergence injected into the EDIT band only when
// ?parityBreak=1: a few-px offset in BOTH axes. Small (simulates a real one-block
// layout bug) yet — because it shifts every content edge across the full band —
// reliably far above the anti-aliasing threshold, so the parity spec proves the
// diff CATCHES a real CSS/layout divergence with clear margin. Off by default, so
// parity holds normally. (A wrapper `background` is intentionally NOT used: the
// block paints its own opaque surface over the wrapper, so a tint is a no-op.)
const PARITY_BREAK_STYLE: React.CSSProperties = {
  transform: 'scale(1.03)',
};

function readParityBreak(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('parityBreak') === '1';
}

function buildMockDraft(sections: BlockMockSection[]) {
  const sectionIds: string[] = [];
  const sectionLayouts: Record<string, string> = {};
  const content: Record<string, any> = {};

  for (const s of sections) {
    sectionIds.push(s.sectionId);
    sectionLayouts[s.sectionId] = s.layout;
    const elements: Record<string, any> = {};
    for (const [key, value] of Object.entries(s.content)) {
      elements[key] = { value, content: value };
    }
    content[s.sectionId] = { elements, layout: s.layout, backgroundType: 'neutral' };
  }

  return { finalContent: { sections: sectionIds, sectionLayouts, content } };
}

/** Seeds the edit store with every section (mode:'preview'), then renders. */
function StoreSeed({ sections, tokenId, children }: { sections: BlockMockSection[]; tokenId: string; children: React.ReactNode }) {
  const { loadFromDraft, setMode } = useEditStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadFromDraft(buildMockDraft(sections), tokenId);
      // Preview (not 'edit'): renders the static, marker-emitting path with NO
      // editing chrome (add/remove affordances, contentEditable carets) — the
      // only render that is a fair VISUAL match to the published block.
      setMode('preview');
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, [loadFromDraft, setMode, sections, tokenId]);

  if (!ready) return <div style={{ padding: 32, color: 'var(--bone-3)', fontFamily: 'var(--font-mono)' }}>Seeding store…</div>;
  return <>{children}</>;
}

function BandLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-parity-switcher-ignore=""
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

function Blocks({ mod, sections, parityBreak }: { mod: TemplateModule; sections: BlockMockSection[]; parityBreak: boolean }) {
  return (
    <div style={{ background: 'var(--ink)', color: 'var(--bone)', fontFamily: 'var(--font-body)', minHeight: '100vh', paddingTop: 64 }}>
      {sections.map((s) => {
        const Edit = mod.resolveBlock(s.sectionType, 'edit', s.layout);
        const Published = mod.resolveBlock(s.sectionType, 'published', s.layout);
        return (
          <section key={s.sectionId} style={{ borderBottom: '1px solid var(--line-strong)' }}>
            <BandLabel>{s.layout} · {s.sectionType} · edit</BandLabel>
            <div
              data-parity-section={s.sectionType}
              data-parity-band="edit"
              style={parityBreak ? PARITY_BREAK_STYLE : undefined}
            >
              {Edit && <Edit sectionId={s.sectionId} />}
            </div>
            <BandLabel>{s.layout} · {s.sectionType} · published</BandLabel>
            <div data-parity-section={s.sectionType} data-parity-band="published">
              {Published && <Published sectionId={s.sectionId} {...s.content} />}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Switcher({
  mod, paletteId, variantId, knobs,
  onPalette, onVariant, onKnob,
}: {
  mod: TemplateModule;
  paletteId: string;
  variantId: string;
  knobs: KnobSelection;
  onPalette: (p: string) => void;
  onVariant: (v: string) => void;
  onKnob: (axis: string, value: string) => void;
}) {
  const palettes = Object.keys(mod.paletteImageKeywords ?? {});
  const knobAxes = mod.knobs?.axes ?? {};
  const selStyle: React.CSSProperties = {
    background: 'var(--ink-2)', color: 'var(--bone)', border: '1px solid var(--line-strong)',
    borderRadius: 6, padding: '4px 6px', fontFamily: 'var(--font-mono)', fontSize: 11,
  };
  return (
    <div
      data-parity-switcher=""
      style={{
        position: 'fixed', top: 12, right: 12, zIndex: 100,
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', maxWidth: '70vw',
        background: 'var(--ink-1)', border: '1px solid var(--line-strong)',
        borderRadius: 12, boxShadow: 'var(--shadow-menu)', padding: '10px 14px',
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--bone-2)',
      }}
    >
      {palettes.length > 0 && (
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          palette
          <select value={paletteId} onChange={(e) => onPalette(e.target.value)} style={selStyle}>
            {palettes.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      )}
      <div style={{ display: 'flex', gap: 4 }}>
        {mod.variants.map((v) => (
          <button
            key={v.id}
            onClick={() => onVariant(v.id)}
            style={{
              padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              background: v.id === variantId ? 'var(--accent)' : 'var(--ink-2)',
              color: v.id === variantId ? 'var(--accent-ink)' : 'var(--bone-2)',
              border: `1px solid ${v.id === variantId ? 'var(--accent)' : 'var(--line-strong)'}`,
            }}
          >
            {v.id}
          </button>
        ))}
      </div>
      {Object.entries(knobAxes).map(([axis, values]) => (
        <label key={axis} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {axis}
          <select
            value={(knobs as Record<string, string>)[axis] ?? ''}
            onChange={(e) => onKnob(axis, e.target.value)}
            style={selStyle}
          >
            {(values ?? []).map((val) => <option key={val} value={val}>{val}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

/**
 * Generic block-gallery + parity stage for one template. Renders nothing heavy on
 * the server (module gated behind `mod` state) — the store subtree only mounts
 * client-side, so this is directly loadable on a fresh URL for every template.
 */
export default function TemplateBlocksStage({ templateId }: { templateId: TemplateId }) {
  const [mod, setMod] = useState<TemplateModule | null>(null);
  const [paletteId, setPaletteId] = useState<string>('');
  const [variantId, setVariantId] = useState<string>('');
  const [knobs, setKnobs] = useState<KnobSelection>({});

  const sections = BLOCK_MOCKS[templateId] ?? [];
  const parityBreak = useMemo(readParityBreak, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const m = await preloadTemplate(templateId);
      if (cancelled) return;
      setPaletteId(m.defaultPaletteId);
      setVariantId(m.defaultVariantId);
      setMod(m);
    })();
    return () => { cancelled = true; };
  }, [templateId]);

  if (!mod) {
    return (
      <div style={{ padding: 32, paddingTop: 96, color: 'var(--bone-3)', fontFamily: 'var(--font-mono)', background: 'var(--ink)', minHeight: '100vh' }}>
        Loading {templateId} blocks…
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div style={{ padding: 32, paddingTop: 96, color: 'var(--bone-3)', fontFamily: 'var(--font-mono)', background: 'var(--ink)', minHeight: '100vh' }}>
        No block mocks enrolled for “{templateId}”. Add them under src/modules/templates/blockMocks/.
      </div>
    );
  }

  const ThemeInjector = mod.ThemeInjector;
  const tokenId = `dev-blocks-${templateId}`;

  return (
    <ThemeInjector paletteId={paletteId} variantId={variantId} knobs={knobs}>
      <Switcher
        mod={mod}
        paletteId={paletteId}
        variantId={variantId}
        knobs={knobs}
        onPalette={setPaletteId}
        onVariant={setVariantId}
        onKnob={(axis, value) => setKnobs((prev) => ({ ...prev, [axis]: value } as KnobSelection))}
      />
      <EditProvider tokenId={tokenId} options={{ showLoadingState: false, showErrorBoundary: false }}>
        <EditStoreGate fallback={<div style={{ padding: 32, color: 'var(--bone-3)' }}>Loading editor…</div>}>
          <StoreSeed sections={sections} tokenId={tokenId}>
            <Blocks mod={mod} sections={sections} parityBreak={parityBreak} />
          </StoreSeed>
        </EditStoreGate>
      </EditProvider>
    </ThemeInjector>
  );
}
