import { describe, it, expect } from 'vitest';
import { slugify } from './normalize';

describe('slugify (F28 — single canonical implementation)', () => {
  it('drops removed punctuation without leaving orphan hyphens', () => {
    expect(slugify('Widget & Co.')).toBe('widget-co');
  });

  it('NFKD-decomposes accents and strips combining marks', () => {
    expect(slugify('Café Crème')).toBe('cafe-creme');
  });

  it('collapses a slash-and-space run into a single hyphen', () => {
    expect(slugify('A/B Testing')).toBe('a-b-testing');
  });

  it('collapses repeated separators (no orphan/double hyphens)', () => {
    expect(slugify('Turbine Blades  &  Discs!!')).toBe('turbine-blades-discs');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--Foo--')).toBe('foo');
    expect(slugify('  spaced  ')).toBe('spaced');
    expect(slugify('!!!leading & trailing!!!')).toBe('leading-trailing');
  });

  it('normalizes casing consistently for cache keys', () => {
    expect(slugify('Freelancers')).toBe('freelancers');
    expect(slugify('freelancer')).toBe('freelancer');
  });

  it('yields an empty string when nothing survives', () => {
    expect(slugify('   ')).toBe('');
    expect(slugify('&&&')).toBe('');
  });
});
