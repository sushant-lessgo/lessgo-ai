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
import { deriveWorksEntries, stampWorkGalleryBinding, stampHeroSlides, WORKS_PHOTOS_PER_GROUP_CAP } from './workCollections';
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

// ─────────────────────────────────────────────────────────────────────────────
// work-contract-wave2 phase 4 — hero-slides auto-derive (first-gen only).
//   One slide per works-group cover; reuses deriveWorksEntries → pickCover so a
//   hidden photo never becomes a slide; no-op when groups/covers empty AND when
//   the hero already carries user-edited slides (never clobber).
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal fc with ONE home hero section (optionally pre-seeded with slides). */
function fcWithHero(
  existingSlides?: any[],
  opts: { pages?: Record<string, any> } = {}
) {
  return {
    content: {
      'hero-xyz': {
        id: 'hero-xyz',
        elements: {
          name: 'Studio Name',
          ...(existingSlides ? { slides: existingSlides } : {}),
        },
      },
    },
    pages: opts.pages ?? {},
  };
}

describe('stampHeroSlides — auto-derive from works covers', () => {
  it('stamps one slide per group cover (cover:true else first), slug-derived id', () => {
    const entries = deriveWorksEntries(
      facts([
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [photo(1), photo(2, { cover: true })] },
        { name: 'Portraits', kind: 'category', price: { mode: 'on-request' }, photos: [photo(3)] },
      ] as any)
    );
    const fc = fcWithHero();
    stampHeroSlides(fc, entries);
    const slides = fc.content['hero-xyz'].elements.slides;
    expect(slides).toHaveLength(2);
    expect(slides[0].image).toBe('https://cdn/2.jpg'); // the cover:true photo
    expect(slides[0].id).toBe('slide-weddings');
    expect(slides[1].image).toBe('https://cdn/3.jpg');
  });

  it('drops groups that have no cover (no photos → no slide)', () => {
    const entries = deriveWorksEntries(
      facts([
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [photo(1)] },
        { name: 'Portraits', kind: 'category', price: { mode: 'on-request' }, photos: [photo(3)] },
        { name: 'Bare', kind: 'category', price: { mode: 'on-request' } }, // no photos
      ] as any)
    );
    const fc = fcWithHero();
    stampHeroSlides(fc, entries);
    // 3 groups in, 2 slides out — the cover-less group is dropped.
    expect(fc.content['hero-xyz'].elements.slides).toHaveLength(2);
    expect(fc.content['hero-xyz'].elements.slides[0].image).toBe('https://cdn/1.jpg');
    expect(JSON.stringify(fc.content['hero-xyz'].elements.slides)).not.toContain('slide-bare');
  });

  it('respects hidden photos (hidden cover falls back; hidden-only group → no slide)', () => {
    const entries = deriveWorksEntries(
      facts([
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [{ id: 'p1', url: 'https://cdn/1.jpg', cover: true, hidden: true }, photo(2)] },
        { name: 'Portraits', kind: 'category', price: { mode: 'on-request' }, photos: [photo(3)] },
        { name: 'Secret', kind: 'category', price: { mode: 'on-request' }, photos: [{ id: 'h', url: 'https://cdn/secret.jpg', hidden: true }] },
      ] as any)
    );
    const fc = fcWithHero();
    stampHeroSlides(fc, entries);
    const slides = fc.content['hero-xyz'].elements.slides;
    expect(slides).toHaveLength(2); // hidden-only group yields no cover → no slide
    expect(slides[0].image).toBe('https://cdn/2.jpg'); // hidden cover fell back to first visible
    expect(JSON.stringify(slides)).not.toContain('secret');
  });

  // ── section-background phase 3 (D8 / R4) — the WRITE-side door on the slides
  //    invariant: a `slides` array is never exactly 1.
  it('a SINGLE-cover collection leaves the hero BYTE-IDENTICAL (no length-1 stamp)', () => {
    const entries = deriveWorksEntries(
      facts([
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [photo(1)] },
      ] as any)
    );
    expect(entries).toHaveLength(1); // the guard's precondition is real
    const fc = fcWithHero();
    const before = JSON.stringify(fc);
    stampHeroSlides(fc, entries);
    expect(JSON.stringify(fc), 'a lone cover was stamped as a length-1 slides array').toBe(before);
    expect(fc.content['hero-xyz'].elements.slides).toBeUndefined();
  });

  it('a multi-group set where only ONE group has a cover is also skipped', () => {
    const entries = deriveWorksEntries(
      facts([
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [photo(1)] },
        { name: 'Bare', kind: 'category', price: { mode: 'on-request' } },
        { name: 'AlsoBare', kind: 'category', price: { mode: 'on-request' } },
      ] as any)
    );
    const fc = fcWithHero();
    stampHeroSlides(fc, entries);
    expect(fc.content['hero-xyz'].elements.slides).toBeUndefined();
  });

  it('no-op when no entries, and when entries carry no covers', () => {
    const fc = fcWithHero();
    const before = JSON.stringify(fc);
    stampHeroSlides(fc, []);
    expect(JSON.stringify(fc)).toBe(before); // no entries → untouched

    const bare = deriveWorksEntries(
      facts([{ name: 'Bare', kind: 'category', price: { mode: 'on-request' } }] as any)
    );
    stampHeroSlides(fc, bare); // entries but no covers → still no slides key
    expect(fc.content['hero-xyz'].elements.slides).toBeUndefined();
  });

  it('NEVER overwrites user-edited slides (hero already has slides → no-op)', () => {
    // TWO covered groups so the ≥2 stamp guard is NOT what makes this pass — the
    // no-clobber rule is (with one group the derive would be skipped anyway and
    // this case would go vacuous).
    const entries = deriveWorksEntries(
      facts([
        { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [photo(1)] },
        { name: 'Portraits', kind: 'category', price: { mode: 'on-request' }, photos: [photo(3)] },
      ] as any)
    );
    const userSlides = [{ id: 'u1', image: 'https://cdn/mine.jpg' }];
    const fc = fcWithHero(userSlides);
    stampHeroSlides(fc, entries);
    expect(fc.content['hero-xyz'].elements.slides).toEqual(userSlides); // untouched
  });

  it('stamps in-page hero sections too', () => {
    const entries = deriveWorksEntries(
      facts([
        { name: 'A', kind: 'category', price: { mode: 'on-request' }, photos: [photo(1)] },
        { name: 'B', kind: 'category', price: { mode: 'on-request' }, photos: [photo(2)] },
      ] as any)
    );
    const fc: any = { content: {}, pages: { 'page-home': { content: { 'hero-p': { id: 'hero-p', elements: {} } } } } };
    stampHeroSlides(fc, entries);
    expect(fc.pages['page-home'].content['hero-p'].elements.slides).toHaveLength(2);
  });
});
