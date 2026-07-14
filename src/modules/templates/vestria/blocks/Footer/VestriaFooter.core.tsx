// src/modules/templates/vestria/blocks/Footer/VestriaFooter.core.tsx
// SINGLE-SOURCE footer layout. PLAIN server-safe module — renders only through
// injected primitives (E). Ported from the Vestria mock (.foot): brand + blurb ·
// link columns · Get in Touch (address / email / tel / whatsapp / map caption) ·
// dashed-top bottom bar. Optional fixed WhatsApp FAB (whatsapp_number gated).
//
// NESTED LINKS v1: link_columns is an editable collection (column heading via the
// 3-part path link_columns.<id>.heading), but the INNER links render as plain
// anchors — the saveField path parser is 3-part (coll.<id>.field) and no existing
// block edits doubly-nested collections. Inner link labels/hrefs are AI-seeded and
// editable only by re-generation in v1.

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { normalizeCopyrightYear } from '../../../shared/footerHygiene';
import { FOOTER_STYLES } from './styles';

export interface VestriaFooterLink { id?: string; label?: string; href?: string }
export interface VestriaFooterColumn { id: string; heading: string; links?: VestriaFooterLink[] }

export interface VestriaFooterContent {
  brand_text?: string;
  blurb?: string;
  address_heading?: string;
  address_html?: string;
  email?: string;
  tel?: string;
  whatsapp?: string;
  map_caption?: string;
  copyright?: string;
  tagline?: string;
  whatsapp_number?: string;
  whatsapp_label?: string;
  whatsapp_prefill?: string;
  link_columns?: VestriaFooterColumn[];
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.8 5 2.3 7L4 29l7.3-2.3c1.9 1 4 1.6 6.2 1.6h.5c6.6 0 12-5.3 12-11.9C30 8.3 24.6 3 18 3h-2zm6.5 16.9c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.3.2-3.7-.8-3.1-1.3-5.1-4.4-5.3-4.6-.2-.2-1.3-1.7-1.3-3.2 0-1.5.8-2.3 1.1-2.6.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.5.3.7.9 2.3 1 2.4.1.2.1.4 0 .6-.1.2-.2.4-.4.6l-.6.7c-.2.2-.4.4-.2.8.2.4 1 1.7 2.2 2.7 1.5 1.3 2.8 1.7 3.2 1.9.4.2.6.2.8-.1.2-.3 1-1.1 1.2-1.5.2-.4.5-.3.8-.2.3.1 2 .9 2.3 1.1.3.2.6.3.6.4.1.2.1.7-.2 1.5z"/>
  </svg>
);

const buildWaHref = (number?: string, prefill?: string): string => {
  const wa = (number || '').replace(/[^0-9]/g, '');
  if (!wa) return '';
  return `https://wa.me/${wa}${prefill ? `?text=${encodeURIComponent(prefill)}` : ''}`;
};

const telHref = (v?: string) => (v ? `tel:${v.replace(/[^\d+]/g, '')}` : '');

export function VestriaFooterCore({ content, E }: { content: VestriaFooterContent; E: VestriaPrimitives }) {
  const columns = content.link_columns || [];
  const fabHref = buildWaHref(content.whatsapp_number, content.whatsapp_prefill);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <footer className="vs-foot">
        <div className="vs-wrap">
          <div className="vs-foot__grid">
            <div>
              <E.Txt elementKey="brand_text" value={content.brand_text} as="span"
                className="vs-foot__brand" placeholder="Brand" />
              <E.Txt elementKey="blurb" value={content.blurb} as="p"
                className="vs-foot__blurb" multiline placeholder="One line — what you make, for whom, where." />
            </div>

            <E.List collectionKey="link_columns" items={columns} className="vs-foot__cols" itemClassName=""
              makeItem={() => ({ heading: '', links: [] })} min={0} max={3} addLabel="+ Column"
              render={(col: VestriaFooterColumn) => (
                <div>
                  <E.Txt elementKey={`link_columns.${col.id}.heading`} value={col.heading} as="h4"
                    className="vs-foot__h4" placeholder="Explore" />
                  <ul className="vs-foot__list">
                    {(col.links || []).map((l, i) => (
                      <li key={l.id ?? i}><a href={l.href || '#'}>{l.label || ''}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            />

            <div>
              <E.Txt elementKey="address_heading" value={content.address_heading} as="h4"
                className="vs-foot__h4" placeholder="Get in Touch" />
              <div className="vs-foot__addr">
                <E.Txt elementKey="address_html" value={content.address_html} as="div" multiline placeholder="Company L.L.C — street, city, country" />
                {content.email && <a href={`mailto:${content.email}`}>{content.email}</a>}
                {content.email && <br />}
                {content.tel && <a href={telHref(content.tel)}>{content.tel}</a>}
                {content.tel && <br />}
                {content.whatsapp && <a href={buildWaHref(content.whatsapp)}>{content.whatsapp}</a>}
              </div>
              {content.map_caption !== undefined && content.map_caption !== '' && (
                <div className="vs-foot__map">
                  <E.Txt elementKey="map_caption" value={content.map_caption} as="span" placeholder="Map — your location" />
                </div>
              )}
            </div>
          </div>

          <div className="vs-foot__bot">
            <E.Txt elementKey="copyright" value={normalizeCopyrightYear(content.copyright) ?? content.copyright} as="span" placeholder="© 2026 Company — All rights reserved." />
            <E.Txt elementKey="tagline" value={content.tagline} as="span" placeholder="" />
          </div>
        </div>
      </footer>

      {fabHref && (
        <a className="vs-wa-fab" href={fabHref} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
          <WhatsAppIcon />
          <span>{content.whatsapp_label || 'WhatsApp'}</span>
        </a>
      )}
    </>
  );
}

export default VestriaFooterCore;
