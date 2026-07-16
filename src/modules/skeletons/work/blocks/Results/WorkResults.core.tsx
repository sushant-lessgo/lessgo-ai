// src/modules/skeletons/work/blocks/Results/WorkResults.core.tsx
// SINGLE-SOURCE results layout (granth .core pattern). PLAIN server-safe module —
// renders through injected `E`. This is the STANDALONE optional `results` section
// (workElementContract.results) — distinct from the `proof` RESULTS shape, but it
// renders the SAME big-number metrics grammar, so it REUSES the proof-results CSS
// (WORK_PROOF_RESULTS_STYLES) per the plan ("thin — may reuse Proof/Results styles").
//   scalars — eyebrow · heading · lead
//   collection — metrics[] { id, value, label }
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries `data-sid`
// (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_PROOF_RESULTS_STYLES } from '../Proof/styles';

export interface WorkResultsMetric { id: string; value?: string; label?: string }

export interface WorkResultsContent {
  eyebrow?: string;
  heading?: string;
  lead?: string;
  metrics?: WorkResultsMetric[];
}

export function WorkResultsCore({
  content, E, sectionId,
}: { content: WorkResultsContent; E: WorkPrimitives; sectionId: string }) {
  const metrics = content.metrics || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_PROOF_RESULTS_STYLES }} />
      <section className="wk-proof-results" data-sid={sectionId} data-section-id={sectionId} data-wk-results="">
        <div className="wk-proof-results__in">
          <div className="wk-proof-results__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-proof-results__eyebrow" placeholder="Outcomes" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-proof-results__heading" placeholder="Results that speak" />
            <E.Txt elementKey="lead" value={content.lead} as="p" multiline
              placeholder="The measurable difference the work made." />
          </div>

          <E.List collectionKey="metrics" items={metrics} className="wk-proof-results__grid"
            itemClassName="wk-proof-results__item"
            makeItem={() => ({ value: '', label: '' })} min={1} max={6} addLabel="+ Metric"
            render={(item: WorkResultsMetric) => (
              <>
                <E.Txt elementKey={`metrics.${item.id}.value`} value={item.value} as="span"
                  className="wk-proof-results__value" placeholder="98%" />
                <E.Txt elementKey={`metrics.${item.id}.label`} value={item.label} as="span"
                  className="wk-proof-results__label" placeholder="Client satisfaction" />
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default WorkResultsCore;
