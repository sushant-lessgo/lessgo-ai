// Guards the naayom Products seed: the deterministic TechPremium finalContent must
// ship the multi-page Products collection (catalog + 9 detail pages) with the
// catalog items materialized from the detail records and grouped by category.
import { describe, it, expect } from 'vitest';
import { buildTechPremiumHomeFinalContent, NAAYOM_PRODUCTS } from './archetypes';

const fc = buildTechPremiumHomeFinalContent({ tokenId: 't1', title: 'Naayom', productName: 'Naayom' });
const pages = Object.values(fc.pages || {}) as any[];
const sidOfType = (p: any, type: string) => (p.sections || []).find((s: string) => p.content?.[s]?.type === type);

describe('naayom products seed', () => {
  it('NAAYOM_PRODUCTS = 9 across the 3 categories', () => {
    expect(NAAYOM_PRODUCTS).toHaveLength(9);
    expect(new Set(NAAYOM_PRODUCTS.map((p) => p.categoryId))).toEqual(new Set(['controllers', 'control', 'monitors']));
  });

  it('emits the multi-page payload: home + catalog + 9 product pages + chrome', () => {
    expect(fc.homeId).toBe('home');
    expect(fc.currentPageId).toBe('home');
    expect(fc.chrome?.header).toBeTruthy();
    expect(fc.chrome?.footer).toBeTruthy();
    expect(pages.find((p) => p.pathSlug === '/')).toBeTruthy();
    expect(pages.find((p) => p.kind === 'singleton' && p.collectionKey === 'products')?.pathSlug).toBe('/products');
    expect(pages.filter((p) => p.kind === 'collectionItem' && p.collectionKey === 'products')).toHaveLength(9);
  });

  it('catalog items[] are materialized (9), grouped across the 3 categories, href → detail slugs', () => {
    const catalog = pages.find((p) => p.kind === 'singleton');
    const items = catalog.content[sidOfType(catalog, 'catalog')].elements.items;
    expect(items).toHaveLength(9);
    expect(new Set(items.map((i: any) => i.categoryId))).toEqual(new Set(['controllers', 'control', 'monitors']));
    expect(items.every((i: any) => i.href.startsWith('/products/'))).toBe(true);
  });

  it('each detail page carries real record copy + materialized related siblings', () => {
    const nwc1000 = pages.find((p) => p.pathSlug === '/products/nwc-1000');
    const rec = nwc1000.content[sidOfType(nwc1000, 'productdetail')].elements;
    expect(rec.model).toBe('NWC 1000');
    expect(rec.category).toBe('controllers');
    expect(rec.features.length).toBeGreaterThan(0);
    expect(rec.specs.length).toBeGreaterThan(0);
    // related = same-category siblings (2 other controllers), excl. self
    expect(rec.related.length).toBe(2);
    expect(rec.related.every((r: any) => r.categoryId === 'controllers')).toBe(true);
  });

  it('home lineup items[] are materialized from the 3 featuredOnHome products (not hand-authored)', () => {
    const home = pages.find((p) => p.pathSlug === '/');
    const items = home.content[sidOfType(home, 'lineup')].elements.items;
    expect(items.map((i: any) => i.model)).toEqual(['NWC 1000', 'NWC 101', 'NWM 100']);
    expect(items.every((i: any) => i.href.startsWith('/products/'))).toBe(true);
    // lineup card shape has no categoryId (unlike the catalog card)
    expect(items[0]).not.toHaveProperty('categoryId');
  });

  it('preserves the flat top-level fields (theme/meta/onboarding restore path)', () => {
    expect(fc.layout?.sections?.length).toBeGreaterThan(0);
    expect(fc.meta?.tokenId).toBe('t1');
    expect(fc.onboardingData).toBeTruthy();
  });
});
