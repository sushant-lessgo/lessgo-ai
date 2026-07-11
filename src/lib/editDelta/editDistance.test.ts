import { describe, it, expect } from 'vitest';
import { editDistance } from './editDistance';

describe('editDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(editDistance('', '')).toBe(0);
    expect(editDistance('hello world', 'hello world')).toBe(0);
  });

  it('handles empty vs non-empty (pure insert/delete)', () => {
    expect(editDistance('', 'abc')).toBe(3);
    expect(editDistance('abc', '')).toBe(3);
  });

  it('counts single insert', () => {
    expect(editDistance('cat', 'cart')).toBe(1);
  });

  it('counts single delete', () => {
    expect(editDistance('cart', 'cat')).toBe(1);
  });

  it('counts single replace', () => {
    expect(editDistance('cat', 'cot')).toBe(1);
  });

  it('classic kitten/sitting = 3', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3);
  });

  it('is symmetric', () => {
    expect(editDistance('flaw', 'lawn')).toBe(editDistance('lawn', 'flaw'));
  });

  it('handles unicode / multi-byte characters', () => {
    expect(editDistance('café', 'cafe')).toBe(1);
    expect(editDistance('naïve', 'naïve')).toBe(0);
    expect(editDistance('🚀', '🚀')).toBe(0);
    // '😀' and '😁' are distinct code units → non-zero distance
    expect(editDistance('a😀b', 'a😁b')).toBeGreaterThan(0);
  });

  describe('>2000-char cap path', () => {
    it('identical long strings still short-circuit to 0', () => {
      const s = 'x'.repeat(5000);
      expect(editDistance(s, s)).toBe(0);
    });

    it('adds abs(lengthDiff) for the tail beyond the cap', () => {
      // Identical first 2000 chars, then different-length tails.
      const base = 'a'.repeat(2000);
      const a = base + 'a'.repeat(500); // len 2500
      const b = base + 'a'.repeat(300); // len 2300
      // First 2000 identical → DP cost 0; tail diff = |2500-2300| = 200.
      expect(editDistance(a, b)).toBe(200);
    });

    it('combines capped DP cost with tail length diff', () => {
      // First 2000 chars differ in exactly one position → DP cost 1.
      const a = 'b' + 'a'.repeat(1999) + 'a'.repeat(600); // len 2600
      const b = 'c' + 'a'.repeat(1999) + 'a'.repeat(400); // len 2400
      // capped DP over first 2000: one replace = 1; tail diff = |2600-2400| = 200.
      expect(editDistance(a, b)).toBe(201);
    });

    it('one side over cap, other under', () => {
      const a = 'a'.repeat(3000);
      const b = 'a'.repeat(1500);
      // capA=2000 'a', capB=1500 'a' → DP = 500 deletes; tail = |3000-1500| = 1500.
      expect(editDistance(a, b)).toBe(2000);
    });
  });
});
