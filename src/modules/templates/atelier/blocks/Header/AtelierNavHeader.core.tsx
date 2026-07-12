// src/modules/templates/atelier/blocks/Header/AtelierNavHeader.core.tsx
// SINGLE-SOURCE header layout (sticky nav). PLAIN server-safe module — renders
// only through injected primitives (E). Provisional markup; the real Atelier×Kontur
// design lands in the phase-9 visual port.

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { HEADER_STYLES } from './styles';

export interface AtelierNavItem { id: string; label: string; href: string }

export interface AtelierHeaderContent {
  logo_text?: string;
  logo_image?: string;
  cta_text?: string;
  cta_href?: string;
  nav_items?: AtelierNavItem[];
}

export function AtelierNavHeaderCore({ content, E }: { content: AtelierHeaderContent; E: AtelierPrimitives }) {
  const navItems = content.nav_items || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HEADER_STYLES }} />
      <nav className="lg-atelier-nav">
        <div className="lg-atelier-wrap lg-atelier-nav__row">
          <span className="lg-atelier-brand">
            {content.logo_image ? (
              <E.Img elementKey="logo_image" src={content.logo_image} alt={content.logo_text || 'logo'}
                className="lg-atelier-brand__logo" eager />
            ) : (
              <E.Txt elementKey="logo_text" value={content.logo_text} as="b" placeholder="Studio" />
            )}
          </span>
          <div className="lg-atelier-nav__mid">
            <E.List collectionKey="nav_items" items={navItems} className="lg-atelier-nav__mid" itemClassName=""
              makeItem={() => ({ label: '', href: '#' })} min={0} max={6} addLabel="+ Link"
              render={(item: AtelierNavItem) => (
                <E.Link hrefKey={`nav_items.${item.id}.href`} href={item.href} className="lg-atelier-nav__link">
                  <E.Txt elementKey={`nav_items.${item.id}.label`} value={item.label} as="span" placeholder="Link" />
                </E.Link>
              )}
            />
          </div>
          <div className="lg-atelier-nav__cta">
            <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="lg-atelier-btn lg-atelier-accent">
              <E.Txt elementKey="cta_text" value={content.cta_text} isButton placeholder="Get in touch" />
            </E.Link>
          </div>
        </div>
      </nav>
    </>
  );
}

export default AtelierNavHeaderCore;
