'use client';

// Surge stats band (edit). Dark panel band of big metric figures. Surge-only delta.
// Consumes: eyebrow (opt), headline (opt), metrics[{id,value,label}] collection.
// (Collection key is `metrics`, NOT `stats` — a same-name collection collapses the
// LLM output.) `value` may contain <em> (accent unit) — SurgeEditable preserves it.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { STATS_STYLES } from './styles';

interface StatItem {
  id: string;
  value: string;
  label: string;
}

interface StatsBandContent {
  eyebrow: string;
  headline: string;
  metrics: StatItem[];
}

interface StatsBandProps {
  sectionId: string;
}

export default function StatsBand({ sectionId }: StatsBandProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate, isExcluded } =
    useServiceBlock<StatsBandContent>({ sectionId });

  const metrics = blockContent.metrics || [];

  const updateField = (id: string, key: keyof StatItem, value: string) => {
    handleCollectionUpdate('metrics', metrics.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };

  const addStat = () => {
    if (metrics.length >= 4) return;
    handleCollectionUpdate('metrics', [
      ...metrics,
      { id: `st${Date.now()}`, value: '100<em>%</em>', label: 'New metric' },
    ]);
  };

  const removeStat = (id: string) => {
    if (metrics.length <= 2) return;
    handleCollectionUpdate('metrics', metrics.filter((s) => s.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STATS_STYLES }} />
      <section className="sg-stats" data-section-id={sectionId}>
        {(blockContent.eyebrow || blockContent.headline || (mode === 'edit' && (!isExcluded('eyebrow') || !isExcluded('headline')))) && (
          <div className="sg-stats__head">
            {(blockContent.eyebrow || (mode === 'edit' && !isExcluded('eyebrow'))) && (
              <SurgeEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey="eyebrow"
                value={blockContent.eyebrow}
                onSave={(v) => handleContentUpdate('eyebrow', v)}
                enterBehavior="save"
                className="sg-stats__eyebrow"
                placeholder="By the numbers"
              />
            )}
            {(blockContent.headline || (mode === 'edit' && !isExcluded('headline'))) && (
              <SurgeEditable
                as="h2"
                mode={mode}
                sectionId={sectionId}
                elementKey="headline"
                value={blockContent.headline}
                onSave={(v) => handleContentUpdate('headline', v)}
                enterBehavior="save"
                className="sg-stats__title"
                placeholder="The numbers we moved"
              />
            )}
          </div>
        )}
        <div className="sg-stats__inner">
          {metrics.map((s) => (
            <div key={s.id} className="sg-stat">
              <SurgeEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey={`metrics_value_${s.id}`}
                value={s.value}
                onSave={(v) => updateField(s.id, 'value', v)}
                enterBehavior="save"
                className="sg-stat__big"
                placeholder="9.2<em>M</em>"
              />
              <SurgeEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey={`metrics_label_${s.id}`}
                value={s.label}
                onSave={(v) => updateField(s.id, 'label', v)}
                enterBehavior="save"
                className="sg-stat__lbl"
                placeholder="Impressions generated"
              />
              {mode === 'edit' && metrics.length > 2 && (
                <button
                  type="button"
                  className="sg-stat__remove"
                  onClick={() => removeStat(s.id)}
                  aria-label="Remove stat"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {mode === 'edit' && metrics.length < 4 && (
            <button type="button" className="sg-stat sg-stat--add" onClick={addStat}>
              + Add stat
            </button>
          )}
        </div>
      </section>
    </>
  );
}
