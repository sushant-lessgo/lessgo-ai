// Server-safe published Lumen priced-service cards. No hooks, flat props. Emits
// data-en/data-nl on translatable nodes for the lumen.v1.js language toggle.

import React from 'react';
import { bilingualAttrs } from '../../i18nKeys';
import { SERVICES_STYLES } from './styles';

interface Deliverable { id?: string; text?: string; text_nl?: string; }
interface Service {
  id?: string;
  name?: string; name_nl?: string;
  dutch_tagline?: string;
  price?: string; price_unit?: string; price_unit_nl?: string;
  pitch?: string; pitch_nl?: string;
  cta_text?: string; cta_text_nl?: string;
  deliverables?: Deliverable[];
}
interface Props {
  sectionId: string;
  eyebrow?: string; eyebrow_nl?: string;
  headline?: string; headline_nl?: string;
  lede?: string; lede_nl?: string;
  services?: Service[];
}

const Tick = () => (
  <span className="lm-tick"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg></span>
);

export default function LumenPricedServiceCardsPublished(props: Props) {
  const services = Array.isArray(props.services) ? props.services : [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SERVICES_STYLES }} />
      <section className="lm-svc-sec">
        <div className="lm-svc-wrap">
          <div className="lm-sec-head">
            {props.eyebrow && (
              <span className="lm-eyebrow" {...bilingualAttrs(props.eyebrow, props.eyebrow_nl || '')}>{props.eyebrow}</span>
            )}
            <h2 {...bilingualAttrs(props.headline || '', props.headline_nl || '')}
              dangerouslySetInnerHTML={{ __html: props.headline || '' }} />
            {props.lede && (
              <p className="lm-lede" {...bilingualAttrs(props.lede, props.lede_nl || '')}>{props.lede}</p>
            )}
          </div>

          <div className="lm-svc-grid">
            {services.map((s, i) => (
              <article className="lm-svc" key={s.id || i}>
                <div className="lm-svc-top">
                  <div className="lm-svc-name">
                    <h3 {...bilingualAttrs(s.name || '', s.name_nl || '')}>{s.name || ''}</h3>
                    {s.dutch_tagline && <span className="lm-nl-sub">{s.dutch_tagline}</span>}
                  </div>
                  <div className="lm-svc-price">
                    {s.price || ''}
                    {s.price_unit && <small {...bilingualAttrs(s.price_unit, s.price_unit_nl || '')}>{s.price_unit}</small>}
                  </div>
                </div>
                {s.pitch && (
                  <p className="lm-svc-pitch" {...bilingualAttrs(s.pitch, s.pitch_nl || '')}>{s.pitch}</p>
                )}
                <ul className="lm-svc-deliv">
                  {(s.deliverables || []).map((d, di) => (
                    <li key={d.id || di}>
                      <Tick />
                      <span {...bilingualAttrs(d.text || '', d.text_nl || '')}>{d.text || ''}</span>
                    </li>
                  ))}
                </ul>
                <div className="lm-svc-foot">
                  <a href="#contact" {...bilingualAttrs(`${s.cta_text || ''} →`, `${s.cta_text_nl || s.cta_text || ''} →`)}>
                    {`${s.cta_text || ''} →`}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
