// Server-safe published variant of the Surge header. No hooks, flat props.

import React from 'react';
import { resolveCtaHref, externalLinkProps, resolveDestination } from '@/utils/resolveCtaHref';
import type { Link } from '@/types/destination';
import { isLink } from '@/types/destination';
import { HEADER_STYLES } from './styles';
// externalLinkProps used for both the CTA and the nav links below.

// Dual-read a nav link's target: legacy raw string href passes through verbatim
// (old pages byte-identical); a new Link object resolves via the dumb resolver.
function resolveLinkHref(value: string | Link | undefined): string {
  if (typeof value === 'string') return value || '#';
  if (isLink(value)) return resolveDestination(value.dest) || '#';
  return '#';
}

interface NavItem {
  id?: string;
  label?: string;
  href?: string | Link;
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
            <img className="sg-brand__img" src={props.logo_image} alt={logoText} loading="eager" decoding="async" />
          ) : (
            <>
              <span className="sg-brand__mark" />
              <span>{logoText}</span>
            </>
          )}
        </div>
        <div className="sg-nav-mid">
          {navItems.map((item, idx) => {
            const href = resolveLinkHref(item.href);
            return (
              <a key={item.id || idx} href={href} {...externalLinkProps(href)}>{item.label || ''}</a>
            );
          })}
        </div>
        <div className="sg-nav-right">
          <a className="sg-btn sg-btn--primary sg-btn--sm" href={ctaHref} {...externalLinkProps(ctaHref)} data-lessgo-cta="" data-lessgo-cta-role="primary">{ctaText}</a>
        </div>
        </div>
      </nav>
    </>
  );
}
