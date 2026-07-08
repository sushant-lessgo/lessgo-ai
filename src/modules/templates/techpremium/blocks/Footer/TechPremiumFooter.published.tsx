// src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.published.tsx
// Server-safe published footer (Phase 4): brand blurb + click-to-action contact +
// socials, link columns, legal row, and the floating WhatsApp FAB (shared chrome →
// every page). Newsletter capture kept (optional, form-wired).

import React from 'react';
import { Facebook, Linkedin, Youtube, MessageCircle } from 'lucide-react';
import TechPremiumNewsletterCapture from './TechPremiumNewsletterCapture';
import { resolveDestination } from '@/utils/resolveCtaHref';
import type { Link } from '@/types/destination';
import { isLink } from '@/types/destination';
import { FOOTER_STYLES } from './footerStyles';

// Dual-read a footer link's target: legacy raw string href passes through verbatim
// (old pages byte-identical); a new Link object resolves via the dumb resolver.
function resolveLinkHref(value: string | Link | undefined): string {
  if (typeof value === 'string') return value || '#';
  if (isLink(value)) return resolveDestination(value.dest) || '#';
  return '#';
}

interface FooterLink { id?: string; label?: string; href?: string | Link }
interface FooterColumn { id?: string; heading?: string; links?: FooterLink[] }
interface Social { id?: string; icon?: string; url?: string }
interface Props {
  sectionId: string;
  wordmark?: string; logo_image?: string; tag?: string; blurb?: string;
  contact_address?: string; contact_tel?: string; contact_email?: string;
  newsletter_placeholder?: string; newsletter_cta?: string;
  copyright?: string; location?: string;
  whatsapp_number?: string; whatsapp_prefill?: string; whatsapp_label?: string;
  footer_columns?: FooterColumn[]; socials?: Social[]; legal_links?: FooterLink[];
  content?: any; publishedPageId?: string; pageOwnerId?: string;
}

const SOCIAL_ICON: Record<string, React.ComponentType<any>> = { Facebook, Linkedin, Youtube, MessageCircle };

export default function TechPremiumFooterPublished(props: Props) {
  const columns = Array.isArray(props.footer_columns) ? props.footer_columns : [];
  const socials = (Array.isArray(props.socials) ? props.socials : []).filter((s) => s && s.url && s.url !== '#');
  const legal = (Array.isArray(props.legal_links) ? props.legal_links : []).filter((l) => l && l.label);

  const newsletterFormId: string | undefined = props.content?.[props.sectionId]?.elementMetadata?.newsletter_cta?.buttonConfig?.formId;
  const newsletterForm = newsletterFormId ? props.content?.forms?.[newsletterFormId] : undefined;

  const wa = (props.whatsapp_number || '').replace(/[^0-9]/g, '');
  const waHref = wa ? `https://wa.me/${wa}${props.whatsapp_prefill ? `?text=${encodeURIComponent(props.whatsapp_prefill)}` : ''}` : '';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <footer className="tp-footer">
        <div className="tp-footer__top">
          <div className="tp-footer__brand">
            <span className="tp-footer__brand-wm">{props.logo_image ? <img className="tp-footer__img" src={props.logo_image} alt={props.wordmark || 'Logo'} /> : <><span className="tp-footer__mk" aria-hidden="true" />{props.wordmark || ''}</>}</span>
            {(props.blurb || props.tag) && <p className="tp-footer__blurb">{props.blurb || props.tag}</p>}
            {(props.contact_address || props.contact_tel || props.contact_email) && (
              <div className="tp-footer__contact">
                {props.contact_address && <div>{props.contact_address}</div>}
                {props.contact_tel && <div><a href={`tel:${props.contact_tel.replace(/\s+/g, '')}`}>{props.contact_tel}</a></div>}
                {props.contact_email && <div><a href={`mailto:${props.contact_email}`}>{props.contact_email}</a></div>}
              </div>
            )}
            {socials.length > 0 && (
              <div className="tp-footer__social">
                {socials.map((s, i) => {
                  const Icon = SOCIAL_ICON[s.icon || 'MessageCircle'] || MessageCircle;
                  return <a key={s.id || i} href={s.url} aria-label={s.icon}><Icon size={16} /></a>;
                })}
              </div>
            )}
            {newsletterForm && (
              <TechPremiumNewsletterCapture form={newsletterForm} formId={newsletterFormId as string} placeholder={props.newsletter_placeholder} cta={props.newsletter_cta} publishedPageId={props.publishedPageId} pageOwnerId={props.pageOwnerId} />
            )}
          </div>

          {columns.map((col, idx) => (
            <div key={col.id || idx} className="tp-footer__col">
              {col.heading && <h4>{col.heading}</h4>}
              <ul>{(col.links || []).map((link, k) => <li key={link.id || k}><a className="tp-footer__link" href={resolveLinkHref(link.href)}>{link.label || ''}</a></li>)}</ul>
            </div>
          ))}
        </div>

        <div className="tp-footer__bottom">
          <div>{props.copyright || '© Your Company'}{props.location ? ` · ${props.location}` : ''}</div>
          {legal.length > 0 && (
            <div className="tp-footer__legal">{legal.map((l, i) => <a key={l.id || i} href={resolveLinkHref(l.href)}>{l.label}</a>)}</div>
          )}
        </div>
      </footer>

      {waHref && (
        <a className="tp-wa-fab" href={waHref} target="_blank" rel="noopener" aria-label="WhatsApp">
          <MessageCircle size={24} />
          {props.whatsapp_label && <span className="tp-wa-label">{props.whatsapp_label}</span>}
        </a>
      )}
    </>
  );
}
