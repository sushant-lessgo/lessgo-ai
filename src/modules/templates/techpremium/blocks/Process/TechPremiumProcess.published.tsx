// src/modules/templates/techpremium/blocks/Process/TechPremiumProcess.published.tsx
// Server-safe published variant of TechPremiumProcess.

import React from 'react';
import * as Icons from 'lucide-react';
import { PROCESS_STYLES } from './styles';

interface Step { id?: string; icon?: string; title?: string; body?: string }

interface TechPremiumProcessPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  steps?: Step[];
}

const n2 = (i: number) => String(i + 1).padStart(2, '0');
const DEFAULT_ICONS = ['Radar', 'SlidersHorizontal', 'TrendingUp'];

function StepIcon({ name }: { name: string }) {
  const Component = (Icons as any)[name] || Icons.Activity;
  return <Component size={24} strokeWidth={1.6} />;
}

export default function TechPremiumProcessPublished(props: TechPremiumProcessPublishedProps) {
  const steps = Array.isArray(props.steps) ? props.steps : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROCESS_STYLES }} />
      <section className="tp-sec">
        <div className="tp-sec__inner">
          <div className="tp-sec-head center">
            {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
            {props.headline && (
              <h2 dangerouslySetInnerHTML={{ __html: props.headline }} />
            )}
            {props.lede && (
              <p className="tp-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />
            )}
          </div>

          {steps.length > 0 && (
            <div className="tp-how-steps" data-count={steps.length}>
              {steps.map((s, i) => (
                <div key={s.id || i} className="tp-step">
                  <span className="tp-flow" aria-hidden>→</span>
                  <span className="tp-ico"><StepIcon name={s.icon || DEFAULT_ICONS[i] || 'Activity'} /></span>
                  <span className="tp-sn">Step {n2(i)}</span>
                  {s.title && <h3 className="tp-step__h3">{s.title}</h3>}
                  {s.body && <p className="tp-step__p">{s.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
