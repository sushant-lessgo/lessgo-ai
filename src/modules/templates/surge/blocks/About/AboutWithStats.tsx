'use client';

// Surge About (edit). 2-col: left = big display lede + body + mono tag pills;
// right = stacked stat cards. Surge-only delta section.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { ABOUT_STYLES } from './styles';

interface AboutTag { id: string; label: string; }
interface AboutStat { id: string; value: string; label: string; sublabel: string; }

interface AboutWithStatsContent {
  eyebrow: string;
  headline: string;
  lede: string;
  body: string;
  tags: AboutTag[];
  stats: AboutStat[];
}

export default function AboutWithStats({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate, isExcluded } =
    useServiceBlock<AboutWithStatsContent>({ sectionId });

  const tags = blockContent.tags || [];
  const stats = blockContent.stats || [];

  const updateTag = (id: string, value: string) =>
    handleCollectionUpdate('tags', tags.map((t) => (t.id === id ? { ...t, label: value } : t)));
  const addTag = () =>
    handleCollectionUpdate('tags', [...tags, { id: `t${Date.now()}`, label: 'New tag' }]);
  const removeTag = (id: string) =>
    handleCollectionUpdate('tags', tags.filter((t) => t.id !== id));

  const updateStat = (id: string, key: keyof AboutStat, value: string) =>
    handleCollectionUpdate('stats', stats.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  const addStat = () => {
    if (stats.length >= 4) return;
    handleCollectionUpdate('stats', [
      ...stats,
      { id: `st${Date.now()}`, value: '100<em>%</em>', label: 'New stat', sublabel: 'supporting detail' },
    ]);
  };
  const removeStat = (id: string) =>
    handleCollectionUpdate('stats', stats.filter((s) => s.id !== id));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ABOUT_STYLES }} />
      <section className="sg-section" data-section-id={sectionId}>
        <div className="sg-sec-head">
          {(blockContent.eyebrow || (mode === 'edit' && !isExcluded('eyebrow'))) && (
            <SurgeEditable
              as="div" mode={mode} sectionId={sectionId} elementKey="eyebrow"
              value={blockContent.eyebrow} onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save" className="sg-sec-eyebrow" placeholder="About us"
            />
          )}
          <SurgeEditable
            as="h2" mode={mode} sectionId={sectionId} elementKey="headline"
            value={blockContent.headline} onSave={(v) => handleContentUpdate('headline', v)}
            enterBehavior="save" className="sg-sec-title" placeholder="A small senior team, <em>obsessed with the graph</em>"
          />
        </div>

        <div className="sg-about">
          <div>
            <SurgeEditable
              as="p" mode={mode} sectionId={sectionId} elementKey="lede"
              value={blockContent.lede} onSave={(v) => handleContentUpdate('lede', v)}
              multiline className="sg-about__lede"
              placeholder="A one-line statement of what makes you different — wrap the <em>sharp</em> word."
            />
            <SurgeEditable
              as="p" mode={mode} sectionId={sectionId} elementKey="body"
              value={blockContent.body} onSave={(v) => handleContentUpdate('body', v)}
              multiline className="sg-about__body"
              placeholder="A supporting paragraph: who you are, how you work, who you take on."
            />
            <div className="sg-about__tags">
              {tags.map((t) => (
                <span key={t.id} className="sg-about__tag">
                  <SurgeEditable
                    as="span" mode={mode} sectionId={sectionId} elementKey={`tags_label_${t.id}`}
                    value={t.label} onSave={(v) => updateTag(t.id, v)} enterBehavior="save"
                    placeholder="Tag"
                  />
                  {mode === 'edit' && (
                    <button type="button" className="sg-x-remove" style={{ top: -6, right: -6 }} onClick={() => removeTag(t.id)} aria-label="Remove tag">×</button>
                  )}
                </span>
              ))}
              {mode === 'edit' && (
                <button type="button" className="sg-about__add" onClick={addTag}>+ Tag</button>
              )}
            </div>
          </div>

          <div className="sg-about__side">
            {stats.map((s) => (
              <div key={s.id} className="sg-about__stat">
                <SurgeEditable
                  as="div" mode={mode} sectionId={sectionId} elementKey={`stats_value_${s.id}`}
                  value={s.value} onSave={(v) => updateStat(s.id, 'value', v)} enterBehavior="save"
                  className="big" placeholder="3.4<em>×</em>"
                />
                <div className="at">
                  <b>
                    <SurgeEditable
                      as="span" mode={mode} sectionId={sectionId} elementKey={`stats_label_${s.id}`}
                      value={s.label} onSave={(v) => updateStat(s.id, 'label', v)} enterBehavior="save"
                      placeholder="Stat label"
                    />
                  </b>
                  <SurgeEditable
                    as="span" mode={mode} sectionId={sectionId} elementKey={`stats_sublabel_${s.id}`}
                    value={s.sublabel} onSave={(v) => updateStat(s.id, 'sublabel', v)} enterBehavior="save"
                    placeholder="supporting detail"
                  />
                </div>
                {mode === 'edit' && stats.length > 1 && (
                  <button type="button" className="sg-x-remove" onClick={() => removeStat(s.id)} aria-label="Remove stat">×</button>
                )}
              </div>
            ))}
            {mode === 'edit' && stats.length < 4 && (
              <button type="button" className="sg-about__add" onClick={addStat}>+ Add stat</button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
