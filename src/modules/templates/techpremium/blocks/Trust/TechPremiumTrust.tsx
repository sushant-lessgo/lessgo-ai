'use client';

// TechPremium Trust strip (Phase 4b) — headline metrics + customer logo rail.
// Edit mode. Surface paper-2. Ported from naayom.blocks.css .trust*.

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';

interface Metric { id: string; value: string; label: string }
interface Logo { id: string; name: string; image: string }
interface Content { metrics: Metric[]; logos: Logo[] }
interface Props { sectionId: string }
const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

export default function TechPremiumTrust({ sectionId }: Props) {
  const { mode, blockContent, handleCollectionUpdate } = useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const metrics = blockContent.metrics || [];
  const logos = blockContent.logos || [];
  const setM = (id: string, k: keyof Metric, v: string) => handleCollectionUpdate('metrics', metrics.map((m) => (m.id === id ? { ...m, [k]: v } : m)));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TRUST_STYLES }} />
      <section className="tp-trust" data-section-id={sectionId}>
        <div className="tp-trust__inner">
          {(metrics.length > 0 || edit) && (
            <div className="tp-trust__metrics">
              {metrics.map((m) => (
                <div key={m.id} className="tp-trust__m">
                  <TechPremiumEditable as="span" className="tp-trust__v" mode={mode} sectionId={sectionId} elementKey={`metrics_value_${m.id}`} value={m.value} onSave={(v) => setM(m.id, 'value', v)} enterBehavior="save" placeholder="+50%" />
                  <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`metrics_label_${m.id}`} value={m.label} onSave={(v) => setM(m.id, 'label', v)} enterBehavior="save" placeholder="yield uplift" />
                  {edit && <button type="button" className="tp-x" onClick={() => handleCollectionUpdate('metrics', metrics.filter((x) => x.id !== m.id))}>×</button>}
                </div>
              ))}
              {edit && metrics.length < 3 && <button type="button" className="tp-add" onClick={() => handleCollectionUpdate('metrics', [...metrics, { id: rid('m'), value: '00%', label: 'metric' }])}>+ metric</button>}
            </div>
          )}
          <div className="tp-trust__div" aria-hidden />
          <div className="tp-trust__logos">
            {logos.map((l) => (
              <span key={l.id} className="tp-trust__logo">
                {l.image ? <img src={l.image} alt={l.name} /> : <span className="tp-trust__logoph">{l.name || 'Logo'}</span>}
                {edit && <button type="button" className="tp-x" onClick={() => handleCollectionUpdate('logos', logos.filter((x) => x.id !== l.id))}>×</button>}
              </span>
            ))}
            {edit && logos.length < 8 && <button type="button" className="tp-add" onClick={() => handleCollectionUpdate('logos', [...logos, { id: rid('lg'), name: 'Partner', image: '' }])}>+ logo</button>}
          </div>
        </div>
      </section>
    </>
  );
}

export const TRUST_STYLES = `
.tp-trust { padding: 0 var(--pad-x); }
.tp-trust__inner { display:grid; grid-template-columns:auto 1px 1fr; gap:clamp(24px,4vw,56px); align-items:center; padding:26px 0; max-width:var(--max-w); margin:0 auto; }
.tp-trust__metrics { display:flex; gap:28px; flex-wrap:wrap; }
.tp-trust__m { position:relative; }
.tp-trust__m .tp-trust__v { font-family:var(--font-display); font-weight:700; font-size:34px; letter-spacing:-0.03em; color:var(--forest); line-height:1; display:block; }
.tp-trust__m span { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-3); margin-top:6px; display:block; }
.tp-trust__div { background:var(--line); height:46px; }
.tp-trust__logos { display:flex; flex-wrap:wrap; align-items:center; gap:14px 18px; }
.tp-trust__logo { position:relative; display:inline-flex; align-items:center; height:30px; }
.tp-trust__logo img { height:28px; object-fit:contain; }
.tp-trust__logoph { font-family:var(--font-mono); font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); border:1px dashed var(--line-2); border-radius:var(--r); padding:6px 12px; }
.tp-x { background:transparent; border:none; color:var(--ink-3); font-size:12px; cursor:pointer; }
.tp-add { background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:4px 8px; border-radius:var(--r); cursor:pointer; }
@media (max-width:760px){ .tp-trust__inner { grid-template-columns:1fr; } .tp-trust__div { display:none; } }
`;
