// Server-safe published Lumen hero. No hooks, flat props. Emits data-en/data-nl
// for the language toggle; CTA hrefs via resolveCtaHref.

import React from 'react';
import { resolveCtaHref, externalLinkProps } from '@/utils/resolveCtaHref';
import { bilingualAttrs } from '../../i18nKeys';
import { HERO_STYLES } from './styles';

interface Props {
  sectionId: string;
  eyebrow?: string; eyebrow_nl?: string;
  headline?: string; headline_nl?: string;
  lede?: string; lede_nl?: string;
  cta_text?: string; cta_text_nl?: string;
  secondary_cta_text?: string; secondary_cta_text_nl?: string;
  who_text?: string; who_text_nl?: string;
  badge_text?: string; badge_text_nl?: string;
  fig_caption?: string; fig_caption_nl?: string;
  fig_number?: string; fig_ratio?: string;
  hero_image?: string;
  content?: any;
}

export default function LumenHeroPublished(props: Props) {
  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#work');
  const secondaryHref = resolveCtaHref(md?.secondary_cta_text?.buttonConfig, forms, '#contact');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <section className="lm-hero" id="top">
        <div className="lm-hero-in">
          <div className="lm-hero-copy">
            {props.eyebrow && (
              <span className="lm-eyebrow" {...bilingualAttrs(props.eyebrow, props.eyebrow_nl || '')}>{props.eyebrow}</span>
            )}
            <h1 className="lm-hero__display" {...bilingualAttrs(props.headline || '', props.headline_nl || '')}
              dangerouslySetInnerHTML={{ __html: props.headline || '' }} />
            {props.lede && (
              <p className="lm-lede" {...bilingualAttrs(props.lede, props.lede_nl || '')}
                dangerouslySetInnerHTML={{ __html: props.lede }} />
            )}
            <div className="lm-hero-actions">
              {props.cta_text && (
                <a className="lm-btn lm-btn--fill" href={ctaHref} {...externalLinkProps(ctaHref)}
                   {...bilingualAttrs(props.cta_text, props.cta_text_nl || '')}>{props.cta_text}</a>
              )}
              {props.secondary_cta_text && (
                <a className="lm-btn lm-btn--line" href={secondaryHref} {...externalLinkProps(secondaryHref)}
                   {...bilingualAttrs(props.secondary_cta_text, props.secondary_cta_text_nl || '')}>{props.secondary_cta_text}</a>
              )}
            </div>
            {props.who_text && (
              <p className="lm-hero-who" {...bilingualAttrs(props.who_text, props.who_text_nl || '')}
                dangerouslySetInnerHTML={{ __html: props.who_text }} />
            )}
          </div>

          <div className="lm-hero-art">
            <div className="lm-ph lm-shot port on-dark">
              {props.hero_image ? (
                <img src={props.hero_image} alt={props.badge_text || 'Hero portrait'} />
              ) : (
                <span className="lm-ph__tag">Hero portrait</span>
              )}
              {props.badge_text && (
                <span className="lm-badge" {...bilingualAttrs(props.badge_text, props.badge_text_nl || '')}>{props.badge_text}</span>
              )}
            </div>
            <span className="lm-frameline" />
            <div className="lm-fig">
              <span className="n">{props.fig_number || 'Fig. 01'}</span>
              {props.fig_caption && (
                <span {...bilingualAttrs(props.fig_caption, props.fig_caption_nl || '')}>{props.fig_caption}</span>
              )}
              <span className="ratio">{props.fig_ratio || '4:5'}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
