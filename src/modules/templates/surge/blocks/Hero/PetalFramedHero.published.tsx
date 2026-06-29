// Server-safe published variant of the Surge hero. No hooks, flat props.

import React from 'react';
import { resolveCtaHref, externalLinkProps } from '@/utils/resolveCtaHref';
import { SurgeDashboard, SurgeFloatChips } from './SurgeDashboard';
import { HERO_STYLES } from './styles';

interface PetalFramedHeroPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  secondary_cta_text?: string;
  hero_image?: string;
  meta?: string;
  content?: any;
}

export default function PetalFramedHeroPublished(props: PetalFramedHeroPublishedProps) {
  const headline = props.headline || '';
  const lede = props.lede || '';

  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#contact');
  const secondaryHref = resolveCtaHref(md?.secondary_cta_text?.buttonConfig, forms, '#work');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <section className="sg-hero">
        <div className="sg-hero__grid">
          <div className="sg-hero__content">
            {props.eyebrow && (
              <span className="sg-pill"><span className="sg-dot" /><span>{props.eyebrow}</span></span>
            )}
            <h1 className="sg-hero__display" dangerouslySetInnerHTML={{ __html: headline }} />
            <p className="sg-hero__lede" dangerouslySetInnerHTML={{ __html: lede }} />
            <div className="sg-hero__actions">
              <div className="sg-hero__cta-row">
                {props.cta_text && (
                  <a className="sg-btn sg-btn--primary" href={ctaHref} {...externalLinkProps(ctaHref)}>{props.cta_text}</a>
                )}
                {props.secondary_cta_text && (
                  <a className="sg-btn sg-btn--ghost" href={secondaryHref} {...externalLinkProps(secondaryHref)}>{props.secondary_cta_text}</a>
                )}
              </div>
              {props.meta && (
                <div className="sg-hero__trust"><span>{props.meta}</span></div>
              )}
            </div>
          </div>
          <div className="sg-dash-wrap">
            {props.hero_image ? (
              <div className="sg-dash__photo" style={{ backgroundImage: `url(${props.hero_image})` }} aria-hidden="true" />
            ) : (
              <div style={{ position: 'relative' }}>
                <SurgeFloatChips />
                <SurgeDashboard />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
