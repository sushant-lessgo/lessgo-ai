// Phase 2 (collections-entry-capture / F19): route-level proof that the SINGLE
// entry AI call both classifies AND extracts collections.
//
// The real first-touch entry has NO businessType in the request, so the schema
// must be extended with the UNION of every engine's enrichment (built from the
// registry) and the fold engine resolved in-code AFTER the one call. This test
// pins:
//   (a) EXACTLY ONE generateWithSchema call per entry request (both routes);
//   (b) no-businessType → union `collections` shape in the schema handed to the
//       AI, and mocked collections.products → briefDraft.facts.collections.products
//       with CODE-DERIVED slugs;
//   (c) foreign-key discard — saas (thing) classification + AI-returned
//       collections.works → works absent from the Brief;
//   (d) explicit businessType:'manufacturer' → engine-only schema (products, NOT
//       the union-only services/case-studies/works keys), behavior unchanged;
//   (e) understand route — agency (trust) classification → collections.services
//       folds, collections.products discarded.
//
// Everything external is mocked; the pure brief/extraction/registry stack runs
// for real (that is what derives slugs and drops foreign keys).
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/aiClient', () => ({ generateWithSchema: vi.fn() }));
vi.mock('@/lib/scrape/fetchSite', () => ({
  scrapeSite: vi.fn(),
  ScrapeError: class ScrapeError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));
vi.mock('@/lib/middleware/planCheck', () => ({
  requireAuth: vi.fn(async () => ({ allowed: true, userId: 'user_1' })),
}));
vi.mock('@/lib/creditSystem', () => ({
  checkCredits: vi.fn(async () => ({ allowed: true, remaining: 100, required: 1 })),
  consumeCredits: vi.fn(async () => ({ success: true, remaining: 100 })),
  logUsageEvent: vi.fn(async () => undefined),
  CREDIT_COSTS: { SCRAPE_WEBSITE: 1, UNDERSTAND: 1 },
  UsageEventType: { SCRAPE_WEBSITE: 'SCRAPE_WEBSITE', UNDERSTAND: 'UNDERSTAND' },
}));
vi.mock('@/lib/rateLimit', () => ({ withAIRateLimit: (h: any) => h }));
vi.mock('@/lib/mockMode', () => ({ isDemoMode: () => false }));
vi.mock('@/lib/security', () => ({
  createSecureResponse: (body: any, status = 200) => ({ __body: body, __status: status }),
}));

import { generateWithSchema } from '@/lib/aiClient';
import { scrapeSite } from '@/lib/scrape/fetchSite';
import { checkCredits, consumeCredits, logUsageEvent } from '@/lib/creditSystem';
import { POST as scrapePOST } from './scrape-website/route';
import { POST as understandPOST } from './understand/route';

const ai = generateWithSchema as unknown as ReturnType<typeof vi.fn>;
const scrape = scrapeSite as unknown as ReturnType<typeof vi.fn>;
const checkCreditsMock = checkCredits as unknown as ReturnType<typeof vi.fn>;
const consumeCreditsMock = consumeCredits as unknown as ReturnType<typeof vi.fn>;
const logUsageEventMock = logUsageEvent as unknown as ReturnType<typeof vi.fn>;

function makeReq(body: any) {
  return {
    method: 'POST',
    url: 'http://localhost/api/v2/test',
    headers: { get: () => null },
    json: async () => body,
  } as any;
}

// The schema is the 3rd positional arg to generateWithSchema.
function capturedCollectionKeys(): string[] {
  const schema = ai.mock.calls[0][2] as any;
  const collections = schema.shape.collections;
  return Object.keys(collections.shape);
}

// A complete EntryScrapeData-shaped extract (facts/excerpts included; the route
// strips them). Enum-valued fields mirror the known-valid route fixtures.
function scrapeExtract(over: Record<string, unknown> = {}) {
  return {
    oneLiner: 'Open hardware boards and modules for makers and developers worldwide',
    productName: 'Pine Store',
    categories: ['Single-board computers'],
    audiences: ['Makers', 'Developers'],
    whatItDoes: 'Designs and sells open single-board computers and accessories.',
    features: ['ARM boards', 'Linux support', 'Community'],
    offer: 'Buy now',
    landingGoal: 'buy',
    testimonials: [],
    facts: [],
    excerpts: [],
    businessTypeGuess: 'saas',
    businessTypeConfidence: 0.9,
    category: 'Single-board computers',
    goalIntentGuess: 'book-call',
    tiebreaker: 'none',
    structureHint: 'single',
    designStyleHint: 'bold-performance',
    platformNeeds: 'none',
    summary: 'An open-hardware vendor selling single-board computers and modules.',
    offerings: ['Boards', 'Modules'],
    outcomes: [],
    deliveryModel: 'remote',
    proofAvailable: [],
    socialProfiles: [],
    ...over,
  };
}

// A complete EntrySignals-shaped raw understand extract (testimonials = strings).
function understandRaw(over: Record<string, unknown> = {}) {
  return {
    businessTypeGuess: 'agency',
    businessTypeConfidence: 0.9,
    category: 'Growth marketing',
    goalIntentGuess: 'book-call',
    tiebreaker: 'expertise',
    structureHint: 'single',
    designStyleHint: 'bold-performance',
    platformNeeds: 'none',
    summary: 'A growth marketing agency for SaaS companies.',
    businessName: 'Scale Growth Co',
    offerings: ['Paid social', 'CRO'],
    audiences: ['SaaS founders'],
    categories: ['Growth marketing'],
    outcomes: [],
    deliveryModel: 'remote',
    offer: 'Free audit',
    oneLiner: 'Growth marketing agency that turns paid traffic into booked demos',
    proofAvailable: [],
    socialProfiles: [],
    testimonials: [],
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  scrape.mockResolvedValue({
    combinedText: 'x'.repeat(200),
    pages: [{ url: 'https://example.com' }],
  });
  checkCreditsMock.mockResolvedValue({ allowed: true, remaining: 100, required: 1 });
  consumeCreditsMock.mockResolvedValue({ success: true, remaining: 100 });
  logUsageEventMock.mockResolvedValue(undefined);
});

describe('entry collection capture — scrape-website route', () => {
  it('(a)+(b) one AI call, union schema, saas→products folds with code-derived slugs', async () => {
    ai.mockResolvedValueOnce(
      scrapeExtract({
        businessTypeGuess: 'saas',
        collections: {
          products: [
            { name: 'PineNote Tablet', oneLiner: 'E-ink tablet', imageUrl: '' },
            { name: '', oneLiner: 'dropped — no name', imageUrl: '' },
          ],
          services: [],
          'case-studies': [],
          works: [],
        },
      })
    );

    const res: any = await scrapePOST(makeReq({ url: 'https://example.com' }));

    // (a) exactly one AI call
    expect(ai).toHaveBeenCalledTimes(1);
    // (b) union collections shape reached the AI schema
    expect(capturedCollectionKeys().sort()).toEqual(
      ['case-studies', 'products', 'services', 'works'].sort()
    );

    const collections = res.__body.briefDraft.facts.collections;
    expect(collections.products).toEqual([
      { name: 'PineNote Tablet', slug: 'pinenote-tablet', oneLiner: 'E-ink tablet' },
    ]);
  });

  it('(c) foreign-key discard: saas (thing) but AI returns collections.works → works absent', async () => {
    ai.mockResolvedValueOnce(
      scrapeExtract({
        businessTypeGuess: 'saas',
        collections: {
          products: [],
          services: [],
          'case-studies': [],
          works: [{ name: 'Wedding shoot', oneLiner: '', imageUrl: '' }],
        },
      })
    );

    const res: any = await scrapePOST(makeReq({ url: 'https://example.com' }));

    expect(ai).toHaveBeenCalledTimes(1);
    const collections = res.__body.briefDraft.facts.collections;
    // thing reads only `products`; foreign `works` dropped → no collections at all.
    expect(collections?.works).toBeUndefined();
  });

  it('(d) explicit businessType:manufacturer → engine-only schema (products, no union-only keys)', async () => {
    ai.mockResolvedValueOnce(
      scrapeExtract({
        businessTypeGuess: 'manufacturer',
        collections: { products: [{ name: 'Bracket', oneLiner: '', imageUrl: '' }] },
      })
    );

    const res: any = await scrapePOST(
      makeReq({ url: 'https://example.com', businessType: 'manufacturer' })
    );

    expect(ai).toHaveBeenCalledTimes(1);
    // engine-only extension: manufacturer collections = ['products'] ONLY.
    expect(capturedCollectionKeys()).toEqual(['products']);
    expect(res.__body.briefDraft.facts.collections.products).toEqual([
      { name: 'Bracket', slug: 'bracket' },
    ]);
  });
});

describe('entry collection capture — understand route', () => {
  it('(a)+(e) one AI call, agency (trust) → services fold, products discarded', async () => {
    ai.mockResolvedValueOnce(
      understandRaw({
        businessTypeGuess: 'agency',
        collections: {
          products: [{ name: 'Should not appear', oneLiner: '', imageUrl: '' }],
          services: [{ name: 'CRO Sprint', oneLiner: 'Conversion audit', imageUrl: '' }],
          'case-studies': [],
          works: [],
        },
      })
    );

    const res: any = await understandPOST(makeReq({ oneLiner: 'A growth marketing agency for SaaS' }));

    expect(ai).toHaveBeenCalledTimes(1);
    // union collections shape reached the AI schema on the no-businessType path
    expect(capturedCollectionKeys().sort()).toEqual(
      ['case-studies', 'products', 'services', 'works'].sort()
    );

    const collections = res.__body.briefDraft.facts.collections;
    expect(collections.services).toEqual([
      { name: 'CRO Sprint', slug: 'cro-sprint', oneLiner: 'Conversion audit' },
    ]);
    // trust does not read `products` → discarded.
    expect(collections.products).toBeUndefined();
  });
});

// ── billing-correctness phase 3 (M1): one charging model ────────────────────
// V2 FAMILY. Both entry routes pre-gate the balance AFTER the demo/mock
// short-circuit and BEFORE the scrape + the AI call, then split a failed
// post-work charge two ways (402 genuine insufficiency / 500 charge_failed on a
// lost write race). createSecureResponse is mocked to { __body, __status }.
describe('v2 entry routes — charging model', () => {
  it('scrape-website: no credits ⇒ 402 BEFORE the scrape AND the AI call, attempt ledgered', async () => {
    checkCreditsMock.mockResolvedValue({ allowed: false, remaining: 0, required: 1 });

    const res: any = await scrapePOST(makeReq({ url: 'https://example.com' }));

    expect(res.__status).toBe(402);
    expect(res.__body.error).toBe('insufficient_credits');
    // Neither the network scrape nor the AI call happened; nothing was charged.
    expect(scrape).not.toHaveBeenCalled();
    expect(ai).not.toHaveBeenCalled();
    expect(consumeCreditsMock).not.toHaveBeenCalled();
    // The 0-credit attempt still lands in the ledger.
    expect(logUsageEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, creditsUsed: 0, userId: 'user_1' })
    );
  });

  it('scrape-website: post-work genuine insufficiency ⇒ 402, extract discarded', async () => {
    ai.mockResolvedValueOnce(scrapeExtract());
    consumeCreditsMock.mockResolvedValue({
      success: false,
      remaining: 0,
      error: 'Insufficient credits',
    });

    const res: any = await scrapePOST(makeReq({ url: 'https://example.com' }));

    expect(res.__status).toBe(402);
    expect(res.__body.error).toBe('insufficient_credits');
    expect(res.__body.data).toBeUndefined();
    expect(res.__body.briefDraft).toBeUndefined();
  });

  it('scrape-website: charge_conflict ⇒ 500 charge_failed with NO "credit" in the payload', async () => {
    ai.mockResolvedValueOnce(scrapeExtract());
    consumeCreditsMock.mockResolvedValue({ success: false, remaining: 9, error: 'charge_conflict' });

    const res: any = await scrapePOST(makeReq({ url: 'https://example.com' }));

    expect(res.__status).toBe(500);
    expect(res.__body.error).toBe('charge_failed');
    expect(res.__body.data).toBeUndefined();
    // Client rails match /credit/i → the buy wall. A solvent user must not land there.
    expect(JSON.stringify(res.__body)).not.toMatch(/credit/i);
  });

  it('understand: no credits ⇒ 402 BEFORE the AI call, attempt ledgered', async () => {
    checkCreditsMock.mockResolvedValue({ allowed: false, remaining: 0, required: 1 });

    const res: any = await understandPOST(makeReq({ oneLiner: 'A growth marketing agency for SaaS' }));

    expect(res.__status).toBe(402);
    expect(res.__body.error).toBe('insufficient_credits');
    expect(ai).not.toHaveBeenCalled();
    expect(consumeCreditsMock).not.toHaveBeenCalled();
    expect(logUsageEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, creditsUsed: 0, userId: 'user_1' })
    );
  });

  it('understand: post-AI genuine insufficiency ⇒ 402, signals discarded', async () => {
    ai.mockResolvedValueOnce(understandRaw());
    consumeCreditsMock.mockResolvedValue({
      success: false,
      remaining: 0,
      error: 'Insufficient credits',
    });

    const res: any = await understandPOST(makeReq({ oneLiner: 'A growth marketing agency for SaaS' }));

    expect(res.__status).toBe(402);
    expect(res.__body.error).toBe('insufficient_credits');
    expect(res.__body.data).toBeUndefined();
    expect(res.__body.briefDraft).toBeUndefined();
  });

  it('understand: charge_conflict ⇒ 500 charge_failed with NO "credit" in the payload', async () => {
    ai.mockResolvedValueOnce(understandRaw());
    consumeCreditsMock.mockResolvedValue({ success: false, remaining: 9, error: 'charge_conflict' });

    const res: any = await understandPOST(makeReq({ oneLiner: 'A growth marketing agency for SaaS' }));

    expect(res.__status).toBe(500);
    expect(res.__body.error).toBe('charge_failed');
    expect(res.__body.data).toBeUndefined();
    expect(JSON.stringify(res.__body)).not.toMatch(/credit/i);
  });
});
