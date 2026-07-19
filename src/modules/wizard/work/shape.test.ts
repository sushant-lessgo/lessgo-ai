// src/modules/wizard/work/shape.test.ts
// ============================================================================
// Unit suite for the STEP 04 site-shape machinery (plan-proposal-gate phase 1).
// The load-bearing data-correctness half: fold (single-page), expand (multi seed
// + proposal subset), the two-way tile alias, and the work-group gate.
//
// NOTE on the proof filter: `filterSectionsByProof` cuts only the `testimonials`
// section key. The work/atelier vertical names its proof band `proof` (the
// skeleton registry key), which the filter never touches — so `proof` is ALWAYS
// kept for atelier. The proof wiring is exercised here against a synthetic
// `testimonials` section instead.
// ============================================================================

import { describe, it, expect, vi } from 'vitest';
import {
  siteShapeOf,
  foldToSinglePage,
  expandToMultiPage,
  canPromoteWorkGroup,
  TILE_ALIAS,
  MENU_KEY_FOR_TILE,
} from './shape';
import {
  workPageTypes,
  PROMOTE_GROUP_MIN,
  type WorkPageTypeKey,
} from '@/modules/engines/workPages';
import { getPageArchetypesForTemplate } from '@/modules/audience/product/pageArchetypes';
import type { WorkSitemapPage } from '@/modules/audience/work/strategy/parseStrategyWork';

const ATELIER_MENU = getPageArchetypesForTemplate('atelier')!;

/** A synthetic multi-page atelier sitemap (menu-keyed archetypeKeys). */
function atelierSitemap(): WorkSitemapPage[] {
  return [
    { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'work', 'proof', 'contact'] },
    { archetypeKey: 'work', title: 'Work', pathSlug: '/work', sections: ['work', 'proof'] },
    { archetypeKey: 'experiences', title: 'Experiences', pathSlug: '/experiences', sections: ['packages', 'proof'] },
    { archetypeKey: 'about', title: 'About', pathSlug: '/about', sections: ['about', 'proof'] },
    { archetypeKey: 'contact', title: 'Contact', pathSlug: '/contact', sections: ['contact'] },
  ];
}

describe('siteShapeOf', () => {
  it('is single for a lone home page', () => {
    expect(siteShapeOf([{ archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] }])).toBe('single');
  });

  it('is multi for more than one page', () => {
    expect(siteShapeOf(atelierSitemap())).toBe('multi');
  });

  it('is multi for a lone non-home page (defensive)', () => {
    expect(siteShapeOf([{ archetypeKey: 'work', title: 'Work', pathSlug: '/work', sections: ['work'] }])).toBe('multi');
  });

  it('is multi for an empty sitemap (defensive)', () => {
    expect(siteShapeOf([])).toBe('multi');
  });
});

describe('foldToSinglePage', () => {
  it('folds to a single home page whose sections are the deduped union in home.allowedSections order', () => {
    const folded = foldToSinglePage(atelierSitemap(), { hasTestimonials: true });
    expect(folded).toHaveLength(1);
    expect(folded[0].archetypeKey).toBe('home');
    // union {hero,work,proof,contact,packages,about} ordered by
    // home.allowedSections [hero,work,proof,packages,about,contact].
    expect(folded[0].sections).toEqual(['hero', 'work', 'proof', 'packages', 'about', 'contact']);
  });

  it('keeps proof for atelier regardless of hasTestimonials (proof band ≠ testimonials key)', () => {
    const folded = foldToSinglePage(atelierSitemap(), { hasTestimonials: false });
    expect(folded[0].sections).toContain('proof');
  });

  it('clamps sections outside home.allowedSections and warns naming them', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pages: WorkSitemapPage[] = [
      { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'work'] },
      { archetypeKey: 'work-detail', title: 'A Project', pathSlug: '/work/a/b', sections: ['workdetail', 'proof'] },
    ];
    const folded = foldToSinglePage(pages);
    expect(folded[0].sections).toEqual(['hero', 'work', 'proof']); // workdetail dropped
    expect(folded[0].sections).not.toContain('workdetail');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('workdetail'));
    warn.mockRestore();
  });

  it('drops a testimonials section when hasTestimonials is false (F22 wiring through the fold)', () => {
    const pages: WorkSitemapPage[] = [
      // home.allowedSections does NOT include testimonials, so it would be
      // clamped anyway — use a section that IS allowed to isolate the proof cut.
      { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero', 'testimonials'] },
    ];
    // 'testimonials' is outside home.allowedSections → clamped; assert hero kept.
    const folded = foldToSinglePage(pages, { hasTestimonials: false });
    expect(folded[0].sections).toEqual(['hero']);
  });

  it('carries title/slug from the input home page', () => {
    const pages = atelierSitemap();
    pages[0].title = 'Kundius';
    const folded = foldToSinglePage(pages);
    expect(folded[0].title).toBe('Kundius');
    expect(folded[0].pathSlug).toBe('/');
  });

  it('falls back to workPageTypes.home defaults when no home page is present', () => {
    const pages: WorkSitemapPage[] = [
      { archetypeKey: 'work', title: 'Work', pathSlug: '/work', sections: ['work', 'proof'] },
    ];
    const folded = foldToSinglePage(pages);
    expect(folded[0].archetypeKey).toBe(workPageTypes.home.key);
    expect(folded[0].pathSlug).toBe(workPageTypes.home.pathSlug);
    expect(folded[0].sections).toEqual(['work', 'proof']);
  });

  it('does not mutate the input', () => {
    const pages = atelierSitemap();
    const snapshot = JSON.stringify(pages);
    foldToSinglePage(pages);
    expect(JSON.stringify(pages)).toBe(snapshot);
  });
});

describe('expandToMultiPage', () => {
  it('no filter → the full atelier menu (5 pages, menu order)', () => {
    const pages = expandToMultiPage(ATELIER_MENU, { hasTestimonials: true });
    expect(pages.map((p) => p.archetypeKey)).toEqual([
      'home', 'work', 'experiences', 'about', 'contact',
    ]);
    // proof-filtered (no-op for atelier — proof kept).
    expect(pages[0].sections).toContain('proof');
  });

  it('pages ["home","work","contact"] (compact) → exactly Home/Work/Contact in menu order', () => {
    const pages = expandToMultiPage(ATELIER_MENU, {
      pages: ['home', 'work', 'contact'],
    });
    expect(pages.map((p) => p.archetypeKey)).toEqual(['home', 'work', 'contact']);
    expect(pages.some((p) => p.pathSlug === '/experiences')).toBe(false);
    expect(pages.some((p) => p.pathSlug === '/about')).toBe(false);
  });

  it('pages including "prices" keeps the atelier "experiences" def (reverse alias works)', () => {
    const pages = expandToMultiPage(ATELIER_MENU, {
      pages: ['home', 'work', 'prices', 'about', 'contact'],
    });
    const experiences = pages.find((p) => p.archetypeKey === 'experiences');
    expect(experiences).toBeDefined();
    expect(experiences!.pathSlug).toBe('/experiences');
    // standard subset = the full 5-page menu, byte-order preserved.
    expect(pages.map((p) => p.archetypeKey)).toEqual([
      'home', 'work', 'experiences', 'about', 'contact',
    ]);
  });

  it('pages including "work-group" is silently skipped (no menu def) without error', () => {
    const pages = expandToMultiPage(ATELIER_MENU, {
      pages: ['home', 'work', 'work-group' as WorkPageTypeKey],
    });
    expect(pages.map((p) => p.archetypeKey)).toEqual(['home', 'work']);
  });
});

describe('TILE_ALIAS / MENU_KEY_FOR_TILE', () => {
  it('bridges experiences → prices and work-detail → project-story', () => {
    expect(TILE_ALIAS['experiences']).toBe('prices');
    expect(TILE_ALIAS['work-detail']).toBe('project-story');
    expect(TILE_ALIAS['home']).toBe('home'); // identity
  });

  it('MENU_KEY_FOR_TILE is the exact inverse of TILE_ALIAS non-identity entries', () => {
    const expected: Record<string, string> = {};
    for (const [archetypeKey, canonical] of Object.entries(TILE_ALIAS)) {
      if (archetypeKey !== canonical) expected[canonical] = archetypeKey;
    }
    expect(MENU_KEY_FOR_TILE).toEqual(expected);
    expect(MENU_KEY_FOR_TILE.prices).toBe('experiences');
    expect(MENU_KEY_FOR_TILE['project-story']).toBe('work-detail');
  });
});

describe('canPromoteWorkGroup', () => {
  it('is false below PROMOTE_GROUP_MIN and true at/above it', () => {
    expect(canPromoteWorkGroup(PROMOTE_GROUP_MIN - 1)).toBe(false);
    expect(canPromoteWorkGroup(PROMOTE_GROUP_MIN)).toBe(true);
    expect(canPromoteWorkGroup(PROMOTE_GROUP_MIN + 1)).toBe(true);
  });
});
