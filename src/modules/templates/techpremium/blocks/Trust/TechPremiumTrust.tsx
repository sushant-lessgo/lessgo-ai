'use client';

// TechPremium Trust strip (Phase 4b) — headline metrics + customer logo rail.
// Edit mode. Surface paper-2. Ported from naayom.blocks.css .trust*.

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

interface Metric { id: string; value: string; label: string }
interface Logo { id: string; name: string; image: string }
interface Content { headline: string; metrics: Metric[]; logos: Logo[] }
interface Props { sectionId: string }
const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

export default function TechPremiumTrust({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } = useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const metrics = blockContent.metrics || [];
  const logos = blockContent.logos || [];
  const setM = (id: string, k: keyof Metric, v: string) => handleCollectionUpdate('metrics', metrics.map((m) => (m.id === id ? { ...m, [k]: v } : m)));

  const store = useEditStore() as any;
  const uploadImage = store.uploadImage as ((f: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>) | undefined;
  const save = store.save as (() => Promise<void>) | undefined;
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);
  const setLogo = (id: string, k: keyof Logo, v: string) => handleCollectionUpdate('logos', logos.map((l) => (l.id === id ? { ...l, [k]: v } : l)));
  const onLogoFile = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadImage) return;
    setUploadingId(id);
    try {
      const url = await uploadImage(file);
      if (typeof url === 'string' && url) {
        handleCollectionUpdate('logos', logos.map((l) => (l.id === id ? { ...l, image: url } : l)));
        await save?.();
      }
    } catch (err) { /* surfaced by the store */ }
    finally { setUploadingId(null); }
  };

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
          {metrics.length > 0 && <div className="tp-trust__div" aria-hidden />}
          <div className="tp-trust__right">
            {(blockContent.headline || edit) && (
              <TechPremiumEditable as="span" className="tp-trust__label" mode={mode} sectionId={sectionId} elementKey="headline" value={blockContent.headline} onSave={(v) => handleContentUpdate('headline', v)} enterBehavior="save" placeholder="Trusted by leading growers" />
            )}
            <div className="tp-trust__logos">
            {logos.map((l) => (
              <span key={l.id} className={`tp-trust__logo${edit ? ' is-edit' : ''}`}>
                {l.image ? <img src={l.image} alt={l.name} /> : <span className="tp-trust__logoph">{l.name || 'Logo'}</span>}
                {edit && (
                  <span className="tp-trust__logo-edit">
                    <label className="tp-trust__logo-up">
                      {uploadingId === l.id ? '…' : (l.image ? '⇄' : '↥')}
                      <input type="file" accept="image/*" onChange={(e) => onLogoFile(l.id, e)} hidden disabled={uploadingId === l.id} />
                    </label>
                    <input className="tp-trust__logo-name" value={l.name} onChange={(e) => setLogo(l.id, 'name', e.target.value)} placeholder="Name" />
                    <button type="button" className="tp-x" onClick={() => handleCollectionUpdate('logos', logos.filter((x) => x.id !== l.id))}>×</button>
                  </span>
                )}
              </span>
            ))}
            {edit && logos.length < 8 && <button type="button" className="tp-add" onClick={() => handleCollectionUpdate('logos', [...logos, { id: rid('lg'), name: 'Partner', image: '' }])}>+ logo</button>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export const TRUST_STYLES = `
.tp-trust { padding: 0 var(--pad-x); }
.tp-trust__inner { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:clamp(24px,4vw,56px); padding:30px 0; max-width:var(--max-w); margin:0 auto; }
.tp-trust__metrics { display:flex; gap:28px; flex-wrap:wrap; }
.tp-trust__m { position:relative; }
.tp-trust__m .tp-trust__v { font-family:var(--font-display); font-weight:700; font-size:34px; letter-spacing:-0.03em; color:var(--forest); line-height:1; display:block; }
.tp-trust__m span { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-3); margin-top:6px; display:block; }
.tp-trust__div { background:var(--line); width:1px; height:46px; }
.tp-trust__right { display:flex; flex-direction:column; gap:10px; flex:1; min-width:0; }
.tp-trust__label { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-3); }
.tp-trust__logos { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:24px 40px; }
.tp-trust__logo { position:relative; display:inline-flex; align-items:center; height:auto; }
.tp-trust__logo img { height:48px; max-width:160px; object-fit:contain; }
.tp-trust__logoph { font-family:var(--font-mono); font-size:12px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-3); border:1px dashed var(--line-2); border-radius:var(--r); padding:14px 22px; }
.tp-trust__logo.is-edit { flex-direction:column; align-items:flex-start; height:auto; gap:6px; border:1px dashed var(--line-2); border-radius:var(--r); padding:8px; }
.tp-trust__logo-edit { display:inline-flex; align-items:center; gap:6px; }
.tp-trust__logo-up { display:inline-grid; place-items:center; width:24px; height:24px; border:1px solid var(--line-2); border-radius:var(--r); font-size:12px; color:var(--ink-2); cursor:pointer; }
.tp-trust__logo-up:hover { border-color:var(--forest); color:var(--forest); }
.tp-trust__logo-name { width:96px; font-family:var(--font-mono); font-size:11px; padding:4px 6px; border:1px solid var(--line-2); border-radius:var(--r); color:var(--ink); }
.tp-x { background:transparent; border:none; color:var(--ink-3); font-size:12px; cursor:pointer; }
.tp-add { background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:4px 8px; border-radius:var(--r); cursor:pointer; }
@media (max-width:760px){ .tp-trust__div { display:none; } .tp-trust__logo img { height:38px; } .tp-trust__logos { gap:20px 28px; } }
`;
