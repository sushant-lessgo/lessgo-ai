import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildSearchQuery,
  fetchImagesForSpecs,
  pickBestImage,
  type ImageFetchResult,
} from './fetchImages';
import type { ImageFetchSpec } from './imageSlots';

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic pickBestImage fixture.
//
// Five candidates hand-picked so each of the three scored scenarios has a single
// unambiguous winner with a wide (>25 pt) margin — robust to rounding. Scoring math
// lives in fetchImages.ts (scoreCandidate) and is exercised through pickBestImage.
//   C1 BLUE  (#2f5fe0, cool/light)  → wins light+cool  (base = its own hue)
//   C2 ORANGE(#e8632a, warm/light)  → wins light+warm  (base = its own hue)
//   C3 NAVY  (#1a1a2e, dark/low-sat)→ wins dark+neutral(base = its own hue)
//   C4 LGREEN(#7fbf95) / C5 YGREEN(#a9c46b) are neutral-hue light fillers.
// ─────────────────────────────────────────────────────────────────────────────
function candidateResult(): ImageFetchResult {
  return {
    sectionType: 'industries-abc12345',
    elementKey: 'industries.ind-1.image',
    imageUrl: 'https://dl/blue.jpg',
    candidates: [
      { url: 'https://px/blue',   downloadUrl: 'https://dl/blue.jpg',   avgColor: '#2f5fe0' },
      { url: 'https://px/orange', downloadUrl: 'https://dl/orange.jpg', avgColor: '#e8632a' },
      { url: 'https://px/navy',   downloadUrl: 'https://dl/navy.jpg',   avgColor: '#1a1a2e' },
      { url: 'https://px/lgreen', downloadUrl: 'https://dl/lgreen.jpg', avgColor: '#7fbf95' },
      { url: 'https://px/ygreen', downloadUrl: 'https://dl/ygreen.jpg', avgColor: '#a9c46b' },
    ],
  };
}

describe('pickBestImage (deterministic scoring)', () => {
  it('light/cool palette picks the cool blue candidate', () => {
    expect(pickBestImage(candidateResult(), 'light', 'cool', '#2f5fe0')).toBe(
      'https://dl/blue.jpg'
    );
  });

  it('light/warm palette picks the warm orange candidate', () => {
    expect(pickBestImage(candidateResult(), 'light', 'warm', '#e8632a')).toBe(
      'https://dl/orange.jpg'
    );
  });

  it('dark/neutral palette picks the dark low-saturation navy candidate', () => {
    expect(pickBestImage(candidateResult(), 'dark', 'neutral', '#1a1a2e')).toBe(
      'https://dl/navy.jpg'
    );
  });

  it('falls back to imageUrl passthrough when there are no candidates', () => {
    const empty: ImageFetchResult = {
      sectionType: 's',
      elementKey: 'e',
      imageUrl: 'https://passthru.jpg',
      candidates: [],
    };
    expect(pickBestImage(empty, 'light', 'cool', '#123456')).toBe('https://passthru.jpg');

    const undef: ImageFetchResult = {
      sectionType: 's',
      elementKey: 'e',
      imageUrl: 'https://passthru2.jpg',
    };
    expect(pickBestImage(undef, 'light', 'warm', '#123456')).toBe('https://passthru2.jpg');
  });
});

describe('buildSearchQuery', () => {
  it('composes first 2 categories + modifier + styleKeywords', () => {
    expect(
      buildSearchQuery(['Invoicing', 'Accounting', 'Extra'], 'industry sector', 'clean editorial')
    ).toBe('Invoicing Accounting industry sector clean editorial');
  });

  it('caps the composed query to ~8 words', () => {
    const q = buildSearchQuery(
      ['Manufacturing', 'Steel'],
      'industry sector professional editorial',
      'manufacturing workshop editorial clean industrial teams'
    );
    expect(q.split(/\s+/).length).toBe(8);
    expect(q).toBe('Manufacturing Steel industry sector professional editorial manufacturing workshop');
  });

  it('falls back to business professional when everything is empty', () => {
    expect(buildSearchQuery([], '', undefined)).toBe('business professional');
    expect(buildSearchQuery([], '', '')).toBe('business professional');
  });
});

describe('fetchImagesForSpecs', () => {
  const specs: ImageFetchSpec[] = [
    {
      sectionId: 'industries-abc12345',
      elementPath: 'industries.ind-1.image',
      orientation: 'landscape',
      queryModifier: 'industry sector automotive',
      collectionWrite: { key: 'industries', itemId: 'ind-1', imageField: 'image' },
    },
    {
      sectionId: 'industries-abc12345',
      elementPath: 'industries.ind-2.image',
      orientation: 'landscape',
      queryModifier: 'industry sector aerospace',
    },
  ];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves results keyed by `${sectionId}.${elementPath}` with candidates', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          photos: [
            { url: 'https://px/a', downloadUrl: 'https://dl/a.jpg', avgColor: '#2f5fe0' },
            { url: 'https://px/b', downloadUrl: 'https://dl/b.jpg', avgColor: '#888888' },
          ],
        }),
      })
    );

    const map = await fetchImagesForSpecs(specs, {
      categories: ['Manufacturing'],
      styleKeywords: 'editorial clean',
    });

    expect(map.size).toBe(2);
    const r1 = map.get('industries-abc12345.industries.ind-1.image');
    expect(r1).toBeDefined();
    expect(r1!.candidates?.length).toBe(2);
    expect(r1!.imageUrl).toBe('https://dl/a.jpg');
    expect(map.has('industries-abc12345.industries.ind-2.image')).toBe(true);
  });

  it('swallows non-ok HTTP into { imageUrl: null, error } without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const map = await fetchImagesForSpecs(specs, { categories: ['X'] });
    const r = map.get('industries-abc12345.industries.ind-1.image');
    expect(r!.imageUrl).toBeNull();
    expect(r!.error).toBe('HTTP 503');
  });

  it('swallows fetch rejection (timeout/network) into { imageUrl: null, error } without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('The operation was aborted')));

    await expect(
      fetchImagesForSpecs(specs, { categories: ['X'] })
    ).resolves.toBeInstanceOf(Map);

    const map = await fetchImagesForSpecs(specs, { categories: ['X'] });
    const r = map.get('industries-abc12345.industries.ind-2.image');
    expect(r!.imageUrl).toBeNull();
    expect(r!.error).toBe('The operation was aborted');
  });
});
