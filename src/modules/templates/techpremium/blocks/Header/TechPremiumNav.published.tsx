// src/modules/templates/techpremium/blocks/Header/TechPremiumNav.published.tsx
// Server-safe published header (Phase 4): dropdown nav + mobile panel + login +
// book-demo. Behaviors (dropdown toggle, burger, active-link) wired by naayom.v1.js.

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';
import { NAV_STYLES } from './navStyles';

interface NavChild { id?: string; label?: string; desc?: string; href?: string }
interface NavItem { id?: string; label?: string; href?: string; children?: NavChild[] }
interface Props {
  sectionId: string;
  logo_text?: string; logo_image?: string;
  cta_text?: string; cta_href?: string;
  signin_text?: string; signin_url?: string;
  nav_items?: NavItem[];
  content?: any;
}

const Lock = () => (<svg className="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
const Chev = () => (<svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>);
const Burger = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>);

export default function TechPremiumNavPublished(props: Props) {
  const navItems = Array.isArray(props.nav_items) ? props.nav_items : [];
  const logoText = props.logo_text || 'Brand';
  const ctaText = props.cta_text || 'Book a demo';
  const signinText = props.signin_text || 'Platform login';

  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = props.cta_href || resolveCtaHref(md?.cta_text?.buttonConfig, forms, '/contact');
  const signinHref = props.signin_url || resolveCtaHref(md?.signin_text?.buttonConfig, forms, '#');
  const hasChildren = (it: NavItem) => Array.isArray(it.children) && it.children.length > 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NAV_STYLES }} />
      <nav className="tp-nav">
        <div className="tp-nav-in">
          <a className="tp-brand" href="/">
            {props.logo_image ? (
              <img className="tp-brand__img" src={props.logo_image} alt={logoText} />
            ) : (
              <>
                <span className="tp-brand__mk" aria-hidden="true" />
                <span className="tp-brand__wm">{logoText}</span>
              </>
            )}
          </a>

          <div className="tp-nav-links">
            {navItems.map((item, i) => hasChildren(item) ? (
              <div key={item.id || i} className="tp-nav-drop">
                <button type="button" className="tp-nav-drop-t" aria-expanded="false">{item.label || ''}<Chev /></button>
                <div className="tp-nav-drop-menu">
                  {item.children!.map((c, k) => (
                    <a key={c.id || k} href={c.href || '#'}><b>{c.label || ''}</b>{c.desc && <span>{c.desc}</span>}</a>
                  ))}
                </div>
              </div>
            ) : (
              <a key={item.id || i} href={item.href || '#'}>{item.label || ''}</a>
            ))}
          </div>

          <div className="tp-nav-cta">
            {signinHref && signinHref !== '#' && (
              <a className="tp-nav-login" href={signinHref}><Lock /><span>{signinText}</span></a>
            )}
            <a className="tp-btn tp-btn--fill" href={ctaHref}>{ctaText}</a>
            <button type="button" className="tp-nav-burger" aria-label="Menu" aria-expanded="false"><Burger /></button>
          </div>
        </div>

        {/* Mobile panel (toggled by naayom.v1.js) */}
        <div className="tp-nav-mobile">
          <div className="tp-nav-mobile-list">
            {navItems.map((item, i) => hasChildren(item) ? (
              <div key={item.id || i} className="tp-nav-m-sec">
                <button type="button">{item.label || ''}<Chev /></button>
                <div className="tp-nav-m-sub">
                  {item.children!.map((c, k) => <a key={c.id || k} href={c.href || '#'}>{c.label || ''}</a>)}
                </div>
              </div>
            ) : (
              <a key={item.id || i} href={item.href || '#'}>{item.label || ''}</a>
            ))}
            {signinHref && signinHref !== '#' && <a href={signinHref}>{signinText}</a>}
          </div>
          <div className="tp-nav-mobile-cta">
            <a className="tp-btn tp-btn--fill" href={ctaHref}>{ctaText}</a>
          </div>
        </div>
      </nav>
    </>
  );
}
