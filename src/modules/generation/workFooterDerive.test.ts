// src/modules/generation/workFooterDerive.test.ts
// work-contract-wave2 phase 5 — footer derive + assembly stamp + resync re-stamp.
// Proves: (1) nav columns track the live page set (incl. CMS detail pages) —
// spec acceptance; (2) contact derives from facts identity with a graceful empty
// fallback; (3) the marker gate keeps an un-opted (Kundius) footer byte-identical
// on both the direct stamp and the resyncWorkContent re-stamp path.

import { describe, it, expect } from 'vitest';
import {
  deriveFooterNav,
  deriveFooterContact,
  stampWorkFooterNav,
  FOOTER_NAV_MODE_DERIVED,
} from './workFooterDerive';
import { resyncWorkContent } from './workLibrarySync';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';

/** A page-set fixture: home + a works index singleton + N works detail pages. */
function pagesFixture(detailSlugs: string[]): Record<string, any> {
  const pages: Record<string, any> = {
    home: { id: 'home', archetypeKey: 'home', pathSlug: '/', title: 'Home', order: 0, kind: 'singleton' },
    'page-works': {
      id: 'page-works', archetypeKey: 'works', pathSlug: '/works', title: 'Portfolio',
      order: 1, kind: 'singleton', collectionKey: 'works',
    },
  };
  detailSlugs.forEach((slug, i) => {
    pages[`page-${slug}`] = {
      id: `page-${slug}`, archetypeKey: 'workdetail', pathSlug: `/works/${slug}`,
      title: slug.replace(/-/g, ' '), order: 2 + i, kind: 'collectionItem', collectionKey: 'works',
    };
  });
  return pages;
}

describe('deriveFooterNav — columns track the live page set', () => {
  it('emits an Explore column (home + index singleton) and a Work column (detail pages)', () => {
    const fc = { pages: pagesFixture(['brand-portraits', 'editorial']) };
    const cols = deriveFooterNav(fc);
    expect(cols.map((c) => c.heading)).toEqual(['Explore', 'Portfolio']);

    const explore = cols[0];
    expect(explore.links.map((l) => l.href)).toEqual(['/', '/works']);

    const work = cols[1];
    expect(work.links.map((l) => l.href)).toEqual([
      '/works/brand-portraits',
      '/works/editorial',
    ]);
    // ids are deterministic from the path (stable React keys / re-stamps).
    expect(work.links[0].id).toBe('fnl-works-brand-portraits');
  });

  it('a NEW detail page adds a Work-column link (add/remove tracking)', () => {
    const before = deriveFooterNav({ pages: pagesFixture(['brand-portraits']) });
    const after = deriveFooterNav({ pages: pagesFixture(['brand-portraits', 'editorial']) });
    const beforeWork = before.find((c) => c.heading === 'Portfolio')!;
    const afterWork = after.find((c) => c.heading === 'Portfolio')!;
    expect(beforeWork.links).toHaveLength(1);
    expect(afterWork.links).toHaveLength(2);
    expect(afterWork.links.some((l) => l.href === '/works/editorial')).toBe(true);
  });

  it('no pages ⇒ no columns (graceful empty)', () => {
    expect(deriveFooterNav({})).toEqual([]);
    expect(deriveFooterNav({ pages: {} })).toEqual([]);
  });
});

describe('deriveFooterContact — from facts identity, graceful fallback', () => {
  it('surfaces location + reach', () => {
    const facts = { identity: { name: 'Kristina', location: 'Amsterdam', reach: 'Worldwide' } } as WorkFacts;
    expect(deriveFooterContact(facts)).toEqual({ location: 'Amsterdam', reach: 'Worldwide' });
  });

  it('empty / absent identity ⇒ {}', () => {
    expect(deriveFooterContact(null)).toEqual({});
    expect(deriveFooterContact({ identity: { name: 'X' } } as WorkFacts)).toEqual({});
  });
});

describe('stampWorkFooterNav — first-gen (marker ADDED)', () => {
  function footerFC() {
    const footerEl: any = { eyebrow: 'Get in touch', heading: 'Lets make yours' };
    const footerSec = { id: 'footer-abc', elements: footerEl };
    return {
      content: { 'footer-abc': footerSec },
      chrome: { footer: { id: 'footer-abc', data: footerSec } },
      pages: pagesFixture(['brand-portraits']),
    };
  }

  it('stamps the marker + derived columns + contact into the footer', () => {
    const fc = footerFC();
    const facts = { identity: { name: 'K', location: 'Amsterdam' } } as WorkFacts;
    stampWorkFooterNav(fc, facts);
    const el = fc.chrome.footer.data.elements as any;
    expect(el.footer_nav_mode).toBe(FOOTER_NAV_MODE_DERIVED);
    expect(el.nav_columns).toHaveLength(2);
    expect(el.contact_location).toBe('Amsterdam');
    expect(el.contact_reach).toBeUndefined();
  });
});

describe('stampWorkFooterNav — re-stamp gate (onlyIfMarked)', () => {
  it('REFRESHES an already-marked footer to the current page set', () => {
    const el: any = { footer_nav_mode: FOOTER_NAV_MODE_DERIVED, nav_columns: [] };
    const fc = { content: { 'footer-1': { id: 'footer-1', elements: el } }, pages: pagesFixture(['a', 'b']) };
    stampWorkFooterNav(fc, null, { onlyIfMarked: true });
    expect(el.nav_columns.length).toBeGreaterThan(0);
    const work = el.nav_columns.find((c: any) => c.heading === 'Portfolio');
    expect(work.links).toHaveLength(2);
  });

  it('LEAVES an un-marked footer byte-identical (Kundius safety)', () => {
    const el: any = { eyebrow: 'Get in touch', heading: 'Lets make yours' };
    const snapshot = JSON.stringify(el);
    const fc = { content: { 'footer-1': { id: 'footer-1', elements: el } }, pages: pagesFixture(['a']) };
    stampWorkFooterNav(fc, null, { onlyIfMarked: true });
    expect(JSON.stringify(el)).toBe(snapshot);
    expect(el.footer_nav_mode).toBeUndefined();
    expect(el.nav_columns).toBeUndefined();
  });
});

describe('resyncWorkContent — footer re-stamp wiring', () => {
  const facts = {
    identity: { name: 'Kristina', location: 'Amsterdam', reach: 'Worldwide' },
    groups: [
      { name: 'Brand Portraits', kind: 'category', price: { mode: 'on-request' }, slug: 'brand-portraits',
        photos: [{ id: 'p1', url: 'u1', cover: true }] },
    ],
  } as unknown as WorkFacts;

  /** Stored content: a marked footer with STALE (empty) columns + the matching
   *  works detail page present in fc.pages (so the resync prune keeps it). */
  function storedContent(marked: boolean) {
    const footerEl: any = { eyebrow: 'x', heading: 'y' };
    if (marked) { footerEl.footer_nav_mode = FOOTER_NAV_MODE_DERIVED; footerEl.nav_columns = []; }
    const footerSec = { id: 'footer-1', elements: footerEl };
    return {
      content: { 'footer-1': footerSec },
      chrome: { footer: { id: 'footer-1', data: footerSec } },
      pages: {
        home: { id: 'home', pathSlug: '/', title: 'Home', order: 0, kind: 'singleton' },
        'page-brand-portraits': {
          id: 'page-brand-portraits', pathSlug: '/works/brand-portraits', title: 'Brand Portraits',
          order: 1, kind: 'collectionItem', collectionKey: 'works',
          content: {},
        },
      },
    };
  }

  it('a MARKED footer picks up the current detail pages after resync', () => {
    const out = resyncWorkContent(storedContent(true), facts);
    const el = out.chrome.footer.data.elements;
    expect(el.footer_nav_mode).toBe(FOOTER_NAV_MODE_DERIVED);
    const work = (el.nav_columns as any[]).find((c) => c.heading === 'Work' || c.heading === 'Portfolio');
    expect(work).toBeTruthy();
    expect(work.links.some((l: any) => l.href === '/works/brand-portraits')).toBe(true);
    expect(el.contact_location).toBe('Amsterdam');
  });

  it('an UN-marked footer stays byte-identical through resync (no migration)', () => {
    const input = storedContent(false);
    const before = JSON.stringify(input.content['footer-1'].elements);
    const out = resyncWorkContent(input, facts);
    const el = out.chrome.footer.data.elements;
    expect(el.footer_nav_mode).toBeUndefined();
    expect(el.nav_columns).toBeUndefined();
    expect(JSON.stringify(el)).toBe(before);
  });
});
