// Server-safe published variant of the Surge stats band. No hooks, flat props.
// `value`/`label` may contain <em> → dangerouslySetInnerHTML.

import React from 'react';
import { STATS_STYLES } from './styles';

interface StatItem {
  id?: string;
  value?: string;
  label?: string;
}

interface StatsBandPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  stats?: StatItem[];
}

export default function StatsBandPublished(props: StatsBandPublishedProps) {
  const stats = Array.isArray(props.stats) ? props.stats : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STATS_STYLES }} />
      <section className="sg-stats">
        {(props.eyebrow || props.headline) && (
          <div className="sg-stats__head">
            {props.eyebrow && <div className="sg-stats__eyebrow">{props.eyebrow}</div>}
            {props.headline && (
              <h2 className="sg-stats__title" dangerouslySetInnerHTML={{ __html: props.headline }} />
            )}
          </div>
        )}
        <div className="sg-stats__inner">
          {stats.map((s, idx) => (
            <div key={s.id || idx} className="sg-stat">
              <div className="sg-stat__big" dangerouslySetInnerHTML={{ __html: s.value || '' }} />
              <div className="sg-stat__lbl" dangerouslySetInnerHTML={{ __html: s.label || '' }} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
