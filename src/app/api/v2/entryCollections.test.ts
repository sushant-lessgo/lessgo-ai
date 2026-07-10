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
  consumeCredits: vi.fn(async () => ({ success: true, remaining: 100 })),
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
import { POST as scrapePOST } from './scrape-website/route';
import { POST as understandPOST } from './understand/route';

const ai = generateWithSchema as unknown as ReturnType<typeof vi.fn>;
const scrape = scrapeSite as unknown as ReturnType<typeof vi.fn>;

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
