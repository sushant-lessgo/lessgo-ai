'use client';

// Surge CaseStudies (edit). 2-col grid of result cards: client + tag + result
// headline + rising sparkline + 3-up metrics. Surge-only delta section.
// NOTE: metrics/client are PLACEHOLDERED by the AI ([Client] / +XX% [metric]) and
// replaced by the founder — this block just renders whatever strings arrive.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { CASES_STYLES, SPARK_PATH } from './styles';

interface CaseMetric { value: string; label: string; }
interface CaseItem {
  id: string;
  client: string;
  client_meta: string;
  tag: string;
  headline: string;
  metrics: CaseMetric[];
}
interface ResultCaseCardsContent {
  eyebrow: string;
  headline: string;
  lede: string;
  cases: CaseItem[];
}

function Spark() {
  return (
    <svg className="sg-spark" viewBox="0 0 200 38" preserveAspectRatio="none" aria-hidden="true">
      <path d={SPARK_PATH} fill="none" stroke="var(--pos)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="200" cy="3" r="3.4" fill="var(--pos)" />
    </svg>
  );
}

export default function ResultCaseCards({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate, isExcluded } =
    useServiceBlock<ResultCaseCardsContent>({ sectionId });

  const cases = blockContent.cases || [];

  const updateCase = (id: string, key: keyof Omit<CaseItem, 'metrics'>, value: string) =>
    handleCollectionUpdate('cases', cases.map((c) => (c.id === id ? { ...c, [key]: value } : c)));

  const updateMetric = (id: string, idx: number, key: keyof CaseMetric, value: string) =>
    handleCollectionUpdate(
      'cases',
      cases.map((c) =>
        c.id === id
          ? { ...c, metrics: (c.metrics || []).map((m, i) => (i === idx ? { ...m, [key]: value } : m)) }
          : c
      )
    );

  const addCase = () => {
    handleCollectionUpdate('cases', [
      ...cases,
      {
        id: `c${Date.now()}`,
        client: '[Client]',
        client_meta: 'Industry · City',
        tag: 'Channel',
        headline: 'The result you delivered, in one line.',
        metrics: [
          { value: '+XX% <em>[metric]</em>', label: 'Metric' },
          { value: 'X.X×', label: 'Metric' },
          { value: '+XX', label: 'Metric' },
        ],
      },
    ]);
  };
  const removeCase = (id: string) =>
    handleCollectionUpdate('cases', cases.filter((c) => c.id !== id));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CASES_STYLES }} />
      <section className="sg-section" data-section-id={sectionId}>
        <div className="sg-sec-head">
          {(blockContent.eyebrow || (mode === 'edit' && !isExcluded('eyebrow'))) && (
            <SurgeEditable
              as="div" mode={mode} sectionId={sectionId} elementKey="eyebrow"
              value={blockContent.eyebrow} onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save" className="sg-sec-eyebrow" placeholder="Selected work"
            />
          )}
          <SurgeEditable
            as="h2" mode={mode} sectionId={sectionId} elementKey="headline"
            value={blockContent.headline} onSave={(v) => handleContentUpdate('headline', v)}
            enterBehavior="save" className="sg-sec-title" placeholder="The proof is the <em>graph going up</em>"
          />
          {(blockContent.lede || (mode === 'edit' && !isExcluded('lede'))) && (
            <SurgeEditable
              as="p" mode={mode} sectionId={sectionId} elementKey="lede"
              value={blockContent.lede} onSave={(v) => handleContentUpdate('lede', v)}
              multiline className="sg-sec-dek"
              placeholder="Real clients, real numbers — replace the placeholders with figures you can defend."
            />
          )}
        </div>

        <div className="sg-cases">
          {cases.map((c) => {
            const metrics = c.metrics || [];
            const initial = (c.client || '?').replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase() || '?';
            return (
              <article key={c.id} className="sg-case">
                {mode === 'edit' && cases.length > 1 && (
                  <button type="button" className="sg-x-remove" onClick={() => removeCase(c.id)} aria-label="Remove case">×</button>
                )}
                <div className="sg-case__top">
                  <div className="sg-case__client">
                    <span className="sg-case__mark">{initial}</span>
                    <div>
                      <b>
                        <SurgeEditable
                          as="span" mode={mode} sectionId={sectionId} elementKey={`cases_client_${c.id}`}
                          value={c.client} onSave={(v) => updateCase(c.id, 'client', v)} enterBehavior="save"
                          placeholder="[Client]"
                        />
                      </b>
                      <small>
                        <SurgeEditable
                          as="span" mode={mode} sectionId={sectionId} elementKey={`cases_client_meta_${c.id}`}
                          value={c.client_meta} onSave={(v) => updateCase(c.id, 'client_meta', v)} enterBehavior="save"
                          placeholder="Industry · City"
                        />
                      </small>
                    </div>
                  </div>
                  <SurgeEditable
                    as="span" mode={mode} sectionId={sectionId} elementKey={`cases_tag_${c.id}`}
                    value={c.tag} onSave={(v) => updateCase(c.id, 'tag', v)} enterBehavior="save"
                    className="sg-case__tag" placeholder="Channel"
                  />
                </div>
                <SurgeEditable
                  as="p" mode={mode} sectionId={sectionId} elementKey={`cases_headline_${c.id}`}
                  value={c.headline} onSave={(v) => updateCase(c.id, 'headline', v)} multiline
                  className="sg-case__headline" placeholder="The result you delivered, in one line."
                />
                <Spark />
                <div className="sg-case__metrics">
                  {metrics.map((m, i) => (
                    <div key={i} className="sg-case__metric">
                      <SurgeEditable
                        as="div" mode={mode} sectionId={sectionId} elementKey={`cases_${c.id}_metric_${i}_value`}
                        value={m.value} onSave={(v) => updateMetric(c.id, i, 'value', v)} enterBehavior="save"
                        className="v" placeholder="+XX% <em>[metric]</em>"
                      />
                      <SurgeEditable
                        as="div" mode={mode} sectionId={sectionId} elementKey={`cases_${c.id}_metric_${i}_label`}
                        value={m.label} onSave={(v) => updateMetric(c.id, i, 'label', v)} enterBehavior="save"
                        className="l" placeholder="Metric"
                      />
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
          {mode === 'edit' && (
            <button type="button" className="sg-case sg-case__add" onClick={addCase}>+ Add case study</button>
          )}
        </div>
      </section>
    </>
  );
}
