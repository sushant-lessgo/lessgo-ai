// src/modules/templates/techpremium/blocks/Lineup/TechPremiumLineup.published.tsx
// Server-safe published variant of TechPremiumLineup. Cards are plain <a href>.

import React from 'react';
import { STYLES } from './TechPremiumLineup';

interface Item {
  id?: string; model?: string; name?: string; oneLiner?: string;
  image?: string; cardSpec?: string; href?: string;
}
interface Props {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  items?: Item[];
}

export default function TechPremiumLineupPublished(props: Props) {
  const items = Array.isArray(props.items) ? props.items : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="tp-sec">
        <div className="tp-sec__inner">
          <div className="tp-sec-head">
            {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
            {props.headline && <h2 dangerouslySetInnerHTML={{ __html: props.headline }} />}
            {props.lede && <p className="tp-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />}
          </div>

          {items.length > 0 && (
            <div className="tp-pcards">
              {items.map((it, idx) => (
                <a key={it.id || idx} className="tp-pcard" href={it.href || '/products'}>
                  <div className="tp-pshot">
                    {it.image ? <img src={it.image} alt={it.name || ''} /> : <span className="tp-pshot__ph">{it.model || 'Product'}</span>}
                  </div>
                  <div className="tp-pbody">
                    {it.model && <span className="tp-pmodel">{it.model}</span>}
                    {it.name && <h4 className="tp-ph4">{it.name}</h4>}
                    {it.oneLiner && <p className="tp-pp">{it.oneLiner}</p>}
                    <div className="tp-pfoot">
                      {it.cardSpec ? <span className="tp-pspecs">{it.cardSpec}</span> : <span />}
                      <span className="tp-penq">View details →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
