// src/modules/templates/techpremium/blocks/Testimonials/TechPremiumResults.published.tsx
// Server-safe published variant of TechPremiumResults.

import React from 'react';

interface Testimonial {
  id?: string;
  quote?: string;
  author_name?: string;
  author_role?: string;
}

interface Logo {
  id?: string;
  name?: string;
}

interface ResultStat {
  id?: string;
  value?: string;
  label?: string;
}

interface TechPremiumResultsPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  stats?: ResultStat[];
  testimonials?: Testimonial[];
  logos?: Logo[];
}

export default function TechPremiumResultsPublished(props: TechPremiumResultsPublishedProps) {
  const stats = Array.isArray(props.stats) ? props.stats : [];
  const testimonials = Array.isArray(props.testimonials) ? props.testimonials : [];
  const logos = Array.isArray(props.logos) ? props.logos : [];

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
          </div>

          {stats.length > 0 && (
            <div className="tp-results-stats">
              {stats.map((s, idx) => (
                <div key={s.id || idx} className="tp-rstat">
                  <div className="tp-rstat__v">{s.value || ''}</div>
                  <div className="tp-rstat__l">{s.label || ''}</div>
                </div>
              ))}
            </div>
          )}

          {testimonials.length > 0 && (
            <div className="tp-t-grid">
              {testimonials.map((t, idx) => (
                <article key={t.id || idx} className="tp-tcard">
                  <span className="tp-pill"><span className="tp-pill__dot" />Verified</span>
                  {t.quote && (
                    <blockquote className="tp-tcard__quote" dangerouslySetInnerHTML={{ __html: t.quote }} />
                  )}
                  <div className="tp-tcard__who">
                    <span className="tp-tcard__av" aria-hidden="true" />
                    <div>
                      {t.author_name && <div className="tp-tcard__name">{t.author_name}</div>}
                      {t.author_role && <div className="tp-tcard__role">{t.author_role}</div>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {logos.length > 0 && (
            <div className="tp-logos">
              {logos.map((l, idx) => (
                <span key={l.id || idx} className="tp-logo">{l.name || ''}</span>
              ))}
            </div>
          )}
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
.tp-pill { display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:10.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; padding:4px 9px 4px 7px; border-radius:999px; color:var(--ok); background:var(--ok-bg); border:1px solid oklch(0.66 0.15 150 / 0.30); align-self:flex-start; }
.tp-pill__dot { width:6px; height:6px; border-radius:50%; background:var(--ok); box-shadow:0 0 0 3px var(--ok-bg); }
.tp-results-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; margin-bottom:40px; }
.tp-rstat { border:1px solid var(--line); border-radius:var(--r-lg); padding:28px 26px; background:var(--paper); }
.tp-rstat__v { font-family:var(--font-display); font-weight:700; font-size:clamp(34px,4vw,46px); letter-spacing:-0.03em; color:var(--forest); line-height:1; }
.tp-rstat__l { font-family:var(--font-mono); font-size:11px; letter-spacing:0.10em; text-transform:uppercase; color:var(--ink-3); margin-top:12px; }
.tp-t-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.tp-tcard { border:1px solid var(--line); border-radius:var(--r-lg); padding:28px 26px; background:var(--paper); display:flex; flex-direction:column; gap:18px; }
.tp-tcard__quote { font-family:var(--font-display); font-weight:500; font-size:18.5px; line-height:1.45; color:var(--ink); letter-spacing:-0.01em; margin:0; flex:1; }
.tp-tcard__who { display:flex; align-items:center; gap:13px; margin-top:auto; }
.tp-tcard__av { width:42px; height:42px; border-radius:50%; flex:none; background:linear-gradient(135deg, var(--paper-3), var(--line-2)); border:1px solid var(--line-2); }
.tp-tcard__name { font-family:var(--font-display); font-weight:600; font-size:15px; color:var(--ink); }
.tp-tcard__role { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); margin-top:2px; }
.tp-logos { display:flex; flex-wrap:wrap; align-items:center; gap:14px 18px; margin-top:40px; }
.tp-logo { height:34px; min-width:96px; padding:0 16px; border:1px dashed var(--line-2); border-radius:var(--r); display:grid; place-items:center; font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.06em; color:var(--ink-3); background:var(--paper); }
@media (max-width:760px){ .tp-t-grid { grid-template-columns:1fr; } .tp-results-stats { grid-template-columns:1fr; } }
`;
