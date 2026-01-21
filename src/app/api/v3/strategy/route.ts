/**
 * /api/v3/strategy - Simplified strategy generation endpoint
 *
 * V3 Flow (SecondOpinion.md):
 * 1. Validate request (no IVOC required)
 * 2. Auth + credits check (2 credits)
 * 3. Build simplified strategy prompt
 * 4. Call AI with structured outputs
 * 5. Deterministic section selection (no AI)
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
import { SimplifiedStrategyResponseSchema } from '@/lib/schemas/strategyV3.schema';
import { buildSimplifiedStrategyPrompt } from '@/modules/strategy/promptsV3';
import { selectSectionsV3 } from '@/modules/strategy/sectionSelectionV3';
import type { LandingGoal, SimplifiedStrategyOutput } from '@/types/generation';
import { landingGoals } from '@/types/generation';

export const dynamic = 'force-dynamic';

// Request schema - simplified, no IVOC
const StrategyV3RequestSchema = z.object({
  // Product info
  productName: z.string().min(1, 'Product name is required'),
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
  features: z.array(z.string()).min(1, 'At least one feature is required'),

  // Context
  landingGoal: z.enum(landingGoals as unknown as [string, ...string[]]),
  offer: z.string().min(1, 'Offer is required'),

  // Assets
  hasTestimonials: z.boolean(),
  hasSocialProof: z.boolean(),
  hasConcreteResults: z.boolean(),

  // Audiences
  primaryAudience: z.string().min(1, 'Primary audience is required'),
  otherAudiences: z.array(z.string()).optional().default([]),

  // Categories (for B2B detection)
  categories: z.array(z.string()).optional().default([]),

  // Multi-audience flag
  hasMultipleAudiences: z.boolean().optional().default(false),
});

async function strategyV3Handler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request
    const body = await req.json();
    const validation = StrategyV3RequestSchema.safeParse(body);

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

    // 3. Build simplified strategy prompt
    const prompt = buildSimplifiedStrategyPrompt({
      productName: data.productName,
      oneLiner: data.oneLiner,
      features: data.features,
      landingGoal: data.landingGoal as LandingGoal,
      offer: data.offer,
      primaryAudience: data.primaryAudience,
      otherAudiences: data.otherAudiences,
      categories: data.categories,
    });

    logger.dev('[strategy-v3] PROMPT:', prompt);

    // 4. Call AI with structured outputs
    let strategyData: SimplifiedStrategyOutput;
    try {
      const response = await generateWithSchema(
        'strategy',  // Use same endpoint type as v2
        [{ role: 'user', content: prompt }],
        SimplifiedStrategyResponseSchema,
        'strategy'
      );

      // Log AI response
      logger.info('[Strategy V3] Awareness:', response.awareness);
      logger.info('[Strategy V3] Section decisions:', response.sectionDecisions);

      // 5. Deterministic section selection
      const sections = selectSectionsV3({
        landingGoal: data.landingGoal as LandingGoal,
        awareness: response.awareness,
        assets: {
          hasTestimonials: data.hasTestimonials,
          hasSocialProof: data.hasSocialProof,
          hasConcreteResults: data.hasConcreteResults,
        },
        sectionDecisions: response.sectionDecisions,
        hasMultipleAudiences: data.hasMultipleAudiences,
      });

      logger.info('[Strategy V3] Final sections:', sections);

      // Construct SimplifiedStrategyOutput
      strategyData = {
        awareness: response.awareness,
        oneReader: response.oneReader,
        oneIdea: response.oneIdea,
        vibe: response.vibe,
        featureAnalysis: response.featureAnalysis,
        sectionDecisions: response.sectionDecisions,
        sections,
      };
    } catch (aiError: any) {
      logger.error('AI strategy V3 generation failed:', aiError);
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

    // 6. Consume credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.STRATEGY_GENERATION,
      CREDIT_COSTS.STRATEGY_GENERATION,
      {
        endpoint: '/api/v3/strategy',
        duration: Date.now() - startTime,
        metadata: {
          productName: data.productName,
          landingGoal: data.landingGoal,
          vibe: strategyData.vibe,
          awareness: strategyData.awareness,
          sectionsCount: strategyData.sections.length,
          version: 'v3',
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
    logger.error('Strategy V3 endpoint error:', error);
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

export const POST = withAIRateLimit(strategyV3Handler);
