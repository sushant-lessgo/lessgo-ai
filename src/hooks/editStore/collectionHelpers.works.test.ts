// collectionHelpers.works.test.ts — work-library-board phase 6 regression.
//
// Pins the `catalogItemsAuthoritative('works')` guard (the pre-existing latent
// blank-cover bug fix): the works catalog `items[]` must SURVIVE the export sweep
// and the live-editor sync BYTE-IDENTICAL, because they are seeded by
// buildCollectionCatalogSlice + maintained by the board's resyncWorkContent — NOT
// re-derivable via cardFromEntry (which reads `rec.images`, but workdetail carries
// `photos`, and the target shape is `{id,name,cover,href}` not `CatalogCard`).
// products/services/case-studies MUST still re-materialize at BOTH call sites.

import { describe, it, expect } from 'vitest';
import {
  catalogItemsAuthoritative,
  materializeIntoPages,
  syncCollection,
  collectionItems,
} from './collectionHelpers';
import { buildPagesForExport } from './pageHelpers';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Authoritative works catalog items (WorkCatalog shape — NOT CatalogCard). */
const WORK_ITEMS = [
  { id: 'works-weddings', name: 'Weddings', cover: 'https://cdn.example.com/w-cover.jpg', href: '/works/weddings' },
  { id: 'works-portraits', name: 'Portraits', cover: 'https://cdn.example.com/p-cover.jpg', href: '/works/portraits' },
];

function fixture() {
  return {
    // Home page so buildPagesForExport's findHomeId resolves cleanly.
    home: {
      id: 'home',
      kind: 'singleton',
      order: 0,
      pathSlug: '/',
      title: 'Home',
      sections: [],
      content: {},
    },
    // works catalog singleton — authoritative items[] (must not change).
    'works-catalog': {
      id: 'works-catalog',
      kind: 'singleton',
      collectionKey: 'works',
      order: 1,
      pathSlug: '/works',
      title: 'Works',
      sections: ['workcatalog-1'],
      content: { 'workcatalog-1': { elements: { items: clone(WORK_ITEMS) } } },
    },
    // works item pages — workdetail carries `photos` (NOT `images`) → cardFromEntry
    // would emit blank-cover cards, which the guard must prevent.
    'works-weddings': {
      id: 'works-weddings',
      kind: 'collectionItem',
      collectionKey: 'works',
      order: 2,
      pathSlug: '/works/weddings',
      title: 'Weddings',
      sections: ['workdetail-1'],
      content: { 'workdetail-1': { elements: { name: 'Weddings', photos: [{ id: 'ph_w1', url: 'https://cdn.example.com/w1.jpg' }] } } },
    },
    'works-portraits': {
      id: 'works-portraits',
      kind: 'collectionItem',
      collectionKey: 'works',
      order: 3,
      pathSlug: '/works/portraits',
      title: 'Portraits',
      sections: ['workdetail-2'],
      content: { 'workdetail-2': { elements: { name: 'Portraits', photos: [{ id: 'ph_p1', url: 'https://cdn.example.com/p1.jpg' }] } } },
    },
    // products catalog singleton — starts EMPTY; must be re-materialized.
    'products-catalog': {
      id: 'products-catalog',
      kind: 'singleton',
      collectionKey: 'products',
      order: 4,
      pathSlug: '/products',
      title: 'Products',
      sections: ['catalog-1'],
      content: { 'catalog-1': { elements: { items: [] } } },
    },
    // products item page — productdetail carries `images` (CatalogCard source).
    'products-widget': {
      id: 'products-widget',
      kind: 'collectionItem',
      collectionKey: 'products',
      order: 5,
      pathSlug: '/products/widget',
      title: 'Widget',
      sections: ['productdetail-1'],
      content: {
        'productdetail-1': {
          elements: {
            model: 'W1',
            name: 'Widget',
            oneLiner: 'A nice widget',
            images: [{ src: 'https://cdn.example.com/widget.jpg' }],
            cardSpec: '12mm',
            category: 'gadgets',
          },
        },
      },
    },
  } as Record<string, any>;
}

const catalogItemsOf = (pages: Record<string, any>, pageId: string, sid: string) =>
  pages[pageId].content[sid].elements.items;

describe('catalogItemsAuthoritative guard', () => {
  it('is true ONLY for works', () => {
    expect(catalogItemsAuthoritative('works')).toBe(true);
    expect(catalogItemsAuthoritative('products')).toBe(false);
    expect(catalogItemsAuthoritative('services')).toBe(false);
    expect(catalogItemsAuthoritative('case-studies')).toBe(false);
  });
});

describe('materializeIntoPages (export/publish call site)', () => {
  it('leaves the works catalog items[] byte-identical', () => {
    const pages = fixture();
    materializeIntoPages(pages, 'works');
    expect(catalogItemsOf(pages, 'works-catalog', 'workcatalog-1')).toEqual(WORK_ITEMS);
  });

  it('still re-materializes the products catalog items[] (blank → 1 card)', () => {
    const pages = fixture();
    expect(catalogItemsOf(pages, 'products-catalog', 'catalog-1')).toHaveLength(0);
    materializeIntoPages(pages, 'products');
    const items = catalogItemsOf(pages, 'products-catalog', 'catalog-1');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'products-widget', model: 'W1', name: 'Widget', image: 'https://cdn.example.com/widget.jpg' });
  });
});

describe('syncCollection (live-editor commitActivePage call site)', () => {
  it('leaves the works catalog items[] byte-identical', () => {
    const state = { pages: fixture(), currentPageId: 'home', sections: [], content: {} };
    syncCollection(state, 'works');
    expect(catalogItemsOf(state.pages, 'works-catalog', 'workcatalog-1')).toEqual(WORK_ITEMS);
  });

  it('still re-materializes the products catalog items[]', () => {
    const state = { pages: fixture(), currentPageId: 'home', sections: [], content: {} };
    syncCollection(state, 'products');
    const items = catalogItemsOf(state.pages, 'products-catalog', 'catalog-1');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'products-widget', image: 'https://cdn.example.com/widget.jpg' });
  });
});

describe('buildPagesForExport (full export sweep)', () => {
  it('preserves works catalog items[] byte-identical while products re-materialize', () => {
    const state = {
      pages: fixture(),
      currentPageId: 'home',
      title: 'Home',
      sections: [],
      sectionLayouts: {},
      sectionSpacing: {},
      content: {},
      chrome: { header: null, footer: null },
    };
    const { pages } = buildPagesForExport(state);

    // works catalog untouched (guarded).
    expect(catalogItemsOf(pages, 'works-catalog', 'workcatalog-1')).toEqual(WORK_ITEMS);
    // works item pages still present + photos intact.
    expect(collectionItems(pages, 'works')).toHaveLength(2);

    // products catalog re-derived by the same sweep.
    const products = catalogItemsOf(pages, 'products-catalog', 'catalog-1');
    expect(products).toHaveLength(1);
    expect(products[0].image).toBe('https://cdn.example.com/widget.jpg');
  });
});
