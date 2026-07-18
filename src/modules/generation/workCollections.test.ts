// src/modules/generation/workCollections.test.ts
// work-onboarding-ingestion (E2) phase 1 — pure binding-helper unit coverage.
//   deriveWorksEntries: groups→entries, 24-photo clamp (D11), url-less drop, slug.
//   stampWorkGalleryBinding: cover precedence, name→slug join survives AI framing,
//     no-photos no-op, href stamped ONLY when the item page exists (D7a guard).

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from '@/lib/normalize';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import { deriveWorksEntries, stampWorkGalleryBinding, WORKS_PHOTOS_PER_GROUP_CAP } from './workCollections';
import { buildCollectionCatalogSlice, buildCollectionItemSlice } from '@/hooks/editStore/archetypes';

function photo(i: number, over: Partial<{ url: string; cover: boolean; alt: string }> = {}) {
  return { id: `p${i}`, url: over.url ?? `https://cdn/${i}.jpg`, ...over };
}

function facts(groups: WorkFacts['groups']): WorkFacts {
  return { groups } as WorkFacts;
}

/** Minimal fc with ONE home work-gallery section carrying `groups` cards. */
function fcWithGallery(
  groupCards: Array<{ id: string; name: string; cover_image?: string; href?: string }>,
  opts: { pages?: Record<string, any> } = {}
) {
  return {
    content: {
      'work-abc': {
        id: 'work-abc',
        elements: {
          heading: 'The work',
          groups: groupCards.map((g) => ({ cover_image: '', href: '#work', ...g })),
        },
      },
    },
    pages: opts.pages ?? {},
  };
}

describe('deriveWorksEntries', () => {
  it('maps flat groups → entries with code-derived slugs + photos', () => {
    const entries = deriveWorksEntries(
      facts([
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [photo(1, { cover: true }), photo(2)] },
        { name: 'Portraits', kind: 'category', price: { mode: 'on-request' }, photos: [photo(3)] },
      ] as any)
    );
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe('Weddings');
    expect(entries[0].slug).toBe(slugify('Weddings'));
    expect(entries[0].photos).toEqual([
      { id: 'p1', url: 'https://cdn/1.jpg', cover: true },
      { id: 'p2', url: 'https://cdn/2.jpg' },
    ]);
  });

  it('drops url-less photo refs and clamps to 24 per group (D11 belt)', () => {
    const many = Array.from({ length: 31 }, (_, i) => photo(i));
    const entries = deriveWorksEntries(
      facts([
        { name: 'Big Shoot', kind: 'category', price: { mode: 'on-request' }, photos: [{ id: 'nope' }, ...many] },
      ] as any)
    );
    // the url-less ref is dropped, remainder clamped to 24
    expect(entries[0].photos).toHaveLength(WORKS_PHOTOS_PER_GROUP_CAP);
    expect(entries[0].photos!.every((p) => !!p.url)).toBe(true);
  });

  it('empty / null facts ⇒ []', () => {
    expect(deriveWorksEntries(null)).toEqual([]);
    expect(deriveWorksEntries(facts([]) as any)).toEqual([]);
    expect(deriveWorksEntries(facts(undefined) as any)).toEqual([]);
  });

  it('a group with no photos yields an entry with no photos field', () => {
    const entries = deriveWorksEntries(
      facts([{ name: 'Bare', kind: 'category', price: { mode: 'on-request' } }] as any)
    );
    expect(entries[0]).not.toHaveProperty('photos');
  });
});

describe('stampWorkGalleryBinding — cover precedence + join', () => {
  const entries = deriveWorksEntries(
    facts([
      { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [photo(1), photo(2, { cover: true }), photo(3)] },
    ] as any)
  );

  it('picks the cover:true photo, else first', () => {
    const fc = fcWithGallery([{ id: 'g1', name: 'Weddings' }], {
      pages: { 'page-weddings': { id: 'page-weddings' } },
    });
    stampWorkGalleryBinding(fc, entries);
    const card = fc.content['work-abc'].elements.groups[0];
    expect(card.cover_image).toBe('https://cdn/2.jpg'); // the cover:true photo
  });

  it('falls back to the first photo when none is flagged cover', () => {
    const noCover = deriveWorksEntries(
      facts([{ name: 'Portraits', kind: 'category', price: { mode: 'on-request' }, photos: [photo(9), photo(8)] }] as any)
    );
    const fc = fcWithGallery([{ id: 'g1', name: 'Portraits' }], {
      pages: { 'page-portraits': {} },
    });
    stampWorkGalleryBinding(fc, noCover);
    expect(fc.content['work-abc'].elements.groups[0].cover_image).toBe('https://cdn/9.jpg');
  });

  it('joins by NAME→slug (survives AI-polished framing), never index', () => {
    // Gallery cards in a DIFFERENT order than entries, framing text differs but
    // the group name is verbatim (facts law) → slug match still binds correctly.
    const multi = deriveWorksEntries(
      facts([
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [photo(1, { cover: true })] },
        { name: 'Portraits', kind: 'category', price: { mode: 'on-request' }, photos: [photo(2, { cover: true })] },
      ] as any)
    );
    const fc = fcWithGallery(
      [
        { id: 'gA', name: 'Portraits' }, // reversed order
        { id: 'gB', name: 'Weddings' },
      ],
      { pages: { 'page-weddings': {}, 'page-portraits': {} } }
    );
    stampWorkGalleryBinding(fc, multi);
    const g = fc.content['work-abc'].elements.groups;
    expect(g[0].cover_image).toBe('https://cdn/2.jpg'); // Portraits
    expect(g[1].cover_image).toBe('https://cdn/1.jpg'); // Weddings
  });

  it('no entries ⇒ no-op (fc untouched)', () => {
    const fc = fcWithGallery([{ id: 'g1', name: 'Weddings', cover_image: '' }]);
    const before = JSON.stringify(fc);
    stampWorkGalleryBinding(fc, []);
    expect(JSON.stringify(fc)).toBe(before);
  });

  it('a group with no photos leaves cover_image as-is', () => {
    const bare = deriveWorksEntries(
      facts([{ name: 'Bare', kind: 'category', price: { mode: 'on-request' } }] as any)
    );
    const fc = fcWithGallery([{ id: 'g1', name: 'Bare', cover_image: 'EXISTING' }], {
      pages: { 'page-bare': {} },
    });
    stampWorkGalleryBinding(fc, bare);
    expect(fc.content['work-abc'].elements.groups[0].cover_image).toBe('EXISTING');
  });
});

describe('stampWorkGalleryBinding — href D7a guard', () => {
  const entries = deriveWorksEntries(
    facts([{ name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [photo(1)] }] as any)
  );

  it('stamps href when the /works/<slug> item page EXISTS', () => {
    const fc = fcWithGallery([{ id: 'g1', name: 'Weddings' }], {
      pages: { 'page-weddings': { id: 'page-weddings' } },
    });
    stampWorkGalleryBinding(fc, entries);
    expect(fc.content['work-abc'].elements.groups[0].href).toBe('/works/weddings');
  });

  it('does NOT stamp href when the item page is ABSENT (non-flipped template)', () => {
    const fc = fcWithGallery([{ id: 'g1', name: 'Weddings', href: '#work' }], { pages: {} });
    stampWorkGalleryBinding(fc, entries);
    // cover still stamped (capability-independent), but href left as-is
    expect(fc.content['work-abc'].elements.groups[0].cover_image).toBe('https://cdn/1.jpg');
    expect(fc.content['work-abc'].elements.groups[0].href).toBe('#work');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// work-library-board phase 1 — hide-not-destroy (single choke point) + stable
// slug across a rename.
// ─────────────────────────────────────────────────────────────────────────────

describe('deriveWorksEntries — hide-not-destroy filter (single choke point)', () => {
  it('drops hidden:true photo refs before the cap/cover, keeps visible ones', () => {
    const entries = deriveWorksEntries(
      facts([
        {
          name: 'Weddings',
          kind: 'category',
          price: { mode: 'on-request' },
          photos: [
            photo(1),
            { id: 'p2', url: 'https://cdn/2.jpg', hidden: true },
            photo(3),
          ],
        },
      ] as any)
    );
    expect(entries[0].photos).toEqual([
      { id: 'p1', url: 'https://cdn/1.jpg' },
      { id: 'p3', url: 'https://cdn/3.jpg' },
    ]);
  });

  it('cover falls back when the flagged cover photo is hidden', () => {
    const entries = deriveWorksEntries(
      facts([
        {
          name: 'Weddings',
          kind: 'category',
          price: { mode: 'on-request' },
          photos: [
            { id: 'p1', url: 'https://cdn/1.jpg', cover: true, hidden: true },
            photo(2),
          ],
        },
      ] as any)
    );
    const fc = fcWithGallery([{ id: 'g1', name: 'Weddings' }], {
      pages: { 'page-weddings': {} },
    });
    stampWorkGalleryBinding(fc, entries);
    // the hidden cover:true photo is gone → cover falls back to the first visible
    expect(fc.content['work-abc'].elements.groups[0].cover_image).toBe('https://cdn/2.jpg');
  });

  it('a hidden photo NEVER reaches any render-surface seeder (catalog / item / gallery)', () => {
    const HIDDEN = 'https://cdn/secret.jpg';
    const entries = deriveWorksEntries(
      facts([
        {
          name: 'Weddings',
          kind: 'category',
          price: { mode: 'on-request' },
          photos: [photo(1), { id: 'hush', url: HIDDEN, hidden: true }],
        },
      ] as any)
    );
    // gallery covers
    const fc = fcWithGallery([{ id: 'g1', name: 'Weddings' }], {
      pages: { 'page-weddings': {} },
    });
    stampWorkGalleryBinding(fc, entries);
    // catalog + item slices are seeded from the SAME entries
    const catalog = buildCollectionCatalogSlice('works', entries);
    const item = buildCollectionItemSlice('works', entries[0]);
    const blob = JSON.stringify({ fc, catalog, item });
    expect(blob).not.toContain(HIDDEN);
  });

  it('SOURCE GUARD: no other render-surface seeder forks the hidden filter', () => {
    // The seeders consume deriveWorksEntries output (already-filtered), so the
    // word `hidden` must NOT appear in their source — proving the filter lives
    // ONLY at the deriveWorksEntries choke point (like multiPageAssembly.test's
    // source-level invariant pattern).
    const multiPage = fs.readFileSync(
      path.join(__dirname, 'multiPageAssembly.ts'),
      'utf8'
    );
    const archetypes = fs.readFileSync(
      path.join(__dirname, '..', '..', 'hooks', 'editStore', 'archetypes.ts'),
      'utf8'
    );
    expect(multiPage).not.toContain('hidden');
    expect(archetypes).not.toContain('hidden');
  });
});

describe('deriveWorksEntries — stable slug (survives a board rename)', () => {
  it('uses group.slug when present, so a rename keeps the /works/<slug> join', () => {
    const renamed = deriveWorksEntries(
      facts([
        {
          name: 'Wedding Films', // renamed from "Weddings"
          slug: 'weddings', // stable slug seeded on the first board save
          kind: 'category',
          price: { mode: 'on-request' },
          photos: [photo(1)],
        },
      ] as any)
    );
    expect(renamed[0].name).toBe('Wedding Films');
    expect(renamed[0].slug).toBe('weddings'); // NOT slugify('Wedding Films')
  });

  it('falls back to slugify(name) for pre-board facts (no slug)', () => {
    const legacy = deriveWorksEntries(
      facts([{ name: 'Portraits', kind: 'category', price: { mode: 'on-request' } }] as any)
    );
    expect(legacy[0].slug).toBe(slugify('Portraits'));
  });
});
