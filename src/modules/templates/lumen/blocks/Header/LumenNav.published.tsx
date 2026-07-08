// Server-safe published Lumen nav. No hooks, flat props. The EN·NL toggle is
// real <button data-lang> wired by lumen.v1.js; nav links + CTA + brand carry
// data-en/data-nl for the live language swap.

import React from 'react';
import { resolveCtaHref, externalLinkProps, resolveDestination } from '@/utils/resolveCtaHref';
import type { Link } from '@/types/destination';
import { isLink } from '@/types/destination';
import { bilingualAttrs } from '../../i18nKeys';
import { HEADER_STYLES } from './styles';

// Dual-read a nav link's target: legacy raw string href passes through verbatim
// (old pages byte-identical); a new Link object resolves via the dumb resolver.
function resolveLinkHref(value: string | Link | undefined): string {
  if (typeof value === 'string') return value || '#';
  if (isLink(value)) return resolveDestination(value.dest) || '#';
  return '#';
}

interface NavItem { id?: string; label?: string; label_nl?: string; href?: string | Link; }
interface Props {
  sectionId: string;
  logo_text?: string; logo_text_nl?: string;
  brand_sub?: string; brand_sub_nl?: string;
  logo_image?: string; cta_text?: string; cta_text_nl?: string;
  nav_items?: NavItem[];
  content?: any;
}

export default function LumenNavPublished(props: Props) {
  const logoText = props.logo_text || 'Studio';
  const navItems = Array.isArray(props.nav_items) ? props.nav_items : [];
  const md = props.content?.[props.sectionId]?.elementMetadata;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, props.content?.forms, '#contact');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HEADER_STYLES }} />
      <nav className="lm-nav">
        <div className="lm-nav-in">
          <a className="lm-brand" href="#top" aria-label={`${logoText} home`}>
            {props.logo_image ? (
              <img className="lm-brand__img" src={props.logo_image} alt={logoText} />
            ) : (
              <>
                <span className="lm-brand__wm" {...bilingualAttrs(logoText, props.logo_text_nl || '')}
                  dangerouslySetInnerHTML={{ __html: logoText }} />
                <span className="lm-brand__sub" {...bilingualAttrs(props.brand_sub || '', props.brand_sub_nl || '')}>
                  {props.brand_sub || ''}
                </span>
              </>
            )}
          </a>

          <div className="lm-nav-links">
            {navItems.map((item, i) => {
              const href = resolveLinkHref(item.href);
              return (
                <a key={item.id || i} href={href} {...externalLinkProps(href)}
                   {...bilingualAttrs(item.label || '', item.label_nl || '')}>
                  {item.label || ''}
                </a>
              );
            })}
          </div>

          <div className="lm-nav-cta">
            <div className="lm-lang" role="group" aria-label="Language">
              <button type="button" data-lang="en" aria-pressed="true">EN</button>
              <button type="button" data-lang="nl" aria-pressed="false">NL</button>
            </div>
            <a className="lm-btn lm-btn--fill lm-btn--sm" href={ctaHref} {...externalLinkProps(ctaHref)}
               data-lessgo-cta="" data-lessgo-cta-role="primary"
               {...bilingualAttrs(props.cta_text || '', props.cta_text_nl || '')}>
              {props.cta_text || 'Request a quote'}
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}
