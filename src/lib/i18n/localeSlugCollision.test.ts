import { describe, it, expect } from 'vitest';
import { findLocaleSubpageCollision } from './localeSlugCollision';
import type { LocaleConfig } from '@/types/core/content';

const cfg = (locales: string[], defaultLocale = 'en'): LocaleConfig => ({
  locales,
  defaultLocale,
});

describe('findLocaleSubpageCollision', () => {
  it('returns null for single-locale / absent config (no new rejection — back-compat)', () => {
    expect(findLocaleSubpageCollision(['/nl', '/about'], null)).toBeNull();
    expect(findLocaleSubpageCollision(['/nl'], undefined)).toBeNull();
    expect(findLocaleSubpageCollision(['/nl'], cfg(['en']))).toBeNull();
  });

  it('rejects a subpage slug equal to a declared non-default locale code', () => {
    expect(findLocaleSubpageCollision(['/about', '/nl'], cfg(['en', 'nl']))).toBe('nl');
    expect(findLocaleSubpageCollision(['nl'], cfg(['en', 'nl']))).toBe('nl');
  });

  it('collides on the FIRST path segment (nested subpage under a locale code)', () => {
    expect(findLocaleSubpageCollision(['/nl/pricing'], cfg(['en', 'nl']))).toBe('nl');
  });

  it('is case-insensitive', () => {
    expect(findLocaleSubpageCollision(['/NL'], cfg(['en', 'nl']))).toBe('nl');
    expect(findLocaleSubpageCollision(['/nl'], cfg(['en', 'NL']))).toBe('nl');
  });

  it('does NOT reject a subpage equal to the DEFAULT locale (default emits no /{loc} route)', () => {
    expect(findLocaleSubpageCollision(['/en'], cfg(['en', 'nl'], 'en'))).toBeNull();
  });

  it('allows non-colliding subpage slugs', () => {
    expect(findLocaleSubpageCollision(['/about', '/pricing', '/contact'], cfg(['en', 'nl']))).toBeNull();
  });

  it('returns the first colliding segment when multiple locales are declared', () => {
    const c = cfg(['en', 'nl', 'de']);
    expect(findLocaleSubpageCollision(['/about', '/de', '/nl'], c)).toBe('de');
  });
});
