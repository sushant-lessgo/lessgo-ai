// src/modules/skeletons/work/blocks/Footer/WorkFooter.core.tsx
// SINGLE-SOURCE footer layout (granth .core pattern). PLAIN server-safe module —
// renders through injected `E`. Binds the FROZEN work-core `footer` contract
// (workElementContract.footer, GranthFollowFooter donor):
//   scalars — eyebrow · heading · note · copyright
//   collection — socials[] { id, network, href }
//
// Tokens: SKIN `var(--wk-*)` + USER `var(--u-*, <default>)`. Root carries
// `data-sid` (style-token hook) + `data-section-id`.

import React from 'react';
import type { WorkPrimitives } from '../primitives';
import { normalizeCopyrightYear } from '@/modules/templates/shared/footerHygiene';
import { WORK_FOOTER_STYLES } from './styles';

export interface WorkFooterSocial { id: string; network?: string; href?: string }

// Wave 2 (work-contract-wave2 phase 5) — DERIVED footer shape. These keys are
// STAMPED into stored content at assembly by workFooterDerive.stampWorkFooterNav
// (behind the `footer_nav_mode:'derived'` opt-in marker) and re-stamped on a CMS
// page-set change by resyncWorkContent. Both renderers read the SAME stored data,
// so there is NO render-time page-list divergence (dual-renderer safe). Absent
// marker ⇒ the core renders EXACTLY today's footer (Kundius byte-identical).
export interface WorkFooterNavLink { id: string; label?: string; href?: string }
export interface WorkFooterNavColumn { id: string; heading?: string; links?: WorkFooterNavLink[] }

export interface WorkFooterContent {
  eyebrow?: string;
  heading?: string;
  note?: string;
  copyright?: string;
  socials?: WorkFooterSocial[];
  /** Opt-in marker: `'derived'` switches on the 3-col index shape below. */
  footer_nav_mode?: string;
  /** Derived nav columns (from the live page set). */
  nav_columns?: WorkFooterNavColumn[];
  /** Derived contact lines (from facts identity). */
  contact_location?: string;
  contact_reach?: string;
}

export function WorkFooterCore({
  content, E, sectionId,
}: { content: WorkFooterContent; E: WorkPrimitives; sectionId: string }) {
  const socials = content.socials || [];

  // ── DERIVED shape (marker present) ────────────────────────────────────────
  // Adds a columns row (nav columns + contact) between the top block and socials.
  // The nav columns/contact are DERIVED (auto-tracked to the page set) → rendered
  // as PLAIN nodes (no edit primitive), so edit == published by construction and
  // a manual edit can't fight the re-stamp. Top/socials/bottom are UNCHANGED from
  // the legacy branch.
  if (content.footer_nav_mode === 'derived') {
    const columns = (content.nav_columns || []).filter((c) => (c.links || []).length > 0);
    const hasContact = !!(content.contact_location || content.contact_reach);
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: WORK_FOOTER_STYLES }} />
        <footer className="wk-footer" data-sid={sectionId} data-section-id={sectionId} data-wk-footer="">
          <div className="wk-footer__in">
            <div className="wk-footer__top">
              <div>
                <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
                  className="wk-footer__eyebrow" placeholder="Get in touch" />
                <E.Txt elementKey="heading" value={content.heading} as="h2"
                  className="wk-footer__heading" placeholder="Let’s make yours." />
              </div>
              <E.Txt elementKey="note" value={content.note} as="p"
                className="wk-footer__note" multiline placeholder="A short closing line about the studio." />
            </div>

            {(columns.length > 0 || hasContact) && (
              <div className="wk-footer__cols">
                {columns.map((col) => (
                  <nav className="wk-footer__col" key={col.id}>
                    {col.heading && <span className="wk-footer__col-head">{col.heading}</span>}
                    <ul className="wk-footer__col-list">
                      {(col.links || []).map((l) => (
                        <li key={l.id}>
                          <a className="wk-footer__col-link" href={l.href || '#'}>{l.label}</a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
                {hasContact && (
                  <div className="wk-footer__col wk-footer__contact">
                    <span className="wk-footer__col-head">Contact</span>
                    {content.contact_location && (
                      <span className="wk-footer__contact-line">{content.contact_location}</span>
                    )}
                    {content.contact_reach && (
                      <span className="wk-footer__contact-line">{content.contact_reach}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {(socials.length > 0) && (
              <E.List collectionKey="socials" items={socials} className="wk-footer__socials"
                makeItem={() => ({ network: 'instagram', href: '' })} min={0} max={6} addLabel="+ Social"
                render={(item: WorkFooterSocial) => (
                  <E.Link hrefKey={`socials.${item.id}.href`} href={item.href}
                    ariaLabel={item.network} external className="wk-footer__social">
                    <E.Txt elementKey={`socials.${item.id}.network`} value={item.network}
                      as="span" placeholder="Instagram" />
                  </E.Link>
                )}
              />
            )}

            <div className="wk-footer__bottom">
              <E.Txt elementKey="copyright"
                value={normalizeCopyrightYear(content.copyright) ?? content.copyright} as="span"
                placeholder="© Studio Name" />
            </div>
          </div>
        </footer>
      </>
    );
  }

  // ── LEGACY shape (no marker) — EXACTLY today's footer (Kundius byte-identical) ──
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WORK_FOOTER_STYLES }} />
      <footer className="wk-footer" data-sid={sectionId} data-section-id={sectionId} data-wk-footer="">
        <div className="wk-footer__in">
          <div className="wk-footer__top">
            <div>
              <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
                className="wk-footer__eyebrow" placeholder="Get in touch" />
              <E.Txt elementKey="heading" value={content.heading} as="h2"
                className="wk-footer__heading" placeholder="Let’s make yours." />
            </div>
            <E.Txt elementKey="note" value={content.note} as="p"
              className="wk-footer__note" multiline placeholder="A short closing line about the studio." />
          </div>

          {(socials.length > 0) && (
            <E.List collectionKey="socials" items={socials} className="wk-footer__socials"
              makeItem={() => ({ network: 'instagram', href: '' })} min={0} max={6} addLabel="+ Social"
              render={(item: WorkFooterSocial) => (
                <E.Link hrefKey={`socials.${item.id}.href`} href={item.href}
                  ariaLabel={item.network} external className="wk-footer__social">
                  <E.Txt elementKey={`socials.${item.id}.network`} value={item.network}
                    as="span" placeholder="Instagram" />
                </E.Link>
              )}
            />
          )}

          <div className="wk-footer__bottom">
            <E.Txt elementKey="copyright"
              value={normalizeCopyrightYear(content.copyright) ?? content.copyright} as="span"
              placeholder="© Studio Name" />
          </div>
        </div>
      </footer>
    </>
  );
}

export default WorkFooterCore;
