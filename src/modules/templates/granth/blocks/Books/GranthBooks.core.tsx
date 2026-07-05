// Single-source Books (पुस्तकें / GranthJacketShelf) layout. PLAIN module. Ported
// from WRDirection1Granth.html: centred header · lead · responsive grid of book
// jackets (CSS-typeset by default; a real cover_image replaces the face) with
// title, meta (kind · year · blurb) and an external Amazon buy link.

import React from 'react';
import type { GranthPrimitives } from '../primitives';
import { BOOKS_STYLES } from './styles';

export interface GranthBook {
  id: string;
  title: string;
  kind: string;
  year: string;
  blurb: string;
  buy_url: string;
  cover_image?: string;
}

export interface GranthBooksContent {
  eyebrow?: string;
  heading?: string;
  lead?: string;
  author_mark?: string; // short pen-name on every jacket (e.g. अरण्य)
  buy_label?: string;   // shared buy-link label
  items?: GranthBook[];
}

const COVER_VARIANTS = ['', 'gr-cover--v3', 'gr-cover--v2'];

export function GranthBooksCore({ content, E }: { content: GranthBooksContent; E: GranthPrimitives }) {
  const items = content.items || [];
  const authorMark = content.author_mark || '';
  const buyLabel = content.buy_label || 'Amazon पर ख़रीदें →';
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BOOKS_STYLES }} />
      <section className="gr-books gr-section gr-wrap">
        <E.Txt elementKey="eyebrow" value={content.eyebrow} as="p"
          className="gr-caption gr-books__eyebrow" placeholder="पुस्तकें" />
        <E.Txt elementKey="heading" value={content.heading} as="h2"
          className="gr-heading gr-books__heading" placeholder="प्रकाशित कृतियाँ" />
        <div className="gr-orn"><span>·</span></div>
        <E.Txt elementKey="lead" value={content.lead} as="p"
          className="gr-books__lead" placeholder="चुनी हुई कृतियाँ।" />

        <E.List collectionKey="items" items={items} className="gr-book-grid" itemClassName="gr-book"
          makeItem={() => ({ title: '', kind: 'कविता-संग्रह', year: '', blurb: '', buy_url: '', cover_image: '' })}
          min={1} max={8} addLabel="+ पुस्तक"
          render={(item: GranthBook, i: number) => (
            <>
              <E.Img elementKey={`items.${item.id}.cover_image`} src={item.cover_image} alt={item.title}
                className={`gr-cover ${COVER_VARIANTS[i % COVER_VARIANTS.length]}`} imgClassName="gr-cover-img"
                placeholder={
                  <>
                    <span className="gr-cover__top">{item.kind}</span>
                    <span className="gr-cover__title">{item.title}</span>
                    <span className="gr-cover__author">{authorMark}</span>
                  </>
                }
              />
              <E.Txt elementKey={`items.${item.id}.title`} value={item.title} as="h3"
                className="gr-book__title" placeholder="पुस्तक का नाम" />
              <p className="gr-book__meta">
                <E.Txt elementKey={`items.${item.id}.kind`} value={item.kind} as="span" placeholder="कविता-संग्रह" />
                <span className="gr-book__sep">·</span>
                <E.Txt elementKey={`items.${item.id}.year`} value={item.year} as="span" placeholder="२०२१" />
                <span className="gr-book__sep">·</span>
                <E.Txt elementKey={`items.${item.id}.blurb`} value={item.blurb} as="span" placeholder="संक्षिप्त परिचय" />
              </p>
              <E.Link hrefKey={`items.${item.id}.buy_url`} href={item.buy_url} external className="gr-buy">
                {buyLabel}
              </E.Link>
            </>
          )}
        />
      </section>
    </>
  );
}

export default GranthBooksCore;
