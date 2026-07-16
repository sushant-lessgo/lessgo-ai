// src/modules/skeletons/work/blocks/Proof/WorkProofResults.core.tsx
// SINGLE-SOURCE proof layout (granth .core pattern) — the RESULTS proof SHAPE (a
// big-number metrics row). PLAIN server-safe module; renders through injected `E`.
//
// Binds the frozen `proof` RESULTS-shape contract (workProofShapeContracts.results):
//   scalars — eyebrow · heading
//   collection — metrics[] { id, value, label }
// This reads a DIFFERENT collection (`metrics`) than testimonials (`quotes`) or
// logos (`logos`), so it carries a DISTINCT copyShape and is NEVER blind-swapped.
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries `data-sid`
// + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_PROOF_RESULTS_STYLES } from './styles';

export interface WorkProofMetric { id: string; value?: string; label?: string }

export interface WorkProofResultsContent {
  eyebrow?: string;
  heading?: string;
  metrics?: WorkProofMetric[];
}

export function WorkProofResultsCore({
  content, E, sectionId,
}: { content: WorkProofResultsContent; E: WorkPrimitives; sectionId: string }) {
  const metrics = content.metrics || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_PROOF_RESULTS_STYLES }} />
      <section className="wk-proof-results" data-sid={sectionId} data-section-id={sectionId} data-wk-proof-results="">
        <div className="wk-proof-results__in">
          <div className="wk-proof-results__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-proof-results__eyebrow" placeholder="The numbers" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-proof-results__heading" placeholder="Results that speak" />
          </div>

          <E.List collectionKey="metrics" items={metrics} className="wk-proof-results__grid"
            itemClassName="wk-proof-results__item"
            makeItem={() => ({ value: '', label: '' })} min={1} max={6} addLabel="+ Metric"
            render={(item: WorkProofMetric) => (
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

export default WorkProofResultsCore;
