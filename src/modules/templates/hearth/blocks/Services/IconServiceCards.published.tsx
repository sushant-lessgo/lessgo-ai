// src/modules/service/blocks/Services/IconServiceCards.published.tsx
// Server-safe published variant of IconServiceCards.

import React from 'react';
import * as Icons from 'lucide-react';

interface ServiceCard {
  id?: string;
  title?: string;
  description?: string;
  icon?: string;
  cta_text?: string;
}

interface IconServiceCardsPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  services?: ServiceCard[];
}

function ServiceIcon({ name }: { name: string }) {
  const Component = (Icons as any)[name] || Icons.Sparkles;
  return <Component size={28} strokeWidth={1.5} />;
}

export default function IconServiceCardsPublished(props: IconServiceCardsPublishedProps) {
  const services = Array.isArray(props.services) ? props.services : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="hearth-services">
        <div className="hearth-services__head">
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
        <div className="hearth-services__grid">
          {services.map((s, idx) => (
            <article key={s.id || idx} className="hearth-service-card">
              <div className="hearth-service-card__icon">
                <ServiceIcon name={s.icon || 'Sparkles'} />
              </div>
              <div className="hearth-service-card__num">
                {String(idx + 1).padStart(2, '0')}.
              </div>
              <h3
                className="hearth-service-card__title"
                dangerouslySetInnerHTML={{ __html: s.title || '' }}
              />
              <p
                className="hearth-service-card__desc"
                dangerouslySetInnerHTML={{ __html: s.description || '' }}
              />
              {s.cta_text && <span className="hearth-service-card__cta">{s.cta_text}</span>}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

const STYLES = `
.hearth-services {
  max-width: var(--max-w); margin: 0 auto;
  padding: var(--sec-pad-y) var(--sec-pad-x);
}
.hearth-services__head { text-align: center; margin-bottom: 64px; }
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
.hearth-services__grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px;
}
@media (max-width: 900px) { .hearth-services__grid { grid-template-columns: 1fr; } }
.hearth-service-card {
  background: var(--cream-1); border: 1px solid var(--sand);
  border-radius: var(--r-lg); padding: 36px 32px 32px;
  display: flex; flex-direction: column; gap: 16px;
}
.hearth-service-card__icon {
  width: 48px; height: 48px; border-radius: 999px;
  background: var(--accent-wash); color: var(--accent-deep);
  display: grid; place-items: center;
}
.hearth-service-card__num {
  font-family: var(--font-display); font-style: italic; font-weight: 500;
  color: var(--accent-deep); font-size: 14px; letter-spacing: 0.05em;
}
.hearth-service-card__title {
  font-family: var(--font-display); font-weight: 500; font-size: 26px;
  line-height: 1.25; letter-spacing: -0.008em; color: var(--ink); margin: 0;
}
.hearth-service-card__desc {
  font-family: var(--font-body); font-size: 15px; color: var(--ink-2);
  line-height: 1.6; margin: 0;
}
.hearth-service-card__cta {
  font-family: var(--font-body); font-weight: 500; font-size: 14px;
  color: var(--accent-deep); margin-top: auto;
}
`;
