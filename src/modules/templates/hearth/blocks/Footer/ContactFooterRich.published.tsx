// src/modules/service/blocks/Footer/ContactFooterRich.published.tsx
// Server-safe published variant.

import React from 'react';
import { normalizeCopyrightYear } from '../../../shared/footerHygiene';

interface SocialLink {
  id?: string;
  platform?: string;
  href?: string;
}

interface ContactFooterRichPublishedProps {
  sectionId: string;
  tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  copyright?: string;
  social_links?: SocialLink[];
}

export default function ContactFooterRichPublished(props: ContactFooterRichPublishedProps) {
  const socialLinks = Array.isArray(props.social_links) ? props.social_links : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <footer className="hearth-footer">
        <div className="hearth-footer__top">
          <div className="hearth-footer__brand">
            <div className="hearth-footer__wordmark">studio</div>
            {props.tagline && <p className="hearth-footer__tagline">{props.tagline}</p>}
          </div>
          <div className="hearth-footer__col">
            <h4>Contact</h4>
            <ul>
              {props.contact_email && (
                <li>
                  <a href={`mailto:${props.contact_email}`}>{props.contact_email}</a>
                </li>
              )}
              {props.contact_phone && <li>{props.contact_phone}</li>}
              {props.address && <li>{props.address}</li>}
            </ul>
          </div>
          {socialLinks.length > 0 && (
            <div className="hearth-footer__col">
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
        <div className="hearth-footer__bottom">
          <div>{normalizeCopyrightYear(props.copyright) || '© Studio'}</div>
          <div className="hearth-footer__made">Made with care.</div>
        </div>
      </footer>
    </>
  );
}

const STYLES = `
.hearth-footer {
  max-width: var(--max-w); margin: 0 auto;
  padding: 96px var(--sec-pad-x) 40px;
  font-family: var(--font-body);
}
.hearth-footer__top {
  display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px;
  padding-bottom: 64px;
}
@media (max-width: 760px) { .hearth-footer__top { grid-template-columns: 1fr; gap: 32px; } }
.hearth-footer__wordmark {
  font-family: var(--font-display); font-weight: 500; font-size: 36px;
  color: var(--ink); letter-spacing: -0.01em;
}
.hearth-footer__tagline {
  font-family: var(--font-display); font-style: italic;
  font-size: 16px; color: var(--ink-2); line-height: 1.5;
  margin-top: 16px; max-width: 36ch;
}
.hearth-footer__col h4 {
  font-size: 12px; font-weight: 500; text-transform: uppercase;
  letter-spacing: 0.2em; color: var(--accent-deep);
  margin: 0 0 22px;
}
.hearth-footer__col ul { list-style: none; padding: 0; margin: 0; }
.hearth-footer__col ul li {
  font-size: 16px; color: var(--ink-2); padding: 6px 0;
}
.hearth-footer__col ul li a { color: inherit; text-decoration: none; }
.hearth-footer__col ul li a:hover { color: var(--accent-deep); }
.hearth-footer__bottom {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 32px; border-top: 1px solid var(--line);
  font-size: 13.5px; color: var(--ink-3);
}
.hearth-footer__made { font-style: italic; font-family: var(--font-display); }
`;
