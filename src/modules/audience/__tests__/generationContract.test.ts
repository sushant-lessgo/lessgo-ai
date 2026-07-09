// Generation contract: the P0 "no broken/empty page" guard.
//
// scale-06 phase 11 — the product + service fixtures now run through the ONE
// unified engine (`runGeneration`, the phase-5 dispatch) instead of the old
// per-audience module paths, and a WRITER fixture is added:
//  - THING  → runGeneration('thing')  → product strategy/copy routes
//  - TRUST  → runGeneration('trust')  → service strategy/copy routes
//  - WORK   → runGeneration('work')   → deterministic Granth path (no LLM)
//
// The adapters call the audience routes over `fetch`; a FAITHFUL fetch mock
// stands in for those routes by invoking the SAME mock generator + processing
// pipeline the routes run (generateMock*Strategy → generateMock*Copy →
// process*Copy). So the copy that flows into the assembled finalContent is the
// REAL processed content, and the schema guard keeps its teeth — it just now
// travels through the unified engine. The saved finalContent is captured from
// the /api/saveDraft body so we can assert every routed uiblock is covered.
//
// Runs two ways:
//  - MOCK (always): the faithful-route path above — zero network/credits.
//  - GOLDEN (when present): validates frozen real-LLM captures in
//    e2e/fixtures/generated/*.json (produced by scripts/captureGenerationFixture).
//    Skipped cleanly when no captures exist yet.

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { validateGeneratedContent } from './contentValidator';
import { serviceElementSchema } from '@/modules/audience/service/elementSchema';
import { meridianElementSchema } from '@/modules/audience/product/elementSchema';
import {
  generateMockServiceStrategy,
  generateMockServiceCopy,
} from '@/modules/prompt/mockResponseGeneratorService';
import {
  generateMockMeridianStrategy,
  generateMockMeridianCopy,
} from '@/modules/prompt/mockResponseGeneratorProduct';
import { processServiceCopy } from '@/modules/audience/service/parseCopy';
import { processProductCopy } from '@/modules/audience/product/parseCopy';
import { runGeneration } from '@/modules/wizard/generation';
import type { ThingGenerationInput } from '@/modules/wizard/generation/thing';
import type { TrustGenerationInput } from '@/modules/wizard/generation/trust';
import type { WorkGenerationInput } from '@/modules/wizard/generation/work';

/** Recursively assert every object with an `id` field has a non-empty one. */
function assertIdsBackfilled(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(assertIdsBackfilled);
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if ('id' in obj) expect(obj.id, `empty id on ${JSON.stringify(obj).slice(0, 60)}`).toBeTruthy();
    Object.values(obj).forEach(assertIdsBackfilled);
  }
}

/** True if the assembled finalContent carries a section for every routed type. */
function coversEverySection(finalContent: any, sectionTypes: string[]): boolean {
  const ids = Object.keys(finalContent?.content ?? {});
  return sectionTypes.every((type) => ids.some((id) => id.startsWith(`${type}-`)));
}

const SCHEMAS = {
  service: serviceElementSchema,
  product: meridianElementSchema,
} as const;

// ---------------------------------------------------------------------------
// Faithful route mocks — reproduce the audience routes' internals so the copy
// that reaches the unified engine is REAL processed content (schema-checkable).
// ---------------------------------------------------------------------------

interface Captured {
  uiblocks?: Record<string, string>;
  sections?: string[];
  processed?: Record<string, any>;
  finalContent?: any;
}

function stubProductFetch(cap: Captured) {
  return vi.fn(async (url: string, init?: any) => {
    const body = init?.body ? JSON.parse(init.body) : {};
    if (url.includes('/api/loadDraft')) {
      return { ok: true, json: async () => ({}) } as any; // not resumable
    }
    if (url.includes('/api/audience/product/strategy')) {
      const strategy = generateMockMeridianStrategy({
        productName: body.productName,
        oneLiner: body.oneLiner,
        features: body.features,
        primaryAudience: body.primaryAudience,
        templateId: body.templateId,
        proof: body.proof,
      });
      cap.uiblocks = strategy.uiblocks;
      cap.sections = strategy.sections;
      return { ok: true, json: async () => ({ success: true, data: strategy }) } as any;
    }
    if (url.includes('/api/audience/product/generate-copy')) {
      const raw = generateMockMeridianCopy({
        strategy: body.strategy,
        uiblocks: body.uiblocks,
        productName: body.productName,
        oneLiner: body.oneLiner,
        offer: body.offer,
      });
      const processed = processProductCopy(raw, body.uiblocks);
      cap.processed = processed;
      return { ok: true, json: async () => ({ success: true, sections: processed }) } as any;
    }
    if (url.includes('/api/saveDraft')) {
      cap.finalContent = body.finalContent;
      return { ok: true, json: async () => ({}) } as any;
    }
    return { ok: false, status: 500, json: async () => ({ error: `unexpected ${url}` }) } as any;
  });
}

function stubServiceFetch(cap: Captured) {
  return vi.fn(async (url: string, init?: any) => {
    const body = init?.body ? JSON.parse(init.body) : {};
    if (url.includes('/api/audience/service/strategy')) {
      const strategy = generateMockServiceStrategy({
        oneLiner: body.oneLiner,
        understanding: body.understanding,
        goal: body.goal,
        offer: body.offer,
        assets: body.assets,
        templateId: body.templateId,
      });
      cap.uiblocks = strategy.uiblocks;
      cap.sections = strategy.sections;
      return { ok: true, json: async () => ({ success: true, data: strategy }) } as any;
    }
    if (url.includes('/api/audience/service/generate-copy')) {
      const raw = generateMockServiceCopy({
        strategy: body.strategy,
        uiblocks: body.uiblocks,
        oneLiner: body.oneLiner,
        offer: body.offer,
      });
      const processed = processServiceCopy(raw, body.uiblocks);
      cap.processed = processed;
      return { ok: true, json: async () => ({ success: true, sections: processed }) } as any;
    }
    if (url.includes('/api/saveDraft')) {
      cap.finalContent = body.finalContent;
      return { ok: true, json: async () => ({}) } as any;
    }
    return { ok: false, status: 500, json: async () => ({ error: `unexpected ${url}` }) } as any;
  });
}

// ---------------------------------------------------------------------------
// THING (product / Meridian) through the unified engine.
// ---------------------------------------------------------------------------

function thingInput(): ThingGenerationInput {
  return {
    tokenId: 'contract-thing',
    templateId: 'meridian',
    productName: 'Meridian',
    oneLiner: 'A deploy platform for teams that ship daily.',
    features: ['Auto deploys', 'Instant rollbacks', 'Build caching'],
    audiences: ['Staff engineers at fast-shipping startups'],
    categories: [],
    offer: 'Free to start',
    goalIntent: 'signup-free',
    goalParam: {},
    proof: { hasTestimonials: true }, // promised ⇒ keeps the testimonials section
    strategy: null,
    sitemap: null,
  };
}

describe('generation contract — THING via runGeneration (product / Meridian)', () => {
  const cap: Captured = {};
  let status: string;

  beforeAll(async () => {
    vi.stubGlobal('fetch', stubProductFetch(cap));
    const result = await runGeneration('thing', thingInput());
    status = result.status;
  });
  afterAll(() => vi.unstubAllGlobals());

  it('runs green end-to-end (strategy → copy → save)', () => {
    expect(status).toBe('done');
    expect(cap.processed).toBeTruthy();
    expect(cap.finalContent).toBeTruthy();
  });

  it('produces a section for every routed uiblock', () => {
    for (const sectionType of Object.keys(cap.uiblocks!)) {
      expect(cap.processed![sectionType], `missing section ${sectionType}`).toBeTruthy();
    }
  });

  it('every section satisfies its element schema (no broken/empty page)', () => {
    const errors = validateGeneratedContent(cap.processed!, cap.uiblocks!, meridianElementSchema);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  it('backfills collection ids recursively (incl. nested footer links)', () => {
    assertIdsBackfilled(cap.processed);
  });

  it('the assembled finalContent covers every routed section', () => {
    expect(coversEverySection(cap.finalContent, cap.sections!)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TRUST (service / Hearth+Lex) through the unified engine.
// ---------------------------------------------------------------------------

function trustInput(): TrustGenerationInput {
  return {
    tokenId: 'contract-trust',
    templateId: 'hearth',
    businessTypeKey: 'agency',
    businessName: 'North Star Studio',
    oneLiner: 'A six-week brand studio for DTC founders.',
    targetClients: ['DTC founders at $300k-$2M ARR'],
    services: ['Brand identity', 'Packaging', 'Website refresh'],
    process: 'Strategy-first sprints with a single point of contact',
    credentials: 'Multiple DTC brand launches',
    offer: 'Fixed-price brand identity in six weeks',
    outcomes: ['Launch-ready in 4 weeks'],
    goalIntent: 'book-call',
    goalParam: {},
    proof: {
      hasTestimonials: true,
      hasClientLogos: true,
      hasOutcomes: false,
      hasCaseStudies: true,
      hasTeamPhotos: false,
      hasFounderPhoto: true,
      testimonialType: 'text',
    },
  };
}

describe('generation contract — TRUST via runGeneration (service / Hearth+Lex)', () => {
  const cap: Captured = {};
  let status: string;

  beforeAll(async () => {
    vi.stubGlobal('fetch', stubServiceFetch(cap));
    const result = await runGeneration('trust', trustInput());
    status = result.status;
  });
  afterAll(() => vi.unstubAllGlobals());

  it('runs green end-to-end (strategy → copy → save)', () => {
    expect(status).toBe('done');
    expect(cap.processed).toBeTruthy();
    expect(cap.finalContent).toBeTruthy();
  });

  it('produces a section for every routed uiblock', () => {
    for (const sectionType of Object.keys(cap.uiblocks!)) {
      expect(cap.processed![sectionType], `missing section ${sectionType}`).toBeTruthy();
    }
  });

  it('every section satisfies its element schema (no broken/empty page)', () => {
    const errors = validateGeneratedContent(cap.processed!, cap.uiblocks!, serviceElementSchema);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  it('backfills collection ids (no duplicate React keys)', () => {
    assertIdsBackfilled(cap.processed);
  });

  it('the assembled finalContent covers every routed section', () => {
    expect(coversEverySection(cap.finalContent, cap.sections!)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// WORK (writer / Granth) through the unified engine — deterministic, no LLM.
// The work engine skips strategy/copy entirely and builds the fixed Granth
// scaffold; the guard asserts a valid Granth finalContent shape.
// ---------------------------------------------------------------------------

function workFetch(cap: Captured) {
  return vi.fn(async (url: string, init?: any) => {
    const body = init?.body ? JSON.parse(init.body) : {};
    // Load-detection defense: the adapter asserts the persisted template is granth.
    if (url.includes('/api/loadDraft')) {
      return { ok: true, json: async () => ({ templateId: 'granth' }) } as any;
    }
    if (url.includes('/api/saveDraft')) {
      cap.finalContent = body.finalContent;
      return { ok: true, json: async () => ({}) } as any;
    }
    return { ok: false, status: 500, json: async () => ({ error: `unexpected ${url}` }) } as any;
  });
}

const WORK_UPLOADS = [
  'https://cdn.example.com/cover-1.jpg',
  'https://cdn.example.com/cover-2.jpg',
  'https://cdn.example.com/cover-3.jpg',
];

function workInput(): WorkGenerationInput {
  return {
    tokenId: 'contract-work',
    templateId: 'granth',
    writerName: 'Test Poet',
    oneLiner: 'A Hindi poet and essayist',
    works: WORK_UPLOADS,
  };
}

describe('generation contract — WORK via runGeneration (writer / Granth)', () => {
  const cap: Captured = {};
  let status: string;

  beforeAll(async () => {
    vi.stubGlobal('fetch', workFetch(cap));
    const result = await runGeneration('work', workInput());
    status = result.status;
  });
  afterAll(() => vi.unstubAllGlobals());

  it('runs green (deterministic Granth path, no strategy/copy call)', () => {
    expect(status).toBe('done');
    expect(cap.finalContent).toBeTruthy();
  });

  it('produces a valid Granth finalContent shape (6 sections, flat layout+content+meta)', () => {
    const fc = cap.finalContent;
    expect(Array.isArray(fc.layout.sections)).toBe(true);
    expect(fc.layout.sections.length).toBe(6);
    expect(Object.keys(fc.content).length).toBe(6);
    expect(fc.meta?.title).toBe('Test Poet');
    // Every listed section id resolves to a content block with a Granth layout.
    for (const id of fc.layout.sections) {
      expect(fc.content[id], `missing content for ${id}`).toBeTruthy();
      expect(String(fc.content[id].layout)).toMatch(/^Granth/);
    }
  });

  it('threads the wizard work uploads onto the book shelf as covers', () => {
    const fc = cap.finalContent;
    const shelf = Object.values(fc.content as Record<string, any>).find(
      (s: any) => s.layout === 'GranthJacketShelf'
    ) as any;
    expect(shelf, 'no GranthJacketShelf section').toBeTruthy();
    const covers = shelf.elements.items.map((it: any) => it.cover_image);
    for (const url of WORK_UPLOADS) {
      expect(covers).toContain(url);
    }
  });

  it('backfills collection ids (books / facts / quotes / socials)', () => {
    assertIdsBackfilled(cap.finalContent);
  });
});

// ---- Golden real-LLM captures (opt-in, present only after a real capture run) ----
const goldenDir = path.resolve(process.cwd(), 'e2e/fixtures/generated');
const goldenFiles = fs.existsSync(goldenDir)
  ? fs.readdirSync(goldenDir).filter((f) => f.endsWith('.json'))
  : [];

describe.skipIf(goldenFiles.length === 0)('generation contract — GOLDEN real-LLM captures', () => {
  it.each(goldenFiles)('%s satisfies its element schema', (file) => {
    const fixture = JSON.parse(fs.readFileSync(path.join(goldenDir, file), 'utf8'));
    const schema = SCHEMAS[fixture.schema as keyof typeof SCHEMAS];
    expect(schema, `unknown schema "${fixture.schema}" in ${file}`).toBeTruthy();
    const errors = validateGeneratedContent(fixture.sections, fixture.uiblocks, schema);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });
});
