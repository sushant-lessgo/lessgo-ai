import { describe, it, expect } from 'vitest';
import {
  resolveLocaleElements,
  getEffectiveElementValue,
  isMultiLocale,
  SUPPORTED_LOCALES,
} from './localeContent';
import type { SectionData, LocaleContentOverlay } from '@/types/core/content';

// Minimal SectionData builder — only `elements` matters for the resolver; the
// rest is cast-filled so we don't couple tests to unrelated metadata shapes.
function section(id: string, elements: Record<string, any>): SectionData {
  return { id, layout: 'x', elements } as SectionData;
}

// Deep-freeze a base fixture so ANY mutation attempt throws (proves purity).
function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    Object.values(obj as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(obj);
  }
  return obj;
}

describe('resolveLocaleElements (D1 overlay-over-base)', () => {
  it('overlay value wins; absent key falls back to base', () => {
    const base = { hero: section('hero', { headline: 'Hello', sub: 'Base sub' }) };
    const overlay: LocaleContentOverlay = { nl: { hero: { headline: 'Hallo' } } };

    const out = resolveLocaleElements(base, overlay, 'nl');

    expect(out.hero.elements.headline).toBe('Hallo'); // overlay wins
    expect(out.hero.elements.sub).toBe('Base sub'); // absent → base fallback
  });

  it('returns base untouched when overlay is undefined (legacy input)', () => {
    const base = { hero: section('hero', { headline: 'Hello' }) };
    const out = resolveLocaleElements(base, undefined, undefined);
    expect(out).toBe(base); // referentially identical — nothing to merge
  });

  it('returns base untouched when locale has no overlay entry', () => {
    const base = { hero: section('hero', { headline: 'Hello' }) };
    const overlay: LocaleContentOverlay = { nl: { hero: { headline: 'Hallo' } } };
    const out = resolveLocaleElements(base, overlay, 'fr'); // fr not in overlay
    expect(out).toBe(base);
  });

  it('never mutates base (deep-frozen fixture survives merge)', () => {
    const base = deepFreeze({
      hero: section('hero', { headline: 'Hello', bullets: ['a', 'b'] }),
    });
    const before = JSON.parse(JSON.stringify(base));
    const overlay: LocaleContentOverlay = {
      nl: { hero: { headline: 'Hallo', bullets: ['x', 'y'] } },
    };

    const out = resolveLocaleElements(base, overlay, 'nl');

    // Base unchanged (deep-equal to its snapshot); output carries overlay values.
    expect(base).toEqual(before);
    expect(out.hero.elements.headline).toBe('Hallo');
    expect(out.hero.elements.bullets).toEqual(['x', 'y']);
    expect(out).not.toBe(base);
    expect(out.hero).not.toBe(base.hero);
  });

  it('handles string[] values (list elements)', () => {
    const base = { faq: section('faq', { questions: ['Q1', 'Q2'] }) };
    const overlay: LocaleContentOverlay = { nl: { faq: { questions: ['V1', 'V2', 'V3'] } } };
    const out = resolveLocaleElements(base, overlay, 'nl');
    expect(out.faq.elements.questions).toEqual(['V1', 'V2', 'V3']);
  });

  it('passes nested V2 collection values through untouched when not overlaid', () => {
    const gallery = [{ id: '1', src: '/a.jpg', tag: 'Sunset' }];
    const base = { media: section('media', { title: 'Gallery', images: gallery }) };
    const overlay: LocaleContentOverlay = { nl: { media: { title: 'Galerij' } } };

    const out = resolveLocaleElements(base, overlay, 'nl');

    expect(out.media.elements.title).toBe('Galerij'); // text overlaid
    expect(out.media.elements.images).toBe(gallery); // collection passed by ref, untouched
  });

  it('leaves sections without an overlay entry as the same reference', () => {
    const base = {
      hero: section('hero', { headline: 'Hello' }),
      cta: section('cta', { label: 'Sign up' }),
    };
    const overlay: LocaleContentOverlay = { nl: { hero: { headline: 'Hallo' } } };
    const out = resolveLocaleElements(base, overlay, 'nl');
    expect(out.cta).toBe(base.cta); // untouched section keeps its reference
    expect(out.hero).not.toBe(base.hero);
  });
});

describe('getEffectiveElementValue', () => {
  const base = { hero: section('hero', { headline: 'Hello', sub: 'Base sub' }) };
  const overlay: LocaleContentOverlay = { nl: { hero: { headline: 'Hallo' } } };

  it('returns overlay value when present', () => {
    expect(getEffectiveElementValue(base, overlay, 'nl', 'hero', 'headline')).toBe('Hallo');
  });

  it('falls back to base when overlay key absent', () => {
    expect(getEffectiveElementValue(base, overlay, 'nl', 'hero', 'sub')).toBe('Base sub');
  });

  it('falls back to base when overlay/locale undefined (legacy)', () => {
    expect(getEffectiveElementValue(base, undefined, undefined, 'hero', 'headline')).toBe('Hello');
  });

  it('returns undefined when neither overlay nor base has the key', () => {
    expect(getEffectiveElementValue(base, overlay, 'nl', 'hero', 'missing')).toBeUndefined();
  });
});

describe('isMultiLocale', () => {
  it('false for undefined / single-locale config', () => {
    expect(isMultiLocale(undefined)).toBe(false);
    expect(isMultiLocale({ locales: ['en'], defaultLocale: 'en' })).toBe(false);
  });

  it('true when more than one locale declared', () => {
    expect(isMultiLocale({ locales: ['en', 'nl'], defaultLocale: 'en' })).toBe(true);
  });
});

describe('SUPPORTED_LOCALES', () => {
  it('is en (default, first) + 11 coverage-100 languages', () => {
    expect(SUPPORTED_LOCALES[0]).toBe('en');
    expect(SUPPORTED_LOCALES).toEqual(['en', 'ja', 'es', 'pt', 'fr', 'it', 'id', 'nl', 'th', 'vi', 'de', 'pl']);
    expect(new Set(SUPPORTED_LOCALES).size).toBe(SUPPORTED_LOCALES.length); // no dupes
  });
});
