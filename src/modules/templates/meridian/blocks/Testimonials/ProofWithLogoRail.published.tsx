// src/modules/templates/meridian/blocks/Testimonials/ProofWithLogoRail.published.tsx
// Server-safe published variant of ProofWithLogoRail.

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

interface ProofWithLogoRailPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  testimonials?: Testimonial[];
  logos?: Logo[];
}

export default function ProofWithLogoRailPublished(props: ProofWithLogoRailPublishedProps) {
  const testimonials = Array.isArray(props.testimonials) ? props.testimonials : [];
  const logos = Array.isArray(props.logos) ? props.logos : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="mrd-section">
        {props.eyebrow && <div className="mrd-eyebrow"><span>{props.eyebrow}</span></div>}
        {props.headline && (
          <h2 className="mrd-section-title" dangerouslySetInnerHTML={{ __html: props.headline }} />
        )}

        {testimonials.length > 0 && (
          <div className="mrd-testi">
            {testimonials.map((t, idx) => (
              <article key={t.id || idx} className={`mrd-testi-card${idx === 0 ? ' mrd-testi-card--lg' : ''}`}>
                <div className="mrd-testi-card__mark" aria-hidden="true">&ldquo;</div>
                {t.quote && (
                  <blockquote className="mrd-testi-card__quote" dangerouslySetInnerHTML={{ __html: t.quote }} />
                )}
                <div className="mrd-testi-card__who">
                  <div className="mrd-testi-card__avatar" aria-hidden="true" />
                  <div>
                    {t.author_name && <div className="mrd-testi-card__name">{t.author_name}</div>}
                    {t.author_role && <div className="mrd-testi-card__role">{t.author_role}</div>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {logos.length > 0 && (
          <div className="mrd-logo-rail">
            {logos.map((l, idx) => (
              <div key={l.id || idx} className="mrd-logo-rail__cell">{l.name || ''}</div>
            ))}
          </div>
        )}
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
.mrd-testi { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 12px; margin-top: 64px; }
@media (max-width: 900px) { .mrd-testi { grid-template-columns: 1fr; } }
.mrd-testi-card {
  border: 1px solid var(--line); border-radius: var(--r-lg);
  padding: 28px 28px 24px; background: var(--ink);
  display: flex; flex-direction: column; position: relative;
}
.mrd-testi-card--lg { background: linear-gradient(180deg, var(--ink-1), var(--ink)); padding: 36px 36px 28px; }
.mrd-testi-card__mark {
  font-family: var(--font-display); font-size: 42px; line-height: 0.8;
  color: var(--accent); margin-bottom: 14px; letter-spacing: -0.03em;
}
.mrd-testi-card__quote {
  margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 19px;
  line-height: 1.45; letter-spacing: -0.01em; color: var(--bone); flex: 1;
}
.mrd-testi-card--lg .mrd-testi-card__quote { font-size: 26px; }
.mrd-testi-card__who {
  display: flex; align-items: center; gap: 12px;
  padding-top: 22px; margin-top: 22px; border-top: 1px solid var(--line);
}
.mrd-testi-card__avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--ink-2), var(--bone-3));
  border: 1px solid var(--line-strong); flex-shrink: 0;
}
.mrd-testi-card__name { font-family: var(--font-display); font-size: 14px; color: var(--bone); font-weight: 500; }
.mrd-testi-card__role { font-family: var(--font-mono); font-size: 11px; color: var(--bone-3); margin-top: 2px; }
.mrd-logo-rail {
  margin-top: 56px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 0;
  border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
}
@media (max-width: 900px) { .mrd-logo-rail { grid-template-columns: repeat(3, 1fr); } }
.mrd-logo-rail__cell {
  padding: 22px 0; text-align: center;
  font-family: var(--font-display); font-weight: 600; font-size: 15px;
  letter-spacing: -0.01em; color: var(--bone-2); border-right: 1px solid var(--line);
}
.mrd-logo-rail__cell:last-child { border-right: 0; }
[data-variant="marketing"] .mrd-eyebrow { font-family: var(--font-body); font-size: 13px; letter-spacing: 0; text-transform: none; font-weight: 500; color: var(--bone-2); }
[data-variant="marketing"] .mrd-eyebrow::after { display: none; }
[data-variant="marketing"] .mrd-section-title { font-weight: 500; font-size: 56px; letter-spacing: -0.03em; }
[data-variant="marketing"] .mrd-testi-card { padding: 36px 36px 28px; }
[data-variant="marketing"] .mrd-testi-card--lg { padding: 44px 44px 36px; }
[data-variant="marketing"] .mrd-testi-card__role { font-family: var(--font-body); font-size: 12.5px; text-transform: none; letter-spacing: 0; }
[data-variant="light"] .mrd-testi-card__avatar { background: linear-gradient(135deg, var(--ink-2), var(--bone-3) 120%); }
[data-variant="light"] .mrd-testi-card--lg { background: linear-gradient(180deg, var(--ink-1), var(--ink)); }
`;
