// src/modules/templates/atelier/blocks/Footer/AtelierFooter.core.tsx
// SINGLE-SOURCE footer. PLAIN server-safe module. Ported from the approved design
// (styles.css/index.html FOOTER; atl-* → lg-atelier-). Phone/WhatsApp are
// manual_preferred (AI never authors numbers).
//
// The design's `.atl-closer` full-bleed CTA band (present on every page, NOT in the
// 8-block set) is mapped INTO this footer scaffolding above the footer proper, per
// the orchestrator ruling — no new registered section type. Its copy is OPTIONAL
// (non-schema) chrome via E primitives (design placeholders); the Index-column
// links use an optional `footer_links` collection (manual-fill / block-mocks).

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { FOOTER_STYLES } from './styles';

export interface AtelierSocialLink { id: string; platform?: string; href?: string }
export interface AtelierFooterLink { id: string; label?: string; href?: string }

export interface AtelierFooterContent {
  brand_text?: string;
  tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_location?: string;
  copyright?: string;
  legal_text?: string;
  whatsapp_number?: string;
  social_links?: AtelierSocialLink[];
  footer_links?: AtelierFooterLink[];
  // closer band (optional, non-schema chrome)
  closer_eyebrow?: string;
  closer_headline?: string;
  closer_lede?: string;
  closer_cta_text?: string;
  closer_cta_href?: string;
  closer_secondary_cta_text?: string;
  closer_secondary_cta_href?: string;
  closer_image?: string;
  index_heading?: string;
  elsewhere_heading?: string;
}

export function AtelierFooterCore({ content, E }: { content: AtelierFooterContent; E: AtelierPrimitives }) {
  const social = content.social_links || [];
  const links = content.footer_links || [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />

      {/* ── CLOSER (full-bleed CTA band) ── */}
      <div className="lg-atelier-closer">
        <div className="lg-atelier-closer__bg">
          <E.Img elementKey="closer_image" src={content.closer_image} alt=""
            className="lg-atelier-closer__img" imgClassName=""
            placeholder={<div className="lg-atelier-ph" />} />
        </div>
        <div className="lg-atelier-closer-in">
          <E.Txt elementKey="closer_eyebrow" value={content.closer_eyebrow} as="span" className="lg-atelier-label lg-atelier-on-dark" placeholder="Ready when you are" />
          <E.Txt elementKey="closer_headline" value={content.closer_headline} as="h2" className="lg-atelier-display lg-atelier-closer__h2" placeholder="Let’s make <em>yours.</em>" />
          {content.closer_lede !== undefined && (
            <E.Txt elementKey="closer_lede" value={content.closer_lede} as="p" className="lg-atelier-closer__lede" placeholder="Bring a brief, a date, or just an idea." multiline />
          )}
          <div className="lg-atelier-closer-actions">
            <E.Link hrefKey="closer_cta_href" href={content.closer_cta_href || '#contact'} className="lg-atelier-btn lg-atelier-accent lg-atelier-lg">
              <E.Txt elementKey="closer_cta_text" value={content.closer_cta_text} isButton placeholder="Start a project" />
            </E.Link>
            {content.closer_secondary_cta_text !== undefined && (
              <E.Link hrefKey="closer_secondary_cta_href" href={content.closer_secondary_cta_href || '#packages'} className="lg-atelier-btn lg-atelier-ghost-d lg-atelier-lg">
                <E.Txt elementKey="closer_secondary_cta_text" value={content.closer_secondary_cta_text} isButton placeholder="See experiences" />
              </E.Link>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER proper ── */}
      <div className="lg-atelier-footer">
        <div className="lg-atelier-footer-big">
          <div className="lg-atelier-fw">
            <E.Txt elementKey="brand_text" value={content.brand_text} as="span" placeholder="Studio Name" />
            <span className="dot">.</span>
          </div>
        </div>
        <div className="lg-atelier-footer-cols">
          <div>
            <E.Txt elementKey="tagline" value={content.tagline} as="p" className="lg-atelier-footer__desc" placeholder="One-line description of the studio and its work — what it makes, who it serves, and where." multiline />
            <div className="lg-atelier-footer-contact">
              <E.Txt elementKey="contact_location" value={content.contact_location} as="div" placeholder="City, Country" />
              <div>
                <E.Txt elementKey="contact_phone" value={content.contact_phone} as="b" placeholder="+00 0 0000 0000" />
                {' · '}
                <E.Txt elementKey="contact_email" value={content.contact_email} as="span" placeholder="hello@studio.example" />
              </div>
            </div>
          </div>
          <div>
            <E.Txt elementKey="index_heading" value={content.index_heading} as="h4" placeholder="Index" />
            <E.List collectionKey="footer_links" items={links} className="lg-atelier-footer-links" itemClassName=""
              makeItem={() => ({ label: '', href: '#' })} min={0} max={8} addLabel="+ Link"
              render={(item: AtelierFooterLink) => (
                <E.Link hrefKey={`footer_links.${item.id}.href`} href={item.href} className="">
                  <E.Txt elementKey={`footer_links.${item.id}.label`} value={item.label} as="span" placeholder="Link" />
                </E.Link>
              )}
            />
          </div>
          <div>
            <E.Txt elementKey="elsewhere_heading" value={content.elsewhere_heading} as="h4" placeholder="Elsewhere" />
            <E.List collectionKey="social_links" items={social} className="lg-atelier-footer-links" itemClassName=""
              makeItem={() => ({ platform: '', href: '#' })} min={0} max={6} addLabel="+ Social"
              render={(item: AtelierSocialLink) => (
                <E.Link hrefKey={`social_links.${item.id}.href`} href={item.href} className="">
                  <E.Txt elementKey={`social_links.${item.id}.platform`} value={item.platform} as="span" placeholder="Platform" />
                </E.Link>
              )}
            />
          </div>
        </div>
        <div className="lg-atelier-footer-bottom">
          <E.Txt elementKey="copyright" value={content.copyright} as="span" placeholder="© Studio Name" />
          <E.Txt elementKey="legal_text" value={content.legal_text} as="span" placeholder="Privacy · Terms" />
        </div>
      </div>
    </>
  );
}

export default AtelierFooterCore;
