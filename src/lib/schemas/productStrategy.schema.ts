// Zod schema for /api/audience/product/strategy response (Meridian P3).
// LEAN subset of strategyV3.schema.ts: reuses the mature product strategy
// concepts (awareness / oneReader / oneIdea / featureAnalysis) but DROPS
// vibe + sectionDecisions + uiblockDecisions — Meridian's pilot uses a fixed
// section list + fixed block map, so the strategy LLM makes no layout choices
// and palette/variant are locked. Legacy strategyV3.schema.ts is UNTOUCHED
// (still serves the 47-block path until P5).
//
// Enum values inlined to avoid $ref issues with structured outputs.

import { z } from 'zod';

export const ProductStrategyResponseSchema = z.object({
  awareness: z.enum([
    'problem-aware-cold',
    'problem-aware-hot',
    'solution-aware-skeptical',
    'solution-aware-eager',
  ]),
  oneReader: z.object({
    personaDescription: z.string().min(1),
    pain: z.array(z.string().min(1)).min(1),
    desire: z.array(z.string().min(1)).min(1),
    objections: z.array(z.string().min(1)).min(1),
  }),
  oneIdea: z.object({
    bigBenefit: z.string().min(1),
    uniqueMechanism: z.string().min(1),
    reasonToBelieve: z.string().min(1),
  }),
  featureAnalysis: z
    .array(
      z.object({
        feature: z.string().min(1),
        benefit: z.string().min(1),
        benefitOfBenefit: z.string().min(1),
      })
    )
    .min(1),
});

export type ProductStrategyResponse = z.infer<typeof ProductStrategyResponseSchema>;
