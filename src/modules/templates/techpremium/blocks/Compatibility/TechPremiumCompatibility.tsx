'use client';

// src/modules/templates/techpremium/blocks/Compatibility/TechPremiumCompatibility.tsx
// TechPremium compatibility: 2-col — left = eyebrow/h2/lede + chips; right = the
// signature live-readout (only if metrics present). Edit mode. Surface paper.
// Consumes CompatibilityChips (chips[] + readout_* elements + readout_metrics[]).

import React from 'react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { TechPremiumReadout, type ReadoutMetric } from '../Readout/TechPremiumReadout';
import { STYLES } from './styles';

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

