// src/modules/audience/work/pricePosition.test.ts
import { describe, it, expect } from 'vitest';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import { derivePricePosition } from './pricePosition';

/**
 * A Kundius-shaped PREMIUM fixture (minimal inline): established studio, higher /
 * on-request prices, a discerning dream client. Phase 4's full Kundius fixture
 * MUST keep classifying as `'premium'` (plan N1 — the pilot voice depends on it).
 */
const kundiusPremium: WorkFacts = {
  identity: { name: 'Studio Kundius', location: 'Amsterdam' },
  establishment: 'established',
  dreamClient: 'Discerning couples who value editorial, timeless imagery',
  praise: ['Impeccable, refined work — worth every euro.'],
  languages: ['en'],
  groups: [
    { name: 'Weddings', kind: 'category', price: { mode: 'from', amount: 4500, currency: 'EUR' } },
    { name: 'Editorial', kind: 'story', price: { mode: 'on-request' } },
  ],
};

describe('derivePricePosition', () => {
  it('classifies a Kundius-shaped premium studio as "premium" (not the middle default)', () => {
    const result = derivePricePosition(kundiusPremium);
    expect(result).toBe('premium');
    expect(result).not.toBe('middle');
  });

  it('classifies an accessible/affordable seller as "friendly"', () => {
    const friendly: WorkFacts = {
      dreamClient: 'Affordable family portraits for local families',
      groups: [
        { name: 'Family', kind: 'category', price: { mode: 'from', amount: 150, currency: 'EUR' } },
        { name: 'Kids', kind: 'category', price: { mode: 'from', amount: 120, currency: 'EUR' } },
      ],
    };
    expect(derivePricePosition(friendly)).toBe('friendly');
  });

  it('defaults to "middle" for thin/ambiguous facts', () => {
    const mid: WorkFacts = {
      groups: [
        { name: 'Portraits', kind: 'category', price: { mode: 'exact', amount: 800, currency: 'EUR' } },
      ],
    };
    expect(derivePricePosition(mid)).toBe('middle');
  });

  it('stays "middle" for on-request-only pricing with no other signal (conservative)', () => {
    const onRequestOnly: WorkFacts = {
      groups: [
        { name: 'Commissions', kind: 'category', price: { mode: 'on-request' } },
        { name: 'Editorial', kind: 'story', price: { mode: 'on-request' } },
      ],
    };
    expect(derivePricePosition(onRequestOnly)).toBe('middle');
  });

  it('handles missing amounts without throwing (all on-request, no keywords)', () => {
    const missingAmounts: WorkFacts = {
      groups: [{ name: 'Work', kind: 'category', price: { mode: 'on-request' } }],
    };
    expect(() => derivePricePosition(missingAmounts)).not.toThrow();
    expect(derivePricePosition(missingAmounts)).toBe('middle');
  });

  it('returns the middle default for null/empty facts', () => {
    expect(derivePricePosition(null)).toBe('middle');
    expect(derivePricePosition(undefined)).toBe('middle');
    expect(derivePricePosition({})).toBe('middle');
  });

  it('lets a premium dream client tip on-request pricing to premium', () => {
    const premiumConcealed: WorkFacts = {
      dreamClient: 'High-end, exclusive brands seeking bespoke editorial work',
      groups: [{ name: 'Editorial', kind: 'story', price: { mode: 'on-request' } }],
    };
    expect(derivePricePosition(premiumConcealed)).toBe('premium');
  });
});
