// src/modules/templates/techpremium/blocks/Hero/TechPremiumHero.published.tsx
// Server-safe published variant of TechPremiumHero. Hero art is static decorative
// (no image slot — PO ruling); the readout card renders stats[] (up to 3).

import React from 'react';
import { resolveCtaHref } from '@/utils/resolveCtaHref';

interface HeroStat {
  id?: string;
  value?: string;
  label?: string;
  unit?: string;
  live?: string;
}

interface TechPremiumHeroPublishedProps {
  sectionId: string;
  status_text?: string;
  audience_tag?: string;
  headline?: string;
  lede?: string;
  cta_text?: string;
  cta_subtext?: string;
  secondary_cta_text?: string;
  caption?: string;
  hero_image?: string;
  stats?: HeroStat[];
  content?: any;
  elementMetadata?: any;
}

export default function TechPremiumHeroPublished(props: TechPremiumHeroPublishedProps) {
  const headline = props.headline || '';
  const lede = props.lede || '';
  const stats = (Array.isArray(props.stats) ? props.stats : []).slice(0, 3);

  const md = props.content?.[props.sectionId]?.elementMetadata || props.elementMetadata;
  const forms = props.content?.forms;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#cta');
  const secondaryHref = resolveCtaHref(md?.secondary_cta_text?.buttonConfig, forms, '#cta');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-hero">
        <div className="tp-hero__inner">
          <div className="tp-hero__copy">
            {props.status_text && <span className="tp-eyebrow">{props.status_text}</span>}
            <h1 className="tp-hero__h1" dangerouslySetInnerHTML={{ __html: headline }} />
            {lede && <p className="tp-lede" dangerouslySetInnerHTML={{ __html: lede }} />}
            {props.caption && (
              <div className="tp-hero__chip">
                <span className="tp-pill"><span className="tp-pill__dot" />Proof</span>
                <span>{props.caption}</span>
              </div>
            )}
            <div className="tp-hero__actions">
              {props.cta_text && (
                <a className="tp-btn tp-btn--lime tp-btn--lg" href={ctaHref} data-lessgo-cta="" data-lessgo-cta-role="primary">{props.cta_text}</a>
              )}
              {props.secondary_cta_text && (
                <a className="tp-btn tp-btn--line tp-btn--lg" href={secondaryHref} data-lessgo-cta="" data-lessgo-cta-role="secondary">{props.secondary_cta_text}</a>
              )}
            </div>
            {props.cta_subtext && <p className="tp-hero__cta-subtext">{props.cta_subtext}</p>}
            {props.audience_tag && <p className="tp-hero__who">{props.audience_tag}</p>}
          </div>

          <div className="tp-hero__art">
            <div className="tp-ph tp-ph--unit" aria-hidden="true">
              {props.hero_image
                ? <img className="tp-hero__photo" src={props.hero_image} alt="" />
                : <span className="tp-ph__tag">Product / hardware photo</span>}
            </div>
            <span className="tp-hero__corner" aria-hidden="true" />
            {stats.length > 0 && (
              <div className="tp-readout">
                <div className="tp-readout__top">
                  <span className="tp-readout__loc"><span className="tp-pill"><span className="tp-pill__dot" />Live</span> <b>Realtime</b></span>
                  <span>Overview</span>
                </div>
                <div className="tp-readout__grid">
                  {stats.map((s, idx) => (
                    <div key={s.id || idx} className="tp-metric">
                      <div className="tp-metric__k">{s.label || ''}</div>
                      <div className="tp-metric__v" data-live={s.live || undefined}>
                        <span>{s.value || ''}</span>
                        {s.unit ? <span className="tp-metric__u">{s.unit}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="tp-readout__foot">
                  <svg className="tp-readout__spark" viewBox="0 0 200 34" preserveAspectRatio="none" aria-hidden="true">
                    <polyline className="area" points="0,30 0,22 22,24 44,18 66,20 88,13 110,16 132,10 154,13 176,8 200,11 200,34 0,34" />
                    <polyline points="0,22 22,24 44,18 66,20 88,13 110,16 132,10 154,13 176,8 200,11" />
                  </svg>
                  <span className="tp-readout__meta">live<br />updated</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

const STYLES = `
.tp-hero { padding: clamp(40px,5vw,72px) var(--pad-x) var(--pad-y); }
.tp-hero__inner { max-width:var(--max-w); margin:0 auto; display:grid; grid-template-columns:1.04fr 0.96fr; gap:clamp(36px,5vw,72px); align-items:center; }
.tp-hero__copy { display:flex; flex-direction:column; align-items:flex-start; gap:22px; }
.tp-eyebrow { font-family:var(--font-mono); font-weight:500; font-size:11.5px; letter-spacing:0.20em; text-transform:uppercase; color:var(--lime-d); display:inline-flex; align-items:center; gap:10px; }
.tp-eyebrow::before { content:""; width:22px; height:1px; background:var(--line-2); }
.tp-hero__h1 { font-family:var(--font-display); font-weight:600; font-size:clamp(40px,5.4vw,68px); line-height:1.04; letter-spacing:-0.028em; color:var(--ink); margin:0; }
.tp-hero__h1 em { font-style:normal; color:var(--forest-2); position:relative; white-space:nowrap; }
.tp-hero__h1 em::after { content:""; position:absolute; left:0; right:0; bottom:0.07em; height:0.30em; background:var(--lime-dim); z-index:-1; }
.tp-lede { font-family:var(--font-body); font-size:18px; line-height:1.7; color:var(--ink-2); max-width:48ch; margin:0; }
.tp-hero__chip { display:inline-flex; align-items:center; gap:11px; padding:8px 14px; border:1px solid var(--line-2); border-radius:999px; background:var(--paper); font-size:13.5px; font-weight:500; color:var(--ink-2); }
.tp-hero__chip b { color:var(--ink); font-weight:600; }
.tp-pill { display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:10.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; padding:4px 9px 4px 7px; border-radius:999px; color:var(--ok); background:var(--ok-bg); border:1px solid oklch(0.66 0.15 150 / 0.30); }
.tp-pill__dot { width:6px; height:6px; border-radius:50%; background:var(--ok); box-shadow:0 0 0 3px var(--ok-bg); }
.tp-hero__actions { display:flex; flex-wrap:wrap; gap:12px; }
.tp-hero__who { font-family:var(--font-mono); font-size:12px; letter-spacing:0.10em; text-transform:uppercase; color:var(--ink-3); margin:0; }
.tp-hero__who b { color:var(--forest); font-weight:600; }
.tp-hero__cta-subtext { font-family:var(--font-mono); font-size:12px; color:var(--ink-3); margin:0; }
.tp-hero__art { position:relative; }
.tp-ph { position:relative; background:var(--paper-2); overflow:hidden; background-image:repeating-linear-gradient(135deg, oklch(0.325 0.045 158 / 0.055) 0 1px, transparent 1px 12px); border:1px solid var(--line); border-radius:var(--r-lg); }
.tp-ph__tag { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-family:var(--font-mono); font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); white-space:nowrap; text-align:center; border:1px solid var(--line-2); padding:5px 10px; border-radius:var(--r); background:var(--paper); }
.tp-ph--unit { aspect-ratio:4/4.4; }
.tp-hero__photo { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:var(--r-lg); }
.tp-hero__corner { position:absolute; inset:12px; border:1px solid var(--lime); opacity:.4; pointer-events:none; border-radius:var(--r-lg); }
.tp-readout { position:absolute; right:-22px; bottom:-26px; width:min(330px,82%); background:var(--paper); border:1px solid var(--line-2); border-radius:var(--r-lg); box-shadow:0 18px 48px -28px oklch(0.30 0.04 158 / 0.5), 0 2px 8px -4px oklch(0.30 0.04 158 / 0.25); overflow:hidden; }
.tp-readout__top { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 16px; border-bottom:1px solid var(--line); font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.10em; text-transform:uppercase; color:var(--ink-2); }
.tp-readout__loc { display:inline-flex; align-items:center; gap:9px; }
.tp-readout__loc b { color:var(--ink); font-weight:600; }
.tp-readout__grid { display:grid; grid-template-columns:repeat(3,1fr); }
.tp-metric { padding:16px 16px 14px; border-right:1px solid var(--line); position:relative; }
.tp-metric:last-child { border-right:0; }
.tp-metric__k { font-family:var(--font-mono); font-size:10px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-3); }
.tp-metric__v { font-family:var(--font-mono); font-weight:600; font-size:22px; letter-spacing:-0.02em; color:var(--ink); margin-top:4px; line-height:1; display:flex; align-items:baseline; gap:3px; }
.tp-metric__u { font-size:11px; font-weight:500; color:var(--ink-3); letter-spacing:0; }
.tp-readout__foot { padding:10px 16px 14px; border-top:1px solid var(--line); display:flex; align-items:center; gap:12px; }
.tp-readout__spark { flex:1; height:34px; }
.tp-readout__spark polyline { fill:none; stroke:var(--lime-d); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.tp-readout__spark .area { fill:var(--lime-dim); stroke:none; }
.tp-readout__meta { font-family:var(--font-mono); font-size:9.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-3); text-align:right; line-height:1.4; }
.tp-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-display); font-weight:600; font-size:14.5px; letter-spacing:-0.005em; padding:13px 22px; border-radius:var(--r); white-space:nowrap; line-height:1; transition:background .16s ease,color .16s ease,border-color .16s ease,transform .16s ease; cursor:pointer; text-decoration:none; border:1px solid transparent; }
.tp-btn--lg { padding:16px 28px; font-size:15.5px; }
.tp-btn--lime { background:var(--lime); color:var(--forest-d); }
.tp-btn--lime:hover { background:oklch(0.815 0.185 128); transform:translateY(-1px); }
.tp-btn--line { border:1px solid var(--line-2); color:var(--ink); background:var(--paper); }
.tp-btn--line:hover { border-color:var(--forest); color:var(--forest); }
@media (max-width:1040px){ .tp-hero__inner { grid-template-columns:1fr; gap:56px; } .tp-hero__art { max-width:460px; } .tp-readout { right:0; } }
@media (max-width:520px){ .tp-hero__actions { width:100%; } .tp-hero__actions .tp-btn { flex:1; } }
`;
