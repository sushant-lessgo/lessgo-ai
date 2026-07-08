// src/modules/templates/techpremium/blocks/Pricing/TechPremiumPricing.published.tsx
// Server-safe published variant of TechPremiumPricing. Per-tier CTA href resolved
// from the tier's buttonConfig (key `tiers_cta_${id}`).

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

interface TechPremiumPricingPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  tiers?: Tier[];
  content?: any;
}

export default function TechPremiumPricingPublished(props: TechPremiumPricingPublishedProps) {
  const tiers = Array.isArray(props.tiers) ? props.tiers : [];
  const md = props.content?.[props.sectionId]?.elementMetadata;
  const forms = props.content?.forms;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec">
        <div className="tp-sec__inner">
          <div className="tp-sec-head">
            {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
            {props.headline && (
              <h2 className="tp-sec-head__h2" dangerouslySetInnerHTML={{ __html: props.headline }} />
            )}
            {props.lede && (
              <p className="tp-sec-head__lede" dangerouslySetInnerHTML={{ __html: props.lede }} />
            )}
          </div>

          <div className="tp-price-grid">
            {tiers.map((t, idx) => {
              const featuresList = Array.isArray(t.features) ? t.features : [];
              return (
                <article key={t.id || idx} className={`tp-pcard${t.featured ? ' tp-pcard--mid' : ''}`}>
                  {t.plan && <div className="tp-pcard__plan">{t.plan}</div>}
                  {t.amount && <div className="tp-pcard__amount">{t.amount}</div>}
                  {t.per && <div className="tp-pcard__per">{t.per}</div>}
                  {t.pitch && <p className="tp-pcard__pitch">{t.pitch}</p>}
                  {featuresList.length > 0 && (
                    <ul className="tp-pcard__features">
                      {featuresList.map((feat, i) => (
                        <li key={i}>{feat}</li>
                      ))}
                    </ul>
                  )}
                  {t.cta_text && (
                    <div className="tp-pcard__cta-row">
                      <a
                        href={resolveCtaHref(md?.[`tiers_cta_${t.id}`]?.buttonConfig, forms, '#cta')}
                        className={`tp-btn ${t.featured ? 'tp-btn--fill' : 'tp-btn--line'} tp-pcard__cta`}
                        data-lessgo-cta=""
                        data-lessgo-cta-role="primary"
                      >{t.cta_text}</a>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

const STYLES = `
.tp-sec { padding: var(--pad-y) var(--pad-x); }
.tp-sec__inner { max-width: var(--max-w); margin: 0 auto; }
.tp-sec-head { max-width: 64ch; display: flex; flex-direction: column; gap: 16px; margin-bottom: 48px; }
.tp-eyebrow { font-family:var(--font-mono); font-weight:500; font-size:11.5px; letter-spacing:0.20em; text-transform:uppercase; color:var(--lime-d); display:inline-flex; align-items:center; gap:10px; align-self:flex-start; }
.tp-eyebrow::before { content:""; width:22px; height:1px; background:var(--line-2); }
.tp-sec-head__h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
.tp-sec-head__lede { font-family:var(--font-body); font-size:18px; line-height:1.7; color:var(--ink-2); margin:0; max-width:60ch; }
.tp-price-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.tp-pcard { border:1px solid var(--line); border-radius:var(--r-lg); padding:32px 28px 28px; background:var(--paper); position:relative; display:flex; flex-direction:column; }
.tp-pcard--mid { border-color:var(--forest); box-shadow:0 16px 40px -28px oklch(0.30 0.04 158 / 0.5); }
.tp-pcard--mid::before { content:"Most chosen"; position:absolute; top:-1px; right:24px; transform:translateY(-50%); font-family:var(--font-mono); font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--forest-d); background:var(--lime); padding:4px 10px; border-radius:999px; }
.tp-pcard__plan { font-family:var(--font-mono); font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--lime-d); }
.tp-pcard__amount { font-family:var(--font-display); font-weight:700; font-size:clamp(34px,4vw,46px); letter-spacing:-0.03em; line-height:1; margin:18px 0 4px; color:var(--ink); }
.tp-pcard__per { font-family:var(--font-mono); font-size:11.5px; color:var(--ink-3); }
.tp-pcard__pitch { font-size:14.5px; color:var(--ink-2); margin:16px 0 22px; line-height:1.55; }
.tp-pcard__features { list-style:none; padding:0; margin:0 0 28px; flex:1; }
.tp-pcard__features li { display:flex; align-items:flex-start; gap:10px; font-size:14px; color:var(--ink-2); padding:8px 0; border-top:1px solid var(--line); }
.tp-pcard__features li:first-child { border-top:0; }
.tp-pcard__features li::before { content:""; width:12px; height:12px; border:1px solid var(--lime-d); border-radius:50%; display:inline-block; flex-shrink:0; margin-top:3px; }
.tp-pcard__cta-row { margin-top:auto; }
.tp-pcard__cta { width:100%; }
.tp-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-display); font-weight:600; font-size:14.5px; letter-spacing:-0.005em; padding:13px 22px; border-radius:var(--r); white-space:nowrap; line-height:1; transition:background .16s ease,color .16s ease,border-color .16s ease,transform .16s ease; cursor:pointer; text-decoration:none; border:1px solid transparent; }
.tp-btn--fill { background:var(--forest); color:var(--paper); }
.tp-btn--fill:hover { background:var(--forest-d); transform:translateY(-1px); }
.tp-btn--line { border:1px solid var(--line-2); color:var(--ink); background:var(--paper); }
.tp-btn--line:hover { border-color:var(--forest); color:var(--forest); }
@media (max-width:760px){ .tp-price-grid { grid-template-columns:1fr; } }
`;
