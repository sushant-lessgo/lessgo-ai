// src/modules/templates/vestria/blocks/About/VestriaAboutStats.core.tsx
// SINGLE-SOURCE about layout (story + stat band, dark surface). PLAIN server-safe
// module — no client directive, no hooks/stores; renders only through injected
// primitives (E). Ported from the Vestria mock (#about): 2-col grid (workshop
// photo · on-dark tag + white h2 + lede + body) over a 4-col hairline stat band.

import React from 'react';
import type { VestriaPrimitives } from '../primitives';
import { ABOUT_STYLES } from './styles';

export interface VestriaStat { id: string; value: string; label: string }

export interface VestriaAboutContent {
  eyebrow?: string;
  headline?: string;
  lede?: string;
  body?: string;
  about_image?: string;
  stats?: VestriaStat[];
}

const MEDIA_PH = (
  <span className="vs-ph" aria-hidden="true"><span>Workshop / team image</span></span>
);

export function VestriaAboutStatsCore({ content, E }: { content: VestriaAboutContent; E: VestriaPrimitives }) {
  const stats = content.stats || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ABOUT_STYLES }} />
      <section className="vs-about vs-pad">
        <div className="vs-wrap">
          <div className="vs-about__grid">
            <div className="vs-about__media">
              <E.Img elementKey="about_image" src={content.about_image} alt={content.headline || ''}
                className="vs-about__frame" placeholder={MEDIA_PH} />
            </div>
            <div className="vs-about__copy">
              <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span"
                className="vs-tag vs-on-dark" placeholder="About us" />
              <E.Txt elementKey="headline" value={content.headline} as="h2"
                className="vs-heading vs-about__h2" multiline placeholder="Your story, in one strong line." />
              <E.Txt elementKey="lede" value={content.lede} as="p"
                className="vs-about__lede" multiline placeholder="Where you started, what you became." />
              <E.Txt elementKey="body" value={content.body} as="p"
                className="vs-about__body" multiline placeholder="What separates you — materials, precision, commitment." />
            </div>
          </div>
          {stats.length > 0 && (
            <E.List collectionKey="stats" items={stats} className="vs-stats" itemClassName="vs-stat"
              makeItem={() => ({ value: '', label: '' })} min={0} max={4} addLabel="+ Stat"
              render={(item: VestriaStat) => (
                <>
                  <E.Txt elementKey={`stats.${item.id}.value`} value={item.value} as="b"
                    className="vs-stat__n" placeholder="2009" />
                  <E.Txt elementKey={`stats.${item.id}.label`} value={item.label} as="span"
                    className="vs-stat__l" placeholder="Since" />
                </>
              )}
            />
          )}
        </div>
      </section>
    </>
  );
}

export default VestriaAboutStatsCore;
