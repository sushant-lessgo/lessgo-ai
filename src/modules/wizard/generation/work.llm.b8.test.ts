// src/modules/wizard/generation/work.llm.b8.test.ts
// B8 (qa-0719) follow-up — WORK LLM fan-out upfront credit gate.
//
// The WORK engine (atelier: photo upload, dream-client, per-service pricing) is
// charged across MULTIPLE routes: /api/audience/work/strategy (STRATEGY_GENERATION)
// then /api/audience/work/generate-copy per page (GENERATE_COPY × pages). Before
// the fix a partial balance sat through the slow strategy call + charge, then
// failed mid-fan-out. The gate checks the balance ONCE against the whole-run
// cost — the work sitemap (input.pages) is KNOWN upfront, so the estimate is
// EXACT (no mid-fan-out gap for a fresh single run).
//
// These assertions FAIL on pre-fix code (no balance call; strategy fires
// regardless of balance) and PASS after.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { runWorkLLMGeneration } from './work.llm';
import type { WorkGenerationInput } from './work';

const STRATEGY_URL = '/api/audience/work/strategy';
const COPY_URL = '/api/audience/work/generate-copy';
const BALANCE_URL = '/api/credits/balance';

/**
 * fetch stub: loadDraft → non-resumable; balance → `balance`; work strategy →
 * a soft 500 (proves the call fired without needing a full fan-out fixture).
 */
function stubFetch(balance: number | null, urls: string[]) {
  const spy = vi.fn(async (url: string) => {
    urls.push(url);
    if (url.includes('/api/loadDraft')) {
      return { ok: true, json: async () => ({}) } as any; // not resumable
    }
    if (url.includes(BALANCE_URL)) {
      return {
        ok: true,
        json: async () => (balance === null ? {} : { totalAvailable: balance }),
      } as any;
    }
    if (url.includes(STRATEGY_URL)) {
      // 500 (not 402) ⇒ the adapter throws→returns status:'error'; the CALL still
      // counts, which is all the sufficient-balance case needs to prove.
      return { ok: false, status: 500, json: async () => ({ error: 'ai_error' }) } as any;
    }
    return { ok: true, json: async () => ({}) } as any;
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function baseWorkInput(over: Partial<WorkGenerationInput> = {}): WorkGenerationInput {
  return {
    tokenId: 'tok-work',
    templateId: 'atelier',
    writerName: 'Kundius',
    oneLiner: 'Portrait photographer',
    works: [],
    // Confirmed sitemap (2 pages) — seeded chargeless from the archetype menu.
    pages: [
      { archetypeKey: 'home', title: 'Home', pathSlug: '/', sections: ['hero'] },
      { archetypeKey: 'work', title: 'Work', pathSlug: '/work', sections: ['work'] },
    ] as any,
    brief: { facts: {} } as any,
    strategy: null,
    ...over,
  };
}

const has = (urls: string[], frag: string) => urls.some((u) => u.includes(frag));

describe('B8 (work) — runWorkLLMGeneration upfront credit gate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('INSUFFICIENT balance (1 < 8 for 2 pages): blocks BEFORE any strategy/copy call', async () => {
    const urls: string[] = [];
    stubFetch(1, urls); // full cost = 2 + 3×2 = 8

    const result = await runWorkLLMGeneration(baseWorkInput());

    expect(result.status).toBe('credits');
    expect(has(urls, BALANCE_URL)).toBe(true); // checked once upfront
    expect(has(urls, STRATEGY_URL)).toBe(false); // NO slow/charged strategy call
    expect(has(urls, COPY_URL)).toBe(false);
  });

  it('SUFFICIENT balance (999 ≥ 8): proceeds to the work strategy call (not an inert always-block)', async () => {
    const urls: string[] = [];
    stubFetch(999, urls);

    const result = await runWorkLLMGeneration(baseWorkInput());

    expect(has(urls, BALANCE_URL)).toBe(true);
    expect(has(urls, STRATEGY_URL)).toBe(true); // gate let generation proceed
    expect(result.status).not.toBe('credits');
  });

  it('balance-endpoint hiccup (no totalAvailable) does NOT block — per-route 402 is the backstop', async () => {
    const urls: string[] = [];
    stubFetch(null, urls);

    await runWorkLLMGeneration(baseWorkInput());

    expect(has(urls, STRATEGY_URL)).toBe(true);
  });
});
