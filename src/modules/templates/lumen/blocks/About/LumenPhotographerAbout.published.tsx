// Server-safe published Lumen About block. No hooks, flat props. Emits
// data-en/data-nl on translatable nodes for the lumen.v1.js language toggle.

import React from 'react';
import { bilingualAttrs } from '../../i18nKeys';
import { resolveCtaHref, externalLinkProps } from '@/utils/resolveCtaHref';
import { ABOUT_STYLES } from './styles';

interface Props {
  sectionId: string;
  content?: Record<string, any>;
  eyebrow?: string; eyebrow_nl?: string;
  headline?: string; headline_nl?: string;
  body?: string; body_nl?: string;
  body2?: string; body2_nl?: string;
  signature?: string;
  cta_text?: string; cta_text_nl?: string;
  secondary_cta_text?: string; secondary_cta_text_nl?: string;
  fig_caption?: string; fig_caption_nl?: string;
  fig_number?: string;
  about_image?: string;
}

export default function LumenPhotographerAboutPublished(props: Props) {
  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#contact');
  const secHref = resolveCtaHref(md?.secondary_cta_text?.buttonConfig, forms, '#work');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ABOUT_STYLES }} />
      <div className="lm-about-in">
        <div className="lm-about-portrait">
          <div className="lm-ph" style={{ aspectRatio: '4 / 5' }}>
            {props.about_image ? (
              <img src={props.about_image} alt={props.fig_caption || 'Portrait'} loading="lazy" decoding="async" />
            ) : (
              <span className="lm-ph-tag">Portrait of the photographer</span>
            )}
          </div>
          <span className="lm-frameline" />
          <div className="lm-fig">
            <span className="lm-fig-n">{props.fig_number || 'Fig. 08'}</span>
            <span {...bilingualAttrs(props.fig_caption || '', props.fig_caption_nl || '')}>{props.fig_caption || ''}</span>
            <span className="lm-fig-ratio">4:5</span>
          </div>
        </div>

        <div className="lm-about-copy">
          {props.eyebrow && (
            <span className="lm-eyebrow" {...bilingualAttrs(props.eyebrow, props.eyebrow_nl || '')}>{props.eyebrow}</span>
          )}
          <h2 {...bilingualAttrs(props.headline || '', props.headline_nl || '')}
            dangerouslySetInnerHTML={{ __html: props.headline || '' }} />
          {props.body && (
            <p {...bilingualAttrs(props.body, props.body_nl || '')} dangerouslySetInnerHTML={{ __html: props.body }} />
          )}
          {props.body2 && (
            <p {...bilingualAttrs(props.body2, props.body2_nl || '')} dangerouslySetInnerHTML={{ __html: props.body2 }} />
          )}
          {props.signature && <div className="lm-about-sign">{props.signature}</div>}
          <div className="lm-about-actions">
            {props.cta_text && (
              <a className="lm-btn lm-btn-brass" href={ctaHref} {...externalLinkProps(ctaHref)}
                data-lessgo-cta="" data-lessgo-cta-role="primary"
                {...bilingualAttrs(props.cta_text, props.cta_text_nl || '')}>{props.cta_text}</a>
            )}
            {props.secondary_cta_text && (
              <a className="lm-btn lm-btn-line" href={secHref} {...externalLinkProps(secHref)}
                data-lessgo-cta="" data-lessgo-cta-role="secondary"
                {...bilingualAttrs(props.secondary_cta_text, props.secondary_cta_text_nl || '')}>{props.secondary_cta_text}</a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
