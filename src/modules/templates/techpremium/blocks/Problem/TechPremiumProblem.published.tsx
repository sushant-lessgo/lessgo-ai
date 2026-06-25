// src/modules/templates/techpremium/blocks/Problem/TechPremiumProblem.published.tsx
// Server-safe published variant of TechPremiumProblem.

import React from 'react';
import { PROBLEM_STYLES } from './styles';

interface Pain { id?: string; title?: string; body?: string }

interface TechPremiumProblemPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  pains?: Pain[];
}

const n2 = (i: number) => String(i + 1).padStart(2, '0');

export default function TechPremiumProblemPublished(props: TechPremiumProblemPublishedProps) {
  const pains = Array.isArray(props.pains) ? props.pains : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROBLEM_STYLES }} />
      <section className="tp-sec">
        <div className="tp-sec__inner">
          <div className="tp-problem-in">
            <div className="tp-problem-lead">
              {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
              {props.headline && (
                <h2 className="tp-problem-lead__h2" dangerouslySetInnerHTML={{ __html: props.headline }} />
              )}
              {props.lede && (
                <p className="tp-lede tp-problem-lead__lede" dangerouslySetInnerHTML={{ __html: props.lede }} />
              )}
            </div>

            {pains.length > 0 && (
              <div className="tp-pain">
                {pains.map((p, i) => (
                  <div key={p.id || i} className="tp-pain-row">
                    <span className="tp-n">{n2(i)}</span>
                    <div className="tp-pain-row__body">
                      {p.title && <h3 className="tp-pain-row__h3">{p.title}</h3>}
                      {p.body && <p className="tp-pain-row__p">{p.body}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
