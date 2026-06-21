// src/modules/templates/techpremium/blocks/Faq/TechPremiumFaq.published.tsx
// Server-safe published variant of TechPremiumFaq. Native <details> — no JS.

import React from 'react';
import { FAQ_STYLES } from './TechPremiumFaq';

interface FaqItem { id?: string; question?: string; answer?: string }

interface TechPremiumFaqPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  items?: FaqItem[];
}

export default function TechPremiumFaqPublished(props: TechPremiumFaqPublishedProps) {
  const items = Array.isArray(props.items) ? props.items : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FAQ_STYLES }} />
      <section className="tp-sec">
        <div className="tp-sec__inner">
          <div className="tp-sec-head center">
            {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
            {props.headline && (
              <h2 dangerouslySetInnerHTML={{ __html: props.headline }} />
            )}
          </div>

          {items.length > 0 && (
            <div className="tp-faq-list">
              {items.map((it, i) => (
                <details key={it.id || i} className="tp-faq-item" open={i === 0}>
                  <summary>
                    <span className="tp-faq-item__q">{it.question}</span>
                    <span className="tp-pm" aria-hidden />
                  </summary>
                  {it.answer && <p>{it.answer}</p>}
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
