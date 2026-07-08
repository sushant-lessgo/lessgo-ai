// src/modules/service/blocks/Packages/TieredPackages.published.tsx
// Server-safe published variant.

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';

interface PackageTier {
  id?: string;
  name?: string;
  price_display?: string;
  timeline?: string;
  features?: string[];
  cta_text?: string;
  is_featured?: boolean;
}

interface TieredPackagesPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  packages?: PackageTier[];
  content?: any;
}

export default function TieredPackagesPublished(props: TieredPackagesPublishedProps) {
  const packages = Array.isArray(props.packages) ? props.packages : [];
  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="hearth-pkg">
        <div className="hearth-pkg__head">
          {props.eyebrow && <div className="hearth-eyebrow">{props.eyebrow}</div>}
          {props.headline && (
            <h2
              className="hearth-section-title"
              dangerouslySetInnerHTML={{ __html: props.headline }}
            />
          )}
          {props.lede && (
            <p
              className="hearth-section-lede"
              dangerouslySetInnerHTML={{ __html: props.lede }}
            />
          )}
        </div>
        <div className="hearth-pkg__grid">
          {packages.map((p, idx) => {
            const featuresList = Array.isArray(p.features) ? p.features : [];
            return (
              <article
                key={p.id || idx}
                className={`hearth-pkg__card${p.is_featured ? ' is-featured' : ''}`}
              >
                {p.name && <div className="hearth-pkg__name">{p.name}</div>}
                {p.price_display && <div className="hearth-pkg__amount">{p.price_display}</div>}
                {p.timeline && <div className="hearth-pkg__per">{p.timeline}</div>}
                {featuresList.length > 0 && (
                  <ul className="hearth-pkg__features">
                    {featuresList.map((feat, i) => (
                      <li key={i}>{feat}</li>
                    ))}
                  </ul>
                )}
                {p.cta_text && (
                  <a
                    href={resolveCtaHref(md?.[`packages_cta_${p.id}`]?.buttonConfig, forms, '#cta')}
                    className={`hearth-btn ${p.is_featured ? 'hearth-btn--primary-inverse' : 'hearth-btn--ghost'} hearth-pkg__cta`}
                    data-lessgo-cta=""
                    data-lessgo-cta-role="primary"
                  >
                    {p.cta_text}
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.hearth-pkg {
  max-width: var(--max-w); margin: 0 auto;
  padding: var(--sec-pad-y) var(--sec-pad-x);
}
.hearth-pkg__head { text-align: center; margin-bottom: 64px; }
.hearth-eyebrow {
  display: inline-flex; align-items: center; gap: 12px;
  font-family: var(--font-body); font-size: 12px; font-weight: 500;
  color: var(--accent-deep); letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 18px;
}
.hearth-eyebrow::before, .hearth-eyebrow::after {
  content: ""; width: 28px; height: 1px; background: var(--accent);
}
.hearth-section-title {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(36px, 4.5vw, 56px); line-height: 1.05;
  letter-spacing: -0.012em; color: var(--ink); margin: 0 auto;
  max-width: 22ch; font-variation-settings: "opsz" 96;
}
.hearth-section-lede {
  font-family: var(--font-display); font-style: italic;
  font-size: 18px; color: var(--ink-2); line-height: 1.5;
  margin: 20px auto 0; max-width: 56ch;
}
.hearth-pkg__grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
  align-items: stretch;
}
@media (max-width: 900px) { .hearth-pkg__grid { grid-template-columns: 1fr; } }
.hearth-pkg__card {
  background: var(--cream-1); border: 1px solid var(--sand);
  border-radius: var(--r-xl); padding: 44px 40px 36px;
  display: flex; flex-direction: column; gap: 16px;
}
.hearth-pkg__card.is-featured {
  background: var(--ink); color: var(--cream);
  transform: translateY(-12px); box-shadow: var(--shadow-lift);
  border-color: transparent;
}
.hearth-pkg__name {
  font-family: var(--font-display); font-weight: 500; font-size: 24px;
  color: var(--accent-deep);
}
.hearth-pkg__card.is-featured .hearth-pkg__name { color: var(--clay); }
.hearth-pkg__amount {
  font-family: var(--font-display); font-weight: 400;
  font-size: clamp(40px, 5vw, 64px); line-height: 1;
  color: var(--ink); letter-spacing: -0.015em;
}
.hearth-pkg__card.is-featured .hearth-pkg__amount { color: var(--cream); }
.hearth-pkg__per {
  font-family: var(--font-display); font-style: italic;
  font-size: 14px; color: var(--ink-2);
}
.hearth-pkg__card.is-featured .hearth-pkg__per { color: oklch(0.72 0.01 60); }
.hearth-pkg__features {
  list-style: none; padding: 0; margin: 16px 0 24px;
}
.hearth-pkg__features li {
  font-family: var(--font-body); font-size: 14.5px; color: var(--ink-2);
  padding: 12px 0 12px 22px; border-top: 1px solid var(--line); position: relative;
}
.hearth-pkg__card.is-featured .hearth-pkg__features li {
  color: oklch(0.88 0.01 60); border-top-color: oklch(1 0 0 / 0.08);
}
.hearth-pkg__features li:first-child { border-top: 0; }
.hearth-pkg__features li::before {
  content: "✓"; position: absolute; left: 0; top: 12px;
  color: var(--sage); font-weight: 600;
}
.hearth-pkg__cta {
  width: 100%; justify-content: center; margin-top: auto;
  padding: 14px 18px; text-align: center;
}
.hearth-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-body); font-weight: 500; text-decoration: none;
  border-radius: var(--r-md); border: 1px solid transparent;
}
.hearth-btn--ghost {
  background: transparent; color: var(--ink); border-color: var(--sand);
}
.hearth-btn--primary-inverse { background: var(--cream); color: var(--ink); border-radius: var(--r-sm); }
`;
