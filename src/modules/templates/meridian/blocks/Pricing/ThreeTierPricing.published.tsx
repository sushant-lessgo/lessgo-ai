// src/modules/templates/meridian/blocks/Pricing/ThreeTierPricing.published.tsx
// Server-safe published variant of ThreeTierPricing.

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';

interface Tier {
  id?: string;
  plan?: string;
  amount?: string;
  per?: string;
  pitch?: string;
  features?: string[];
  cta_text?: string;
  featured?: boolean;
}

interface ThreeTierPricingPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  tiers?: Tier[];
  content?: any;
}

export default function ThreeTierPricingPublished(props: ThreeTierPricingPublishedProps) {
  const tiers = Array.isArray(props.tiers) ? props.tiers : [];
  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="mrd-section">
        {props.eyebrow && <div className="mrd-eyebrow"><span>{props.eyebrow}</span></div>}
        {props.headline && (
          <h2 className="mrd-section-title" dangerouslySetInnerHTML={{ __html: props.headline }} />
        )}
        {props.lede && (
          <p className="mrd-section-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />
        )}

        <div className="mrd-price-grid">
          {tiers.map((t, idx) => {
            const featuresList = Array.isArray(t.features) ? t.features : [];
            return (
              <article key={t.id || idx} className={`mrd-price-card${t.featured ? ' mrd-price-card--mid' : ''}`}>
                {t.plan && <div className="mrd-price-card__plan">{t.plan}</div>}
                {t.amount && <div className="mrd-price-card__amount">{t.amount}</div>}
                {t.per && <div className="mrd-price-card__per">{t.per}</div>}
                {t.pitch && <p className="mrd-price-card__pitch">{t.pitch}</p>}
                {featuresList.length > 0 && (
                  <ul className="mrd-price-card__features">
                    {featuresList.map((feat, i) => (
                      <li key={i}>{feat}</li>
                    ))}
                  </ul>
                )}
                {t.cta_text && (
                  <div className="mrd-price-card__cta-row">
                    <a href={resolveCtaHref(md?.[`tiers_cta_${t.id}`]?.buttonConfig, forms, '#cta')} className={`mrd-btn ${t.featured ? 'mrd-btn--primary' : 'mrd-btn--ghost'} mrd-btn--arrow mrd-price-card__cta`} data-lessgo-cta="" data-lessgo-cta-role="primary">
                      {t.cta_text}
                    </a>
                  </div>
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
.mrd-section { padding: var(--sec-pad-y) var(--sec-pad-x); max-width: 1340px; margin: 0 auto; position: relative; }
.mrd-eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--bone-3);
  display: inline-flex; align-items: center; gap: 10px;
}
.mrd-eyebrow::after { content: ""; width: 32px; height: 1px; background: var(--line-strong); display: inline-block; }
.mrd-section-title {
  font-family: var(--font-display); font-weight: 500; font-size: 52px;
  line-height: 1.05; letter-spacing: -0.025em; color: var(--bone);
  max-width: 22ch; margin: 22px 0 0;
}
.mrd-section-lede {
  font-family: var(--font-display); font-size: 19px; line-height: 1.5;
  color: var(--bone-2); max-width: 58ch; margin: 16px 0 0;
}
.mrd-price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 64px; }
@media (max-width: 900px) { .mrd-price-grid { grid-template-columns: 1fr; } }
.mrd-price-card {
  border: 1px solid var(--line); border-radius: var(--r-lg);
  padding: 32px 28px 28px; background: var(--ink); position: relative;
  display: flex; flex-direction: column;
}
.mrd-price-card--mid { background: linear-gradient(180deg, var(--ink-1), var(--ink)); border-color: var(--line-strong); }
.mrd-price-card--mid::before {
  content: "Most chosen"; position: absolute; top: -1px; right: 24px;
  transform: translateY(-50%); font-family: var(--font-mono); font-size: 10.5px;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-ink);
  background: var(--accent); padding: 4px 10px; border-radius: var(--r-pill);
}
.mrd-price-card__plan { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; color: var(--bone-3); text-transform: uppercase; }
.mrd-price-card__amount {
  font-family: var(--font-display); font-weight: 500; font-size: 56px;
  letter-spacing: -0.03em; line-height: 1; margin: 20px 0 4px; color: var(--bone);
}
.mrd-price-card__per { font-family: var(--font-mono); font-size: 11.5px; color: var(--bone-3); }
.mrd-price-card__pitch { font-family: var(--font-display); font-size: 15px; color: var(--bone-2); margin: 18px 0 24px; max-width: 28ch; }
.mrd-price-card__features { list-style: none; padding: 0; margin: 0 0 28px; flex: 1; }
.mrd-price-card__features li {
  display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px;
  color: var(--bone-2); padding: 8px 0; border-top: 1px solid var(--line-soft);
}
.mrd-price-card__features li:first-child { border-top: 0; }
.mrd-price-card__features li::before {
  content: ""; width: 12px; height: 12px; border: 1px solid var(--accent);
  border-radius: 50%; display: inline-block; flex-shrink: 0; margin-top: 3px;
}
.mrd-price-card__cta-row { margin-top: auto; }
.mrd-price-card__cta { width: 100%; justify-content: space-between; }
.mrd-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-weight: 500; font-size: 13.5px;
  letter-spacing: -0.005em; border-radius: var(--r-md); padding: 12px 16px;
  transition: all 140ms ease; border: 1px solid transparent; text-decoration: none;
}
.mrd-btn--primary { background: var(--accent); color: var(--accent-ink); }
.mrd-btn--primary:hover { filter: brightness(1.06); }
.mrd-btn--ghost { color: var(--bone); border-color: var(--line); background: transparent; }
.mrd-btn--ghost:hover { border-color: var(--line-strong); background: var(--ink-1); }
.mrd-btn--arrow::after { content: "→"; font-family: var(--font-mono); font-size: 13px; }
[data-variant="marketing"] .mrd-eyebrow { font-family: var(--font-body); font-size: 13px; letter-spacing: 0; text-transform: none; font-weight: 500; color: var(--bone-2); }
[data-variant="marketing"] .mrd-eyebrow::after { display: none; }
[data-variant="marketing"] .mrd-section-title { font-weight: 500; font-size: 56px; letter-spacing: -0.03em; }
[data-variant="marketing"] .mrd-btn { border-radius: 12px; font-family: var(--font-body); font-weight: 500; }
[data-variant="marketing"] .mrd-btn--arrow::after { font-family: var(--font-body); }
`;
