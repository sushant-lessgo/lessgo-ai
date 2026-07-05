// src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.core.tsx
// SINGLE-SOURCE lead-form layout. PLAIN server-safe module — copy renders through
// injected primitives (E); the FORM ITSELF arrives as a prebuilt `formNode` from
// each wrapper (edit = inert preview, published = real <form data-lessgo-form>
// wired to form.v1.js), mirroring the TechPremiumContact split. Ported from the
// Vestria mock (#quote): left copy column (tag · h2 · lede · assurance rows) +
// right form card.

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { CONTACT_STYLES } from './styles';

export interface VestriaAssurance { id: string; kicker: string; text: string }

export interface VestriaLeadFormContent {
  tag_text?: string;
  headline?: string;
  lede?: string;
  form_id?: string;
  form_note?: string;
  assurances?: VestriaAssurance[];
}

export function VestriaLeadFormCore({
  content, E, formNode,
}: { content: VestriaLeadFormContent; E: VestriaPrimitives; formNode?: React.ReactNode }) {
  const assurances = content.assurances || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_STYLES }} />
      <section className="vs-lead vs-pad">
        <div className="vs-wrap">
          <div className="vs-lead__grid">
            <div className="vs-lead__copy">
              <E.Txt elementKey="tag_text" value={content.tag_text} as="span"
                className="vs-tag" placeholder="Request a Quote" />
              <E.Txt elementKey="headline" value={content.headline} as="h2"
                className="vs-heading vs-lead__h2" placeholder="Tell us what you need." />
              <E.Txt elementKey="lede" value={content.lede} as="p"
                className="vs-lead__lede" multiline placeholder="Share a few details and we reply within one business day." />
              {assurances.length > 0 && (
                <E.List collectionKey="assurances" items={assurances} className="vs-assur" itemClassName="vs-assur__row"
                  makeItem={() => ({ kicker: '', text: '' })} min={0} max={4} addLabel="+ Assurance"
                  render={(item: VestriaAssurance) => (
                    <>
                      <E.Txt elementKey={`assurances.${item.id}.kicker`} value={item.kicker} as="b"
                        className="vs-assur__k" placeholder="01" />
                      <E.Txt elementKey={`assurances.${item.id}.text`} value={item.text} as="span"
                        multiline placeholder="No obligation — quotes and samples are complimentary." />
                    </>
                  )}
                />
              )}
            </div>
            {formNode}
          </div>
        </div>
      </section>
    </>
  );
}

export default VestriaLeadFormCore;
