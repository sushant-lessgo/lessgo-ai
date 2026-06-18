// Generation contract: the P0 "no broken/empty page" guard.
//
// Runs two ways:
//  - MOCK (always): drives the real processing pipeline (processServiceCopy ->
//    defaults + id backfill + italic fallback) over the pure mock generator, so
//    it runs in CI with zero network/credits.
//  - GOLDEN (when present): validates frozen real-LLM captures in
//    e2e/fixtures/generated/*.json (produced by scripts/captureGenerationFixture).
//    Skipped cleanly when no captures exist yet.

import fs from 'node:fs';
import path from 'node:path';
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
import type { ServiceUnderstandingInput, ServiceAssetInput } from '@/types/service';

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

const SCHEMAS = {
  service: serviceElementSchema,
  product: meridianElementSchema,
} as const;

const understanding: ServiceUnderstandingInput = {
  serviceType: 'agency',
  whatYouDo: 'Brand and web studio for DTC skincare founders',
  services: ['Brand identity', 'Packaging', 'Website refresh'],
  targetClients: ['DTC founders at $300k-$2M ARR'],
  outcomes: ['Launch-ready in 4 weeks', 'Conversion-focused copy'],
  deliveryModel: 'remote',
};

const assets: ServiceAssetInput = {
  hasTestimonials: true,
  hasClientLogos: true,
  hasOutcomes: false,
  hasCaseStudies: true,
  hasTeamPhotos: false,
  hasFounderPhoto: true,
  testimonialType: 'text',
};

describe('generation contract — MOCK pipeline (service / Hearth+Lex)', () => {
  const strategy = generateMockServiceStrategy({
    oneLiner: 'A six-week brand studio for DTC founders.',
    understanding,
    goal: 'book-call',
    offer: 'Fixed-price brand identity in six weeks',
    assets,
  });
  const raw = generateMockServiceCopy({
    strategy,
    uiblocks: strategy.uiblocks,
    oneLiner: 'A six-week brand studio for DTC founders.',
    offer: 'Fixed-price brand identity in six weeks',
  });
  const processed = processServiceCopy(raw, strategy.uiblocks);

  it('produces a section for every routed uiblock', () => {
    for (const sectionType of Object.keys(strategy.uiblocks)) {
      expect(processed[sectionType], `missing section ${sectionType}`).toBeTruthy();
    }
  });

  it('every section satisfies its element schema (no broken/empty page)', () => {
    const errors = validateGeneratedContent(processed, strategy.uiblocks, serviceElementSchema);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  it('backfills collection ids (no duplicate React keys)', () => {
    assertIdsBackfilled(processed);
  });
});

describe('generation contract — MOCK pipeline (product / Meridian)', () => {
  const strategy = generateMockMeridianStrategy({
    productName: 'Meridian',
    oneLiner: 'A deploy platform for teams that ship daily.',
    features: ['Auto deploys', 'Instant rollbacks', 'Build caching'],
    primaryAudience: 'Staff engineers at fast-shipping startups',
  });
  const raw = generateMockMeridianCopy({
    strategy,
    uiblocks: strategy.uiblocks,
    productName: 'Meridian',
    oneLiner: 'A deploy platform for teams that ship daily.',
    offer: 'Free to start',
  });
  const processed = processProductCopy(raw, strategy.uiblocks);

  it('produces a section for every routed uiblock', () => {
    for (const sectionType of Object.keys(strategy.uiblocks)) {
      expect(processed[sectionType], `missing section ${sectionType}`).toBeTruthy();
    }
  });

  it('every section satisfies its element schema (no broken/empty page)', () => {
    const errors = validateGeneratedContent(processed, strategy.uiblocks, meridianElementSchema);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });

  it('backfills collection ids recursively (incl. nested footer links)', () => {
    assertIdsBackfilled(processed);
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
