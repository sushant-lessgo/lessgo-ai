// src/modules/brief/collections.test.ts
// Phase-1 unit coverage (scale-10): the Brief collections reader/writer —
// round-trip, tolerant of missing/malformed facts, code-derived slugs.

import { describe, it, expect } from 'vitest';
import type { Brief } from '@/types/brief';
import { slugify } from '@/lib/normalize';
import {
  getCollections,
  getCollectionEntries,
  makeCollectionEntry,
  setCollections,
  type CollectionsFacts,
} from './collections';

/** Minimal Brief carrier — only `facts` matters to the reader. */
function briefWith(facts: Record<string, unknown>): Brief {
  return { facts } as unknown as Brief;
}

describe('getCollections — tolerant reader', () => {
  it('returns {} when brief is null/undefined', () => {
    expect(getCollections(null)).toEqual({});
    expect(getCollections(undefined)).toEqual({});
  });

  it('returns {} when facts.collections is absent', () => {
    expect(getCollections(briefWith({ entry: {} }))).toEqual({});
  });

  it('returns {} when facts.collections is malformed (not an object)', () => {
    expect(getCollections(briefWith({ collections: 'nope' }))).toEqual({});
    expect(getCollections(briefWith({ collections: 42 }))).toEqual({});
  });

  it('drops unknown collection keys and non-array values', () => {
    const out = getCollections(
      briefWith({
        collections: {
          products: [{ name: 'Widget' }],
          catalog: [{ name: 'not a collection' }], // vestria flat-grid — NOT a key
          bogus: [{ name: 'x' }],
          services: 'not-an-array',
        },
      })
    );
    expect(Object.keys(out)).toEqual(['products']);
  });

  it('drops entries without a usable name; re-derives slugs', () => {
    const out = getCollections(
      briefWith({
        collections: {
          products: [
            { name: 'NWC 1000 Controller', oneLiner: 'grow room', imageUrl: 'http://x/y.png' },
            { name: '   ' }, // blank → dropped
            { oneLiner: 'no name' }, // no name → dropped
            'garbage', // non-object → dropped
          ],
        },
      })
    );
    expect(out.products).toHaveLength(1);
    expect(out.products![0]).toEqual({
      name: 'NWC 1000 Controller',
      slug: slugify('NWC 1000 Controller'),
      oneLiner: 'grow room',
      imageUrl: 'http://x/y.png',
    });
  });
});

describe('getCollectionEntries', () => {
  it('returns entries for a key, [] when absent', () => {
    const brief = briefWith({ collections: { services: [{ name: 'Weddings' }] } });
    expect(getCollectionEntries(brief, 'services')).toHaveLength(1);
    expect(getCollectionEntries(brief, 'works')).toEqual([]);
  });
});

describe('makeCollectionEntry — slug never AI', () => {
  it('derives slug from name via slugify', () => {
    const e = makeCollectionEntry('Phase II Tunnel Control!');
    expect(e).toEqual({ name: 'Phase II Tunnel Control!', slug: slugify('Phase II Tunnel Control!') });
    expect(e.slug).toBe('phase-ii-tunnel-control');
  });

  it('carries optional fields when provided', () => {
    const e = makeCollectionEntry('Portrait', { oneLiner: 'people', imageUrl: 'u' });
    expect(e.oneLiner).toBe('people');
    expect(e.imageUrl).toBe('u');
  });
});

describe('setCollections — pure writer round-trip', () => {
  it('writes normalized entries and reads them back', () => {
    const base = briefWith({ entry: { businessName: 'Acme' } });
    const collections: CollectionsFacts = {
      products: [makeCollectionEntry('Widget One'), makeCollectionEntry('Widget Two')],
    };
    const next = setCollections(base, collections);
    expect(getCollections(next)).toEqual({
      products: [
        { name: 'Widget One', slug: 'widget-one' },
        { name: 'Widget Two', slug: 'widget-two' },
      ],
    });
  });

  it('preserves sibling facts keys', () => {
    const base = briefWith({ entry: { businessName: 'Acme' } });
    const next = setCollections(base, { works: [makeCollectionEntry('Book A')] });
    expect((next.facts as Record<string, unknown>)['entry']).toEqual({ businessName: 'Acme' });
  });

  it('keeps empty collections (empty-state ships) and re-derives slugs from raw names', () => {
    const base = briefWith({});
    const next = setCollections(base, {
      services: [],
      'case-studies': [{ name: 'Client X Launch', slug: 'STALE-SLUG' }],
    });
    const out = getCollections(next);
    expect(out.services).toEqual([]);
    expect(out['case-studies']).toEqual([{ name: 'Client X Launch', slug: 'client-x-launch' }]);
  });
});
