// scripts/testServicePipeline.ts
// End-to-end Phase 2 backend test harness. Exercises the full service
// generation pipeline in-process (no HTTP, no auth, no credit deduction):
//
//   oneLiner + understanding + assets
//     → buildServiceStrategyPrompt → AI / mock → ServiceStrategyResponse
//     → assembleServiceStrategy (sections + uiblocks)
//     → buildServiceCopyPrompt → AI / mock → CopyResponse
//     → processServiceCopy (defaults + italic-em fallback)
//
// Pretty-prints the assembled JSON so you can eyeball what the renderer will
// receive before any UIBlock is built.
//
// Usage:
//   NEXT_PUBLIC_USE_MOCK_GPT=true npx tsx scripts/testServicePipeline.ts
//   (omit env to call live AI — charges credits via direct generateWithSchema)
//
// Note: this script bypasses the API routes' auth/credit/rate-limit layer.
// It is dev-only and not wired into any UI flow.

import 'dotenv/config';
import { buildServiceStrategyPrompt } from '../src/modules/audience/service/strategy/promptsService';
import { assembleServiceStrategy } from '../src/modules/audience/service/strategy/parseStrategyService';
import { buildServiceCopyPrompt } from '../src/modules/audience/service/copyPrompt';
import { processServiceCopy, validateServiceCopyCompleteness } from '../src/modules/audience/service/parseCopy';
import { generateMockServiceStrategy, generateMockServiceCopy } from '../src/modules/prompt/mockResponseGeneratorService';
import type {
  ServiceUnderstandingInput,
  ServiceAssetInput,
  ServiceGoal,
} from '../src/types/service';

interface SampleInput {
  oneLiner: string;
  understanding: ServiceUnderstandingInput;
  goal: ServiceGoal;
  offer: string;
  assets: ServiceAssetInput;
}

const SAMPLE_INPUT: SampleInput = {
  oneLiner: 'Boutique branding studio for direct-to-consumer skincare brands.',
  understanding: {
    serviceType: 'agency',
    serviceCategories: ['Branding', 'Packaging Design'],
    industries: ['Skincare', 'Beauty', 'DTC'],
    targetClients: 'Founders launching DTC skincare brands at $300k–$2M ARR',
    services: ['Brand identity', 'Packaging design', 'Web design'],
    deliveryModel: 'remote',
  },
  goal: 'book-call',
  offer: 'Free 30-min brand audit, no obligation',
  assets: {
    hasTestimonials: true,
    hasClientLogos: true,
    hasOutcomes: false,
    hasCaseStudies: true,
    hasTeamPhotos: false,
    hasFounderPhoto: true,
    testimonialType: 'text',
  },
};

async function main() {
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Service pipeline test  |  mocks: ${useMocks}`);
  console.log('='.repeat(60));

  // ===== Strategy =====
  console.log('\n[1/4] Strategy prompt + LLM call');
  const strategyPrompt = buildServiceStrategyPrompt({
    oneLiner: SAMPLE_INPUT.oneLiner,
    understanding: SAMPLE_INPUT.understanding,
    goal: SAMPLE_INPUT.goal,
    offer: SAMPLE_INPUT.offer,
    assets: SAMPLE_INPUT.assets,
  });
  console.log(`  Prompt length: ${strategyPrompt.length} chars`);

  let assembledStrategy;
  if (useMocks) {
    assembledStrategy = generateMockServiceStrategy({
      oneLiner: SAMPLE_INPUT.oneLiner,
      understanding: SAMPLE_INPUT.understanding,
      goal: SAMPLE_INPUT.goal,
      offer: SAMPLE_INPUT.offer,
      assets: SAMPLE_INPUT.assets,
    });
  } else {
    // Lazy-load AI client + schema to keep mock runs free of OPENAI_API_KEY requirement.
    const { generateWithSchema } = await import('../src/lib/aiClient');
    const { ServiceStrategyResponseSchema } = await import('../src/lib/schemas/strategyService.schema');
    const llmResponse = await generateWithSchema(
      'strategy',
      [{ role: 'user', content: strategyPrompt }],
      ServiceStrategyResponseSchema,
      'serviceStrategy'
    );
    assembledStrategy = assembleServiceStrategy({
      llmResponse,
      goal: SAMPLE_INPUT.goal,
      assets: SAMPLE_INPUT.assets,
    });
  }
  console.log('  Sections:', assembledStrategy.sections);
  console.log('  UIBlocks:', assembledStrategy.uiblocks);

  // ===== Copy =====
  console.log('\n[2/4] Copy prompt + LLM call');
  const copyPrompt = buildServiceCopyPrompt({
    strategy: assembledStrategy,
    uiblocks: assembledStrategy.uiblocks,
    oneLiner: SAMPLE_INPUT.oneLiner,
    offer: SAMPLE_INPUT.offer,
    goal: SAMPLE_INPUT.goal,
    understanding: SAMPLE_INPUT.understanding,
  });
  console.log(`  Prompt length: ${copyPrompt.length} chars`);

  let rawCopy: Record<string, any>;
  if (useMocks) {
    rawCopy = generateMockServiceCopy({
      strategy: assembledStrategy,
      uiblocks: assembledStrategy.uiblocks,
      oneLiner: SAMPLE_INPUT.oneLiner,
      offer: SAMPLE_INPUT.offer,
    });
  } else {
    const { generateRawJson } = await import('../src/lib/aiClient');
    const { CopyResponseSchema } = await import('../src/lib/schemas');
    rawCopy = await generateRawJson('copy', copyPrompt, CopyResponseSchema);
  }

  // ===== Process =====
  console.log('\n[3/4] Apply schema defaults + italic-em fallback');
  const processed = processServiceCopy(rawCopy as any, assembledStrategy.uiblocks);

  // ===== Validate =====
  console.log('\n[4/4] Completeness check');
  const { complete, missingSections } = validateServiceCopyCompleteness(
    processed,
    assembledStrategy.uiblocks
  );
  console.log(`  Complete: ${complete}`);
  if (!complete) console.log('  Missing:', missingSections);

  console.log(`\n${'='.repeat(60)}`);
  console.log('Final assembled output (strategy + copy):');
  console.log('='.repeat(60));
  console.log(JSON.stringify({ strategy: assembledStrategy, copy: processed }, null, 2));

  // Spot-check italic-em on hero/cta headline
  const heroHeadline = (processed.hero?.elements as any)?.headline;
  const ctaHeadline = (processed.cta?.elements as any)?.headline;
  console.log('\nItalic-accent spot-check:');
  console.log(`  hero.headline: ${heroHeadline}  (em: ${/<em\b/i.test(heroHeadline || '')})`);
  console.log(`  cta.headline:  ${ctaHeadline}   (em: ${/<em\b/i.test(ctaHeadline || '')})`);
}

main().catch((err) => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
