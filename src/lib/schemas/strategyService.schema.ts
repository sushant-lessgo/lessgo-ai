// src/lib/schemas/strategyService.schema.ts
// Zod schema for /api/audience/service/strategy response. Mirror of strategyV3.schema.ts
// pattern but with service-specific shape (oneClient / ourPosition /
// servicePresentation). All enum values inlined to avoid $ref issues with
// Anthropic structured outputs.
//
// Reference: src/types/service.ts (ServiceStrategyOutput).

import { z } from 'zod';

/**
 * ServiceAwareness enum — 4 visitor states.
 * Pilot ignores LLM choice and forces 'search-aware-comparing' downstream;
 * schema keeps the field for forward-compat with Phase 7+.
 */
export const ServiceAwarenessEnum = z.enum([
  'search-aware-cold',
  'search-aware-comparing',
  'referral-driven',
  'relationship-warming',
]);

/**
 * OneClient — service-route equivalent of v3's oneReader.
 */
export const OneClientSchema = z.object({
  who:        z.string().min(1),
  coreDesire: z.string().min(1),
  corePain:   z.string().min(1),
  pains:      z.array(z.string().min(1)).min(1),
  desires:    z.array(z.string().min(1)).min(1),
  objections: z.array(z.string().min(1)).min(1),
});

/**
 * OurPosition — service-route equivalent of v3's oneIdea.
 * Services sell the provider, not just the offering.
 */
export const OurPositionSchema = z.object({
  promise:     z.string().min(1),
  approach:    z.string().min(1),
  credibility: z.string().min(1),
});

/**
 * ServicePresentation — how packages/quotes are framed.
 */
export const ServicePresentationSchema = z.object({
  format:           z.enum(['packages', 'quote-only', 'hybrid']),
  showProcess:      z.boolean(),
  showCaseStudies:  z.boolean(),
});

/**
 * SectionDecisions — LLM hints for optional sections.
 * Pilot only honors testimonials presence; rest deferred to Phase 7+.
 */
export const ServiceSectionDecisionsSchema = z.object({
  includeTransformation: z.boolean(),
  includeProblem:        z.boolean(),
  includeApproach:       z.boolean(),
  isHighTouch:           z.boolean(),
});

/**
 * UIBlockDecisions — advisory for Phase 7+. Pilot uses fixed mapping.
 * All fields optional so LLM may omit. NOTE: OpenAI structured outputs
 * require `.optional()` to be paired with `.nullable()` (every field must
 * be required or explicitly nullable). LLM may emit `null` for omitted
 * fields; consumers treat null/undefined identically.
 */
export const ServiceUIBlockDecisionsSchema = z.object({
  heroBlock:          z.string().nullable().optional(),
  servicesBlock:      z.string().nullable().optional(),
  processBlock:       z.string().nullable().optional(),
  packagesBlock:      z.string().nullable().optional(),
  casestudiesBlock:   z.string().nullable().optional(),
  testimonialsBlock:  z.string().nullable().optional(),
  ctaBlock:           z.string().nullable().optional(),
});

/**
 * ServiceStrategyResponseSchema — fully inlined for Anthropic structured outputs.
 */
export const ServiceStrategyResponseSchema = z.object({
  awareness: z.enum([
    'search-aware-cold',
    'search-aware-comparing',
    'referral-driven',
    'relationship-warming',
  ]),
  oneClient: z.object({
    who:        z.string().min(1),
    coreDesire: z.string().min(1),
    corePain:   z.string().min(1),
    pains:      z.array(z.string().min(1)).min(1),
    desires:    z.array(z.string().min(1)).min(1),
    objections: z.array(z.string().min(1)).min(1),
  }),
  ourPosition: z.object({
    promise:     z.string().min(1),
    approach:    z.string().min(1),
    credibility: z.string().min(1),
  }),
  servicePresentation: z.object({
    format:          z.enum(['packages', 'quote-only', 'hybrid']),
    showProcess:     z.boolean(),
    showCaseStudies: z.boolean(),
  }),
  sectionDecisions: z.object({
    includeTransformation: z.boolean(),
    includeProblem:        z.boolean(),
    includeApproach:       z.boolean(),
    isHighTouch:           z.boolean(),
  }),
  uiblockDecisions: z.object({
    heroBlock:          z.string().nullable().optional(),
    servicesBlock:      z.string().nullable().optional(),
    processBlock:       z.string().nullable().optional(),
    packagesBlock:      z.string().nullable().optional(),
    casestudiesBlock:   z.string().nullable().optional(),
    testimonialsBlock:  z.string().nullable().optional(),
    ctaBlock:           z.string().nullable().optional(),
  }),
});

export type ServiceStrategyResponse = z.infer<typeof ServiceStrategyResponseSchema>;
