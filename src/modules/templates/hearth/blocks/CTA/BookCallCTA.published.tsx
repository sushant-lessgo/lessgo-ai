// src/modules/service/blocks/CTA/BookCallCTA.published.tsx
// Server-safe published variant. Primary CTA destination resolved via
// buttonConfig on cta_text element-metadata (single source of truth — no
// dedicated calendly_url field).

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';

interface BookCallCTAPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  secondary_cta_text?: string;
  meta?: string;
  // Standard published-renderer props for form-builder integration.
  content?: any;
  elementMetadata?: any;
}

export default function BookCallCTAPublished(props: BookCallCTAPublishedProps) {
  const headline = props.headline || '';
  const lede = props.lede || '';

  const md = props.content?.[props.sectionId]?.elementMetadata || props.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#cta');
  const secondaryHref = resolveCtaHref(md?.secondary_cta_text?.buttonConfig, forms, '#cta');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="hearth-cta-wrap" id="cta">
        <div className="hearth-cta">
          <div className="hearth-cta__inner">
            {props.eyebrow && (
              <div className="hearth-eyebrow hearth-cta__eyebrow">{props.eyebrow}</div>
            )}
            <h2
              className="hearth-cta__headline"
              dangerouslySetInnerHTML={{ __html: headline }}
            />
            <p
              className="hearth-cta__lede"
              dangerouslySetInnerHTML={{ __html: lede }}
            />
            <div className="hearth-cta__actions">
              {props.cta_text && (
                <a className="hearth-btn hearth-btn--primary hearth-btn--lg" href={ctaHref}>
                  {props.cta_text}
                </a>
              )}
              {props.secondary_cta_text && (
                <a className="hearth-btn hearth-btn--ghost hearth-btn--lg" href={secondaryHref}>
                  {props.secondary_cta_text}
                </a>
              )}
              {props.meta && <span className="hearth-cta__caption">{props.meta}</span>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const STYLES = `
.hearth-cta-wrap {
  max-width: var(--max-w); margin: 0 auto;
  padding: var(--sec-pad-y) var(--sec-pad-x);
}
.hearth-cta {
  position: relative;
  border-radius: var(--r-xl);
  padding: 120px 80px;
  background:
    radial-gradient(circle at 30% 20%, var(--accent-wash), transparent 60%),
    linear-gradient(160deg, var(--cream-2), var(--cream-1));
  border: 1px solid var(--sand);
  text-align: center; overflow: hidden;
}
@media (max-width: 760px) { .hearth-cta { padding: 64px 28px; } }
.hearth-cta__inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
.hearth-eyebrow {
  display: inline-flex; align-items: center; gap: 12px;
  font-family: var(--font-body); font-size: 12px; font-weight: 500;
  color: var(--accent-deep); letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 18px;
}
.hearth-eyebrow::before, .hearth-eyebrow::after {
  content: ""; width: 28px; height: 1px; background: var(--accent);
}
.hearth-cta__headline {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(44px, 5.5vw, 76px); line-height: 1.05;
  letter-spacing: -0.012em; color: var(--ink); margin: 18px 0 16px;
  font-variation-settings: "opsz" 144;
}
.hearth-cta__lede {
  font-family: var(--font-display); font-style: italic;
  font-size: 21px; color: var(--ink-2); line-height: 1.5; margin: 0 auto 36px;
  max-width: 48ch;
}
.hearth-cta__actions {
  display: flex; gap: 14px; justify-content: center; align-items: center; flex-wrap: wrap;
}
.hearth-cta__caption {
  font-family: var(--font-display); font-style: italic;
  font-size: 14px; color: var(--ink-3);
}
.hearth-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-body); font-weight: 500; text-decoration: none;
  border-radius: var(--r-md); border: 1px solid transparent;
}
.hearth-btn--primary { background: var(--ink); color: var(--cream); padding: 12px 20px; }
.hearth-btn--ghost {
  background: transparent; color: var(--ink); border-color: var(--sand);
  padding: 12px 20px;
}
.hearth-btn--lg { padding: 18px 28px; font-size: 16.5px; }
`;
