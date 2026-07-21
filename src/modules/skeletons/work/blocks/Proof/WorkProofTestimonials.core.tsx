// src/modules/skeletons/work/blocks/Proof/WorkProofTestimonials.core.tsx
// SINGLE-SOURCE proof layout (granth .core pattern), DEFAULT proof shape =
// verbatim testimonials. PLAIN server-safe module — renders through injected `E`.
//
// Binds the FROZEN work-core `proof` contract (workElementContract.proof, the
// GranthCriticsGrid donor shape):
//   scalars — eyebrow · heading · awards_line
//   collection — quotes[] { id, text, source }
// The logos / results proof SHAPES are separate variants (phase 6) — this is only
// the testimonials shape.
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries
// `data-sid` (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_PROOF_STYLES } from './styles';

export interface WorkProofQuote { id: string; text?: string; source?: string }

export interface WorkProofContent {
  eyebrow?: string;
  heading?: string;
  awards_line?: string;
  quotes?: WorkProofQuote[];
}

export function WorkProofTestimonialsCore({
  content, E, sectionId, editable = false,
}: { content: WorkProofContent; E: WorkPrimitives; sectionId: string; editable?: boolean }) {
  const quotes = content.quotes || [];
  const empty = quotes.length === 0;
  // Greyed-placeholder policy (never silently omit): with NO quotes, PUBLISHED
  // omits the whole band (no heading over an empty grid), while the EDITOR shows a
  // visible greyed placeholder card so the owner sees a slot to fill.
  if (empty && !editable) return null;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_PROOF_STYLES }} />
      <section className="wk-proof" data-sid={sectionId} data-section-id={sectionId} data-wk-proof-testimonials="">
        <div className="wk-proof__in">
          <div className="wk-proof__head">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-proof__eyebrow" placeholder="Kind words" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-proof__heading" placeholder="What clients say" />
            <E.Txt elementKey="awards_line" value={content.awards_line} as="p"
              className="wk-proof__awards" placeholder="Awards & recognition" />
          </div>

          {empty && editable && (
            <div className="wk-proof__empty" data-wk-proof-empty="" aria-hidden="true">
              Add a client testimonial — clients&rsquo; words build trust
            </div>
          )}

          <E.List collectionKey="quotes" items={quotes} className="wk-proof__grid"
            itemClassName="wk-proof__card"
            makeItem={() => ({ text: '', source: '' })} min={0} max={3} addLabel="+ Quote"
            render={(item: WorkProofQuote) => (
              <>
                <E.Txt elementKey={`quotes.${item.id}.text`} value={item.text} as="blockquote"
                  className="wk-proof__quote" multiline placeholder="A short line of praise from a client." />
                <E.Txt elementKey={`quotes.${item.id}.source`} value={item.source} as="cite"
                  className="wk-proof__source" placeholder="Client · Company" />
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default WorkProofTestimonialsCore;
