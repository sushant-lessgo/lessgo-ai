// src/modules/templates/techpremium/blocks/Footer/TechPremiumFooter.published.tsx
// Server-safe published variant of TechPremiumFooter (dark forest-d surface).
// Nested link columns + optional live newsletter capture.

import React from 'react';
import TechPremiumNewsletterCapture from './TechPremiumNewsletterCapture';

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

interface TechPremiumFooterPublishedProps {
  sectionId: string;
  wordmark?: string;
  tag?: string;
  newsletter_placeholder?: string;
  newsletter_cta?: string;
  copyright?: string;
  location?: string;
  footer_columns?: FooterColumn[];
  content?: any;
  publishedPageId?: string;
  pageOwnerId?: string;
}

export default function TechPremiumFooterPublished(props: TechPremiumFooterPublishedProps) {
  const columns = Array.isArray(props.footer_columns) ? props.footer_columns : [];

  const newsletterFormId: string | undefined =
    props.content?.[props.sectionId]?.elementMetadata?.newsletter_cta?.buttonConfig?.formId;
  const newsletterForm = newsletterFormId ? props.content?.forms?.[newsletterFormId] : undefined;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <footer className="tp-footer">
        <div className="tp-footer__inner">
          <div className="tp-footer__top">
            <div className="tp-footer__brand">
              <span className="tp-footer__brand-wm">
                <span className="tp-footer__mk" aria-hidden="true" />
                {props.wordmark || 'Brand'}
              </span>
              {props.tag && <p className="tp-footer__tag">{props.tag}</p>}
              {newsletterForm && (
                <TechPremiumNewsletterCapture
                  form={newsletterForm}
                  formId={newsletterFormId as string}
                  placeholder={props.newsletter_placeholder}
                  cta={props.newsletter_cta}
                  publishedPageId={props.publishedPageId}
                  pageOwnerId={props.pageOwnerId}
                />
              )}
            </div>

            {columns.map((col, idx) => (
              <div key={col.id || idx} className="tp-footer__col">
                {col.heading && <h4>{col.heading}</h4>}
                <ul>
                  {(col.links || []).map((link, linkIdx) => (
                    <li key={link.id || linkIdx}>
                      <a className="tp-footer__link" href={link.href || '#'}>{link.label || ''}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="tp-footer__bottom">
            <div>{props.copyright || '© Your Company'}</div>
            {props.location && <div>{props.location}</div>}
          </div>
        </div>
      </footer>
    </>
  );
}

const STYLES = `
.tp-footer { padding: var(--pad-y) var(--pad-x) 0; font-family:var(--font-body); color:oklch(0.84 0.022 140 / 0.82); }
.tp-footer__inner { max-width:var(--max-w); margin:0 auto; }
.tp-footer__top { display:grid; grid-template-columns:1.6fr 1fr 1fr 1fr; gap:36px; padding-bottom:44px; }
.tp-footer__brand-wm { display:inline-flex; align-items:center; gap:11px; font-family:var(--font-display); font-weight:700; font-size:21px; letter-spacing:-0.02em; color:var(--paper); }
.tp-footer__mk { width:34px; height:34px; border-radius:7px; background:oklch(0.34 0.045 158); display:grid; place-items:center; position:relative; flex-shrink:0; }
.tp-footer__mk::before { content:""; width:14px; height:14px; border-radius:50%; border:2px solid var(--lime); }
.tp-footer__mk::after { content:""; position:absolute; width:5px; height:5px; border-radius:50%; background:var(--lime); }
.tp-footer__tag { font-size:14px; line-height:1.7; max-width:34ch; margin:18px 0; }
.tp-news { display:flex; border:1px solid var(--line-dk); border-radius:var(--r); overflow:hidden; max-width:320px; margin:18px 0; }
.tp-news__input { flex:1; border:0; background:transparent; color:var(--paper); padding:10px 12px; font:inherit; font-size:13px; outline:none; }
.tp-news__input::placeholder { color:oklch(0.84 0.022 140 / 0.55); }
.tp-news__btn { background:var(--lime); color:var(--forest-d); padding:0 14px; border:0; font-family:var(--font-mono); font-size:12px; font-weight:600; cursor:pointer; }
.tp-news__btn:disabled { opacity:0.6; cursor:default; }
.tp-news-done { font-family:var(--font-mono); font-size:12px; color:var(--lime); max-width:320px; padding:6px 0; }
.tp-footer__col h4 { font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; color:var(--lime); margin:0 0 16px; }
.tp-footer__col ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:11px; }
.tp-footer__col li { font-size:14px; }
.tp-footer__link { color:inherit; text-decoration:none; }
.tp-footer__link:hover { color:var(--paper); }
.tp-footer__bottom { border-top:1px solid var(--line-dk); padding:20px 0; margin-top:8px; display:flex; flex-wrap:wrap; gap:12px 26px; align-items:center; justify-content:space-between; font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.04em; }
@media (max-width:1040px){ .tp-footer__top { grid-template-columns:1fr 1fr; gap:32px 24px; } }
@media (max-width:520px){ .tp-footer__top { grid-template-columns:1fr; } }
`;
