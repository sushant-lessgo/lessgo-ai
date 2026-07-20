import { describe, it, expect } from 'vitest';
import { slugifyName, uniqueSlug, SLUG_FALLBACK, SLUG_MAX_LENGTH } from './slug';
import { SlugSchema } from '@/lib/schemas/collection.schema';

describe('slugifyName', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyName('My Great Books')).toBe('my-great-books');
  });

  it('folds diacritics to ascii', () => {
    expect(slugifyName('Café Crème')).toBe('cafe-creme');
  });

  it('collapses punctuation runs and trims edge hyphens', () => {
    expect(slugifyName('  --Hello,   World!!! ')).toBe('hello-world');
  });

  it('falls back when nothing slugifiable remains', () => {
    expect(slugifyName('???')).toBe(SLUG_FALLBACK);
    expect(slugifyName('')).toBe(SLUG_FALLBACK);
  });

  it('caps length and never leaves a trailing hyphen', () => {
    const long = slugifyName('a'.repeat(40) + ' ' + 'b'.repeat(40));
    expect(long.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(long.endsWith('-')).toBe(false);
  });

  it('always emits a SlugSchema-valid string', () => {
    for (const name of ['Café Crème', '  --Hello, World!!! ', '???', '2026 Q1 Report']) {
      expect(SlugSchema.safeParse(slugifyName(name)).success).toBe(true);
    }
  });
});

describe('uniqueSlug', () => {
  it('returns the base when free', () => {
    expect(uniqueSlug('Books', ['articles'])).toBe('books');
  });

  it('clamps with a numeric suffix on collision', () => {
    expect(uniqueSlug('Books', ['books'])).toBe('books-2');
    expect(uniqueSlug('Books', ['books', 'books-2'])).toBe('books-3');
  });

  it('skips only taken suffixes', () => {
    expect(uniqueSlug('Books', ['books', 'books-3'])).toBe('books-2');
  });

  it('slugifies the base before comparing', () => {
    expect(uniqueSlug('My Books!', ['my-books'])).toBe('my-books-2');
  });

  it('keeps suffixed results inside the length cap', () => {
    const base = 'a'.repeat(SLUG_MAX_LENGTH);
    const taken = [slugifyName(base)];
    const out = uniqueSlug(base, taken);
    expect(out.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(SlugSchema.safeParse(out).success).toBe(true);
  });

  it('handles an empty taken list', () => {
    expect(uniqueSlug('Books')).toBe('books');
  });
});
