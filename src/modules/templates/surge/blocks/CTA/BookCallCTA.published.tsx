// Server-safe published variant of the Surge closing CTA. CTA destinations
// resolved via resolveCtaHref from elementMetadata buttonConfig.

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';
import { CTA_STYLES } from './styles';

interface BookCallCTAPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  secondary_cta_text?: string;
  meta?: string;
  content?: any;
}

export default function BookCallCTAPublished(props: BookCallCTAPublishedProps) {
  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#contact');
  const secondaryHref = resolveCtaHref(md?.secondary_cta_text?.buttonConfig, forms, '#work');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CTA_STYLES }} />
      <section className="sg-cta-wrap">
        <div className="sg-cta">
          <div className="sg-cta__inner">
            {props.eyebrow && <div className="sg-cta__eyebrow">{props.eyebrow}</div>}
            {props.headline && (
              <h2 className="sg-cta__headline" dangerouslySetInnerHTML={{ __html: props.headline }} />
            )}
            {props.lede && (
              <p className="sg-cta__lede" dangerouslySetInnerHTML={{ __html: props.lede }} />
            )}
            <div className="sg-cta__actions">
              {props.cta_text && (
                <a className="sg-btn sg-btn--primary" href={ctaHref}>{props.cta_text}</a>
              )}
              {props.secondary_cta_text && (
                <a className="sg-btn sg-btn--ghost" href={secondaryHref}>{props.secondary_cta_text}</a>
              )}
            </div>
            {props.meta && <span className="sg-cta__caption">{props.meta}</span>}
          </div>
        </div>
      </section>
    </>
  );
}
