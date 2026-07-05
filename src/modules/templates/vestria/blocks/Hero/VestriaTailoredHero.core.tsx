// src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.core.tsx
// SINGLE-SOURCE hero layout. PLAIN server-safe module (no client directive, no
// hooks/stores) — renders only through injected primitives (E). Ported from the
// Vestria mock: tag · display headline (italic <em> accent) · lede · CTA pair ·
// media frame with stat stamp · 3 value props under a stitched rule.

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { HERO_STYLES } from './styles';

export interface VestriaValue { id: string; kicker: string; title: string; description: string }

export interface VestriaHeroContent {
  tag_text?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  cta_href?: string;
  secondary_cta_text?: string;
  secondary_cta_href?: string;
  hero_image?: string;
  stamp_value?: string;
  stamp_label?: string;
  values?: VestriaValue[];
}

const MEDIA_PH = (
  <span className="vs-ph" aria-hidden="true"><span>Hero image</span></span>
);

export function VestriaTailoredHeroCore({ content, E }: { content: VestriaHeroContent; E: VestriaPrimitives }) {
  const values = content.values || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <section className="vs-hero">
        <div className="vs-wrap">
          <div className="vs-hero__grid">
            <div className="vs-hero__copy">
              <E.Txt elementKey="tag_text" value={content.tag_text} as="span"
                className="vs-tag" placeholder="What you make · Where" />
              <E.Txt elementKey="headline" value={content.headline} as="h1"
                className="vs-display vs-hero__h1" multiline
                placeholder="Made for teams that <em>mean business.</em>" />
              <E.Txt elementKey="lede" value={content.lede} as="p"
                className="vs-hero__lede" multiline placeholder="One paragraph — who you serve, what you deliver, at what scale." />
              <div className="vs-hero__cta">
                <E.Link hrefKey="cta_href" href={content.cta_href || '#contact'} className="vs-btn vs-accent">
                  <E.Txt elementKey="cta_text" value={content.cta_text} isButton placeholder="Request a Quote" />
                  <span className="vs-arw">→</span>
                </E.Link>
                {(content.secondary_cta_text !== undefined) && (
                  <E.Link hrefKey="secondary_cta_href" href={content.secondary_cta_href || '#catalog'} className="vs-btn vs-ghost">
                    <E.Txt elementKey="secondary_cta_text" value={content.secondary_cta_text} isButton placeholder="View Catalogue" />
                  </E.Link>
                )}
              </div>
            </div>
            <div className="vs-hero__media">
              <E.Img elementKey="hero_image" src={content.hero_image} alt={content.tag_text || ''}
                className="vs-hero__frame" placeholder={MEDIA_PH} />
              {(content.stamp_value || content.stamp_label) && (
                <div className="vs-hero__stamp">
                  <E.Txt elementKey="stamp_value" value={content.stamp_value} as="b"
                    className="vs-hero__stamp-n" placeholder="40k+" />
                  <E.Txt elementKey="stamp_label" value={content.stamp_label} as="span"
                    className="vs-hero__stamp-l" placeholder="Delivered / year" />
                </div>
              )}
            </div>
          </div>

          {values.length > 0 && (
            <div className="vs-values">
              <E.List collectionKey="values" items={values} className="vs-values__grid" itemClassName="vs-value"
                makeItem={() => ({ kicker: '', title: '', description: '' })} min={0} max={3} addLabel="+ Value"
                render={(item: VestriaValue) => (
                  <>
                    <E.Txt elementKey={`values.${item.id}.kicker`} value={item.kicker} as="span"
                      className="vs-value__num" placeholder="01 — Assurance" />
                    <E.Txt elementKey={`values.${item.id}.title`} value={item.title} as="h3"
                      className="vs-heading vs-value__h3" placeholder="Quality Assurance" />
                    <E.Txt elementKey={`values.${item.id}.description`} value={item.description} as="p"
                      className="vs-value__p" multiline placeholder="One concrete proof line." />
                  </>
                )}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default VestriaTailoredHeroCore;
