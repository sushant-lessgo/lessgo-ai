// src/modules/generation/workLibrarySync.test.ts
// work-library-board (phase 2) — fixture-driven proof for the pure resync.
// Covers rename / merge / hide / reorder + the three group-reference surfaces
// (gallery cards · chrome cards · workcatalog items · item-page photos) staying
// mutually consistent, AI copy byte-identity, idempotency, and graceful degrade.

import { describe, it, expect } from 'vitest';
import { resyncWorkContent } from './workLibrarySync';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Two groups (Weddings + Portraits), works-capable content matching the shapes
 *  the generation path seeds. Photos: w1(cover)+w2 on Weddings, p1 on Portraits. */
function baseFacts(): WorkFacts {
  return {
    groups: [
      {
        name: 'Weddings',
        kind: 'category',
        price: { mode: 'on-request' },
        slug: 'weddings',
        photos: [
          { id: 'w1', url: 'https://cdn.test/w1.jpg', cover: true },
          { id: 'w2', url: 'https://cdn.test/w2.jpg' },
        ],
      },
      {
        name: 'Portraits',
        kind: 'category',
        price: { mode: 'on-request' },
        slug: 'portraits',
        photos: [{ id: 'p1', url: 'https://cdn.test/p1.jpg' }],
      },
    ],
  } as WorkFacts;
}

/** A works-capable stored content tree: flat home gallery + chrome-footer gallery
 *  + a workcatalog singleton + two workdetail item pages. Cards/items/photos are
 *  pre-seeded to the SAME values baseFacts would produce (so a first resync with
 *  unchanged facts is a pure no-op / id-stable). */
function baseContent(): any {
  const galleryCards = () => [
    { id: 'card-weddings', name: 'Weddings', cover_image: 'https://cdn.test/w1.jpg', href: '/works/weddings' },
    { id: 'card-portraits', name: 'Portraits', cover_image: 'https://cdn.test/p1.jpg', href: '/works/portraits' },
  ];
  return {
    content: {
      'hero-home': {
        id: 'hero-home',
        type: 'hero',
        elements: { name: 'Kristina Kundius', role_line: 'Photographer', headline: '<em>Real</em> AI copy' },
      },
      'work-home': {
        id: 'work-home',
        type: 'work',
        elements: { eyebrow: 'Selected work', heading: 'The work', lead: 'A hand-picked few.', groups: galleryCards() },
      },
    },
    chrome: {
      header: { id: 'header-home', layout: 'WorkHeader', data: { id: 'header-home', type: 'header', elements: { logo_text: 'KK' } } },
      footer: {
        id: 'footer-home',
        layout: 'WorkFooter',
        data: { id: 'footer-home', type: 'footer', elements: { copyright: '© KK', groups: galleryCards() } },
      },
    },
    pages: {
      'page-work-catalog': {
        id: 'page-work-catalog',
        archetypeKey: 'work-catalog',
        pathSlug: '/works',
        title: 'Works',
        order: 1,
        kind: 'singleton',
        collectionKey: 'works',
        sections: ['workcatalog-1'],
        content: {
          'workcatalog-1': {
            id: 'workcatalog-1',
            type: 'workcatalog',
            elements: {
              eyebrow: 'Works',
              items: [
                { id: 'it-weddings', name: 'Weddings', cover: 'https://cdn.test/w1.jpg', href: '/works/weddings' },
                { id: 'it-portraits', name: 'Portraits', cover: 'https://cdn.test/p1.jpg', href: '/works/portraits' },
              ],
            },
          },
        },
      },
      'page-weddings': {
        id: 'page-weddings',
        archetypeKey: 'work-detail',
        pathSlug: '/works/weddings',
        title: 'Weddings',
        order: 2,
        kind: 'collectionItem',
        collectionKey: 'works',
        sections: ['workdetail-w'],
        content: {
          'workdetail-w': {
            id: 'workdetail-w',
            type: 'workdetail',
            elements: {
              name: 'Weddings',
              client: 'Real client',
              problem: 'Real problem copy',
              result: 'Real result copy',
              photos: [
                { id: 'w1', url: 'https://cdn.test/w1.jpg', alt: '', cover: true },
                { id: 'w2', url: 'https://cdn.test/w2.jpg', alt: '', cover: false },
              ],
            },
          },
        },
      },
      'page-portraits': {
        id: 'page-portraits',
        archetypeKey: 'work-detail',
        pathSlug: '/works/portraits',
        title: 'Portraits',
        order: 3,
        kind: 'collectionItem',
        collectionKey: 'works',
        sections: ['workdetail-p'],
        content: {
          'workdetail-p': {
            id: 'workdetail-p',
            type: 'workdetail',
            elements: {
              name: 'Portraits',
              client: 'Portrait client',
              problem: 'Portrait problem',
              result: 'Portrait result',
              photos: [{ id: 'p1', url: 'https://cdn.test/p1.jpg', alt: '', cover: false }],
            },
          },
        },
      },
    },
  };
}

// ── Accessors ────────────────────────────────────────────────────────────────
const galleryCards = (fc: any) => fc.content['work-home'].elements.groups;
const chromeCards = (fc: any) => fc.chrome.footer.data.elements.groups;
const catalogItems = (fc: any) => fc.pages['page-work-catalog'].content['workcatalog-1'].elements.items;
const detailPhotos = (fc: any, key: string) =>
  fc.pages[key]?.content[key === 'page-weddings' ? 'workdetail-w' : 'workdetail-p']?.elements.photos;

// ── Tests ────────────────────────────────────────────────────────────────────

describe('resyncWorkContent — unchanged facts (id-stable no-op)', () => {
  it('preserves card/item ids and does not touch AI copy', () => {
    const out = resyncWorkContent(baseContent(), baseFacts());
    expect(galleryCards(out).map((c: any) => c.id)).toEqual(['card-weddings', 'card-portraits']);
    expect(catalogItems(out).map((i: any) => i.id)).toEqual(['it-weddings', 'it-portraits']);
    expect(out.content['hero-home'].elements.headline).toBe('<em>Real</em> AI copy');
    expect(out.content['work-home'].elements.heading).toBe('The work');
  });
});

describe('resyncWorkContent — rename (slug preserved)', () => {
  it('updates the card + catalog name, keeps slug/href + ids, keeps the page', () => {
    const facts = baseFacts();
    facts.groups![0].name = 'Wedding Films'; // slug stays 'weddings'
    const out = resyncWorkContent(baseContent(), facts);

    const card = galleryCards(out)[0];
    expect(card.name).toBe('Wedding Films');
    expect(card.href).toBe('/works/weddings');
    expect(card.id).toBe('card-weddings'); // id stable across rename

    const item = catalogItems(out)[0];
    expect(item.name).toBe('Wedding Films');
    expect(item.href).toBe('/works/weddings');
    expect(item.id).toBe('it-weddings');

    // chrome card updated identically.
    expect(chromeCards(out)[0].name).toBe('Wedding Films');
    // item page survives (slug unchanged).
    expect(out.pages['page-weddings']).toBeTruthy();
  });
});

describe('resyncWorkContent — merge (absorb Portraits into Weddings)', () => {
  it('drops the absorbed card + catalog item, prunes its page, concatenates photos', () => {
    const facts = baseFacts();
    // board merge result: Portraits gone; its photo concatenated onto Weddings.
    facts.groups = [
      {
        name: 'Weddings',
        kind: 'category',
        price: { mode: 'on-request' },
        slug: 'weddings',
        photos: [
          { id: 'w1', url: 'https://cdn.test/w1.jpg', cover: true },
          { id: 'w2', url: 'https://cdn.test/w2.jpg' },
          { id: 'p1', url: 'https://cdn.test/p1.jpg' },
        ],
      },
    ] as WorkFacts['groups'];
    const out = resyncWorkContent(baseContent(), facts);

    expect(galleryCards(out).map((c: any) => c.name)).toEqual(['Weddings']);
    expect(catalogItems(out).map((i: any) => i.name)).toEqual(['Weddings']);
    expect(out.pages['page-portraits']).toBeUndefined(); // absorbed page pruned
    expect(out.pages['page-weddings']).toBeTruthy();

    const photos = detailPhotos(out, 'page-weddings');
    expect(photos.map((p: any) => p.id)).toEqual(['w1', 'w2', 'p1']); // concatenated on survivor
  });
});

describe('resyncWorkContent — hide (photo flagged hidden)', () => {
  it('removes the photo from the item page + gallery cover + catalog, never from facts', () => {
    const facts = baseFacts();
    facts.groups![0].photos![0].hidden = true; // hide w1 (the cover)
    const before = JSON.stringify(facts);
    const out = resyncWorkContent(baseContent(), facts);

    // item page no longer carries w1; cover falls back to w2.
    const photos = detailPhotos(out, 'page-weddings');
    expect(photos.map((p: any) => p.id)).toEqual(['w2']);
    expect(galleryCards(out)[0].cover_image).toBe('https://cdn.test/w2.jpg');
    expect(catalogItems(out)[0].cover).toBe('https://cdn.test/w2.jpg');

    // facts are read-only — never mutated by the resync.
    expect(JSON.stringify(facts)).toBe(before);
  });
});

describe('resyncWorkContent — reorder (facts order = surface order)', () => {
  it('reorders gallery cards AND catalog items identically, ids follow', () => {
    const facts = baseFacts();
    facts.groups = [facts.groups![1], facts.groups![0]]; // Portraits, Weddings
    const out = resyncWorkContent(baseContent(), facts);

    expect(galleryCards(out).map((c: any) => c.name)).toEqual(['Portraits', 'Weddings']);
    expect(galleryCards(out).map((c: any) => c.id)).toEqual(['card-portraits', 'card-weddings']);
    expect(catalogItems(out).map((i: any) => i.name)).toEqual(['Portraits', 'Weddings']);
    expect(catalogItems(out).map((i: any) => i.id)).toEqual(['it-portraits', 'it-weddings']);
    expect(chromeCards(out).map((c: any) => c.name)).toEqual(['Portraits', 'Weddings']);
  });
});

describe('resyncWorkContent — mutual consistency of all group-ref surfaces', () => {
  it('gallery, chrome, and catalog agree on names + order after a save', () => {
    const facts = baseFacts();
    facts.groups![0].name = 'Wedding Films';
    facts.groups = [facts.groups![1], facts.groups![0]];
    const out = resyncWorkContent(baseContent(), facts);

    const names = ['Portraits', 'Wedding Films'];
    expect(galleryCards(out).map((c: any) => c.name)).toEqual(names);
    expect(chromeCards(out).map((c: any) => c.name)).toEqual(names);
    expect(catalogItems(out).map((i: any) => i.name)).toEqual(names);
  });
});

describe('resyncWorkContent — AI copy fields byte-identical', () => {
  it('leaves hero copy + workdetail connective copy untouched', () => {
    const input = baseContent();
    const out = resyncWorkContent(input, baseFacts());
    expect(out.content['hero-home'].elements).toEqual(input.content['hero-home'].elements);
    const wd = out.pages['page-weddings'].content['workdetail-w'].elements;
    expect(wd.client).toBe('Real client');
    expect(wd.problem).toBe('Real problem copy');
    expect(wd.result).toBe('Real result copy');
    expect(wd.name).toBe('Weddings');
  });

  it('never mutates the input tree', () => {
    const input = baseContent();
    const snapshot = JSON.stringify(input);
    resyncWorkContent(input, baseFacts());
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('resyncWorkContent — idempotency', () => {
  it('re-running on already-resynced content is a no-op diff', () => {
    const facts = baseFacts();
    facts.groups![0].name = 'Wedding Films';
    facts.groups![0].photos![0].hidden = true;
    const once = resyncWorkContent(baseContent(), facts);
    const twice = resyncWorkContent(once, facts);
    expect(twice).toEqual(once);
  });
});

describe('resyncWorkContent — graceful degrade (non-works content)', () => {
  /** atelier-shaped content: a gallery section, but NO item pages + NO workcatalog. */
  function degradeContent(): any {
    return {
      content: {
        'work-home': {
          id: 'work-home',
          type: 'work',
          elements: {
            heading: 'Work',
            groups: [
              { id: 'g-weddings', name: 'Weddings', cover_image: 'https://cdn.test/w1.jpg' },
              { id: 'g-portraits', name: 'Portraits', cover_image: 'https://cdn.test/p1.jpg' },
            ],
          },
        },
      },
      pages: {},
    };
  }

  it('rebuilds cards without hrefs, writes no catalog/item pages, never throws', () => {
    const out = resyncWorkContent(degradeContent(), baseFacts());
    const cards = out.content['work-home'].elements.groups;
    expect(cards.map((c: any) => c.name)).toEqual(['Weddings', 'Portraits']);
    // D7a: no item page ⇒ no href on any card.
    for (const c of cards) expect(c.href).toBeUndefined();
    // covers still reflect the facts.
    expect(cards[0].cover_image).toBe('https://cdn.test/w1.jpg');
    // ids preserved by name-slug match (no href to read).
    expect(cards.map((c: any) => c.id)).toEqual(['g-weddings', 'g-portraits']);
    // nothing else created.
    expect(Object.keys(out.pages)).toEqual([]);
  });

  it('degrades idempotently', () => {
    const once = resyncWorkContent(degradeContent(), baseFacts());
    const twice = resyncWorkContent(once, baseFacts());
    expect(twice).toEqual(once);
  });
});
