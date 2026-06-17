// src/modules/templates/techpremium/blocks/Header/TechPremiumNav.published.tsx
// Server-safe published variant of TechPremiumNav. No hooks, no edit affordances.

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';

interface NavItem {
  id?: string;
  label?: string;
  href?: string;
}

interface TechPremiumNavPublishedProps {
  sectionId: string;
  logo_text?: string;
  cta_text?: string;
  signin_text?: string;
  logo_image?: string;
  nav_items?: NavItem[];
  content?: any;
}

export default function TechPremiumNavPublished(props: TechPremiumNavPublishedProps) {
  const logoText = props.logo_text || 'Brand';
  const ctaText = props.cta_text || 'Book a demo';
  const signinText = props.signin_text || 'Platform login';
  const navItems = Array.isArray(props.nav_items) ? props.nav_items : [];

  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#cta');
  const signinHref = resolveCtaHref(md?.signin_text?.buttonConfig, forms, '#signin');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <nav className="tp-nav">
        <div className="tp-nav__left">
          <div className="tp-brand">
            {props.logo_image ? (
              <img className="tp-brand__img" src={props.logo_image} alt="" />
            ) : (
              <span className="tp-brand__mk" aria-hidden="true" />
            )}
            <span className="tp-brand__wm">{logoText}</span>
          </div>
          {navItems.length > 0 && (
            <div className="tp-nav-links">
              {navItems.map((item, idx) => (
                <a key={item.id || idx} className="tp-nav-link" href={item.href || '#'}>{item.label || ''}</a>
              ))}
            </div>
          )}
        </div>
        <div className="tp-nav-right">
          <a className="tp-nav-login" href={signinHref}>
            <svg className="tp-nav-login__lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <span>{signinText}</span>
          </a>
          <a className="tp-btn tp-btn--fill tp-btn--sm" href={ctaHref}>{ctaText}</a>
        </div>
      </nav>
    </>
  );
}

const STYLES = `
.tp-nav { display:flex; align-items:center; justify-content:space-between; gap:28px; padding:14px var(--pad-x); border-bottom:1px solid var(--line); font-family:var(--font-body); }
.tp-nav__left { display:flex; align-items:center; gap:28px; min-width:0; }
.tp-brand { display:inline-flex; align-items:center; gap:11px; }
.tp-brand__mk { width:34px; height:34px; border-radius:7px; background:var(--forest); display:grid; place-items:center; position:relative; flex-shrink:0; }
.tp-brand__mk::before { content:""; width:14px; height:14px; border-radius:50%; border:2px solid var(--lime); }
.tp-brand__mk::after { content:""; position:absolute; width:5px; height:5px; border-radius:50%; background:var(--lime); }
.tp-brand__img { width:34px; height:34px; border-radius:7px; object-fit:cover; flex-shrink:0; }
.tp-brand__wm { font-family:var(--font-display); font-weight:700; font-size:21px; letter-spacing:-0.02em; color:var(--ink); }
.tp-nav-links { display:flex; align-items:center; gap:28px; }
.tp-nav-link { font-size:14px; font-weight:500; color:var(--ink-2); text-decoration:none; }
.tp-nav-link:hover { color:var(--forest); }
.tp-nav-right { display:flex; align-items:center; gap:12px; }
.tp-nav-login { display:inline-flex; align-items:center; gap:7px; font-family:var(--font-display); font-weight:600; font-size:14px; color:var(--ink-2); text-decoration:none; }
.tp-nav-login:hover { color:var(--forest); }
.tp-nav-login__lock { width:13px; height:13px; flex:none; }
.tp-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-display); font-weight:600; font-size:14.5px; letter-spacing:-0.005em; padding:13px 22px; border-radius:var(--r); white-space:nowrap; line-height:1; transition:background .16s ease,color .16s ease,border-color .16s ease,transform .16s ease; cursor:pointer; text-decoration:none; border:1px solid transparent; }
.tp-btn--sm { padding:10px 18px; font-size:14px; }
.tp-btn--fill { background:var(--forest); color:var(--paper); }
.tp-btn--fill:hover { background:var(--forest-d); transform:translateY(-1px); }
@media (max-width:1040px){ .tp-nav-links { display:none; } }
@media (max-width:520px){ .tp-nav-login span { display:none; } }
`;
