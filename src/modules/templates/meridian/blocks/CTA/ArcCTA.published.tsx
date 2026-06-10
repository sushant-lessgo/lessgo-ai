// src/modules/templates/meridian/blocks/CTA/ArcCTA.published.tsx
// Server-safe published variant of ArcCTA.

import React from 'react';

interface ArcCTAPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  body?: string;
  cta_text?: string;
  secondary_cta_text?: string;
}

export default function ArcCTAPublished(props: ArcCTAPublishedProps) {
  const headline = props.headline || '';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="mrd-cta-wrap">
        <div className="mrd-cta">
          <div className="mrd-cta__grid" aria-hidden="true" />
          <div className="mrd-cta__arc" aria-hidden="true" />
          <div className="mrd-cta__inner">
            {props.eyebrow && <div className="mrd-cta__eyebrow">{props.eyebrow}</div>}
            <h2 className="mrd-cta__headline" dangerouslySetInnerHTML={{ __html: headline }} />
            {props.body && <p className="mrd-cta__body">{props.body}</p>}
            <div className="mrd-cta__actions">
              {props.cta_text && (
                <a className="mrd-btn mrd-btn--primary mrd-btn--lg mrd-btn--arrow" href="#cta">{props.cta_text}</a>
              )}
              {props.secondary_cta_text && (
                <a className="mrd-btn mrd-btn--ghost mrd-btn--lg" href="#cta">{props.secondary_cta_text}</a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const STYLES = `
.mrd-cta-wrap { max-width: 1340px; margin: 0 auto; padding: 0 var(--sec-pad-x); }
.mrd-cta {
  position: relative; border: 1px solid var(--line); border-radius: var(--r-xl);
  padding: 96px 72px; overflow: hidden; background: var(--ink); margin: 120px 0;
}
@media (max-width: 760px) { .mrd-cta { padding: 56px 28px; } }
.mrd-cta__arc {
  position: absolute; right: -160px; bottom: -220px; width: 640px; height: 640px;
  border-radius: 50%; border: 1px solid var(--accent); opacity: 0.6; pointer-events: none;
}
.mrd-cta__arc::before { content: ""; position: absolute; inset: 40px; border-radius: 50%; border: 1px solid var(--accent-dim); }
.mrd-cta__arc::after { content: ""; position: absolute; inset: 100px; border-radius: 50%; border: 1px solid var(--accent-dim); }
.mrd-cta__grid {
  position: absolute; inset: 0; pointer-events: none;
  background:
    linear-gradient(var(--line-soft) 1px, transparent 1px) 0 0 / 100% 48px,
    linear-gradient(90deg, var(--line-soft) 1px, transparent 1px) 0 0 / 48px 100%;
  -webkit-mask-image: linear-gradient(90deg, black 40%, transparent 85%);
  mask-image: linear-gradient(90deg, black 40%, transparent 85%);
}
.mrd-cta__inner { position: relative; z-index: 1; max-width: 640px; }
.mrd-cta__eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--accent);
}
.mrd-cta__headline {
  font-family: var(--font-display); font-weight: 600; font-size: 72px;
  line-height: 0.95; letter-spacing: -0.03em; margin: 16px 0 0; color: var(--bone);
}
@media (max-width: 760px) { .mrd-cta__headline { font-size: 48px; } }
.mrd-cta__headline em { color: var(--accent); }
.mrd-cta__body {
  font-family: var(--font-display); font-size: 19px; color: var(--bone-2);
  margin: 24px 0 40px; max-width: 44ch;
}
.mrd-cta__actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.mrd-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-weight: 500; font-size: 13.5px;
  letter-spacing: -0.005em; border-radius: var(--r-md); padding: 10px 14px;
  transition: all 140ms ease; border: 1px solid transparent; text-decoration: none;
}
.mrd-btn--lg { padding: 14px 20px; font-size: 15px; }
.mrd-btn--primary { background: var(--accent); color: var(--accent-ink); }
.mrd-btn--primary:hover { filter: brightness(1.06); }
.mrd-btn--ghost { color: var(--bone); border-color: var(--line); background: transparent; }
.mrd-btn--ghost:hover { border-color: var(--line-strong); background: var(--ink-1); }
.mrd-btn--arrow::after { content: "→"; font-family: var(--font-mono); font-size: 13px; }
[data-variant="marketing"] .mrd-cta__eyebrow { font-family: var(--font-body); letter-spacing: 0; text-transform: none; font-size: 13px; }
[data-variant="marketing"] .mrd-btn { border-radius: 12px; font-family: var(--font-body); font-weight: 500; }
[data-variant="marketing"] .mrd-btn--arrow::after { font-family: var(--font-body); }
`;
