// Single-source Praise (सम्मान और चर्चा / GranthCriticsGrid) layout. PLAIN module.
// OPTIONAL section. Critic quotes in a 2-col grid + a gold-separated awards line.
// Ported from template-design/WRDirection1Granth.html (.praise).

import React from 'react';
import type { GranthPrimitives } from '../primitives';
import { PRAISE_STYLES } from './styles';

export interface GranthQuote { id: string; text: string; source: string }

export interface GranthPraiseContent {
  eyebrow?: string;
  heading?: string;
  quotes?: GranthQuote[];
  awards_line?: string; // HTML with <em> gold separators
}

export function GranthPraiseCore({ content, E }: { content: GranthPraiseContent; E: GranthPrimitives }) {
  const quotes = content.quotes || [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRAISE_STYLES }} />
      <section className="gr-praise gr-section gr-wrap">
        <E.Txt elementKey="eyebrow" value={content.eyebrow} as="p"
          className="gr-caption gr-praise__eyebrow" placeholder="सम्मान और चर्चा" />
        <E.Txt elementKey="heading" value={content.heading} as="h2"
          className="gr-heading gr-praise__heading" placeholder="आलोचकों की दृष्टि में" />

        <E.List collectionKey="quotes" items={quotes} className="gr-praise-grid" itemClassName="gr-praise-quote"
          makeItem={() => ({ text: '', source: '' })} min={0} max={3} addLabel="+ टिप्पणी"
          render={(item: GranthQuote) => (
            <>
              <E.Txt elementKey={`quotes.${item.id}.text`} value={item.text} as="span" multiline
                className="gr-praise-text" placeholder="आलोचक की टिप्पणी।" />
              <E.Txt elementKey={`quotes.${item.id}.source`} value={item.source} as="cite"
                className="gr-praise-cite" placeholder="— स्रोत" />
            </>
          )}
        />

        <E.Txt elementKey="awards_line" value={content.awards_line} as="p"
          className="gr-awards" placeholder="पुरस्कार व सम्मान" />
      </section>
    </>
  );
}

export default GranthPraiseCore;
