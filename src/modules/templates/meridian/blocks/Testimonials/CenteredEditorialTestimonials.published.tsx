// src/modules/templates/meridian/blocks/Testimonials/CenteredEditorialTestimonials.published.tsx
// Server-safe published variant of CenteredEditorialTestimonials (scale-09 phase 6).
// Same flat props / markup / CSS as the edit renderer (shared styles). Optional
// bands (stats / logos) and the supporting grid omit entirely when empty.

import React from 'react';
import { CENTERED_EDITORIAL_TESTIMONIALS_STYLES } from './CenteredEditorialTestimonials.styles';

interface Testimonial {
  id?: string;
  quote?: string;
  author_name?: string;
  author_role?: string;
}
interface Stat {
  id?: string;
  value?: string;
  label?: string;
}
interface Logo {
  id?: string;
  name?: string;
}

interface CenteredEditorialTestimonialsPublishedProps {
  sectionId: string;
  eyebrow?: string;
  headline?: string;
  testimonials?: Testimonial[];
  stats?: Stat[];
  logos?: Logo[];
}

function WhoRow({ t }: { t: Testimonial }) {
  return (
    <div className="mrd-te__who">
      <div className="mrd-te__avatar" aria-hidden="true" />
      <div className="mrd-te__who-meta">
        {t.author_name && <div className="mrd-te__name">{t.author_name}</div>}
        {t.author_role && <div className="mrd-te__role">{t.author_role}</div>}
      </div>
    </div>
  );
}

export default function CenteredEditorialTestimonialsPublished(props: CenteredEditorialTestimonialsPublishedProps) {
  const testimonials = Array.isArray(props.testimonials) ? props.testimonials : [];
  const stats = Array.isArray(props.stats) ? props.stats : [];
  const logos = Array.isArray(props.logos) ? props.logos : [];

  const featured = testimonials[0];
  const supporting = testimonials.slice(1);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CENTERED_EDITORIAL_TESTIMONIALS_STYLES }} />
      <section className="mrd-te-sec">
        <div className="mrd-te__head">
          {props.eyebrow && <div className="mrd-te__eyebrow"><span>{props.eyebrow}</span></div>}
          {props.headline && (
            <h2 className="mrd-te__title" dangerouslySetInnerHTML={{ __html: props.headline }} />
          )}
        </div>

        {featured && (
          <div className="mrd-te__featured">
            <span className="mrd-te__mark" aria-hidden="true">&ldquo;</span>
            {featured.quote && (
              <blockquote className="mrd-te__quote" dangerouslySetInnerHTML={{ __html: featured.quote }} />
            )}
            <WhoRow t={featured} />
          </div>
        )}

        {supporting.length > 0 && (
          <div className="mrd-te__support">
            {supporting.map((t, idx) => (
              <article key={t.id || idx} className="mrd-te__card">
                {t.quote && (
                  <blockquote className="mrd-te__quote" dangerouslySetInnerHTML={{ __html: t.quote }} />
                )}
                <WhoRow t={t} />
              </article>
            ))}
          </div>
        )}

        {stats.length > 0 && (
          <div className="mrd-te__stats">
            {stats.map((s, idx) => (
              <div key={s.id || idx} className="mrd-te__stat">
                <div className="mrd-te__stat-k" dangerouslySetInnerHTML={{ __html: s.value || '' }} />
                <div className="mrd-te__stat-l">{s.label || ''}</div>
              </div>
            ))}
          </div>
        )}

        {logos.length > 0 && (
          <div className="mrd-te__logos">
            {logos.map((l, idx) => (
              <div key={l.id || idx} className="mrd-te__logo">{l.name || ''}</div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
