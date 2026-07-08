// src/modules/service/blocks/Hero/PetalFramedHero.published.tsx
// Server-safe published variant of PetalFramedHero.

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';

interface PetalFramedHeroPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  cta_subtext?: string;
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
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#cta');
  const secondaryHref = resolveCtaHref(md?.secondary_cta_text?.buttonConfig, forms, '#cta');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="hearth-hero">
        <div className="hearth-hero__copy">
          {props.eyebrow && (
            <div className="hearth-hero__eyebrow">
              <span className="hearth-hero__pip" />
              <span>{props.eyebrow}</span>
            </div>
          )}
          <h1
            className="hearth-hero__headline"
            dangerouslySetInnerHTML={{ __html: headline }}
          />
          <p
            className="hearth-hero__lede"
            dangerouslySetInnerHTML={{ __html: lede }}
          />
          <div className="hearth-hero__actions">
            {props.cta_text && (
              <a className="hearth-btn hearth-btn--primary hearth-btn--lg" href={ctaHref} data-lessgo-cta="" data-lessgo-cta-role="primary">
                {props.cta_text}
              </a>
            )}
            {props.secondary_cta_text && (
              <a className="hearth-btn hearth-btn--ghost hearth-btn--lg" href={secondaryHref} data-lessgo-cta="" data-lessgo-cta-role="secondary">
                {props.secondary_cta_text}
              </a>
            )}
            {props.meta && <span className="hearth-hero__caption">{props.meta}</span>}
          </div>

          {props.cta_subtext && (
            <p className="hearth-hero__cta-subtext">{props.cta_subtext}</p>
          )}
        </div>
        <div className="hearth-hero__art" aria-hidden="true">
          <div
            className="hearth-hero__photo hearth-hero__photo--main"
            style={{
              backgroundImage: props.hero_image
                ? `url(${props.hero_image})`
                : 'linear-gradient(135deg, var(--clay), var(--accent))',
            }}
          />
        </div>
      </section>
    </>
  );
}

const STYLES = `
.hearth-hero {
  display: grid; grid-template-columns: 1.05fr 1fr; gap: 64px;
  align-items: center; max-width: var(--max-w); margin: 0 auto;
  padding: 96px var(--sec-pad-x) var(--sec-pad-y);
}
@media (max-width: 900px) { .hearth-hero { grid-template-columns: 1fr; gap: 40px; padding-top: 48px; } }
.hearth-hero__eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--font-body); font-size: 12px; font-weight: 500;
  color: var(--ink-2); letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 28px;
}
.hearth-hero__pip { width: 8px; height: 8px; border-radius: 50%; background: var(--sage); }
.hearth-hero__headline {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(48px, 6.4vw, 84px); line-height: 0.98;
  letter-spacing: -0.015em; font-variation-settings: "opsz" 144;
  color: var(--ink); margin: 0;
}
.hearth-hero__lede {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 21px; line-height: 1.5; color: var(--ink-2);
  max-width: 48ch; margin-top: 28px;
}
.hearth-hero__actions {
  display: flex; gap: 14px; margin-top: 44px; align-items: center; flex-wrap: wrap;
}
.hearth-hero__caption {
  font-family: var(--font-display); font-style: italic;
  font-size: 14px; color: var(--ink-3);
}
.hearth-hero__cta-subtext {
  font-family: var(--font-display); font-style: italic;
  font-size: 14px; color: var(--ink-3); margin-top: 16px;
}
.hearth-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-body); font-weight: 500;
  border-radius: var(--r-md); text-decoration: none;
  border: 1px solid transparent;
}
.hearth-btn--primary { background: var(--ink); color: var(--cream); padding: 12px 20px; }
.hearth-btn--lg { padding: 18px 28px; font-size: 16.5px; }
.hearth-btn--ghost {
  background: transparent; color: var(--ink); border-color: var(--sand);
  padding: 12px 20px;
}
.hearth-hero__art { position: relative; aspect-ratio: 4/5; min-height: 420px; }
.hearth-hero__photo {
  position: absolute; inset: 0;
  border-radius: var(--r-petal);
  background-size: cover; background-position: center;
  box-shadow: var(--shadow-lift);
}
`;
