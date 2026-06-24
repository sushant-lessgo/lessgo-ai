'use client';

// Surge stats band (edit). Dark panel band of big metric figures. Surge-only delta.
// Consumes: eyebrow (opt), headline (opt), stats[{id,value,label}] collection.
// `value` may contain <em> (accent unit) — SurgeEditable preserves it.

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
  stats: StatItem[];
}

interface StatsBandProps {
  sectionId: string;
}

export default function StatsBand({ sectionId }: StatsBandProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useServiceBlock<StatsBandContent>({ sectionId });

  const stats = blockContent.stats || [];

  const updateField = (id: string, key: keyof StatItem, value: string) => {
    handleCollectionUpdate('stats', stats.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };

  const addStat = () => {
    if (stats.length >= 4) return;
    handleCollectionUpdate('stats', [
      ...stats,
      { id: `st${Date.now()}`, value: '100<em>%</em>', label: 'New metric' },
    ]);
  };

  const removeStat = (id: string) => {
    if (stats.length <= 2) return;
    handleCollectionUpdate('stats', stats.filter((s) => s.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STATS_STYLES }} />
      <section className="sg-stats" data-section-id={sectionId}>
        {(blockContent.eyebrow || blockContent.headline || mode === 'edit') && (
          <div className="sg-stats__head">
            {(blockContent.eyebrow || mode === 'edit') && (
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
            {(blockContent.headline || mode === 'edit') && (
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
          {stats.map((s) => (
            <div key={s.id} className="sg-stat">
              <SurgeEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey={`stats_value_${s.id}`}
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
                elementKey={`stats_label_${s.id}`}
                value={s.label}
                onSave={(v) => updateField(s.id, 'label', v)}
                enterBehavior="save"
                className="sg-stat__lbl"
                placeholder="Impressions generated"
              />
              {mode === 'edit' && stats.length > 2 && (
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
          {mode === 'edit' && stats.length < 4 && (
            <button type="button" className="sg-stat sg-stat--add" onClick={addStat}>
              + Add stat
            </button>
          )}
        </div>
      </section>
    </>
  );
}
