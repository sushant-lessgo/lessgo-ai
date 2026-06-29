// Server-safe published variant of the Surge header. No hooks, flat props.

import React from 'react';
import { resolveCtaHref, externalLinkProps } from '@/utils/resolveCtaHref';
import { HEADER_STYLES } from './styles';
// externalLinkProps used for both the CTA and the nav links below.

interface NavItem {
  id?: string;
  label?: string;
  href?: string;
}

interface WarmNavHeaderPublishedProps {
  sectionId: string;
  logo_text?: string;
  cta_text?: string;
  logo_image?: string;
  nav_items?: NavItem[];
  content?: any;
}

export default function WarmNavHeaderPublished(props: WarmNavHeaderPublishedProps) {
  const logoText = props.logo_text || 'Studio';
  const ctaText = props.cta_text || 'Book a growth audit';
  const navItems = Array.isArray(props.nav_items) ? props.nav_items : [];

  const md = props.content?.[props.sectionId]?.elementMetadata;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, props.content?.forms, '#contact');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HEADER_STYLES }} />
      <nav className="sg-nav">
        <div className="sg-nav-in">
        <div className="sg-brand">
          {props.logo_image ? (
            <img className="sg-brand__img" src={props.logo_image} alt={logoText} />
          ) : (
            <>
              <span className="sg-brand__mark" />
              <span>{logoText}</span>
            </>
          )}
        </div>
        <div className="sg-nav-mid">
          {navItems.map((item, idx) => (
            <a key={item.id || idx} href={item.href || '#'} {...externalLinkProps(item.href)}>{item.label || ''}</a>
          ))}
        </div>
        <div className="sg-nav-right">
          <a className="sg-btn sg-btn--primary sg-btn--sm" href={ctaHref} {...externalLinkProps(ctaHref)}>{ctaText}</a>
        </div>
        </div>
      </nav>
    </>
  );
}
