// WorkDetail — FLAT photo grid (the `/works/<slug>` project page). Mirror of
// galleryGroups.test.tsx, but the ASSERTION is inverted: on the DETAIL surface a
// flat photo list is CORRECT. The frozen group-references-only invariant belongs to
// the HOME GALLERY (galleryGroups.test.tsx) — the real photos of a group land HERE,
// bound by the works fan-out into the `photos` collection (workdetailContract).
// This test feeds a `photos` collection through the published WorkDetail core and
// asserts: (a) every photo url renders as exactly one <img>, (b) the COVER photo
// renders FIRST, (c) one grid cell per photo, and (d) the project name renders.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makePublishedPrimitives } from './blocks/publishedPrimitives';
import { WorkDetailCore } from './blocks/WorkDetail/WorkDetail.core';
import { resyncWorkContent } from '@/modules/generation/workLibrarySync';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';

function count(hay: string, needle: string): number {
  return hay.split(needle).length - 1;
}

describe('WorkDetail — flat photo grid (project-story page)', () => {
  // A group's photos, mirroring what the fan-out seeds into the workdetail item
  // page. The 3rd photo carries cover:true — so it must render FIRST.
  const photos = [
    { id: 'ph1', url: 'https://cdn.test/a.jpg', alt: 'A' },
    { id: 'ph2', url: 'https://cdn.test/b.jpg', alt: 'B' },
    { id: 'ph3', url: 'https://cdn.test/cover.jpg', alt: 'Cover', cover: true },
  ];

  const html = renderToStaticMarkup(
    React.createElement(WorkDetailCore, {
      content: {
        name: 'Acme rebrand',
        client: 'Acme',
        problem: 'A tired identity',
        result: '3× more enquiries',
        photos,
      },
      E: makePublishedPrimitives(),
      sectionId: 'workdetail-test',
    })
  );

  it('renders the project name (title)', () => {
    expect(html).toContain('Acme rebrand');
  });

  it('renders every photo url as exactly one <img>', () => {
    for (const p of photos) {
      expect(count(html, `src="${p.url}"`), `photo "${p.url}" must render once`).toBe(1);
    }
    // One media wrapper per photo — a real flat photo list (NOT a single cover ref).
    expect(count(html, 'class="wk-detail__media"')).toBe(photos.length);
  });

  it('renders the COVER photo FIRST (cover-first ordering)', () => {
    const coverAt = html.indexOf('src="https://cdn.test/cover.jpg"');
    const firstNonCoverAt = html.indexOf('src="https://cdn.test/a.jpg"');
    expect(coverAt).toBeGreaterThan(-1);
    expect(coverAt, 'the cover photo must render before the others').toBeLessThan(firstNonCoverAt);
  });

  it('renders the carry-only client/problem/result meta when present', () => {
    expect(html).toContain('Acme');
    expect(html).toContain('A tired identity');
    expect(html).toContain('3× more enquiries');
  });

  it('with NO cover flag, keeps document order (first photo leads)', () => {
    const noCover = renderToStaticMarkup(
      React.createElement(WorkDetailCore, {
        content: { name: 'X', photos: [{ id: 'z1', url: 'https://cdn.test/1.jpg' }, { id: 'z2', url: 'https://cdn.test/2.jpg' }] },
        E: makePublishedPrimitives(),
        sectionId: 'wd2',
      })
    );
    expect(noCover.indexOf('src="https://cdn.test/1.jpg"')).toBeLessThan(
      noCover.indexOf('src="https://cdn.test/2.jpg"')
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// work-library-board (phase 7) — the RESYNCED `photos[]` write.
//
// The board's save-time resync (`resyncWorkContent`, phase 2) rewrites each
// `/works/<slug>` item page's `workdetail.photos[]` from the group's FACTS photos,
// dropping `hidden:true` refs at the single choke point. This test runs the REAL
// resync over a works-capable content fixture, then renders the item page's
// resynced photos through the REAL WorkDetail core — proving the detail page
// reflects the board (hidden dropped, order + cover preserved).
// ═══════════════════════════════════════════════════════════════════════════

function wdFacts(): WorkFacts {
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
          { id: 'w3', url: 'https://cdn.test/w3.jpg' },
        ],
      },
    ],
  } as WorkFacts;
}

function wdContent(): any {
  return {
    content: {},
    pages: {
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
              client: 'Real client',
              problem: 'Real problem copy',
              result: 'Real result copy',
              photos: [{ id: 'w1', url: 'https://cdn.test/w1.jpg', alt: '', cover: true }],
            },
          },
        },
      },
    },
  };
}

const wdPhotos = (fc: any) => fc.pages['page-weddings'].content['workdetail-w'].elements.photos;

function renderDetail(photos: any[]): string {
  return renderToStaticMarkup(
    React.createElement(WorkDetailCore, {
      content: { name: 'Weddings', client: 'Real client', problem: 'Real problem copy', result: 'Real result copy', photos },
      E: makePublishedPrimitives(),
      sectionId: 'workdetail-resync',
    })
  );
}

describe('WorkDetail — resynced photos[] reflect the board/facts', () => {
  it('resync writes the full facts photo set onto the item page (cover-first render)', () => {
    const out = resyncWorkContent(wdContent(), wdFacts());
    const photos = wdPhotos(out);
    // The item page now carries all three facts photos (was seeded with only w1).
    expect(photos.map((p: any) => p.id)).toEqual(['w1', 'w2', 'w3']);

    const html = renderDetail(photos);
    for (const url of ['https://cdn.test/w1.jpg', 'https://cdn.test/w2.jpg', 'https://cdn.test/w3.jpg']) {
      expect(count(html, `src="${url}"`), `photo ${url} must render once`).toBe(1);
    }
    // Cover (w1) renders first.
    expect(html.indexOf('src="https://cdn.test/w1.jpg"')).toBeLessThan(
      html.indexOf('src="https://cdn.test/w2.jpg"')
    );
  });

  it('a HIDDEN photo is dropped from the resynced item page (never rendered)', () => {
    const facts = wdFacts();
    facts.groups![0].photos![1].hidden = true; // hide w2
    const out = resyncWorkContent(wdContent(), facts);
    const photos = wdPhotos(out);

    expect(photos.map((p: any) => p.id)).toEqual(['w1', 'w3']); // w2 dropped

    const html = renderDetail(photos);
    expect(html, 'hidden photo url must not reach the item page').not.toContain('https://cdn.test/w2.jpg');
    expect(html).toContain('https://cdn.test/w1.jpg');
    expect(html).toContain('https://cdn.test/w3.jpg');
    expect(count(html, 'class="wk-detail__media"')).toBe(2);
  });
});
