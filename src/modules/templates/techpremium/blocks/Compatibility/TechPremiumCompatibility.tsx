'use client';

// src/modules/templates/techpremium/blocks/Compatibility/TechPremiumCompatibility.tsx
// TechPremium compatibility: 2-col — left = eyebrow/h2/lede + chips; right = the
// signature live-readout (only if metrics present). Edit mode. Surface paper.
// Consumes CompatibilityChips (chips[] + readout_* elements + readout_metrics[]).

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { TechPremiumReadout, READOUT_STYLES, type ReadoutMetric } from '../Readout/TechPremiumReadout';
import { SEC_HEAD_STYLES } from '../shared/sharedStyles';

interface Chip { id: string; text: string }
interface Metric { id: string; key: string; value: string; unit: string; live: string }
interface Content {
  eyebrow: string; headline: string; lede: string;
  readout_status: string; readout_tone: string; readout_stage: string; readout_caption: string;
  chips: Chip[]; readout_metrics: Metric[];
}
interface Props { sectionId: string }
const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;

export default function TechPremiumCompatibility({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const chips = blockContent.chips || [];
  const metrics = blockContent.readout_metrics || [];

  const updateChip = (id: string, value: string) =>
    handleCollectionUpdate('chips', chips.map((c) => (c.id === id ? { ...c, text: value } : c)));
  const addChip = () => {
    if (chips.length >= 8) return;
    handleCollectionUpdate('chips', [...chips, { id: rid('c'), text: 'New item' }]);
  };
  const removeChip = (id: string) => {
    if (chips.length <= 2) return;
    handleCollectionUpdate('chips', chips.filter((c) => c.id !== id));
  };

  const readoutData = metrics.length > 0 ? {
    statusLabel: blockContent.readout_status,
    statusTone: blockContent.readout_tone,
    stage: blockContent.readout_stage,
    caption: blockContent.readout_caption,
    metrics: metrics.map((m): ReadoutMetric => ({ key: m.key, value: m.value, unit: m.unit, live: m.live })),
  } : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec" data-section-id={sectionId}>
        <div className="tp-sec__inner">
          <div className="tp-compat-in">
            <div className="tp-compat-copy">
              {(blockContent.eyebrow || edit) && (
                <TechPremiumEditable
                  as="span" mode={mode} sectionId={sectionId} elementKey="eyebrow"
                  value={blockContent.eyebrow} onSave={(v) => handleContentUpdate('eyebrow', v)}
                  enterBehavior="save" className="tp-eyebrow" placeholder="Compatibility"
                />
              )}
              <TechPremiumEditable
                as="h2" mode={mode} sectionId={sectionId} elementKey="headline"
                value={blockContent.headline} onSave={(v) => handleContentUpdate('headline', v)}
                enterBehavior="save" className="" placeholder="Works with what you have"
              />
              {(blockContent.lede || edit) && (
                <TechPremiumEditable
                  as="p" mode={mode} sectionId={sectionId} elementKey="lede"
                  value={blockContent.lede} onSave={(v) => handleContentUpdate('lede', v)}
                  multiline className="tp-lede" placeholder="One or two sentences on compatibility."
                />
              )}
              <div className="tp-compat-chips">
                {chips.map((c) => (
                  <span key={c.id} className="tp-compat-chip">
                    <span className="tp-d" />
                    <TechPremiumEditable
                      as="span" mode={mode} sectionId={sectionId} elementKey={`chips_text_${c.id}`}
                      value={c.text} onSave={(v) => updateChip(c.id, v)}
                      enterBehavior="save" placeholder="Item"
                    />
                    {edit && chips.length > 2 && (
                      <button type="button" className="tp-x" onClick={() => removeChip(c.id)} aria-label="Remove item">×</button>
                    )}
                  </span>
                ))}
                {edit && chips.length < 8 && (
                  <button type="button" className="tp-add" onClick={addChip}>+ item</button>
                )}
              </div>
            </div>
            {readoutData && (
              <div className="tp-compat-readout">
                <TechPremiumReadout data={readoutData} />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export const COMPAT_STYLES = `
.tp-sec-head h2, .tp-compat-copy h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
.tp-compat-in{ display:grid; grid-template-columns:0.9fr 1.1fr; gap:clamp(36px,5vw,72px); align-items:center; }
.tp-compat-copy{ display:flex; flex-direction:column; gap:16px; }
.tp-compat-chips{ display:flex; flex-wrap:wrap; gap:12px; margin-top:24px; }
.tp-compat-chip{ display:inline-flex; align-items:center; gap:9px; border:1px solid var(--line-2); border-radius:999px; padding:9px 16px 9px 13px; background:var(--paper); font-size:14px; font-weight:500; color:var(--ink); }
.tp-compat-chip .tp-d{ width:7px; height:7px; border-radius:50%; background:var(--lime-d); }
.tp-compat-readout{ display:grid; gap:14px; }
.tp-x{ background:transparent; border:none; color:var(--ink-3); font-size:12px; cursor:pointer; margin-left:2px; }
.tp-add{ background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:6px 12px; border-radius:999px; cursor:pointer; }
@media (max-width:1040px){ .tp-compat-in{ grid-template-columns:1fr; gap:40px; } }
`;

const STYLES = SEC_HEAD_STYLES + READOUT_STYLES + COMPAT_STYLES;
export { STYLES };
