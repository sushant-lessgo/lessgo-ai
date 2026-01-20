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

// Type for middle section (for exports)
export type MiddleSection = z.infer<typeof MiddleSectionEnum>;
