// src/modules/templates/lex/blocks/Header/LetterheadNav.published.tsx
// Server-safe published variant of LetterheadNav. No hooks, no edit affordances.

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';

interface NavItem {
  id?: string;
  label?: string;
  href?: string;
}

interface LetterheadNavPublishedProps {
  sectionId: string;
  logo_text?: string;
  cta_text?: string;
  logo_image?: string;
  nav_items?: NavItem[];
  content?: any;
}

export default function LetterheadNavPublished(props: LetterheadNavPublishedProps) {
  const logoText = props.logo_text || 'Firm';
  const ctaText = props.cta_text || 'Schedule a consultation';
  const navItems = Array.isArray(props.nav_items) ? props.nav_items : [];

  const md = props.content?.[props.sectionId]?.elementMetadata;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, props.content?.forms, '#cta');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <nav className="lex-nav">
        <div className="lex-nav__brand">
          <span className="lex-nav__mark">{logoText.charAt(0).toUpperCase()}</span>
          <span>{logoText}</span>
        </div>
        <div className="lex-nav__mid">
          {navItems.map((item, idx) => (
            <a
              key={item.id || idx}
              href={item.href || '#'}
              className={idx === 0 ? 'lex-nav__link is-active' : 'lex-nav__link'}
            >
              {item.label || ''}
            </a>
          ))}
        </div>
        <div className="lex-nav__right">
          <a className="lex-nav__cta" href={ctaHref}>{ctaText}</a>
        </div>
      </nav>
    </>
  );
}

const STYLES = `
.lex-nav {
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: stretch;
  border-bottom: 1px solid var(--rule);
  background: var(--paper);
  font-family: var(--font-body);
}
.lex-nav__brand {
  display: flex; align-items: center; gap: 12px;
  padding: 24px var(--sec-pad-x);
  border-right: 1px solid var(--rule);
  font-family: var(--font-display); font-weight: 500; font-size: 24px;
  letter-spacing: -0.015em; color: var(--ink);
}
.lex-nav__mark {
  width: 32px; height: 32px;
  border: 1.5px solid var(--trust); border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-style: italic; font-weight: 500;
  font-size: 18px; color: var(--trust); flex-shrink: 0;
}
.lex-nav__mid { display: flex; align-items: center; gap: 0; padding: 0 8px; }
.lex-nav__link {
  font-size: 13px; font-weight: 500; padding: 0 22px;
  display: inline-flex; align-items: center; color: var(--ink-2);
  letter-spacing: 0.04em; position: relative; text-decoration: none;
}
.lex-nav__link:hover { color: var(--ink); }
.lex-nav__link.is-active { color: var(--ink); }
.lex-nav__link.is-active::after {
  content: ""; position: absolute; bottom: 18px; left: 22px; right: 22px;
  height: 2px; background: var(--trust);
}
.lex-nav__right {
  display: flex; align-items: center; gap: 16px;
  padding: 0 var(--sec-pad-x);
  border-left: 1px solid var(--rule);
}
.lex-nav__cta {
  background: var(--trust); color: var(--trust-ink);
  font-family: var(--font-body); font-weight: 500; font-size: 13px;
  padding: 12px 22px; border-radius: 2px; letter-spacing: 0.02em;
  display: inline-flex; align-items: center; gap: 8px; text-decoration: none;
}
.lex-nav__cta:hover { background: var(--trust-deep); }
@media (max-width: 1100px) {
  .lex-nav__mid { display: none; }
}
`;
