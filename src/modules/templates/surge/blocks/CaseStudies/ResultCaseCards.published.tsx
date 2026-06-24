// Server-safe published variant of the Surge CaseStudies block. No hooks, flat props.

import React from 'react';
import { CASES_STYLES, SPARK_PATH } from './styles';

interface CaseMetric { value?: string; label?: string; }
interface CaseItem {
  id?: string;
  client?: string;
  client_meta?: string;
  tag?: string;
  headline?: string;
  metrics?: CaseMetric[];
}
interface ResultCaseCardsPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  cases?: CaseItem[];
}

function Spark() {
  return (
    <svg className="sg-spark" viewBox="0 0 200 38" preserveAspectRatio="none" aria-hidden="true">
      <path d={SPARK_PATH} fill="none" stroke="var(--pos)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="200" cy="3" r="3.4" fill="var(--pos)" />
    </svg>
  );
}

export default function ResultCaseCardsPublished(props: ResultCaseCardsPublishedProps) {
  const cases = Array.isArray(props.cases) ? props.cases : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CASES_STYLES }} />
      <section className="sg-section">
        <div className="sg-sec-head">
          {props.eyebrow && <div className="sg-sec-eyebrow">{props.eyebrow}</div>}
          {props.headline && (
            <h2 className="sg-sec-title" dangerouslySetInnerHTML={{ __html: props.headline }} />
          )}
          {props.lede && <p className="sg-sec-dek" dangerouslySetInnerHTML={{ __html: props.lede }} />}
        </div>

        <div className="sg-cases">
          {cases.map((c, ci) => {
            const metrics = Array.isArray(c.metrics) ? c.metrics : [];
            const initial = (c.client || '?').replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase() || '?';
            return (
              <article key={c.id || ci} className="sg-case">
                <div className="sg-case__top">
                  <div className="sg-case__client">
                    <span className="sg-case__mark">{initial}</span>
                    <div>
                      <b>{c.client}</b>
                      <small>{c.client_meta}</small>
                    </div>
                  </div>
                  {c.tag && <span className="sg-case__tag">{c.tag}</span>}
                </div>
                {c.headline && (
                  <p className="sg-case__headline" dangerouslySetInnerHTML={{ __html: c.headline }} />
                )}
                <Spark />
                <div className="sg-case__metrics">
                  {metrics.map((m, i) => (
                    <div key={i} className="sg-case__metric">
                      <div className="v" dangerouslySetInnerHTML={{ __html: m.value || '' }} />
                      <div className="l">{m.label}</div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
