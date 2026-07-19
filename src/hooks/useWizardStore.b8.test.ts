// src/hooks/useWizardStore.b8.test.ts
// B8 (qa-0719) — UPFRONT full-run credit gate.
//
// The out-of-credits path during first generation used to be SLOW + dead-end:
// a partial balance passed the strategy pre-gate, sat through the slow strategy
// AI call + a 2-credit charge, THEN hit the copy gate mid-pipeline ("we
// couldn't build your site — out of credits"). The fix checks the balance ONCE
// at the earliest generation trigger (fetchStrategy) against the WHOLE run cost
// (STRATEGY_GENERATION + GENERATE_COPY×pages = 5 for a single page) and blocks
// INSTANTLY with zero partial charge.
//
// These assertions FAIL on pre-fix code (no balance call; strategy fires
// regardless of balance) and PASS after.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Brief } from '@/types/brief';
import { useWizardStore } from './useWizardStore';
import { estimateFullRunCost } from '@/lib/creditRunGate';
import type { ProductStrategyOutput } from '@/types/product';

const MOCK_STRATEGY: ProductStrategyOutput = {
  awareness: 'solution-aware-skeptical',
  oneReader: { personaDescription: 'p', pain: ['a'], desire: ['b'], objections: ['c'] },
  oneIdea: { bigBenefit: 'x', uniqueMechanism: 'y', reasonToBelieve: 'z' },
  featureAnalysis: [{ feature: 'f', benefit: 'b', benefitOfBenefit: 'bb' }],
  sections: ['header', 'hero', 'features', 'footer'],
  uiblocks: {
    header: 'MeridianHeader',
    hero: 'MeridianHero',
    features: 'MeridianFeatures',
    footer: 'MeridianFooter',
  },
} as unknown as ProductStrategyOutput;

function briefWithEntry(entry: Record<string, unknown>, extra: Partial<Brief> = {}): Brief {
  return { facts: { entry }, ...extra } as Brief;
}

const thingBrief = briefWithEntry(
  {
    rawInput: 'https://acme.app',
    businessName: 'Acme Invoicing',
    oneLiner: 'Invoicing software for freelancers that auto-chases late payments',
    audiences: ['freelance designers'],
    offerings: ['auto-chase'],
    offer: 'Free 14-day trial',
  },
  { businessType: 'saas', copyEngine: 'thing', confidence: 0.9 },
);

/** fetch stub: balance route returns `balance`; strategy route returns a strategy. */
function stubFetch(balance: number | null, urls: string[]) {
  const spy = vi.fn(async (url: string) => {
    urls.push(url);
    if (url.includes('/api/credits/balance')) {
      return {
        ok: true,
        json: async () => (balance === null ? {} : { totalAvailable: balance }),
      } as any;
    }
    if (url.includes('/api/audience/product/strategy')) {
      return { ok: true, json: async () => ({ success: true, data: MOCK_STRATEGY }) } as any;
    }
    return { ok: true, json: async () => ({}) } as any;
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

const hasStrategyCall = (urls: string[]) =>
  urls.some((u) => u.includes('/api/audience/product/strategy'));
const hasCopyCall = (urls: string[]) =>
  urls.some((u) => u.includes('/api/audience/product/generate-copy'));
const hasBalanceCall = (urls: string[]) => urls.some((u) => u.includes('/api/credits/balance'));

describe('B8 — upfront full-run credit gate (fetchStrategy)', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
    useWizardStore
      .getState()
      .hydrate({ tokenId: 'tok123', brief: thingBrief, audienceType: 'product', templateId: 'meridian' });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('single-page full-run cost is 5 (strategy 2 + copy 3×1)', () => {
    expect(estimateFullRunCost(1)).toBe(5);
    expect(estimateFullRunCost(3)).toBe(11); // 2 + 3×3
  });

  it('INSUFFICIENT balance (1 < 5): blocks BEFORE any strategy/copy call, shows credits error', async () => {
    const urls: string[] = [];
    stubFetch(1, urls);

    await useWizardStore.getState().fetchStrategy();

    expect(hasBalanceCall(urls)).toBe(true); // checked the balance ONCE upfront
    expect(hasStrategyCall(urls)).toBe(false); // NO slow/charged strategy call
    expect(hasCopyCall(urls)).toBe(false);

    const s = useWizardStore.getState();
    expect(s.strategyStatus).toBe('error');
    expect(s.strategyCreditsError).toBe(true);
    expect(s.strategy).toBeNull();
  });

  it('SUFFICIENT balance (999 ≥ 5): proceeds to the strategy call (not an inert always-block)', async () => {
    const urls: string[] = [];
    stubFetch(999, urls);

    await useWizardStore.getState().fetchStrategy();

    expect(hasBalanceCall(urls)).toBe(true);
    expect(hasStrategyCall(urls)).toBe(true); // generation proceeds exactly as before
    expect(useWizardStore.getState().strategyCreditsError).toBe(false);
  });

  it('balance-endpoint hiccup (no totalAvailable) does NOT block — per-route gate is the backstop', async () => {
    const urls: string[] = [];
    stubFetch(null, urls);

    await useWizardStore.getState().fetchStrategy();

    expect(hasStrategyCall(urls)).toBe(true);
  });
});
