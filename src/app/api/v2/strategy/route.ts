/**
 * /api/v2/strategy - Strategy generation endpoint
 *
 * Flow:
 * 1. Validate request
 * 2. Auth + credits check (2 credits)
 * 3. Build strategy prompt
 * 4. Call AI with structured outputs
 * 5. validateSections() post-processing
 * 6. Consume credits, return strategy
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAuth } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { generateWithSchema } from '@/lib/aiClient';
import {
  EnhancedStrategyResponseSchema,
  SequentialStrategyResponseSchema,
} from '@/lib/schemas';
import {
  buildStrategyPrompt,
  validateSections,
  applyCanonicalOrder,
  limitProofSections,
} from '@/modules/strategy';
import type { IVOC, LandingGoal, StrategyOutput, SectionType } from '@/types/generation';
import { landingGoals } from '@/types/generation';

export const dynamic = 'force-dynamic';

// Request schema
const StrategyRequestSchema = z.object({
  // Product info
  productName: z.string().min(1, 'Product name is required'),
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
  // Features as string array - AI extracts benefits internally
  features: z.array(z.string()).min(1, 'At least one feature is required'),

  // Context
  landingGoal: z.enum(landingGoals as unknown as [string, ...string[]]),
  offer: z.string().min(1, 'Offer is required'),

  // Assets
  hasTestimonials: z.boolean(),
  hasSocialProof: z.boolean(),
  hasConcreteResults: z.boolean(),

  // IVOC (from research step)
  ivoc: z.object({
    pains: z.array(z.string()),
    desires: z.array(z.string()),
    objections: z.array(z.string()),
    firmBeliefs: z.array(z.string()),
    shakableBeliefs: z.array(z.string()),
    commonPhrases: z.array(z.string()),
  }),

  // Audiences
  primaryAudience: z.string().min(1, 'Primary audience is required'),
  otherAudiences: z.array(z.string()).optional().default([]),
});

async function strategyHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request
    const body = await req.json();
    const validation = StrategyRequestSchema.safeParse(body);

    if (!validation.success) {
      return createSecureResponse(
        {
          success: false,
          error: 'validation_error',
          details: validation.error.issues,
        },
        400
      );
    }

    const data = validation.data;

    // 2. Auth + credits check
    const authCheck = await requireAuth(req);
    if (!authCheck.allowed) {
      return createSecureResponse(
        {
          success: false,
          error: 'unauthorized',
          message: authCheck.error,
        },
        authCheck.statusCode || 401
      );
    }

    const userId = authCheck.userId!;

    // 3. Build strategy prompt
    const prompt = buildStrategyPrompt({
      productName: data.productName,
      oneLiner: data.oneLiner,
      features: data.features,
      landingGoal: data.landingGoal as LandingGoal,
      offer: data.offer,
      ivoc: data.ivoc as IVOC,
      primaryAudience: data.primaryAudience,
      otherAudiences: data.otherAudiences,
      assets: {
        hasTestimonials: data.hasTestimonials,
        hasSocialProof: data.hasSocialProof,
        hasConcreteResults: data.hasConcreteResults,
      },
    });

    // 4. Call AI with structured outputs
    // Choose schema based on objection flow mode
    const objectionFlowMode = process.env.OBJECTION_FLOW_MODE || 'grouped';
    const isSequentialMode = objectionFlowMode === 'sequential';
    const responseSchema = isSequentialMode
      ? SequentialStrategyResponseSchema
      : EnhancedStrategyResponseSchema;

    logger.dev('[strategy] PROMPT:', prompt);

    let strategyData: StrategyOutput;
    try {
      // AI returns response based on selected schema
      const response = await generateWithSchema(
        'strategy',
        [{ role: 'user', content: prompt }],
        responseSchema,
        'strategy'
      );
      logger.dev('[strategy] AI RESPONSE:', response);
      logger.dev('[strategy] FRICTION:', response.frictionAssessment);

      if (isSequentialMode) {
        // Sequential mode: objectionResolutions
        const seqResponse = response as any;
        logger.dev('[strategy] OBJECTION RESOLUTIONS:', seqResponse.objectionResolutions?.length || 0);
      } else {
        // Grouped mode: objectionGroups
        const grpResponse = response as any;
        logger.dev('[strategy] OBJECTION GROUPS:', grpResponse.objectionGroups?.length || 0);
      }

      // 5. Post-processing pipeline for middleSections
      let middleSections = (response.middleSections || ['Features']) as SectionType[];

      // 5a. Apply canonical persuasion order
      middleSections = applyCanonicalOrder(middleSections);
      logger.dev('[strategy] AFTER CANONICAL ORDER:', middleSections);

      // 5b. Limit proof sections to at most 2
      middleSections = limitProofSections(middleSections);
      logger.dev('[strategy] AFTER PROOF LIMIT:', middleSections);

      // Construct full sections: Header, Hero, ...middleSections, CTA, Footer
      const sections = [
        'Header',
        'Hero',
        ...middleSections,
        'CTA',
        'Footer',
      ] as StrategyOutput['sections'];

      // Convert response to StrategyOutput for downstream compatibility
      let legacyObjections: Array<{ thought: string; section: string }> = [];

      if (isSequentialMode) {
        // Sequential mode: map objectionResolutions to legacy format
        const seqResponse = response as any;
        legacyObjections = (seqResponse.objectionResolutions || [])
          .filter((res: any) => res.decision === 'add' && res.chosenSection)
          .map((res: any) => ({
            thought: res.thought,
            section: res.chosenSection,
          }));
      } else {
        // Grouped mode: map objectionGroups to legacy format
        const grpResponse = response as any;
        legacyObjections = (grpResponse.objectionGroups || []).flatMap((group: any) =>
          group.objections.map((obj: any) => ({
            thought: obj.thought,
            section: group.resolvedBy,
          }))
        );
      }

      strategyData = {
        vibe: response.vibe as StrategyOutput['vibe'],
        oneReader: response.oneReader as StrategyOutput['oneReader'],
        oneIdea: response.oneIdea as StrategyOutput['oneIdea'],
        featureAnalysis: response.featureAnalysis as StrategyOutput['featureAnalysis'],
        objections: legacyObjections as StrategyOutput['objections'],
        sections,
      };
      logger.dev('[strategy] CONSTRUCTED SECTIONS:', sections);
    } catch (aiError: any) {
      logger.error('AI strategy generation failed:', aiError);
      return createSecureResponse(
        {
          success: false,
          error: 'ai_error',
          message: aiError.message || 'AI generation failed',
          recoverable: true,
        },
        500
      );
    }

    // 6. Final validation: filter by asset availability and handle FAQ placement
    const assets = {
      hasTestimonials: data.hasTestimonials,
      hasSocialProof: data.hasSocialProof,
      hasConcreteResults: data.hasConcreteResults,
    };

    strategyData.sections = validateSections(
      strategyData.sections,
      data.landingGoal as LandingGoal,
      assets
    );

    // Dedupe sections (preserve order)
    strategyData.sections = [...new Set(strategyData.sections)];

    // 7. Consume credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.STRATEGY_GENERATION,
      CREDIT_COSTS.STRATEGY_GENERATION,
      {
        endpoint: '/api/v2/strategy',
        duration: Date.now() - startTime,
        metadata: {
          productName: data.productName,
          landingGoal: data.landingGoal,
          vibe: strategyData.vibe,
          sectionsCount: strategyData.sections.length,
        },
      }
    );

    if (!creditResult.success) {
      logger.warn(`Credit consumption failed for user ${userId}: ${creditResult.error}`);
    }

    return createSecureResponse({
      success: true,
      data: strategyData,
      creditsUsed: CREDIT_COSTS.STRATEGY_GENERATION,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    logger.error('Strategy endpoint error:', error);
    return createSecureResponse(
      {
        success: false,
        error: 'internal_error',
        message: error.message || 'An unexpected error occurred',
        recoverable: true,
      },
      500
    );
  }
}

export const POST = withAIRateLimit(strategyHandler);
