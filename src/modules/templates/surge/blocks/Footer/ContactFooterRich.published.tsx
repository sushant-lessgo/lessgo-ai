// Server-safe published variant of the Surge footer. No hooks, flat props.

import React from 'react';
import { externalLinkProps } from '@/utils/resolveCtaHref';
import { FOOTER_STYLES } from './styles';
import { DEFAULT_FOOTER_LINKS, type FooterLink } from './footerDefaults';

interface SocialLink {
  id?: string;
  platform?: string;
  href?: string;
}

interface ContactFooterRichPublishedProps {
  sectionId: string;
  tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  copyright?: string;
  social_links?: SocialLink[];
  whatsapp_number?: string;
  whatsapp_label?: string;
  whatsapp_prefill?: string;
  links_heading?: string;
  footer_links?: FooterLink[];
  content?: any;
}

// Inline MessageCircle glyph (server-safe).
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export default function ContactFooterRichPublished(props: ContactFooterRichPublishedProps) {
  const socialLinks = Array.isArray(props.social_links) ? props.social_links : [];
  const storedLinks = Array.isArray(props.footer_links) ? props.footer_links : [];
  const footerLinks: FooterLink[] = storedLinks.length ? storedLinks : DEFAULT_FOOTER_LINKS;
  const wa = (props.whatsapp_number || '').replace(/[^0-9]/g, '');
  const waHref = wa ? `https://wa.me/${wa}${props.whatsapp_prefill ? `?text=${encodeURIComponent(props.whatsapp_prefill)}` : ''}` : '';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <footer className="sg-footer">
        <div className="sg-footer__top">
          <div className="sg-footer__brand">
            <div className="sg-footer__brand-row">
              <span className="sg-footer__mark" />
              <span>Studio</span>
            </div>
            {props.tagline && <p className="sg-footer__tagline">{props.tagline}</p>}
            <div className="sg-footer__badge"><span className="lv" />Booking now</div>
          </div>

          <div className="sg-footer__col">
            <h4>Contact</h4>
            <ul>
              {props.contact_email && <li>{props.contact_email}</li>}
              {props.contact_phone && <li>{props.contact_phone}</li>}
              {props.address && <li>{props.address}</li>}
            </ul>
          </div>

          <div className="sg-footer__col">
            <h4>Elsewhere</h4>
            <ul>
              {socialLinks.map((s, idx) => (
                <li key={s.id || idx}>
                  {s.href ? <a href={s.href} {...externalLinkProps(s.href)}>{s.platform || ''}</a> : (s.platform || '')}
                </li>
              ))}
            </ul>
          </div>

          <div className="sg-footer__col">
            <h4>{props.links_heading || 'Studio'}</h4>
            <ul>
              {footerLinks.map((l, idx) => (
                <li key={l.id || idx}>
                  <a href={l.href || '#'} {...externalLinkProps(l.href)}>{l.label || ''}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sg-footer__bottom">
          <span>{props.copyright || ''}</span>
          <span>Built with Lessgo</span>
        </div>
      </footer>

      {waHref && (
        <a className="sg-wa-fab" href={waHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
          <WhatsAppIcon />
          {props.whatsapp_label && <span className="sg-wa-label">{props.whatsapp_label}</span>}
        </a>
      )}
    </>
  );
}
