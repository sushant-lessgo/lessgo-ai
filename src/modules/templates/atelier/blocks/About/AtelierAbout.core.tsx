// src/modules/templates/atelier/blocks/About/AtelierAbout.core.tsx
// SINGLE-SOURCE about section. PLAIN server-safe module. Ported from the approved
// design (index.html about teaser + about.html bio split / press / studio; atl-* →
// lg-atelier-). Used BOTH as the home about teaser and the About-page bio.
//
// TWO MODES:
//   - default (teaser): the bio split only (schema keys: eyebrow/headline/body/
//     body2/about_image/signature + optional badge/cta chrome).
//   - content.mode === 'page': adds a press strip (`press_items`) + a reversed
//     studio split (`studio_*`).
//
// PORT DEVIATION (logged in audit): the design's About page is three separate
// surfaces (bio / press-alt / studio); here they compress into ONE section (one
// data-surface), delineated by rules. press_items + studio_* are OPTIONAL,
// non-schema (manual-fill / block-mocks), so generation leaves them empty.

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { ABOUT_STYLES } from './styles';

export interface AtelierPressItem { id: string; year?: string; title?: string; publication?: string }

export interface AtelierAboutContent {
  eyebrow?: string;
  headline?: string;
  body?: string;
  body2?: string;
  about_image?: string;
  signature?: string;
  badge_text?: string;
  cta_text?: string;
  cta_href?: string;
  secondary_cta_text?: string;
  secondary_cta_href?: string;
  /** 'page' = full About page (adds press + studio split); default = teaser. */
  mode?: 'page';
  // page-mode extras (optional, non-schema)
  press_eyebrow?: string;
  press_headline?: string;
  press_items?: AtelierPressItem[];
  studio_eyebrow?: string;
  studio_headline?: string;
  studio_body?: string;
  studio_image?: string;
  studio_cta_text?: string;
  studio_cta_href?: string;
}

export function AtelierAboutCore({ content, E }: { content: AtelierAboutContent; E: AtelierPrimitives }) {
  const page = content.mode === 'page';
  const press = content.press_items || [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ABOUT_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad">
        {/* ── BIO SPLIT ── */}
        <div className="lg-atelier-split">
          <div className="lg-atelier-split-art">
            <E.Img elementKey="about_image" src={content.about_image} alt={content.headline || 'about'}
              className="lg-atelier-split-art__img" imgClassName=""
              placeholder={<div className="lg-atelier-ph"><span>Portrait — 4:5</span></div>} />
            <E.Txt elementKey="badge_text" value={content.badge_text} as="span" className="lg-atelier-badge" placeholder="Maker · City" />
          </div>
          <div className="lg-atelier-split-copy">
            {content.eyebrow !== undefined && (
              <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-label" placeholder="About" />
            )}
            <E.Txt elementKey="headline" value={content.headline} as="h2" className="lg-atelier-heading" placeholder="The hands behind <em>the work.</em>" />
            <E.Txt elementKey="body" value={content.body} as="p" placeholder="A short introduction lives here — who makes the work and what clients hire them for." multiline />
            {content.body2 !== undefined && (
              <E.Txt elementKey="body2" value={content.body2} as="p" placeholder="" multiline />
            )}
            <E.Txt elementKey="signature" value={content.signature} as="div" className="lg-atelier-sign" placeholder="Maker Name" />
            <div className="lg-atelier-split-actions">
              <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="lg-atelier-btn lg-atelier-fill">
                <E.Txt elementKey="cta_text" value={content.cta_text} isButton placeholder="Start a project" />
              </E.Link>
              {content.secondary_cta_text !== undefined && (
                <E.Link hrefKey="secondary_cta_href" href={content.secondary_cta_href || '#work'} className="lg-atelier-btn lg-atelier-line">
                  <E.Txt elementKey="secondary_cta_text" value={content.secondary_cta_text} isButton placeholder="See the work" />
                </E.Link>
              )}
            </div>
          </div>
        </div>

        {page && (
          <>
            {/* ── PRESS STRIP ── */}
            <div className="lg-atelier-about-extra">
              <div className="lg-atelier-rule">
                <E.Txt elementKey="press_eyebrow" value={content.press_eyebrow} as="span" className="lg-atelier-rule__idx" placeholder="01" />
                <E.Txt elementKey="press_headline" value={content.press_headline} as="h2" className="lg-atelier-heading" placeholder="Selected recognition" />
              </div>
              <E.List
                collectionKey="press_items"
                items={press}
                className="lg-atelier-press"
                itemClassName="lg-atelier-press-row"
                makeItem={() => ({ year: '', title: '', publication: '' })}
                min={0}
                max={12}
                addLabel="+ Recognition"
                render={(item: AtelierPressItem) => (
                  <>
                    <E.Txt elementKey={`press_items.${item.id}.year`} value={item.year} as="span" className="y" placeholder="2026" />
                    <E.Txt elementKey={`press_items.${item.id}.title`} value={item.title} as="span" className="t" placeholder="Award or feature title" />
                    <E.Txt elementKey={`press_items.${item.id}.publication`} value={item.publication} as="span" className="w" placeholder="Publication" />
                  </>
                )}
              />
            </div>

            {/* ── STUDIO SPLIT (reversed) ── */}
            <div className="lg-atelier-about-extra">
              <div className="lg-atelier-split lg-atelier-split--rev">
                <div className="lg-atelier-split-art">
                  <E.Img elementKey="studio_image" src={content.studio_image} alt={content.studio_headline || 'studio'}
                    className="lg-atelier-split-art__img" imgClassName=""
                    placeholder={<div className="lg-atelier-ph"><span>Studio image — 4:5</span></div>} />
                </div>
                <div className="lg-atelier-split-copy">
                  <E.Txt elementKey="studio_eyebrow" value={content.studio_eyebrow} as="span" className="lg-atelier-label" placeholder="The studio" />
                  <E.Txt elementKey="studio_headline" value={content.studio_headline} as="h2" className="lg-atelier-heading" placeholder="Where the work <em>happens.</em>" />
                  <E.Txt elementKey="studio_body" value={content.studio_body} as="p" placeholder="A short paragraph about the space, the tools, or the way of working." multiline />
                  {content.studio_cta_text !== undefined && (
                    <div className="lg-atelier-split-actions">
                      <E.Link hrefKey="studio_cta_href" href={content.studio_cta_href || '#packages'} className="lg-atelier-btn lg-atelier-line">
                        <E.Txt elementKey="studio_cta_text" value={content.studio_cta_text} isButton placeholder="Ways to work together" />
                      </E.Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default AtelierAboutCore;
