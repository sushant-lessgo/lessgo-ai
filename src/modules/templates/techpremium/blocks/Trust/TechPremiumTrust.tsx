'use client';

// TechPremium Trust strip (Phase 4b) — headline metrics + customer logo rail.
// Edit mode. Surface paper-2. Ported from naayom.blocks.css .trust*.

import React from 'react';
import { TRUST_STYLES } from './styles';
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
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);
  const setLogo = (id: string, k: keyof Logo, v: string) => handleCollectionUpdate('logos', logos.map((l) => (l.id === id ? { ...l, [k]: v } : l)));
  const onLogoFile = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadImage) return;
    setUploadingId(id);
    try {
      // Atomic store-target write: writes logos.<id>.image into the CURRENT store
      // state (+ auto-saves). Avoids the stale-closure clobber a manual
      // handleCollectionUpdate(logos.map(...)) had on rapid/concurrent uploads.
      await uploadImage(file, { sectionId, elementKey: `logos.${id}.image` });
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
            {/* Edit = static, editable single row. Published wraps this in a
                .tp-trust__marquee and duplicates the logo array to auto-scroll —
                an INTENTIONAL edit↔published divergence (logo content is identical;
                published only loops + animates it). Not a dual-renderer parity bug. */}
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

