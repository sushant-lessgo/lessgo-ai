// Server-safe published variant of the Surge multi-review grid. No hooks, flat props.

import React from 'react';
import { REVIEWGRID_STYLES } from './ReviewGrid.styles';

interface Review {
  id?: string;
  quote?: string;
  author_name?: string;
  author_role?: string;
  author_company?: string;
  author_photo?: string;
}

interface ReviewGridPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  reviews?: Review[];
}

function initials(name?: string): string {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '—';
}

export default function ReviewGridPublished(props: ReviewGridPublishedProps) {
  const reviews = Array.isArray(props.reviews) ? props.reviews : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: REVIEWGRID_STYLES }} />
      <section className="sg-rev-section">
        {(props.eyebrow || props.headline) && (
          <div className="sg-rev-head">
            {props.eyebrow && <div className="sg-rev-eyebrow">{props.eyebrow}</div>}
            {props.headline && (
              <h2 className="sg-rev-title" dangerouslySetInnerHTML={{ __html: props.headline }} />
            )}
          </div>
        )}
        <div className="sg-reviews">
          {reviews.map((r, idx) => {
            const role = [r.author_role, r.author_company].filter(Boolean).join(', ');
            return (
              <article key={r.id || idx} className={`sg-rev${idx === 0 ? ' sg-rev--feat' : ''}`}>
                <div className="sg-rev__mark" aria-hidden="true">&#8220;</div>
                <p className="sg-rev__quote" dangerouslySetInnerHTML={{ __html: r.quote || '' }} />
                <div className="sg-rev__by">
                  <div
                    className="sg-rev__av"
                    style={r.author_photo ? { backgroundImage: `url(${r.author_photo})` } : undefined}
                  >
                    {!r.author_photo && initials(r.author_name)}
                  </div>
                  <div>
                    <span className="sg-rev__name">{r.author_name}</span>
                    {role && <div className="sg-rev__role">{role}</div>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
