// Single-source Writing (एक रचना / GranthFramedPage) layout. PLAIN module. One poem
// on a double-framed page card. OPTIONAL section — the page composes without it.
// Ported from template-design/WRDirection1Granth.html (.poem).

import React from 'react';
import type { GranthPrimitives } from '../primitives';
import { WRITING_STYLES } from './styles';

export interface GranthWritingContent {
  label?: string;
  title?: string;
  poem?: string; // multiline (line breaks preserved via white-space:pre-line)
  signature?: string;
}

export function GranthWritingCore({ content, E }: { content: GranthWritingContent; E: GranthPrimitives }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WRITING_STYLES }} />
      <section className="gr-writing gr-section">
        <div className="gr-wrap">
          <div className="gr-page">
            <E.Txt elementKey="label" value={content.label} as="p"
              className="gr-caption" placeholder="एक रचना" />
            <E.Txt elementKey="title" value={content.title} as="h2"
              className="gr-writing__title" placeholder="कविता का शीर्षक" />
            <E.Txt elementKey="poem" value={content.poem} as="div" multiline
              className="gr-poem-body" placeholder={'पहली पंक्ति\nदूसरी पंक्ति'} />
            <E.Txt elementKey="signature" value={content.signature} as="p"
              className="gr-writing__sig" placeholder="— उपनाम" />
          </div>
        </div>
      </section>
    </>
  );
}

export default GranthWritingCore;
