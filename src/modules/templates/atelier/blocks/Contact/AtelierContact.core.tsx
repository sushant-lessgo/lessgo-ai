// src/modules/templates/atelier/blocks/Contact/AtelierContact.core.tsx
// SINGLE-SOURCE contact section. PLAIN server-safe module. Provisional — the
// shared lead-form placement lands in the phase-9 visual port (form_id already in
// the contract). Contact details are manual_preferred (AI never authors numbers).

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
}

export function AtelierContactCore({ content, E }: { content: AtelierContactContent; E: AtelierPrimitives }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad lg-atelier-contact">
        <div className="lg-atelier-contact__intro">
          {content.eyebrow !== undefined && (
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-tag" placeholder="Contact" />
          )}
          <E.Txt elementKey="headline" value={content.headline} as="h2" className="lg-atelier-heading lg-atelier-h2" placeholder="Let’s work together" />
          <E.Txt elementKey="lede" value={content.lede} as="p" className="lg-atelier-contact__lede" placeholder="Tell me about your project." multiline />
        </div>
        <div className="lg-atelier-contact__details">
          {content.email && <a href={`mailto:${content.email}`}>{content.email}</a>}
          {content.phone && <a href={`tel:${content.phone.replace(/[^\d+]/g, '')}`}>{content.phone}</a>}
        </div>
      </div>
    </>
  );
}

export default AtelierContactCore;
