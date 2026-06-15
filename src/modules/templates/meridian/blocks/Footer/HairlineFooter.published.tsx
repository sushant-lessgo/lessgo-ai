// src/modules/templates/meridian/blocks/Footer/HairlineFooter.published.tsx
// Server-safe published variant of HairlineFooter. Nested link columns.

import React from 'react';

interface FooterLink {
  id?: string;
  label?: string;
  href?: string;
}

interface FooterColumn {
  id?: string;
  heading?: string;
  links?: FooterLink[];
}

interface HairlineFooterPublishedProps {
  sectionId: string;
  wordmark?: string;
  tag?: string;
  newsletter_placeholder?: string;
  newsletter_cta?: string;
  copyright?: string;
  location?: string;
  footer_columns?: FooterColumn[];
}

export default function HairlineFooterPublished(props: HairlineFooterPublishedProps) {
  const columns = Array.isArray(props.footer_columns) ? props.footer_columns : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <footer className="mrd-footer">
        <div className="mrd-footer__top">
          <div className="mrd-footer__brand">
            <div className="mrd-footer__wordmark">
              {props.wordmark || 'meridian'}
              <span className="mrd-footer__dot" aria-hidden="true">.</span>
            </div>
            {props.tag && <p className="mrd-footer__tag">{props.tag}</p>}
            {/* Decorative newsletter UI. Rendered as a div (not a form) because
                the published page is a Server Component — event handlers like
                onSubmit can't cross the RSC boundary. The original handler only
                preventDefault'd, so a non-submitting div is behavior-equivalent. */}
            <div className="mrd-news">
              <input className="mrd-news__input" placeholder={props.newsletter_placeholder || 'you@company.com'} readOnly />
              <button type="button" className="mrd-news__btn">{props.newsletter_cta || 'subscribe'}</button>
            </div>
          </div>

          {columns.map((col, idx) => (
            <div key={col.id || idx} className="mrd-footer__col">
              {col.heading && <h4>{col.heading}</h4>}
              <ul>
                {(col.links || []).map((link, linkIdx) => (
                  <li key={link.id || linkIdx}>
                    <a href={link.href || '#'}>{link.label || ''}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mrd-footer__bottom">
          <div>{props.copyright || '© Meridian'}</div>
          {props.location && <div>{props.location}</div>}
        </div>
      </footer>
    </>
  );
}

const STYLES = `
.mrd-footer { border-top: 1px solid var(--line); padding: 72px var(--sec-pad-x) 32px; max-width: 1340px; margin: 0 auto; font-family: var(--font-body); }
.mrd-footer__top { display: flex; flex-wrap: wrap; gap: 40px; padding-bottom: 56px; border-bottom: 1px solid var(--line); }
.mrd-footer__brand { flex: 2 1 280px; }
.mrd-footer__col { flex: 1 1 140px; }
.mrd-footer__wordmark { font-family: var(--font-display); font-weight: 600; font-size: 26px; letter-spacing: -0.03em; color: var(--bone); }
.mrd-footer__dot { color: var(--accent); }
.mrd-footer__tag { font-family: var(--font-display); font-size: 14px; color: var(--bone-2); margin: 12px 0 22px; max-width: 34ch; }
.mrd-news { display: flex; border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; max-width: 320px; }
.mrd-news__input { flex: 1; border: 0; background: transparent; color: var(--bone); padding: 10px 12px; font: inherit; font-size: 13px; outline: none; }
.mrd-news__input::placeholder { color: var(--bone-3); }
.mrd-news__btn { background: var(--ink-1); color: var(--bone); padding: 0 14px; border: 0; border-left: 1px solid var(--line); font-family: var(--font-mono); font-size: 12px; cursor: pointer; }
.mrd-news__btn:hover { background: var(--ink-2); }
.mrd-footer__col h4 { font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--bone-3); margin: 0 0 18px; font-weight: 400; }
.mrd-footer__col ul { list-style: none; padding: 0; margin: 0; }
.mrd-footer__col ul li { font-size: 13.5px; color: var(--bone-2); padding: 4px 0; }
.mrd-footer__col ul li a { color: inherit; text-decoration: none; }
.mrd-footer__col ul li a:hover { color: var(--bone); }
.mrd-footer__bottom {
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap;
  padding-top: 28px; font-family: var(--font-mono); font-size: 11px; color: var(--bone-3); letter-spacing: 0.04em;
}
[data-variant="marketing"] .mrd-footer__col h4 { font-family: var(--font-body); letter-spacing: 0; text-transform: none; font-size: 12px; }
`;
