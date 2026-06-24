// Server-safe published variant of the Surge About block. No hooks, flat props.

import React from 'react';
import { ABOUT_STYLES } from './styles';

interface AboutTag { id?: string; label?: string; }
interface AboutStat { id?: string; value?: string; label?: string; sublabel?: string; }

interface AboutWithStatsPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  lede?: string;
  body?: string;
  tags?: AboutTag[];
  stats?: AboutStat[];
}

export default function AboutWithStatsPublished(props: AboutWithStatsPublishedProps) {
  const tags = Array.isArray(props.tags) ? props.tags : [];
  const stats = Array.isArray(props.stats) ? props.stats : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ABOUT_STYLES }} />
      <section className="sg-section">
        <div className="sg-sec-head">
          {props.eyebrow && <div className="sg-sec-eyebrow">{props.eyebrow}</div>}
          {props.headline && (
            <h2 className="sg-sec-title" dangerouslySetInnerHTML={{ __html: props.headline }} />
          )}
        </div>

        <div className="sg-about">
          <div>
            {props.lede && <p className="sg-about__lede" dangerouslySetInnerHTML={{ __html: props.lede }} />}
            {props.body && <p className="sg-about__body" dangerouslySetInnerHTML={{ __html: props.body }} />}
            {tags.length > 0 && (
              <div className="sg-about__tags">
                {tags.map((t, i) => (
                  <span key={t.id || i} className="sg-about__tag">{t.label}</span>
                ))}
              </div>
            )}
          </div>

          <div className="sg-about__side">
            {stats.map((s, i) => (
              <div key={s.id || i} className="sg-about__stat">
                <div className="big" dangerouslySetInnerHTML={{ __html: s.value || '' }} />
                <div className="at">
                  <b>{s.label}</b>
                  {s.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
