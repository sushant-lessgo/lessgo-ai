// src/modules/templates/atelier/blocks/Footer/AtelierFooter.core.tsx
// SINGLE-SOURCE footer. PLAIN server-safe module. Provisional; refined in the
// phase-9 visual port. Phone/WhatsApp are manual_preferred (AI never authors
// numbers).

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { FOOTER_STYLES } from './styles';

export interface AtelierSocialLink { id: string; platform?: string; href?: string }

export interface AtelierFooterContent {
  brand_text?: string;
  tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  copyright?: string;
  whatsapp_number?: string;
  social_links?: AtelierSocialLink[];
}

const waHref = (v?: string) => (v ? `https://wa.me/${v.replace(/[^\d]/g, '')}` : '#');

export function AtelierFooterCore({ content, E }: { content: AtelierFooterContent; E: AtelierPrimitives }) {
  const social = content.social_links || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad-sm lg-atelier-foot">
        <div className="lg-atelier-foot__brandcol">
          <E.Txt elementKey="brand_text" value={content.brand_text} as="div" className="lg-atelier-foot__brand" placeholder="Studio" />
          <E.Txt elementKey="tagline" value={content.tagline} as="p" className="lg-atelier-foot__tagline" placeholder="" multiline />
        </div>
        <div className="lg-atelier-foot__contact">
          {content.contact_email && <a href={`mailto:${content.contact_email}`}>{content.contact_email}</a>}
          {content.contact_phone && <a href={`tel:${content.contact_phone.replace(/[^\d+]/g, '')}`}>{content.contact_phone}</a>}
          {content.whatsapp_number && <a href={waHref(content.whatsapp_number)}>WhatsApp</a>}
        </div>
        {social.length > 0 && (
          <E.List collectionKey="social_links" items={social} className="lg-atelier-foot__social" itemClassName=""
            makeItem={() => ({ platform: '', href: '#' })} min={0} max={6} addLabel="+ Social"
            render={(item: AtelierSocialLink) => (
              <E.Link hrefKey={`social_links.${item.id}.href`} href={item.href} className="">
                <E.Txt elementKey={`social_links.${item.id}.platform`} value={item.platform} as="span" placeholder="Platform" />
              </E.Link>
            )}
          />
        )}
        <E.Txt elementKey="copyright" value={content.copyright} as="div" className="lg-atelier-foot__copy" placeholder="© Studio" />
      </div>
    </>
  );
}

export default AtelierFooterCore;
