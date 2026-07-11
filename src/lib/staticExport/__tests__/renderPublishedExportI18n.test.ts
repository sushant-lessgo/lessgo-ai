// src/lib/staticExport/__tests__/renderPublishedExportI18n.test.ts
// i18n-phase-1 Phase 5 — loop-level test of renderPublishedExport's per-locale
// fan-out (the wiring the generateStaticHTML-only tests could NOT exercise).
//
// A multi-page project (root + 1 subpage) with 2 locales (en default + nl). The nl
// overlay lives — per the COMMITTED Phase 2/3a model — ENTIRELY in the ROOT
// `localeContent` map, keyed by globally-unique sectionId, with entries for BOTH a
// root section AND a subpage section. Proves:
//   • `/nl` root doc renders the nl overlay for the root section,
//   • `/nl/about` subpage doc renders the nl overlay for the SUBPAGE section
//     (this is what silently rendered English before the resolve-source fix),
//   • default `/` and `/about` docs stay base (English),
//   • extraRoutes carries `/nl` and `/nl/about`.
//
// The upload/prisma/blob boundary is stubbed minimally; generateStaticHTML runs for
// REAL so assertions are on genuinely rendered HTML.

import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// Capture rendered HTML per blob pageName ('index' | 'about' | 'nl' | 'nl/about').
const uploads: Record<string, string> = {};
vi.mock('../blobUploader', () => ({
  uploadStaticSite: vi.fn(async (opts: any) => {
    const name = opts.pageName || 'index';
    uploads[name] = opts.html;
    return {
      version: opts.version || 'ver-1',
      blobKey: `pages/p/ver-1/${name}.html`,
      blobUrl: `blob://${name}`,
      sizeBytes: Buffer.byteLength(opts.html, 'utf8'),
    };
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    publishedPageVersion: { create: vi.fn(async () => ({ id: 'ver-row-1' })) },
    publishedPage: { update: vi.fn(async () => ({})) },
  },
}));

vi.mock('@vercel/blob', () => ({ del: vi.fn(async () => {}), put: vi.fn(async () => ({})) }));

vi.mock('../getPublishedGoal', () => ({ getPublishedGoal: vi.fn(async () => null) }));

import { renderPublishedExport } from '../renderPublishedExport';

const ROOT_SEC = 'hero-root0001';
const SUB_SEC = 'hero-subp0001';

const EN_ROOT = 'ENROOTHEADLINEUNIQUE welcome';
const NL_ROOT = 'NLROOTHEADLINEUNIQUE welkom';
const EN_SUB = 'ENSUBHEADLINEUNIQUE about us';
const NL_SUB = 'NLSUBHEADLINEUNIQUE over ons';

function heroSection(id: string, headline: string) {
  return {
    id,
    type: 'hero',
    layout: 'leftCopyRightImage',
    elements: { headline },
    backgroundType: 'primary',
  };
}

function buildInput() {
  return {
    pageId: 'p',
    userId: 'u',
    slug: 'myslug',
    title: 'My Site',
    analyticsEnabled: false,
    audienceType: 'product' as const,
    templateId: 'meridian',
    variantId: null,
    paletteId: null,
    baseUrl: 'https://lessgo.ai',
    localeConfig: { locales: ['en', 'nl'], defaultLocale: 'en' },
    // Raw nested PublishedPage.content shape (renderPublishedExport flattens it).
    content: {
      layout: { sections: [ROOT_SEC], theme: {} },
      content: { [ROOT_SEC]: heroSection(ROOT_SEC, EN_ROOT) },
      forms: {},
      // PROJECT-GLOBAL overlay: both root + subpage sections in the ROOT map.
      localeContent: {
        nl: {
          [ROOT_SEC]: { headline: NL_ROOT },
          [SUB_SEC]: { headline: NL_SUB },
        },
      },
      subpages: {
        '/about': {
          title: 'About',
          layout: { sections: [SUB_SEC], theme: {} },
          content: { [SUB_SEC]: heroSection(SUB_SEC, EN_SUB) },
        },
      },
    },
  };
}

describe('Phase 5 — renderPublishedExport per-locale fan-out', () => {
  beforeEach(() => {
    for (const k of Object.keys(uploads)) delete uploads[k];
  });

  it('resolves the PROJECT-GLOBAL overlay for both root and subpage locale docs', async () => {
    const result = await renderPublishedExport(buildInput() as any);

    // Four docs emitted: default root + default subpage + nl root + nl subpage.
    expect(uploads['index']).toBeTruthy();
    expect(uploads['about']).toBeTruthy();
    expect(uploads['nl']).toBeTruthy();
    expect(uploads['nl/about']).toBeTruthy();

    // Default docs render base (English) copy.
    expect(uploads['index']).toContain(EN_ROOT);
    expect(uploads['index']).not.toContain(NL_ROOT);
    expect(uploads['index']).toContain('<html lang="en">');
    expect(uploads['about']).toContain(EN_SUB);
    expect(uploads['about']).not.toContain(NL_SUB);

    // nl ROOT doc renders the root-section overlay.
    expect(uploads['nl']).toContain(NL_ROOT);
    expect(uploads['nl']).not.toContain(EN_ROOT);
    expect(uploads['nl']).toContain('<html lang="nl">');

    // nl SUBPAGE doc renders the SUBPAGE-section overlay — the fix. Pre-fix this
    // read subFlat.localeContent (undefined) → base → EN_SUB.
    expect(uploads['nl/about']).toContain(NL_SUB);
    expect(uploads['nl/about']).not.toContain(EN_SUB);
    expect(uploads['nl/about']).toContain('<html lang="nl">');

    // Routes: default subpage + both nl docs (default root is the version pointer,
    // not an extraRoute).
    expect(Object.keys(result.extraRoutes).sort()).toEqual(
      ['/about', '/nl', '/nl/about'].sort()
    );
  });
});
