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
