// src/modules/templates/atelier/blocks/Quote/AtelierQuoteBand.core.tsx
// SINGLE-SOURCE quote band (sectionType 'quote'). PLAIN server-safe module.
// Provisional; refined in the phase-9 visual port.

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { QUOTE_STYLES } from './styles';

export interface AtelierQuoteContent {
  eyebrow?: string;
  quote?: string;
  author_name?: string;
  author_role?: string;
}

export function AtelierQuoteBandCore({ content, E }: { content: AtelierQuoteContent; E: AtelierPrimitives }) {
  const hasAuthor = !!(content.author_name || content.author_role);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: QUOTE_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad-sm lg-atelier-quote">
        {content.eyebrow !== undefined && (
          <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-tag" placeholder="" />
        )}
        <E.Txt elementKey="quote" value={content.quote} as="blockquote" className="lg-atelier-quote__q" placeholder="A short line of praise from a client." multiline />
        {hasAuthor && (
          <cite className="lg-atelier-quote__cite">
            <E.Txt elementKey="author_name" value={content.author_name} as="span" placeholder="Name" />
            {content.author_name && content.author_role ? ' · ' : ''}
            <E.Txt elementKey="author_role" value={content.author_role} as="span" placeholder="Role" />
          </cite>
        )}
      </div>
    </>
  );
}

export default AtelierQuoteBandCore;
