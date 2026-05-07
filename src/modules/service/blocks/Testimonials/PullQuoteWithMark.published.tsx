// src/modules/service/blocks/Testimonials/PullQuoteWithMark.published.tsx
// Server-safe published variant.

import React from 'react';

interface PullQuoteWithMarkPublishedProps {
  sectionId: string;
  eyebrow?: string;
  quote?: string;
  author_name?: string;
  author_role?: string;
  author_company?: string;
  author_photo?: string;
  meta?: string;
}

export default function PullQuoteWithMarkPublished(props: PullQuoteWithMarkPublishedProps) {
  const roleLine = [props.author_role, props.author_company].filter(Boolean).join(' · ');
  const quote = props.quote || '';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="hearth-testi">
        {props.eyebrow && <div className="hearth-eyebrow">{props.eyebrow}</div>}
        <article className="hearth-testi__card">
          <div className="hearth-testi__mark" aria-hidden="true">"</div>
          <div
            className="hearth-testi__quote"
            dangerouslySetInnerHTML={{ __html: quote }}
          />
          <div className="hearth-testi__who">
            <div
              className="hearth-testi__avatar"
              style={{
                backgroundImage: props.author_photo
                  ? `url(${props.author_photo})`
                  : 'linear-gradient(135deg, var(--clay), var(--accent))',
              }}
            />
            <div>
              {props.author_name && <div className="hearth-testi__name">{props.author_name}</div>}
              {roleLine && <div className="hearth-testi__role">{roleLine}</div>}
            </div>
          </div>
        </article>
        {props.meta && <div className="hearth-testi__meta">{props.meta}</div>}
      </section>
    </>
  );
}

const STYLES = `
.hearth-testi {
  max-width: 880px; margin: 0 auto;
  padding: var(--sec-pad-y) var(--sec-pad-x);
  text-align: center;
}
.hearth-eyebrow {
  display: inline-flex; align-items: center; gap: 12px;
  font-family: var(--font-body); font-size: 12px; font-weight: 500;
  color: var(--accent-deep); letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 18px;
}
.hearth-eyebrow::before, .hearth-eyebrow::after {
  content: ""; width: 28px; height: 1px; background: var(--accent);
}
.hearth-testi__card {
  position: relative;
  background: var(--cream-1); border: 1px solid var(--sand);
  border-radius: var(--r-lg); padding: 56px 48px 36px;
  text-align: left; margin-top: 32px;
}
.hearth-testi__mark {
  position: absolute; top: 16px; left: 32px;
  font-family: var(--font-display); font-style: italic;
  font-size: 80px; line-height: 1; color: var(--accent);
}
.hearth-testi__quote {
  font-family: var(--font-display); font-weight: 400;
  font-size: 24px; line-height: 1.4; color: var(--ink); margin: 0 0 32px;
}
.hearth-testi__who {
  display: flex; align-items: center; gap: 14px;
  border-top: 1px solid var(--line); padding-top: 24px;
}
.hearth-testi__avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background-size: cover; background-position: center; flex-shrink: 0;
}
.hearth-testi__name {
  font-family: var(--font-display); font-weight: 500; font-size: 15px; color: var(--ink);
}
.hearth-testi__role {
  font-family: var(--font-display); font-style: italic;
  font-size: 13.5px; color: var(--ink-3); margin-top: 2px;
}
.hearth-testi__meta {
  font-family: var(--font-display); font-style: italic;
  font-size: 13px; color: var(--ink-3); margin-top: 24px;
}
`;
