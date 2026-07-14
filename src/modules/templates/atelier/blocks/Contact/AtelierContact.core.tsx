// src/modules/templates/atelier/blocks/Contact/AtelierContact.core.tsx
// SINGLE-SOURCE contact section. PLAIN server-safe module — copy + detail rows
// render through injected primitives (E); the FORM ITSELF arrives as a prebuilt
// `formNode` from each wrapper (edit = inert preview, published = real
// <form data-lessgo-form> wired to form.v1.js → /api/forms/submit), mirroring the
// Vestria/TechPremium split so form submission is NOT reinvented here. Ported from
// the approved design (contact.html CONTACT; atl-* → lg-atelier-). The inner-page
// dark page-head band precedes this via the Hero page-head mode (separate section),
// per the orchestrator ruling — not duplicated here.

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { CONTACT_STYLES } from './styles';

export interface AtelierContactContent {
  form_id?: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  email?: string;
  phone?: string;
  location?: string;   // optional (non-schema) — "Based in" row
  instagram?: string;  // optional (non-schema) — "Instagram" row
}

export function AtelierContactCore({
  content, E, formNode,
}: { content: AtelierContactContent; E: AtelierPrimitives; formNode?: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad lg-atelier-contact">
        <div className="lg-atelier-contact-copy">
          {content.eyebrow !== undefined && (
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-label" placeholder="Details" />
          )}
          <E.Txt elementKey="headline" value={content.headline} as="h2" className="lg-atelier-heading" placeholder="Or reach out <em>directly.</em>" />
          {content.lede !== undefined && (
            <E.Txt elementKey="lede" value={content.lede} as="p" className="lg-atelier-lede" placeholder="Email is answered daily; calls by appointment." multiline />
          )}
          <div className="lg-atelier-cd">
            <div className="lg-atelier-cd-row">
              <span className="k">Based in</span>
              <E.Txt elementKey="location" value={content.location} as="span" className="v" placeholder="City · serving the region" />
            </div>
            <div className="lg-atelier-cd-row">
              <span className="k">Phone</span>
              <E.Txt elementKey="phone" value={content.phone} as="span" className="v v-strong" placeholder="+00 0 0000 0000" />
            </div>
            <div className="lg-atelier-cd-row">
              <span className="k">Email</span>
              <E.Txt elementKey="email" value={content.email} as="span" className="v" placeholder="hello@studio.example" />
            </div>
            <div className="lg-atelier-cd-row">
              <span className="k">Instagram</span>
              <E.Txt elementKey="instagram" value={content.instagram} as="span" className="v" placeholder="@studioname" />
            </div>
          </div>
        </div>
        {formNode}
      </div>
    </>
  );
}

export default AtelierContactCore;
