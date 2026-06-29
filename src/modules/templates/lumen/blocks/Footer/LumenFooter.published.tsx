// Server-safe published Lumen footer. No hooks, flat props. Emits data-en/data-nl
// on every translatable node for the lumen.v1.js language toggle. Includes the
// fixed floating WhatsApp/call CTA (pure anchors, no JS).

import React from 'react';
import { bilingualAttrs } from '../../i18nKeys';
import { FOOTER_STYLES } from './styles';
import {
  DEFAULT_FOOTER_COLUMNS, DEFAULT_LEGAL_LINKS,
  type FooterColumn, type LegalLink,
} from './footerDefaults';

interface Props {
  sectionId: string;
  brand_text?: string; brand_text_nl?: string;
  brand_sub?: string; brand_sub_nl?: string;
  tagline?: string; tagline_nl?: string;
  contact_line?: string; contact_line_nl?: string;
  contact_phone?: string; contact_email?: string;
  copyright?: string; copyright_nl?: string;
  whatsapp_number?: string; whatsapp_label?: string; whatsapp_label_nl?: string; whatsapp_prefill?: string;
  book_call_url?: string;
  footer_columns?: FooterColumn[];
  legal_links?: LegalLink[];
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4zm-2.6 4c-.2 0-.5 0-.7.3-.3.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.9 4.4 3.9 2.2.8 2.6.7 3.1.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1-.6-.2-1.5-.6-2.3-1.4-.6-.6-1-1.3-1.2-1.5-.1-.2 0-.4.1-.5l.4-.5c.1-.2.1-.3.2-.5 0-.2 0-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.5z" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);

function buildWaHref(number?: string, prefill?: string): string {
  const wa = (number || '').replace(/[^0-9]/g, '');
  if (!wa) return '';
  return `https://wa.me/${wa}${prefill ? `?text=${encodeURIComponent(prefill)}` : ''}`;
}

export default function LumenFooterPublished(props: Props) {
  const columns: FooterColumn[] = (props.footer_columns || []).length ? props.footer_columns! : DEFAULT_FOOTER_COLUMNS;
  const legal: LegalLink[] = (props.legal_links || []).length ? props.legal_links! : DEFAULT_LEGAL_LINKS;
  const waHref = buildWaHref(props.whatsapp_number, props.whatsapp_prefill);
  const callHref = props.book_call_url || '#contact';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <footer className="lm-footer">
        <div className="lm-footer-top">
          <div className="lm-footer-brand">
            <span className="lm-footer-brandrow">
              <span className="lm-footer-wm">
                <span {...bilingualAttrs(props.brand_text || '', props.brand_text_nl || '')}>{props.brand_text || ''}</span>
                <em>.</em>
              </span>
              {(props.brand_sub || props.brand_sub_nl) && (
                <span className="lm-footer-sub" {...bilingualAttrs(props.brand_sub || '', props.brand_sub_nl || '')}>{props.brand_sub || ''}</span>
              )}
            </span>
            {(props.tagline || props.tagline_nl) && (
              <p {...bilingualAttrs(props.tagline || '', props.tagline_nl || '')}>{props.tagline || ''}</p>
            )}
            <div className="lm-footer-contact">
              <span {...bilingualAttrs(props.contact_line || '', props.contact_line_nl || '')}>{props.contact_line || ''}</span>
              <br />
              {props.contact_phone && <b>{props.contact_phone}</b>}
              {props.contact_phone && props.contact_email ? ' · ' : ''}
              {props.contact_email && (
                <a href={`mailto:${props.contact_email}`}>{props.contact_email}</a>
              )}
            </div>
          </div>

          {columns.map((col, ci) => (
            <div className="lm-footer-col" key={col.id || ci}>
              <h4 {...bilingualAttrs(col.heading || '', col.heading_nl || '')}>{col.heading || ''}</h4>
              <ul>
                {(col.links || []).map((l, li) => (
                  <li key={l.id || li}>
                    <a href={l.href || '#'} {...bilingualAttrs(l.label || '', l.label_nl || '')}>{l.label || ''}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="lm-footer-bottom">
          <span {...bilingualAttrs(props.copyright || '', props.copyright_nl || '')}>{props.copyright || ''}</span>
          <span className="lm-footer-legal">
            {legal.map((l, i) => (
              <React.Fragment key={l.id || i}>
                {i > 0 && <span aria-hidden="true">·</span>}
                <a href={l.href || '#'} {...bilingualAttrs(l.label || '', l.label_nl || '')}>{l.label || ''}</a>
              </React.Fragment>
            ))}
          </span>
        </div>
      </footer>

      <div className="lm-float-cta" aria-label="Quick contact">
        {waHref && (
          <a className="lm-fab lm-fab-wa" href={waHref} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            <span className="lm-fab-lbl" {...bilingualAttrs(props.whatsapp_label || 'WhatsApp', props.whatsapp_label_nl || 'WhatsApp')}>{props.whatsapp_label || 'WhatsApp'}</span>
          </a>
        )}
        <a className="lm-fab lm-fab-call" href={callHref}>
          <PhoneIcon />
          <span className="lm-fab-lbl">Book a call</span>
        </a>
      </div>
    </>
  );
}
