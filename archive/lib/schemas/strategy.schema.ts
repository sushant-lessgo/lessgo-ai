// Zod schema for /api/v2/strategy response
// Used with OpenAI Structured Outputs and Anthropic JSON Schema

import { z } from 'zod';
import {
  vibes,
  awarenessLevels,
  sophisticationLevels,
  sectionTypes,
} from '@/types/generation';

// Enum schemas for constrained values
export const VibeEnum = z.enum(vibes as unknown as [string, ...string[]]);
export const AwarenessLevelEnum = z.enum(awarenessLevels as unknown as [string, ...string[]]);
export const SophisticationLevelEnum = z.enum(sophisticationLevels as unknown as [string, ...string[]]);
export const SectionTypeEnum = z.enum(sectionTypes as unknown as [string, ...string[]]);

// Middle sections - excludes fixed sections (Header, Hero, CTA, Footer)
// AI only returns these; fixed sections are added server-side
const middleSectionTypes = [
  'Problem',
  'BeforeAfter',
  'Features',
  'UniqueMechanism',
  'HowItWorks',
  'Testimonials',
  'SocialProof',
  'Results',
  'FounderNote',
  'Pricing',
  'ObjectionHandle',
  'FAQ',
  'UseCases',
] as const;
export const MiddleSectionEnum = z.enum(middleSectionTypes);

// Inline enum values to avoid $ref issues with Anthropic structured outputs
// When zod-to-json-schema creates shared refs, transformSchemaForAnthropic breaks nested paths
const objectionThemeValues = ['trust', 'risk', 'fit', 'how', 'what', 'price', 'effort'] as const;
const intensityValues = ['low', 'medium', 'high'] as const;
const frictionValues = ['low', 'medium', 'high'] as const;

// FrictionAssessment schema
export const FrictionAssessmentSchema = z.object({
  level: z.enum(frictionValues),
  reasoning: z.string().min(1),
});

// EnhancedObjection schema
export const EnhancedObjectionSchema = z.object({
  thought: z.string().min(1),
  theme: z.enum(objectionThemeValues),
  intensity: z.enum(intensityValues),
  preHandledByHero: z.boolean().nullable(),
});

// ObjectionGroup schema
export const ObjectionGroupSchema = z.object({
  theme: z.enum(objectionThemeValues),
  objections: z.array(EnhancedObjectionSchema).min(1),
  resolvedBy: MiddleSectionEnum,
  reasoning: z.string().min(1),
});

// OneReader schema
export const OneReaderSchema = z.object({
  who: z.string().min(1),
  coreDesire: z.string().min(1),
  corePain: z.string().min(1),
  beliefs: z.string().min(1),
  awareness: AwarenessLevelEnum,
  sophistication: SophisticationLevelEnum,
  emotionalState: z.string().min(1),
});

// OneIdea schema
export const OneIdeaSchema = z.object({
  bigBenefit: z.string().min(1),
  uniqueMechanism: z.string().min(1),
  reasonToBelieve: z.string().min(1),
});

// FeatureAnalysis schema
export const FeatureAnalysisSchema = z.object({
  feature: z.string().min(1),
  benefit: z.string().min(1),
  benefitOfBenefit: z.string().min(1),
});

// ObjectionMapping schema
export const ObjectionMappingSchema = z.object({
  thought: z.string().min(1),
  section: SectionTypeEnum,
});

// Main strategy response schema
export const StrategyResponseSchema = z.object({
  vibe: VibeEnum,
  oneReader: OneReaderSchema,
  oneIdea: OneIdeaSchema,
  featureAnalysis: z.array(FeatureAnalysisSchema).min(1),
  objections: z.array(ObjectionMappingSchema),
  // AI only returns middle sections; Header, Hero, CTA, Footer added server-side
  middleSections: z.array(MiddleSectionEnum).min(1),
});

export type StrategyResponse = z.infer<typeof StrategyResponseSchema>;

// Enhanced strategy response schema - FULLY INLINED to avoid $ref issues
// Anthropic structured outputs breaks when zod-to-json-schema creates nested $refs
// ALL enum values must be inlined as literals - NO shared schema references allowed
export const EnhancedStrategyResponseSchema = z.object({
  vibe: z.enum(['Dark Tech', 'Light Trust', 'Warm Friendly', 'Bold Energy', 'Calm Minimal']),
  oneReader: z.object({
    who: z.string().min(1),
    coreDesire: z.string().min(1),
    corePain: z.string().min(1),
    beliefs: z.string().min(1),
    awareness: z.enum(['unaware', 'problem-aware', 'solution-aware', 'product-aware', 'most-aware']),
    sophistication: z.enum(['low', 'medium', 'high']),
    emotionalState: z.string().min(1),
  }),
  oneIdea: z.object({
    bigBenefit: z.string().min(1),
    uniqueMechanism: z.string().min(1),
    reasonToBelieve: z.string().min(1),
  }),
  featureAnalysis: z.array(z.object({
    feature: z.string().min(1),
    benefit: z.string().min(1),
    benefitOfBenefit: z.string().min(1),
  })).min(1),
  frictionAssessment: z.object({
    level: z.enum(['low', 'medium', 'high']),
    reasoning: z.string().min(1),
  }),
  allObjections: z.array(z.object({
    thought: z.string().min(1),
    theme: z.enum(['trust', 'risk', 'fit', 'how', 'what', 'price', 'effort']),
    intensity: z.enum(['low', 'medium', 'high']),
    preHandledByHero: z.boolean().nullable(),
  })),
  objectionGroups: z.array(z.object({
    theme: z.enum(['trust', 'risk', 'fit', 'how', 'what', 'price', 'effort']),
    objections: z.array(z.object({
      thought: z.string().min(1),
      theme: z.enum(['trust', 'risk', 'fit', 'how', 'what', 'price', 'effort']),
      intensity: z.enum(['low', 'medium', 'high']),
      preHandledByHero: z.boolean().nullable(),
    })).min(1),
    resolvedBy: z.enum(['Problem', 'BeforeAfter', 'Features', 'UniqueMechanism', 'HowItWorks', 'Testimonials', 'SocialProof', 'Results', 'FounderNote', 'Pricing', 'ObjectionHandle', 'FAQ', 'UseCases']),
    reasoning: z.string().min(1),
  })),
  middleSections: z.array(z.enum(['Problem', 'BeforeAfter', 'Features', 'UniqueMechanism', 'HowItWorks', 'Testimonials', 'SocialProof', 'Results', 'FounderNote', 'Pricing', 'ObjectionHandle', 'FAQ', 'UseCases'])).min(1),
});

export type EnhancedStrategyResponse = z.infer<typeof EnhancedStrategyResponseSchema>;

// Sequential strategy response schema - for sequential objection flow mode
// AI processes each objection individually instead of grouping
export const SequentialStrategyResponseSchema = z.object({
  vibe: z.enum(['Dark Tech', 'Light Trust', 'Warm Friendly', 'Bold Energy', 'Calm Minimal']),
  oneReader: z.object({
    who: z.string().min(1),
    coreDesire: z.string().min(1),
    corePain: z.string().min(1),
    beliefs: z.string().min(1),
    awareness: z.enum(['unaware', 'problem-aware', 'solution-aware', 'product-aware', 'most-aware']),
    sophistication: z.enum(['low', 'medium', 'high']),
    emotionalState: z.string().min(1),
  }),
  oneIdea: z.object({
    bigBenefit: z.string().min(1),
    uniqueMechanism: z.string().min(1),
    reasonToBelieve: z.string().min(1),
  }),
  featureAnalysis: z.array(z.object({
    feature: z.string().min(1),
    benefit: z.string().min(1),
    benefitOfBenefit: z.string().min(1),
  })).min(1),
  frictionAssessment: z.object({
    level: z.enum(['low', 'medium', 'high']),
    reasoning: z.string().min(1),
  }),
  // SIMPLIFIED: only thought + intensity (no theme, no preHandledByHero)
  allObjections: z.array(z.object({
    thought: z.string().min(1),
    intensity: z.enum(['low', 'medium', 'high']),
  })),
  // NEW: per-objection resolutions (AI argues for each)
  objectionResolutions: z.array(z.object({
    thought: z.string().min(1),
    intensity: z.enum(['low', 'medium', 'high']),
    inferredTheme: z.enum(['trust', 'risk', 'fit', 'how', 'what', 'price', 'effort']),
    preHandledByHero: z.boolean(),
    candidateSections: z.array(z.enum(['Problem', 'BeforeAfter', 'Features', 'UniqueMechanism', 'HowItWorks', 'Testimonials', 'SocialProof', 'Results', 'FounderNote', 'Pricing', 'ObjectionHandle', 'FAQ', 'UseCases'])),
    alreadyCoveredBy: z.enum(['Problem', 'BeforeAfter', 'Features', 'UniqueMechanism', 'HowItWorks', 'Testimonials', 'SocialProof', 'Results', 'FounderNote', 'Pricing', 'ObjectionHandle', 'FAQ', 'UseCases']).nullable(),
    decision: z.enum(['add', 'skip']),
    chosenSection: z.enum(['Problem', 'BeforeAfter', 'Features', 'UniqueMechanism', 'HowItWorks', 'Testimonials', 'SocialProof', 'Results', 'FounderNote', 'Pricing', 'ObjectionHandle', 'FAQ', 'UseCases']).nullable(),
    reasoning: z.string().min(1),
  })),
  middleSections: z.array(z.enum(['Problem', 'BeforeAfter', 'Features', 'UniqueMechanism', 'HowItWorks', 'Testimonials', 'SocialProof', 'Results', 'FounderNote', 'Pricing', 'ObjectionHandle', 'FAQ', 'UseCases'])).min(1),
});

export type SequentialStrategyResponse = z.infer<typeof SequentialStrategyResponseSchema>;

// Type for middle section (for exports)
export type MiddleSection = z.infer<typeof MiddleSectionEnum>;
