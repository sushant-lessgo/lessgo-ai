// src/modules/templates/techpremium/blocks/Explainer/TechPremiumExplainer.published.tsx
// Server-safe published variant of TechPremiumExplainer. Flat props, no hooks.

import React from 'react';
import { Check } from 'lucide-react';
import { EXPLAINER_STYLES } from './TechPremiumExplainer';
import { SEC_HEAD_STYLES, PH_STYLES, BTN_STYLES } from '../shared/sharedStyles';

interface Bullet { id?: string; text?: string }
interface Row {
  id?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  image?: string;
  flip?: boolean;
  cta_text?: string;
  cta_href?: string;
  bullets?: Bullet[];
}
interface Props {
  sectionId: string;
  rows?: Row[];
}

const STYLES = SEC_HEAD_STYLES + PH_STYLES + BTN_STYLES + EXPLAINER_STYLES;

export default function TechPremiumExplainerPublished(props: Props) {
  const rows = Array.isArray(props.rows) ? props.rows : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec">
        <div className="tp-sec__inner">
          {rows.map((r, idx) => {
            const bullets = Array.isArray(r.bullets) ? r.bullets : [];
            return (
              <div key={r.id || idx} className={`tp-explain${r.flip ? ' flip' : ''}`}>
                <div className="tp-explain-media">
                  <div className="tp-ph">
                    {r.image ? <img src={r.image} alt={r.title || ''} /> : <span className="tp-tag">{r.eyebrow || 'Photo'}</span>}
                  </div>
                </div>
                <div className="tp-explain-copy">
                  {r.eyebrow && <span className="tp-eyebrow">{r.eyebrow}</span>}
                  {r.title && <h3 className="tp-explain-h3" dangerouslySetInnerHTML={{ __html: r.title }} />}
                  {r.body && <p className="tp-explain-p" dangerouslySetInnerHTML={{ __html: r.body }} />}
                  {bullets.length > 0 && (
                    <ul className="tp-explain-list">
                      {bullets.map((b, k) => (
                        <li key={b.id || k}>
                          <Check size={20} strokeWidth={2} />
                          <span>{b.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {r.cta_text && (
                    <a className="tp-btn2 line" href={r.cta_href || '#'}>{r.cta_text}</a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
