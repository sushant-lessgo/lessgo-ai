// src/modules/templates/atelier/blocks/Header/AtelierNavHeader.core.tsx
// SINGLE-SOURCE header layout — Atelier×Kontur 3-column nav grammar. PLAIN
// server-safe module — renders only through injected primitives (E). Ported from
// the approved design (styles.css "NAV" block, atl-* → lg-atelier-).
//
// TWO MODES (design has both):
//   - solid (default): sticky blurred-paper bar, dark text (inner pages).
//   - overlay (content.mode === 'overlay'): transparent bar over the dark hero,
//     light text (home). Overlay positioning sits over the following hero section
//     in the multipage stack — verified in the phase-12 parity QA.
// CSS-only mobile drawer: a top-level checkbox + sibling drawer (checkbox hack),
// toggled by the burger <label>. The EN/NL toggle is visual chrome only — real
// locale switching is the platform i18n layer.

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
  /** 'overlay' = transparent-over-hero (home); default 'solid' = inner pages. */
  mode?: 'overlay' | 'solid';
}

export function AtelierNavHeaderCore({ content, E }: { content: AtelierHeaderContent; E: AtelierPrimitives }) {
  const navItems = content.nav_items || [];
  const overlay = content.mode === 'overlay';
  const navClass = overlay ? 'lg-atelier-nav' : 'lg-atelier-nav solid';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HEADER_STYLES }} />
      {/* CSS-only mobile drawer toggle (sibling of the drawer below). */}
      <input type="checkbox" id="lg-atelier-menu" className="lg-atelier-menu-toggle" aria-hidden="true" tabIndex={-1} />
      <header className={navClass}>
        <div className="lg-atelier-nav-in">
          <nav className="lg-atelier-nav-left">
            <E.List collectionKey="nav_items" items={navItems} className="lg-atelier-nav-left" itemClassName=""
              makeItem={() => ({ label: '', href: '#' })} min={0} max={6} addLabel="+ Link"
              render={(item: AtelierNavItem) => (
                <E.Link hrefKey={`nav_items.${item.id}.href`} href={item.href} className="lg-atelier-nl">
                  <E.Txt elementKey={`nav_items.${item.id}.label`} value={item.label} as="span" placeholder="Link" />
                </E.Link>
              )}
            />
          </nav>
          <span className="lg-atelier-brand">
            {content.logo_image ? (
              <E.Img elementKey="logo_image" src={content.logo_image} alt={content.logo_text || 'logo'}
                className="lg-atelier-brand-logo" eager />
            ) : (
              <E.Txt elementKey="logo_text" value={content.logo_text} as="span" className="lg-atelier-wm" placeholder="Studio Name" />
            )}
          </span>
          <div className="lg-atelier-nav-right">
            <span className="lg-atelier-lang" role="group" aria-label="Language">
              <button type="button" aria-pressed="true">EN</button>
              <span className="lg-atelier-sep">/</span>
              <button type="button" aria-pressed="false">NL</button>
            </span>
            <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="lg-atelier-btn-nav">
              <E.Txt elementKey="cta_text" value={content.cta_text} isButton placeholder="Start a project" />
            </E.Link>
            <label className="lg-atelier-burger" htmlFor="lg-atelier-menu" aria-label="Menu">
              <span /><span /><span />
            </label>
          </div>
        </div>
      </header>
      {/* Mobile drawer — mirrors the nav links (static; the editable source is the
          nav above). Shown only < 900px via the checkbox hack. */}
      <div className="lg-atelier-drawer">
        <label className="lg-atelier-drawer-scrim" htmlFor="lg-atelier-menu" aria-hidden="true" />
        <div className="lg-atelier-drawer-panel">
          <label className="lg-atelier-drawer-close" htmlFor="lg-atelier-menu" aria-label="Close">×</label>
          {navItems.map((item) => (
            <a key={item.id} href={item.href || '#'}>{item.label || 'Link'}</a>
          ))}
        </div>
      </div>
    </>
  );
}

export default AtelierNavHeaderCore;
