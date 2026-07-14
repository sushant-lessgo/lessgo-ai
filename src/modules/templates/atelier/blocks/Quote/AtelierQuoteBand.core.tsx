// src/modules/templates/atelier/blocks/Quote/AtelierQuoteBand.core.tsx
// SINGLE-SOURCE quote band (sectionType 'quote'). STATIC dark quote grid — NOT a
// marquee (the marquee is the Hero region, ported in 9a). PLAIN server-safe module.
// Ported from the approved design (index.html QUOTE BAND; atl-* → lg-atelier-).
//
// The service schema carries a SINGLE quote (quote/author_name/author_role). To
// reach the design's 1–3-up grid, an OPTIONAL non-schema `quotes` collection is
// supported (manual-fill / block-mocks); when absent the single schema quote
// renders as one figure. Surface = dark.

import React from 'react';
import type { AtelierPrimitives } from '../primitives';
import { QUOTE_STYLES } from './styles';

export interface AtelierQuoteItem { id: string; quote?: string; author_name?: string; author_role?: string }

export interface AtelierQuoteContent {
  eyebrow?: string;
  headline?: string;
  quote?: string;
  author_name?: string;
  author_role?: string;
  /** optional multi-quote grid (non-schema; overrides the single quote below). */
  quotes?: AtelierQuoteItem[];
}

function Who({ E, base, name, role }: { E: AtelierPrimitives; base: string; name?: string; role?: string }) {
  return (
    <figcaption className="lg-atelier-who">
      <E.Txt elementKey={`${base}author_name`} value={name} as="b" placeholder="Client name" />
      {' · '}
      <E.Txt elementKey={`${base}author_role`} value={role} as="span" placeholder="Company, City" />
    </figcaption>
  );
}

export function AtelierQuoteBandCore({ content, E }: { content: AtelierQuoteContent; E: AtelierPrimitives }) {
  const quotes = content.quotes && content.quotes.length ? content.quotes : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: QUOTE_STYLES }} />
      <div className="lg-atelier-wrap lg-atelier-pad">
        <div className="lg-atelier-rule">
          {content.eyebrow !== undefined && (
            <E.Txt elementKey="eyebrow" value={content.eyebrow} as="span" className="lg-atelier-rule__idx" placeholder="03" />
          )}
          <E.Txt elementKey="headline" value={content.headline} as="h2" className="lg-atelier-heading" placeholder="Kind words" />
        </div>

        {quotes ? (
          <E.List
            collectionKey="quotes"
            items={quotes}
            className="lg-atelier-quotes"
            itemClassName="lg-atelier-quote"
            makeItem={() => ({ quote: '', author_name: '', author_role: '' })}
            min={1}
            max={6}
            addLabel="+ Quote"
            render={(item: AtelierQuoteItem) => (
              <>
                <span className="lg-atelier-mark">&ldquo;</span>
                <E.Txt elementKey={`quotes.${item.id}.quote`} value={item.quote} as="p" placeholder="A short line of praise from a client." multiline />
                <Who E={E} base={`quotes.${item.id}.`} name={item.author_name} role={item.author_role} />
              </>
            )}
          />
        ) : (
          <div className="lg-atelier-quotes">
            <figure className="lg-atelier-quote">
              <span className="lg-atelier-mark">&ldquo;</span>
              <E.Txt elementKey="quote" value={content.quote} as="p" placeholder="The work carried our whole launch — we just showed it." multiline />
              <Who E={E} base="" name={content.author_name} role={content.author_role} />
            </figure>
          </div>
        )}
      </div>
    </>
  );
}

export default AtelierQuoteBandCore;
