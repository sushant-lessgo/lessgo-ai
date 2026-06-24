// Server-safe published variant of Surge IconServiceCards. No hooks, flat props.

import React from 'react';
import { SERVICES_STYLES } from './styles';

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

export default function IconServiceCardsPublished(props: IconServiceCardsPublishedProps) {
  const services = Array.isArray(props.services) ? props.services : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SERVICES_STYLES }} />
      <section className="sg-section">
        <div className="sg-sec-head">
          {props.eyebrow && <div className="sg-sec-eyebrow">{props.eyebrow}</div>}
          {props.headline && (
            <h2 className="sg-sec-title" dangerouslySetInnerHTML={{ __html: props.headline }} />
          )}
          {props.lede && (
            <p className="sg-sec-dek" dangerouslySetInnerHTML={{ __html: props.lede }} />
          )}
        </div>
        <div className="sg-services-grid">
          {services.map((s, idx) => (
            <article key={s.id || idx} className="sg-svc">
              <span className="sg-svc__n">{String(idx + 1).padStart(2, '0')}</span>
              {s.icon && <span className="sg-svc__ic">{s.icon}</span>}
              <h3 className="sg-svc__title" dangerouslySetInnerHTML={{ __html: s.title || '' }} />
              <p className="sg-svc__desc" dangerouslySetInnerHTML={{ __html: s.description || '' }} />
              {s.cta_text && <span className="sg-svc__cta">{s.cta_text}</span>}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
