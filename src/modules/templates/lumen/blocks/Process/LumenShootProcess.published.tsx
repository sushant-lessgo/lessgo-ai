// Server-safe published Lumen process band. No hooks, flat props. Emits
// data-en/data-nl on every translatable node for the lumen.v1.js language toggle.
// Dark band — the data-surface="esp" wrapper paints the espresso bg.

import React from 'react';
import { bilingualAttrs } from '../../i18nKeys';
import { PROCESS_STYLES } from './styles';

interface Step {
  id?: string;
  step_number?: string;
  title?: string;
  title_nl?: string;
  description?: string;
  description_nl?: string;
}
interface Props {
  sectionId: string;
  eyebrow?: string; eyebrow_nl?: string;
  headline?: string; headline_nl?: string;
  lede?: string; lede_nl?: string;
  steps?: Step[];
}

export default function LumenShootProcessPublished(props: Props) {
  const steps = Array.isArray(props.steps) ? props.steps : [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROCESS_STYLES }} />
      <div className="lm-process">
        <div className="lm-sec-head">
          {props.eyebrow ? (
            <span className="lm-eyebrow" {...bilingualAttrs(props.eyebrow, props.eyebrow_nl || '')}>{props.eyebrow}</span>
          ) : null}
          <h2
            className="lm-sec-title"
            {...bilingualAttrs(props.headline || '', props.headline_nl || '')}
            dangerouslySetInnerHTML={{ __html: props.headline || '' }}
          />
          {props.lede ? (
            <p className="lm-lede" {...bilingualAttrs(props.lede, props.lede_nl || '')}>{props.lede}</p>
          ) : null}
        </div>
        <div className="lm-steps">
          {steps.map((s, i) => (
            <div key={s.id || i} className="lm-step">
              <span className="lm-sn">{s.step_number || ''}</span>
              <h3 {...bilingualAttrs(s.title || '', s.title_nl || '')}>{s.title || ''}</h3>
              <p {...bilingualAttrs(s.description || '', s.description_nl || '')}>{s.description || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
