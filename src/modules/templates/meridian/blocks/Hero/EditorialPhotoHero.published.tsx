// src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.published.tsx
// Server-safe published variant of EditorialPhotoHero (scale-09 phase 6). Same
// flat props / markup / CSS as the edit renderer (shared EDITORIAL_PHOTO_HERO_STYLES)
// so editor and published stay pixel-identical. No hooks, no client imports.

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';
import { EDITORIAL_PHOTO_HERO_STYLES } from './EditorialPhotoHero.styles';

interface EditorialPhotoHeroPublishedProps {
  sectionId: string;
  status_text?: string;
  audience_tag?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  cta_subtext?: string;
  secondary_cta_text?: string;
  caption?: string;
  hero_image?: string;
  // Standard published-renderer props for form-builder integration.
  content?: any;
  elementMetadata?: any;
}

export default function EditorialPhotoHeroPublished(props: EditorialPhotoHeroPublishedProps) {
  const headline = props.headline || '';
  const lede = props.lede || '';

  const md = props.content?.[props.sectionId]?.elementMetadata || props.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#cta');
  const secondaryHref = resolveCtaHref(md?.secondary_cta_text?.buttonConfig, forms, '#cta');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EDITORIAL_PHOTO_HERO_STYLES }} />
      <section className="mrd-hep">
        <div className="mrd-hep__copy">
          {(props.status_text || props.audience_tag) && (
            <div className="mrd-hep__top">
              {props.status_text && (
                <span className="mrd-hep__status"><span className="mrd-hep__dot" />{props.status_text}</span>
              )}
              {props.audience_tag && <span className="mrd-hep__tag">{props.audience_tag}</span>}
            </div>
          )}

          <h1 className="mrd-hep__headline" dangerouslySetInnerHTML={{ __html: headline }} />
          <p className="mrd-hep__lede" dangerouslySetInnerHTML={{ __html: lede }} />

          <div className="mrd-hep__actions">
            <div className="mrd-hep__cta-wrap">
              {props.cta_text && (
                <a className="mrd-btn mrd-btn--primary mrd-btn--lg mrd-btn--arrow" href={ctaHref} data-lessgo-cta="" data-lessgo-cta-role="primary">{props.cta_text}</a>
              )}
              {props.cta_subtext && <span className="mrd-hep__cta-sub">{props.cta_subtext}</span>}
            </div>
            {props.secondary_cta_text && (
              <a className="mrd-btn mrd-btn--ghost mrd-btn--lg" href={secondaryHref} data-lessgo-cta="" data-lessgo-cta-role="secondary">{props.secondary_cta_text}</a>
            )}
          </div>
        </div>

        <div className="mrd-hep__media">
          <div className="mrd-hep__frame">
            <div className="mrd-hep__img">
              {props.hero_image ? (
                <img src={props.hero_image} alt="" loading="eager" decoding="async" />
              ) : (
                <span className="mrd-hep__slot-lbl">
                  <b>hero_image</b><br />product shot / team / dashboard — 4:5 or wider
                </span>
              )}
            </div>
            {props.caption && <span className="mrd-hep__caption">{props.caption}</span>}
          </div>
        </div>
      </section>
    </>
  );
}
