// src/modules/generation/spread.test.ts
// template-factory phase 10 — deterministic generation spread.
//
// Two properties per pick point: DETERMINISM (same token → same result) and
// SPREAD (distinct tokens vary). The headline acceptance is the combined
// starting-tuple distribution over 10 tokens for the hearth + meridian fixtures.

import { describe, it, expect } from 'vitest';
import { hashToken, makeRng, seededIndex, pickSeeded, seedFor } from './spread';
import { selectEligibleBlock } from './blockEligibility';
import { templateMeta } from '@/modules/templates/templateMeta';
import { meridianPalettes } from '@/types/product';

// Ten distinct, realistic-looking project tokens.
const TOKENS = Array.from({ length: 10 }, (_, i) => `proj-token-${i}-${(i * 7 + 3).toString(36)}`);

describe('hashToken / makeRng — deterministic primitives', () => {
  it('hashToken is stable + pure (no Math.random)', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
    expect(hashToken('')).toBeTypeOf('number');
  });

  it('makeRng reproduces its sequence from the same seed', () => {
    const a = makeRng(12345);
    const b = makeRng(12345);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
    seqA.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    });
  });

  it('seedFor namespaces by salt (independent draws from one token)', () => {
    expect(seedFor('tok', 'palette')).not.toBe(seedFor('tok', 'look'));
    expect(seedFor('tok', 'palette')).toBe(seedFor('tok', 'palette'));
  });
});

describe('pickSeeded / seededIndex', () => {
  const items = ['a', 'b', 'c', 'd', 'e'] as const;

  it('empty / absent list ⇒ undefined; seededIndex ⇒ -1', () => {
    expect(pickSeeded([], 'tok')).toBeUndefined();
    expect(pickSeeded(undefined, 'tok')).toBeUndefined();
    expect(seededIndex(0, 'tok')).toBe(-1);
  });

  it('same (items, token, salt) ⇒ identical pick', () => {
    expect(pickSeeded(items, 'tok', 'palette')).toBe(pickSeeded(items, 'tok', 'palette'));
  });

  it('index is always in range', () => {
    for (const t of TOKENS) {
      const idx = seededIndex(items.length, t, 'palette');
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(items.length);
    }
  });

  it('SPREAD: 10 tokens over a 5-item list yield ≥3 distinct picks', () => {
    const seen = new Set(TOKENS.map((t) => pickSeeded(items, t, 'palette')));
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});

// ── the phase-10 acceptance: starting-tuple distribution + determinism ───────

/** Mirror of the generation-side spread points as a pure fixture:
 *  meridian palette (b) + meridian features block (a) + hearth look (c). */
function startingTuple(token: string): { palette: string; heroBlock: string; look: string } {
  const palette = pickSeeded(meridianPalettes, token, 'palette')!;
  // A co-eligible meridian block-variant section (features) — spreads by seed.
  const heroBlock = selectEligibleBlock('meridian', 'features', { seed: token })!;
  const looks = templateMeta.hearth.looks!;
  const look = pickSeeded(looks, token, 'look')!.id;
  return { palette, heroBlock, look };
}

describe('generation spread — starting tuple (hearth + meridian fixtures)', () => {
  it('DETERMINISM: same token twice ⇒ identical tuple', () => {
    for (const t of TOKENS) {
      expect(startingTuple(t)).toEqual(startingTuple(t));
    }
  });

  it('SPREAD: 10 distinct tokens ⇒ ≥7 distinct (palette, look, block) tuples', () => {
    const tuples = TOKENS.map((t) => JSON.stringify(startingTuple(t)));
    const distinct = new Set(tuples);
    expect(distinct.size).toBeGreaterThanOrEqual(7);
  });

  it('every tuple field is a REAL id (valid starting selection)', () => {
    const lookIds = new Set(templateMeta.hearth.looks!.map((l) => l.id));
    for (const t of TOKENS) {
      const { palette, heroBlock, look } = startingTuple(t);
      expect(meridianPalettes).toContain(palette as (typeof meridianPalettes)[number]);
      expect(['HairlineFeatureGrid', 'LedgerFeatureList']).toContain(heroBlock);
      expect(lookIds.has(look)).toBe(true);
    }
  });
});
