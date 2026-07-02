// Server-safe published variant of the Surge testimonial. No hooks, flat props.

import React from 'react';
import { TESTI_STYLES } from './styles';

interface PullQuoteWithMarkPublishedProps {
  sectionId: string;
  eyebrow?: string;
  quote?: string;
  author_name?: string;
  author_role?: string;
  author_company?: string;
  author_photo?: string;
  meta?: string;
}

function initials(name: string): string {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'AK';
}

export default function PullQuoteWithMarkPublished(props: PullQuoteWithMarkPublishedProps) {
  const roleLine = [props.author_role, props.author_company].filter(Boolean).join(', ');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TESTI_STYLES }} />
      <section className="sg-testi">
        {props.eyebrow && (
          <div className="sg-testi__head">
            <span className="sg-testi__eyebrow">{props.eyebrow}</span>
          </div>
        )}
        <article className="sg-review">
          <div className="sg-review__mark" aria-hidden="true">&#8220;</div>
          {props.quote && (
            <p className="sg-review__quote" dangerouslySetInnerHTML={{ __html: props.quote }} />
          )}
          <div className="sg-review__by">
            <div
              className="sg-review__av"
              style={{ backgroundImage: props.author_photo ? `url(${props.author_photo})` : undefined }}
            >
              {!props.author_photo && initials(props.author_name || '')}
            </div>
            <div>
              {props.author_name && <span className="sg-review__name">{props.author_name}</span>}
              {roleLine && <div className="sg-review__role">{roleLine}</div>}
            </div>
          </div>
        </article>
        {props.meta && <div className="sg-review__meta">{props.meta}</div>}
      </section>
    </>
  );
}
