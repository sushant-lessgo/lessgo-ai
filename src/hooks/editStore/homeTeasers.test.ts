// Guards "pin to home": the home lineup (products) + gallery-preview (gallery
// images) are MATERIALIZED read-only views derived from flagged source content.
// Products flagged `featuredOnHome` fill the lineup (fallback: first-3); gallery
// images flagged `onHome` fill the preview (fallback: first-6). Cross-page write:
// flags live on the product / gallery pages, output lands on the home page.
import { describe, it, expect } from 'vitest';
import { materializeHomeLineup, materializeHomeGallery, materializeHomeTeasers } from './collectionHelpers';

// ── minimal fixtures ──────────────────────────────────────────────────────
let n = 0;
const sid = (type: string) => `${type}-${(n++).toString(36)}0000`; // `${type}-${uuid}` shape

const productPage = (order: number, model: string, featuredOnHome: boolean) => {
  const s = sid('productdetail');
  return {
    id: `page-${model}`, pathSlug: `/products/${model}`, order,
    kind: 'collectionItem', collectionKey: 'products',
    sections: [s],
    content: { [s]: { type: 'productdetail', elements: { model, name: model, oneLiner: `${model} one-liner`, cardSpec: 'spec', featuredOnHome, images: [{ id: 'i', src: `${model}.jpg` }] } } },
  };
};

const galleryPage = (images: any[]) => {
  const s = sid('gallery');
  return {
    id: 'page-gallery', pathSlug: '/gallery', order: 20,
    kind: 'singleton',
    sections: [s],
    content: { [s]: { type: 'gallery', elements: { images } } },
  };
};

const homePage = () => {
  const li = sid('lineup');
  const gp = sid('gallerypreview');
  return {
    id: 'home', pathSlug: '/', order: 0,
    sections: [li, gp],
    content: {
      [li]: { type: 'lineup', elements: { headline: 'Lineup', items: [] } },
      [gp]: { type: 'gallerypreview', elements: { headline: 'Gallery', images: [] } },
    },
  };
};

const asPages = (arr: any[]) => Object.fromEntries(arr.map((p) => [p.id, p])) as any;

const img = (id: string, onHome: boolean) => ({ id, src: `${id}.jpg`, tag: id, category: 'c', onHome });

describe('materializeHomeLineup', () => {
  it('picks the flagged products in order, mapped to lineup cards (no categoryId)', () => {
    const pages = asPages([
      productPage(2, 'a', true),
      productPage(3, 'b', false),
      productPage(4, 'c', true),
      productPage(5, 'd', false),
    ]);
    const out = materializeHomeLineup(pages);
    expect(out.map((c) => c.model)).toEqual(['a', 'c']);
    expect(out[0].href).toBe('/products/a');
    expect(out[0].image).toBe('a.jpg');
    expect(out[0]).not.toHaveProperty('categoryId');
  });

  it('falls back to the first 3 (order-sorted) when nothing is flagged', () => {
    const pages = asPages([
      productPage(4, 'c', false),
      productPage(2, 'a', false),
      productPage(3, 'b', false),
      productPage(5, 'd', false),
    ]);
    expect(materializeHomeLineup(pages).map((c) => c.model)).toEqual(['a', 'b', 'c']);
  });

  it('caps the flagged set at 4', () => {
    const pages = asPages([2, 3, 4, 5, 6].map((o, i) => productPage(o, `p${i}`, true)));
    expect(materializeHomeLineup(pages)).toHaveLength(4);
  });
});

describe('materializeHomeGallery', () => {
  it('picks the flagged images (fallback: first 6, cap 6)', () => {
    const flagged = galleryPage([img('x', false), img('y', true), img('z', true)]);
    expect(materializeHomeGallery(asPages([flagged])).map((i) => i.id)).toEqual(['y', 'z']);

    const none = galleryPage(Array.from({ length: 9 }, (_, i) => img(`g${i}`, false)));
    const fb = materializeHomeGallery(asPages([none]));
    expect(fb).toHaveLength(6);
    expect(fb[0].id).toBe('g0');
  });

  it('returns [] when there is no gallery page', () => {
    expect(materializeHomeGallery(asPages([homePage()]))).toEqual([]);
  });
});

describe('materializeHomeTeasers (cross-page write into the home page)', () => {
  it('writes the flagged lineup + gallery-preview into the home sections', () => {
    const home = homePage();
    const pages = asPages([
      home,
      productPage(2, 'a', true),
      productPage(3, 'b', false),
      productPage(4, 'c', true),
      galleryPage([img('x', true), img('y', false), img('z', true)]),
    ]);
    materializeHomeTeasers(pages);
    const liEls = (home.content as any)[home.sections[0]].elements;
    const gpEls = (home.content as any)[home.sections[1]].elements;
    expect(liEls.items.map((i: any) => i.model)).toEqual(['a', 'c']);
    expect(gpEls.images.map((i: any) => i.id)).toEqual(['x', 'z']);
  });

  it('no-ops when the home page lacks lineup/gallerypreview sections (other templates)', () => {
    const bare = { id: 'home', pathSlug: '/', order: 0, sections: [sid('hero')], content: {} as any };
    const pages = asPages([bare, productPage(2, 'a', true)]);
    expect(() => materializeHomeTeasers(pages)).not.toThrow();
    expect(bare.content).toEqual({});
  });
});
