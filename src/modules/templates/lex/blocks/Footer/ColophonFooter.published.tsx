// src/modules/templates/lex/blocks/Footer/ColophonFooter.published.tsx
// Server-safe published variant of ColophonFooter.

import React from 'react';
import { normalizeCopyrightYear } from '../../../shared/footerHygiene';

interface SocialLink {
  id?: string;
  platform?: string;
  href?: string;
}

interface ColophonFooterPublishedProps {
  sectionId: string;
  tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  copyright?: string;
  social_links?: SocialLink[];
}

export default function ColophonFooterPublished(props: ColophonFooterPublishedProps) {
  const socialLinks = Array.isArray(props.social_links) ? props.social_links : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <footer className="lex-footer">
        <div className="lex-footer__top">
          <div className="lex-footer__brand">
            {props.tagline && (
              <p className="lex-footer__tagline" dangerouslySetInnerHTML={{ __html: props.tagline }} />
            )}
            <div className="lex-footer__addr">
              {props.contact_email && <div>{props.contact_email}</div>}
              {props.contact_phone && <div>{props.contact_phone}</div>}
              {props.address && <div dangerouslySetInnerHTML={{ __html: props.address }} />}
            </div>
          </div>
          {socialLinks.length > 0 && (
            <div className="lex-footer__col">
              <h4>Elsewhere</h4>
              <ul>
                {socialLinks.map((s, idx) => (
                  <li key={s.id || idx}>
                    <a href={s.href || '#'}>{s.platform || ''}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="lex-footer__bottom">
          <span>{normalizeCopyrightYear(props.copyright) || ''}</span>
          <span className="lex-footer__set">Set in Source Serif 4 &amp; Inter Tight</span>
        </div>
      </footer>
    </>
  );
}

const STYLES = `
.lex-footer {
  background: var(--paper); border-top: 1px solid var(--ink);
  font-family: var(--font-body);
}
.lex-footer__top {
  padding: 64px var(--sec-pad-x) 56px;
  display: grid; grid-template-columns: 1.6fr 1fr; gap: 48px;
  border-bottom: 1px solid var(--rule);
}
@media (max-width: 760px) { .lex-footer__top { grid-template-columns: 1fr; gap: 32px; } }
.lex-footer__brand { display: flex; flex-direction: column; gap: 16px; }
.lex-footer__tagline {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 20px; line-height: 1.5; color: var(--ink-2); max-width: 36ch; margin: 0;
}
.lex-footer__addr {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em;
  color: var(--ink-3); line-height: 1.9; margin-top: 8px;
}
.lex-footer__col h4 {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 500;
  margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--rule);
}
.lex-footer__col ul { list-style: none; margin: 0; padding: 0; }
.lex-footer__col ul li {
  font-family: var(--font-display); font-weight: 400; font-size: 16px; padding: 6px 0;
}
.lex-footer__col ul li a { color: var(--ink-2); text-decoration: none; }
.lex-footer__col ul li a:hover { color: var(--trust); }
.lex-footer__bottom {
  padding: 24px var(--sec-pad-x);
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-3); flex-wrap: wrap;
}
.lex-footer__set {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 13px; letter-spacing: 0; text-transform: none; color: var(--ink-2);
}
`;
