// src/modules/templates/vestria/blocks/Header/VestriaNavHeader.core.tsx
// SINGLE-SOURCE header layout (util bar + sticky nav). PLAIN server-safe module —
// renders only through injected primitives (E). Ported from the Vestria mock
// (.util + .nav): dark util strip (note · tel · whatsapp) over a sticky
// paper-blur nav (brand + mark · nav links · ghost + accent CTAs).

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { HEADER_STYLES } from './styles';

export interface VestriaNavItem { id: string; label: string; href: string }

export interface VestriaHeaderContent {
  logo_text?: string;
  logo_mark_text?: string;
  logo_image?: string;
  cta_text?: string;
  cta_href?: string;
  secondary_cta_text?: string;
  secondary_cta_href?: string;
  util_note?: string;
  util_tel?: string;
  util_whatsapp?: string;
  nav_items?: VestriaNavItem[];
}

const telHref = (v?: string) => (v ? `tel:${v.replace(/[^\d+]/g, '')}` : '#');
const waHref = (v?: string) => (v ? `https://wa.me/${v.replace(/[^\d]/g, '')}` : '#');

export function VestriaNavHeaderCore({ content, E }: { content: VestriaHeaderContent; E: VestriaPrimitives }) {
  const navItems = content.nav_items || [];
  const hasUtil = !!(content.util_note || content.util_tel || content.util_whatsapp);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HEADER_STYLES }} />
      {hasUtil && (
        <div className="vs-util">
          <div className="vs-wrap vs-util__row">
            <E.Txt elementKey="util_note" value={content.util_note} as="span"
              className="vs-util__note" placeholder="Manufacturing since … · City" />
            <span className="vs-util__right">
              {content.util_tel ? (
                <a href={telHref(content.util_tel)}>
                  <E.Txt elementKey="util_tel" value={content.util_tel} as="span" placeholder="Tel +…" />
                </a>
              ) : (
                <E.Txt elementKey="util_tel" value={content.util_tel} as="span" placeholder="" />
              )}
              {content.util_tel && content.util_whatsapp && <span className="vs-util__sep">·</span>}
              {content.util_whatsapp ? (
                <a href={waHref(content.util_whatsapp)}>
                  <E.Txt elementKey="util_whatsapp" value={content.util_whatsapp} as="span" placeholder="WhatsApp +…" />
                </a>
              ) : (
                <E.Txt elementKey="util_whatsapp" value={content.util_whatsapp} as="span" placeholder="" />
              )}
            </span>
          </div>
        </div>
      )}
      <nav className="vs-nav">
        <div className="vs-wrap vs-nav__row">
          <span className="vs-brand">
            {content.logo_image ? (
              <E.Img elementKey="logo_image" src={content.logo_image} alt={content.logo_text || 'logo'}
                className="vs-brand__logo" eager />
            ) : (
              <E.Txt elementKey="logo_text" value={content.logo_text} as="b" placeholder="Brand" />
            )}
            <E.Txt elementKey="logo_mark_text" value={content.logo_mark_text} as="span"
              className="vs-brand__mark" placeholder="" />
          </span>
          <div className="vs-nav__mid">
            <E.List collectionKey="nav_items" items={navItems} className="vs-nav__mid" itemClassName=""
              makeItem={() => ({ label: '', href: '#' })} min={0} max={6} addLabel="+ Link"
              render={(item: VestriaNavItem) => (
                <E.Link hrefKey={`nav_items.${item.id}.href`} href={item.href} className="vs-nav__link">
                  <E.Txt elementKey={`nav_items.${item.id}.label`} value={item.label} as="span" placeholder="Link" />
                </E.Link>
              )}
            />
          </div>
          <div className="vs-nav__cta">
            {(content.secondary_cta_text !== undefined) && (
              <E.Link hrefKey="secondary_cta_href" href={content.secondary_cta_href || '#catalog'} className="vs-btn vs-ghost">
                <E.Txt elementKey="secondary_cta_text" value={content.secondary_cta_text} isButton placeholder="Catalogue" />
              </E.Link>
            )}
            <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="vs-btn vs-accent">
              <E.Txt elementKey="cta_text" value={content.cta_text} isButton placeholder="Request a Quote" />
            </E.Link>
          </div>
        </div>
      </nav>
    </>
  );
}

export default VestriaNavHeaderCore;
