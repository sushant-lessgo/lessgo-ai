// src/modules/templates/atelier/blocks/Hero/AtelierHero.core.tsx
// SINGLE-SOURCE hero layout (static image; slider markup lands phase 9/10). PLAIN
// server-safe module — renders only through injected primitives (E).

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { HERO_STYLES } from './styles';

export interface AtelierHeroContent {
  eyebrow?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  cta_href?: string;
  secondary_cta_text?: string;
  secondary_cta_href?: string;
  hero_image?: string;
  meta?: string;
}

export function AtelierHeroCore({ content, E }: { content: AtelierHeroContent; E: AtelierPrimitives }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad lg-atelier-hero">
        <div className="lg-atelier-hero__body">
          {content.eyebrow !== undefined && (
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-tag" placeholder="Studio" />
          )}
          <E.Txt elementKey="headline" value={content.headline} as="h1" className="lg-atelier-display lg-atelier-hero__h1" placeholder="Work that holds the room." />
          <E.Txt elementKey="lede" value={content.lede} as="p" className="lg-atelier-hero__lede" placeholder="A short line about the work you make." multiline />
          <div className="lg-atelier-hero__cta">
            <E.Link hrefKey="cta_href" href={content.cta_href || '#work'} className="lg-atelier-btn lg-atelier-accent">
              <E.Txt elementKey="cta_text" value={content.cta_text} isButton placeholder="View the work" />
            </E.Link>
            {content.secondary_cta_text !== undefined && (
              <E.Link hrefKey="secondary_cta_href" href={content.secondary_cta_href || '#contact'} className="lg-atelier-btn lg-atelier-ghost">
                <E.Txt elementKey="secondary_cta_text" value={content.secondary_cta_text} isButton placeholder="Get in touch" />
              </E.Link>
            )}
          </div>
          <E.Txt elementKey="meta" value={content.meta} as="p" className="lg-atelier-hero__meta" placeholder="" />
        </div>
        <div className="lg-atelier-hero__media">
          <E.Img elementKey="hero_image" src={content.hero_image} alt={content.headline || 'hero'}
            className="lg-atelier-hero__mediaWrap" imgClassName="" eager
            placeholder={<div className="lg-atelier-ph"><span>Hero image</span></div>} />
        </div>
      </div>
    </>
  );
}

export default AtelierHeroCore;
