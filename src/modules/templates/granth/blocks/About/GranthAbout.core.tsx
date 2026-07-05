// Single-source About (परिचय) layout. PLAIN module. Ported from
// WRDirection1Granth.html: centred eyebrow + heading · · ornament · bio prose
// (narrow) · hairline-divided facts row.

import React from 'react';
import type { GranthPrimitives } from '../primitives';
import { ABOUT_STYLES } from './styles';

export interface GranthFact { id: string; value: string; label: string }

export interface GranthAboutContent {
  eyebrow?: string;
  heading?: string;
  bio?: string; // multiline HTML (<p>…</p><p>…</p>)
  facts?: GranthFact[];
}

export function GranthAboutCore({ content, E }: { content: GranthAboutContent; E: GranthPrimitives }) {
  const facts = content.facts || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ABOUT_STYLES }} />
      <section className="gr-about gr-section">
        <div className="gr-wrap">
          <E.Txt elementKey="eyebrow" value={content.eyebrow} as="p"
            className="gr-caption gr-about__eyebrow" placeholder="परिचय" />
          <E.Txt elementKey="heading" value={content.heading} as="h2"
            className="gr-heading gr-about__heading" placeholder="जीवन और लेखन" />
          <div className="gr-orn"><span>·</span></div>
          <div className="gr-narrow">
            <E.Txt elementKey="bio" value={content.bio} as="div" multiline
              className="gr-about__bio" placeholder="लेखक का संक्षिप्त परिचय — दो अनुच्छेद।" />
          </div>
          <E.List collectionKey="facts" items={facts} className="gr-facts" itemClassName="gr-fact"
            makeItem={() => ({ value: '', label: '' })} min={0} max={4} addLabel="+ तथ्य"
            render={(item: GranthFact) => (
              <>
                <E.Txt elementKey={`facts.${item.id}.value`} value={item.value} as="b"
                  className="gr-fact__value" placeholder="१९४८" />
                <E.Txt elementKey={`facts.${item.id}.label`} value={item.label} as="span"
                  className="gr-fact__label" placeholder="जन्म" />
              </>
            )}
          />
        </div>
      </section>
    </>
  );
}

export default GranthAboutCore;
