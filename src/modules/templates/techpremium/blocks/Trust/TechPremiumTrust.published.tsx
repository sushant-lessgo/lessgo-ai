// TechPremium Trust strip — published (server-safe, flat props, no hooks).
// Mirrors TechPremiumTrust.tsx markup read-only. Surface paper-2.

import React from 'react';
import { TRUST_STYLES } from './TechPremiumTrust';

interface Metric { id: string; value: string; label: string }
interface Logo { id: string; name: string; image: string }
interface Props {
  sectionId: string;
  headline?: string;
  metrics?: Metric[];
  logos?: Logo[];
}

export default function TechPremiumTrustPublished({ sectionId, headline, metrics, logos }: Props) {
  const ms = Array.isArray(metrics) ? metrics : [];
  const ls = Array.isArray(logos) ? logos : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TRUST_STYLES }} />
      <section className="tp-trust" data-section-id={sectionId}>
        <div className="tp-trust__inner">
          {ms.length > 0 && (
            <div className="tp-trust__metrics">
              {ms.map((m) => (
                <div key={m.id} className="tp-trust__m">
                  <span className="tp-trust__v">{m.value}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="tp-trust__div" aria-hidden />
          <div className="tp-trust__right">
            {headline && <span className="tp-trust__label">{headline}</span>}
            <div className="tp-trust__logos">
              {ls.map((l) => (
                <span key={l.id} className="tp-trust__logo">
                  {l.image ? <img src={l.image} alt={l.name} /> : <span className="tp-trust__logoph">{l.name || 'Logo'}</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
