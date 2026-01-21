// Zod schema for /api/v3/strategy response
// Simplified strategy for V3 onboarding flow
// Reference: SecondOpinion.md
// ALL enum values inlined to avoid $ref issues with Anthropic structured outputs

import { z } from 'zod';

/**
 * Simplified Awareness Level Enum (4 values)
 * Combines awareness + sophistication into single dimension
 */
export const SimplifiedAwarenessLevelEnum = z.enum([
  'problem-aware-cold',       // Knows problem, low emotional intensity
  'problem-aware-hot',        // Feels pain intensely, urgent
  'solution-aware-skeptical', // Knows solutions, needs convincing
  'solution-aware-eager',     // Ready to act, needs confirmation
]);

/**
 * Simplified OneReader Schema
 * Persona + pain/desire/objections arrays
 */
export const SimplifiedOneReaderSchema = z.object({
  personaDescription: z.string().min(1),
  pain: z.array(z.string().min(1)).min(1),
  desire: z.array(z.string().min(1)).min(1),
  objections: z.array(z.string().min(1)).min(1),
});

/**
 * OneIdea Schema (same as v2)
 */
export const OneIdeaSchemaV3 = z.object({
  bigBenefit: z.string().min(1),
  uniqueMechanism: z.string().min(1),
  reasonToBelieve: z.string().min(1),
});

/**
 * Feature Analysis Schema (same as v2)
 */
export const FeatureAnalysisSchemaV3 = z.object({
  feature: z.string().min(1),
  benefit: z.string().min(1),
  benefitOfBenefit: z.string().min(1),
});

/**
 * Section Decisions Schema
 * LLM decisions for Before/After, UniqueMechanism, ObjectionHandle, isB2B
 */
export const SectionDecisionsSchema = z.object({
  includeBeforeAfter: z.boolean(),
  includeUniqueMechanism: z.boolean(),
  includeObjectionHandle: z.boolean(),
  isB2B: z.boolean(),
});

/**
 * Simplified Strategy Response Schema - FULLY INLINED
 * Used for Anthropic structured outputs
 */
export const SimplifiedStrategyResponseSchema = z.object({
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
  vibe: z.enum(['Dark Tech', 'Light Trust', 'Warm Friendly', 'Bold Energy', 'Calm Minimal']),
  featureAnalysis: z.array(z.object({
    feature: z.string().min(1),
    benefit: z.string().min(1),
    benefitOfBenefit: z.string().min(1),
  })).min(1),
  sectionDecisions: z.object({
    includeBeforeAfter: z.boolean(),
    includeUniqueMechanism: z.boolean(),
    includeObjectionHandle: z.boolean(),
    isB2B: z.boolean(),
  }),
});

export type SimplifiedStrategyResponse = z.infer<typeof SimplifiedStrategyResponseSchema>;
