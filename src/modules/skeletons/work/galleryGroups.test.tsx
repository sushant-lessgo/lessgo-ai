// AC L120 — the work gallery renders GROUP REFERENCES (each group's name + ONE
// cover reference), NEVER an embedded flat photo list. The frozen work-core
// contract keeps photos in the `works` collection (COLLECTIONS.works); the gallery
// section owns only `groups` { id, name, cover_image, href }. This test feeds a
// `groups` collection mapped from the real Kundius workFacts groups through the
// published gallery core and asserts (a) every group name + exactly ONE cover per
// group renders, and (b) there is NO flat photo-list markup.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makePublishedPrimitives } from './blocks/publishedPrimitives';
import { WorkGalleryGridCore } from './blocks/Gallery/WorkGalleryGrid.core';
import WorkGalleryGridPublished from './blocks/Gallery/WorkGalleryGrid.published';
import { WorkCatalogCore } from './blocks/Catalog/WorkCatalog.core';
import { resyncWorkContent } from '@/modules/generation/workLibrarySync';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import { kundiusWorkFacts } from '@/modules/audience/work/__tests__/fixtures/kundiusBrief';

function count(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

describe('WorkGalleryGrid — group references only (AC L120)', () => {
  // Map the real Kundius priced groups onto the frozen `groups` collection shape.
  const groups = kundiusWorkFacts.groups.map((g, i) => ({
    id: `kg${i + 1}`,
    name: g.name,
    cover_image: '', // cover REFERENCE (empty → placeholder); never a photo list
    href: '#work',
  }));

  const html = renderToStaticMarkup(
    React.createElement(WorkGalleryGridCore, {
      content: { eyebrow: 'Selected work', heading: 'The work', lead: 'x', groups },
      E: makePublishedPrimitives(),
      sectionId: 'gallery-test',
    })
  );

  it('renders every group name', () => {
    for (const g of kundiusWorkFacts.groups) {
      const escaped = g.name.replace(/&/g, '&amp;'); // React escapes text nodes
      expect(html, `group "${g.name}" must render`).toContain(escaped);
    }
  });

  it('renders exactly one group cell + one cover reference per group', () => {
    // Count on the class ATTRIBUTE (not the CSS rule in the <style> block).
    expect(count(html, 'class="wk-gallery__group"')).toBe(groups.length);
    // One cover container per group — proves a single cover REFERENCE, not a list
    // of photos per group.
    expect(count(html, 'class="wk-gallery__media"')).toBe(groups.length);
  });

  it('embeds NO flat photo-list markup', () => {
    // The gallery never touches the `photos.<id>.url` collection path, and emits no
    // per-photo cell class — those live on the workdetail/library surface, not here.
    expect(html).not.toContain('photos.');
    expect(html).not.toContain('wk-gallery__photo');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// work-library-board (phase 7) — resync-driven parity + catalog consistency.
//
// The board's save-time resync (`resyncWorkContent`, phase 2) rewrites every
// group-reference SURFACE in stored content from the work FACTS. These tests feed
// a facts + stored-content fixture through the REAL resync (not hand-built cards)
// and render the resulting surfaces through the REAL block renderers, asserting:
//   • gallery cards render the resynced name/cover/href (dual-renderer parity —
//     the .core is single-source; only the edit wrapper adds `manageSlot`),
//   • the PUBLISHED gallery wrapper NEVER emits the edit-only "manage photos" link
//     (the phase-6-deferred guard — a genuine dual-renderer-leak tripwire),
//   • a HIDDEN photo (its cover) is dropped → the gallery cover falls back and the
//     hidden url never reaches gallery output,
//   • gallery cards and the `/works` `workcatalog` items agree (name/cover/href)
//     from ONE fixture — the catalog index stays consistent after a save.
// ═══════════════════════════════════════════════════════════════════════════

/** Two priced groups, works-capable facts (the shape the generation path seeds). */
function resyncFacts(): WorkFacts {
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

/** A works-capable stored content tree: flat-home gallery + a `workcatalog`
 *  singleton + two `workdetail` item pages. Cards/items/photos are pre-seeded so
 *  id-stability holds; the resync rewrites names/covers/hrefs/photos from facts. */
function resyncContent(): any {
  const cards = () => [
    { id: 'card-weddings', name: 'Weddings', cover_image: 'https://cdn.test/w1.jpg', href: '/works/weddings' },
    { id: 'card-portraits', name: 'Portraits', cover_image: 'https://cdn.test/p1.jpg', href: '/works/portraits' },
  ];
  return {
    content: {
      'work-home': {
        id: 'work-home',
        type: 'work',
        elements: { eyebrow: 'Selected work', heading: 'The work', lead: 'A few.', groups: cards() },
      },
    },
    pages: {
      'page-work-catalog': {
        id: 'page-work-catalog',
        pathSlug: '/works',
        kind: 'singleton',
        collectionKey: 'works',
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
        pathSlug: '/works/weddings',
        kind: 'collectionItem',
        collectionKey: 'works',
        content: {
          'workdetail-w': {
            id: 'workdetail-w',
            type: 'workdetail',
            elements: {
              name: 'Weddings',
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
        pathSlug: '/works/portraits',
        kind: 'collectionItem',
        collectionKey: 'works',
        content: {
          'workdetail-p': {
            id: 'workdetail-p',
            type: 'workdetail',
            elements: { name: 'Portraits', photos: [{ id: 'p1', url: 'https://cdn.test/p1.jpg', alt: '', cover: false }] },
          },
        },
      },
    },
  };
}

const galleryGroupsOf = (fc: any) => fc.content['work-home'].elements.groups;
const catalogItemsOf = (fc: any) => fc.pages['page-work-catalog'].content['workcatalog-1'].elements.items;

/** Render the PUBLISHED gallery wrapper from a resynced cards array. */
function renderPublishedGallery(groups: any[]): string {
  return renderToStaticMarkup(
    React.createElement(WorkGalleryGridPublished as any, { sectionId: 'gallery-resync', groups })
  );
}

/** Render the workcatalog core (published primitives) from a resynced items array. */
function renderCatalog(items: any[]): string {
  return renderToStaticMarkup(
    React.createElement(WorkCatalogCore, {
      content: { eyebrow: 'Works', items },
      E: makePublishedPrimitives(),
      sectionId: 'catalog-resync',
    })
  );
}

describe('WorkGalleryGrid — resynced cards render (name/cover/href)', () => {
  it('renders every resynced group card with its cover reference + /works href', () => {
    const out = resyncWorkContent(resyncContent(), resyncFacts());
    const groups = galleryGroupsOf(out);
    const html = renderPublishedGallery(groups);

    // Names.
    expect(html).toContain('Weddings');
    expect(html).toContain('Portraits');
    // Cover REFERENCES (one <img> per group cover) — the resync's covers.
    expect(html).toContain('src="https://cdn.test/w1.jpg"');
    expect(html).toContain('src="https://cdn.test/p1.jpg"');
    // Hrefs — /works/<slug> (item pages exist → D7a stamps the link).
    expect(html).toContain('href="/works/weddings"');
    expect(html).toContain('href="/works/portraits"');
    // One group cell per resynced entry (no flat photo list).
    expect(count(html, 'class="wk-gallery__group"')).toBe(groups.length);
  });
});

describe('WorkGalleryGrid — manageSlot is edit-only (published-leak tripwire)', () => {
  // The published wrapper must NEVER emit the edit-only "manage photos" link. If a
  // future edit makes WorkGalleryGridPublished pass a manageSlot, this FAILS.
  it('the PUBLISHED wrapper emits NO manage-photos marker', () => {
    const out = resyncWorkContent(resyncContent(), resyncFacts());
    const html = renderPublishedGallery(galleryGroupsOf(out));
    expect(html).not.toContain('data-wk-manage-photos');
    expect(html).not.toContain('Manage photos');
    // Assert on the class ATTRIBUTE — `.wk-gallery__manage` also appears as a CSS
    // rule in the injected <style> block (present regardless of the slot).
    expect(html).not.toContain('class="wk-gallery__manage"');
  });

  it('the core DOES emit the marker when a manageSlot is injected (assertion is not vacuous)', () => {
    // Mirror the edit wrapper's exact slot so the negative assertion above is
    // proven meaningful — a leaked slot is detectable.
    const manageSlot = React.createElement(
      'p',
      { className: 'wk-gallery__manage' },
      React.createElement('a', { href: '/dashboard/tok/work', 'data-wk-manage-photos': '' }, 'Manage photos →')
    );
    const html = renderToStaticMarkup(
      React.createElement(WorkGalleryGridCore, {
        content: { groups: galleryGroupsOf(resyncWorkContent(resyncContent(), resyncFacts())) },
        E: makePublishedPrimitives(),
        sectionId: 'gallery-edit-sim',
        manageSlot,
      })
    );
    expect(html).toContain('data-wk-manage-photos');
    expect(html).toContain('Manage photos');
  });
});

describe('WorkGalleryGrid — hidden photo absent from resynced gallery output', () => {
  it('hiding the cover falls back to the next visible photo; hidden url never renders', () => {
    const facts = resyncFacts();
    facts.groups![0].photos![0].hidden = true; // hide w1 (the Weddings cover)
    const out = resyncWorkContent(resyncContent(), facts);

    const weddings = galleryGroupsOf(out)[0];
    expect(weddings.cover_image).toBe('https://cdn.test/w2.jpg'); // fallback cover

    const html = renderPublishedGallery(galleryGroupsOf(out));
    expect(html, 'hidden cover url must not reach gallery output').not.toContain('https://cdn.test/w1.jpg');
    expect(html).toContain('https://cdn.test/w2.jpg');
  });
});

describe('WorkGalleryGrid + WorkCatalog — catalog consistency (one fixture)', () => {
  it('gallery cards and workcatalog items agree on name/cover/href after a save', () => {
    // Rename + reorder so the assertion isn't the trivial identity case.
    const facts = resyncFacts();
    facts.groups![0].name = 'Wedding Films'; // slug stays 'weddings'
    facts.groups = [facts.groups![1], facts.groups![0]]; // Portraits, then Weddings
    const out = resyncWorkContent(resyncContent(), facts);

    const galleryHtml = renderPublishedGallery(galleryGroupsOf(out));
    const catalogHtml = renderCatalog(catalogItemsOf(out));

    // Same names, covers, hrefs render on BOTH surfaces from the one resync.
    for (const s of ['Portraits', 'Wedding Films']) {
      expect(galleryHtml, `gallery missing ${s}`).toContain(s);
      expect(catalogHtml, `catalog missing ${s}`).toContain(s);
    }
    for (const url of ['https://cdn.test/p1.jpg', 'https://cdn.test/w1.jpg']) {
      expect(galleryHtml).toContain(`src="${url}"`);
      expect(catalogHtml).toContain(`src="${url}"`);
    }
    for (const href of ['/works/portraits', '/works/weddings']) {
      expect(galleryHtml).toContain(`href="${href}"`);
      expect(catalogHtml).toContain(`href="${href}"`);
    }

    // Order agrees: Portraits before Wedding Films on both surfaces.
    expect(galleryHtml.indexOf('Portraits')).toBeLessThan(galleryHtml.indexOf('Wedding Films'));
    expect(catalogHtml.indexOf('Portraits')).toBeLessThan(catalogHtml.indexOf('Wedding Films'));
  });
});
