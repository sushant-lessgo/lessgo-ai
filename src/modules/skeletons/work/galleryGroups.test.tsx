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
