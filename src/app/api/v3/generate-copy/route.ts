/**
 * /api/v3/generate-copy - V3 Copy generation endpoint
 *
 * Accepts SimplifiedStrategyOutput from V3 strategy endpoint.
 *
 * Flow:
 * 1. Validate request (V3 schema)
 * 2. Auth + credits check (3 credits)
 * 3. Build V3 copy prompt
 * 4. Call AI with structured outputs (with retry on failure)
 * 5. Validate completeness
 * 6. Consume credits, return copy
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAuth } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { generateRawJson } from '@/lib/aiClient';
import { CopyResponseSchema } from '@/lib/schemas';
import { buildCopyPromptV3, buildCopyRetryPromptV3 } from '@/modules/copy/copyPromptV3';
import { validateCompleteness } from '@/modules/copy/parseCopy';
import type { SectionCopy, SimplifiedStrategyOutput, LandingGoal } from '@/types/generation';
import { sectionTypes, vibes, simplifiedAwarenessLevels, landingGoals } from '@/types/generation';

export const dynamic = 'force-dynamic';

// Max retry attempts for parsing failures
const MAX_RETRIES = 2;

// V3 Strategy schema (SimplifiedStrategyOutput)
const V3StrategySchema = z.object({
  awareness: z.enum(simplifiedAwarenessLevels as unknown as [string, ...string[]]),
  oneReader: z.object({
    personaDescription: z.string(),
    pain: z.array(z.string()),
    desire: z.array(z.string()),
    objections: z.array(z.string()),
  }),
  oneIdea: z.object({
    bigBenefit: z.string(),
    uniqueMechanism: z.string(),
    reasonToBelieve: z.string(),
  }),
  vibe: z.enum(vibes as unknown as [string, ...string[]]),
  featureAnalysis: z.array(
    z.object({
      feature: z.string(),
      benefit: z.string(),
      benefitOfBenefit: z.string(),
    })
  ),
  sectionDecisions: z.object({
    includeBeforeAfter: z.boolean(),
    includeUniqueMechanism: z.boolean(),
    includeObjectionHandle: z.boolean(),
    isB2B: z.boolean(),
  }),
  uiblockDecisions: z.object({
    productType: z.enum(['behind-the-scenes', 'visual-ui-hero', 'visual-ui-supports']),
    featuresUIBlock: z.enum(['IconGrid', 'MetricTiles', 'Carousel', 'SplitAlternating']),
    uniqueMechanismUIBlock: z.enum(['SecretSauceReveal', 'StackedHighlights', 'TechnicalAdvantage', 'MethodologyBreakdown', 'PropertyComparisonMatrix', 'ProcessFlowDiagram']),
    pricingUIBlock: z.enum(['TierCards', 'ToggleableMonthlyYearly', 'SliderPricing', 'CallToQuotePlan']),
    objectionHandleUIBlock: z.enum(['VisualObjectionTiles', 'MythVsRealityGrid']),
    faqQuestionCount: z.number(),
    useCasesAudienceType: z.enum(['industry', 'role']),
  }),
  sections: z.array(z.enum(sectionTypes as unknown as [string, ...string[]])),
  uiblocks: z.record(z.string()).optional(),
});

// V3 Request schema
const GenerateCopyV3RequestSchema = z.object({
  strategy: V3StrategySchema,
  uiblocks: z.record(z.string()),
  productName: z.string().min(1, 'Product name is required'),
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
  offer: z.string().min(1, 'Offer is required'),
  landingGoal: z.enum(landingGoals as unknown as [string, ...string[]]),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
});

async function generateCopyV3Handler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request
    const body = await req.json();
    const validation = GenerateCopyV3RequestSchema.safeParse(body);

    if (!validation.success) {
      logger.error('[generate-copy-v3] Validation failed:', validation.error.issues);
      return createSecureResponse(
        {
          success: false,
          error: 'validation_error',
          details: validation.error.issues,
        },
        400
      );
    }

    const { strategy, uiblocks, productName, oneLiner, offer, landingGoal, features } =
      validation.data;

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

    // 3. Build V3 copy prompt
    const prompt = buildCopyPromptV3({
      strategy: strategy as SimplifiedStrategyOutput,
      uiblocks,
      productName,
      oneLiner,
      offer,
      landingGoal: landingGoal as LandingGoal,
      features,
    });

    // 4. Call AI with raw JSON generation (no structured outputs - z.record() not supported by Anthropic)
    logger.dev('[generate-copy-v3] PROMPT:', prompt);

    let sections: Record<string, SectionCopy> | null = null;
    let lastError: string | null = null;
    let attempts = 0;
    let currentPrompt = prompt;

    while (attempts <= MAX_RETRIES && !sections) {
      attempts++;
      logger.dev(`[generate-copy-v3] Attempt ${attempts}/${MAX_RETRIES + 1}`);

      try {
        const response = await generateRawJson(
          'copy',
          currentPrompt,
          CopyResponseSchema
        );
        logger.dev('[generate-copy-v3] RESPONSE:', response);

        sections = response as Record<string, SectionCopy>;
      } catch (aiError: any) {
        lastError = aiError.message || 'AI generation failed';
        logger.error(`AI copy generation failed (attempt ${attempts}):`, aiError);

        if (attempts <= MAX_RETRIES) {
          currentPrompt = buildCopyRetryPromptV3(prompt, lastError || 'Unknown error', '');
          logger.warn(`Copy generation failed (attempt ${attempts}), retrying`);
        }
      }
    }

    // All attempts failed
    if (!sections) {
      return createSecureResponse(
        {
          success: false,
          error: 'generation_failed',
          message: lastError || 'Failed to generate copy after multiple attempts',
          recoverable: true,
        },
        500
      );
    }

    // 5. Validate completeness
    const { complete, missingSections } = validateCompleteness(
      sections,
      uiblocks as Record<string, string>
    );

    if (!complete) {
      logger.warn('[generate-copy-v3] Copy incomplete, missing sections:', missingSections);
    }

    // 6. Consume credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.GENERATE_COPY,
      CREDIT_COSTS.GENERATE_COPY,
      {
        endpoint: '/api/v3/generate-copy',
        duration: Date.now() - startTime,
        metadata: {
          productName,
          landingGoal,
          sectionsGenerated: Object.keys(sections).length,
          attempts,
          version: 'v3',
        },
      }
    );

    if (!creditResult.success) {
      logger.warn(`Credit consumption failed for user ${userId}: ${creditResult.error}`);
    }

    return createSecureResponse({
      success: true,
      sections,
      creditsUsed: CREDIT_COSTS.GENERATE_COPY,
      creditsRemaining: creditResult.remaining,
      meta: {
        attempts,
        complete,
        missingSections: complete ? undefined : missingSections,
      },
    });
  } catch (error: any) {
    logger.error('[generate-copy-v3] Endpoint error:', error);
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

export const POST = withAIRateLimit(generateCopyV3Handler);
