// src/modules/templates/vestria/blocks/Testimonials/VestriaQuotes.core.tsx
// SINGLE-SOURCE testimonials layout. PLAIN server-safe module — renders only
// through injected primitives (E). Ported from the Vestria mock (.testi): on-dark
// eyebrow block + 3-col bordered quote cards (accent “ mark · quote · dashed-top
// author). Collection is named `testimonials` with quote/author_name/author_role —
// EXACT field names; injectRealTestimonials (parseCopy.ts) targets them.

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { TESTIMONIALS_STYLES } from './styles';

export interface VestriaTestimonial { id: string; quote: string; author_name: string; author_role: string }

export interface VestriaQuotesContent {
  eyebrow?: string;
  headline?: string;
  testimonials?: VestriaTestimonial[];
}

export function VestriaQuotesCore({ content, E }: { content: VestriaQuotesContent; E: VestriaPrimitives }) {
  const quotes = content.testimonials || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TESTIMONIALS_STYLES }} />
      <section className="vs-testi vs-pad">
        <div className="vs-wrap">
          <div className="vs-eyebrow-block" style={{ marginBottom: 0 }}>
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="vs-tag vs-on-dark" placeholder="In Their Words" />
            <E.Txt elementKey="headline" value={content.headline} as="h2"
              className="vs-heading vs-h2" placeholder="Buyers who stopped shopping around." />
          </div>
          <E.List collectionKey="testimonials" items={quotes} className="vs-testi__grid" itemClassName="vs-quote"
            makeItem={() => ({ quote: '', author_name: '', author_role: '' })} min={1} max={3} addLabel="+ Quote"
            render={(item: VestriaTestimonial) => (
              <>
                <div className="vs-quote__mk" aria-hidden="true">&ldquo;</div>
                <E.Txt elementKey={`testimonials.${item.id}.quote`} value={item.quote} as="p"
                  className="vs-quote__p" multiline placeholder="One concrete result, in the customer's own words." />
                <div className="vs-quote__who">
                  <E.Txt elementKey={`testimonials.${item.id}.author_name`} value={item.author_name} as="span"
                    className="vs-quote__nm" placeholder="Name" />
                  <E.Txt elementKey={`testimonials.${item.id}.author_role`} value={item.author_role} as="span"
                    className="vs-quote__rl" placeholder="Role · Company" />
                </div>
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default VestriaQuotesCore;
