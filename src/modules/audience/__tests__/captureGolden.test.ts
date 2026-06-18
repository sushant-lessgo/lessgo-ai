// Real-LLM golden-fixture capture. OPT-IN — skipped unless CAPTURE=1.
//
//   CAPTURE=1 npx vitest run captureGolden        # capture all templates
//
// Makes ONE real copy-generation call per template off a fixed, realistic mock
// strategy, runs the production processing pipeline, validates the result, and
// freezes it to e2e/fixtures/generated/<template>.json. The generationContract
// test then validates those frozen captures offline (no repeat cost).
//
// Costs credits / hits the live model — that's why it's gated. Run it once after
// a generation change, eyeball the JSON, commit the fixtures.

import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load secrets the same way the app does (build/runtime read .env.local).
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// NOTE: @/lib/aiClient instantiates the OpenAI client at module load and throws
// without OPENAI_API_KEY, so it is dynamic-imported INSIDE the tests below — a
// normal (no-key) CI run skips these tests and never loads it.
import { CopyResponseSchema } from '@/lib/schemas/copy.schema';
import { buildServiceCopyPrompt } from '@/modules/audience/service/copyPrompt';
import { buildProductCopyPrompt } from '@/modules/audience/product/copyPrompt';
import { processServiceCopy } from '@/modules/audience/service/parseCopy';
import { processProductCopy } from '@/modules/audience/product/parseCopy';
import { serviceElementSchema } from '@/modules/audience/service/elementSchema';
import { meridianElementSchema } from '@/modules/audience/product/elementSchema';
import {
  generateMockServiceStrategy,
} from '@/modules/prompt/mockResponseGeneratorService';
import {
  generateMockMeridianStrategy,
} from '@/modules/prompt/mockResponseGeneratorProduct';
import { validateGeneratedContent } from './contentValidator';
import type { ServiceUnderstandingInput, ServiceAssetInput } from '@/types/service';

const OUT_DIR = path.resolve(process.cwd(), 'e2e/fixtures/generated');

function writeFixture(name: string, schema: 'service' | 'product', uiblocks: any, sections: any) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify({ template: name, schema, uiblocks, sections }, null, 2));
  // eslint-disable-next-line no-console
  console.log(`[capture] wrote ${file} (${Object.keys(sections).length} sections)`);
}

const understanding: ServiceUnderstandingInput = {
  serviceType: 'agency',
  whatYouDo: 'Brand and web studio for DTC skincare founders',
  services: ['Brand identity', 'Packaging', 'Website refresh'],
  targetClients: ['DTC founders at $300k-$2M ARR'],
  outcomes: ['Launch-ready in 4 weeks', 'Conversion-focused copy'],
  deliveryModel: 'remote',
};
const assets: ServiceAssetInput = {
  hasTestimonials: true, hasClientLogos: true, hasOutcomes: false,
  hasCaseStudies: true, hasTeamPhotos: false, hasFounderPhoto: true, testimonialType: 'text',
};

// Long timeout — real model calls.
describe.skipIf(process.env.CAPTURE !== '1')('CAPTURE real-LLM golden fixtures', () => {
  it('service (Hearth/Lex schema) → e2e/fixtures/generated/service.json', async () => {
    const oneLiner = 'A six-week brand studio for DTC founders.';
    const offer = 'Fixed-price brand identity in six weeks';
    const strategy = generateMockServiceStrategy({ oneLiner, understanding, goal: 'book-call', offer, assets });
    const prompt = buildServiceCopyPrompt({
      strategy, uiblocks: strategy.uiblocks, oneLiner, offer, goal: 'book-call', understanding,
    });
    const { generateRawJson } = await import('@/lib/aiClient');
    const raw = await generateRawJson('copy', prompt, CopyResponseSchema);
    const processed = processServiceCopy(raw as any, strategy.uiblocks);
    const errors = validateGeneratedContent(processed as any, strategy.uiblocks, serviceElementSchema);
    expect(errors, `real service copy failed validation:\n${JSON.stringify(errors, null, 2)}`).toEqual([]);
    writeFixture('service', 'service', strategy.uiblocks, processed);
  }, 120_000);

  it('product (Meridian schema) → e2e/fixtures/generated/product.json', async () => {
    const oneLiner = 'A deploy platform for teams that ship daily.';
    const offer = 'Free to start';
    const features = ['Auto deploys', 'Instant rollbacks', 'Build caching'];
    const strategy = generateMockMeridianStrategy({
      productName: 'Meridian', oneLiner, features, primaryAudience: 'Staff engineers at fast-shipping startups',
    });
    const prompt = buildProductCopyPrompt({
      strategy, uiblocks: strategy.uiblocks, productName: 'Meridian', oneLiner, offer,
      landingGoal: 'signup' as any, features,
    });
    const { generateRawJson } = await import('@/lib/aiClient');
    const raw = await generateRawJson('copy', prompt, CopyResponseSchema);
    const processed = processProductCopy(raw as any, strategy.uiblocks);
    const errors = validateGeneratedContent(processed as any, strategy.uiblocks, meridianElementSchema);
    expect(errors, `real product copy failed validation:\n${JSON.stringify(errors, null, 2)}`).toEqual([]);
    writeFixture('product', 'product', strategy.uiblocks, processed);
  }, 120_000);
});
