// src/modules/service/blocks/Header/WarmNavHeader.published.tsx
// Server-safe published variant of WarmNavHeader. No hooks, no edit affordances.

import React from 'react';

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
}

export default function WarmNavHeaderPublished(props: WarmNavHeaderPublishedProps) {
  const logoText = props.logo_text || 'Studio';
  const ctaText = props.cta_text || 'Book a call';
  const navItems = Array.isArray(props.nav_items) ? props.nav_items : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <nav className="hearth-nav">
        <div className="hearth-nav__left">
          <div className="hearth-nav__brand">
            <div className="hearth-nav__brand-mark">{logoText.charAt(0).toLowerCase()}</div>
            <span>{logoText}</span>
          </div>
          {navItems.length > 0 && (
            <div className="hearth-nav__links">
              {navItems.map((item, idx) => (
                <a
                  key={item.id || idx}
                  href={item.href || '#'}
                  className={idx === 0 ? 'hearth-nav__link is-active' : 'hearth-nav__link'}
                >
                  {item.label || ''}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="hearth-nav__right">
          <a className="hearth-btn hearth-btn--primary hearth-btn--sm" href="#cta">
            {ctaText}
          </a>
        </div>
      </nav>
    </>
  );
}

const STYLES = `
.hearth-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px var(--sec-pad-x);
  max-width: var(--max-w); margin: 0 auto;
  font-family: var(--font-body);
}
.hearth-nav__left { display: flex; align-items: center; gap: 40px; }
.hearth-nav__brand {
  display: flex; align-items: center; gap: 12px;
  font-family: var(--font-display); font-weight: 500; font-size: 22px; letter-spacing: -0.01em;
  color: var(--ink);
}
.hearth-nav__brand-mark {
  width: 32px; height: 32px; border-radius: 999px;
  display: grid; place-items: center;
  background: var(--accent-wash); color: var(--accent-deep);
  font-family: var(--font-display); font-style: italic; font-size: 16px;
}
.hearth-nav__links { display: flex; gap: 32px; font-size: 15px; color: var(--ink-2); }
.hearth-nav__link { position: relative; padding: 4px 0; text-decoration: none; color: inherit; }
.hearth-nav__link.is-active { color: var(--ink); }
.hearth-nav__right { display: flex; align-items: center; gap: 12px; }
.hearth-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-body); font-weight: 500;
  border-radius: var(--r-md); text-decoration: none;
  border: 1px solid transparent;
}
.hearth-btn--primary { background: var(--ink); color: var(--cream); padding: 12px 20px; }
.hearth-btn--sm { padding: 10px 16px; font-size: 13.5px; border-radius: var(--r-sm); }
`;
