// src/modules/skeletons/work/blocks/Contact/WorkContact.core.tsx
// SINGLE-SOURCE contact layout (granth .core pattern). PLAIN server-safe module —
// copy renders through injected `E`; the conversion MECHANISM is chosen by
// `contact_method` (workElementContract.contact):
//   - 'form'                    → the prebuilt `formNode` (lead-form markup; edit =
//                                 inert preview, published = real <form
//                                 data-lessgo-form> → form.v1.js → /api/forms/submit)
//   - 'whatsapp' | 'booking' | 'call' → a single CTA link (cta_label → the channel)
// This follows the form-CTA presentation pattern: a multi-field form gets its own
// bordered card next to the copy; a single-action channel is just an inline CTA.
//
// Binds contract keys: eyebrow · heading · lead · contact_method · cta_label
// (form_ref is a forms-system reference — resolved by the wrappers, not painted).
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries
// `data-sid` (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { WORK_CONTACT_STYLES } from './styles';

export interface WorkContactContent {
  eyebrow?: string;
  heading?: string;
  lead?: string;
  contact_method?: string; // 'form' | 'whatsapp' | 'booking' | 'call'
  form_ref?: string;
  cta_label?: string;
  cta_href?: string;
}

export function WorkContactCore({
  content, E, sectionId, formNode,
}: {
  content: WorkContactContent; E: WorkPrimitives; sectionId: string;
  /** Prebuilt lead-form markup (only rendered when contact_method === 'form'). */
  formNode?: React.ReactNode;
}) {
  const method = (content.contact_method || 'form').toLowerCase();
  const isForm = method === 'form';
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_CONTACT_STYLES }} />
      <section className="wk-contact" data-sid={sectionId} data-section-id={sectionId}
        data-wk-contact="" data-wk-contact-method={method}>
        <div className="wk-contact__in">
          <div className="wk-contact__copy">
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
              className="wk-contact__eyebrow" placeholder="Get in touch" />
            <E.Txt elementKey="heading" value={content.heading} as="h2"
              className="wk-contact__heading" placeholder="Let’s work together" />
            <E.Txt elementKey="lead" value={content.lead} as="p"
              className="wk-contact__lead" multiline
              placeholder="Tell me about the project — I reply within one working day." />

            {!isForm && (
              <div className="wk-contact__cta-wrap">
                <E.Link hrefKey="cta_href" href={content.cta_href || '#'} className="wk-contact__cta" external>
                  <E.Txt elementKey="cta_label" value={content.cta_label} isButton placeholder="Message me" />
                </E.Link>
              </div>
            )}
          </div>

          {isForm && formNode}
        </div>
      </section>
    </>
  );
}

export default WorkContactCore;
