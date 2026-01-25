/**
 * /api/v2/generate-copy - Copy generation endpoint
 *
 * Flow:
 * 1. Validate request
 * 2. Auth + credits check (3 credits)
 * 3. Build copy prompt
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
import { generateWithSchema } from '@/lib/aiClient';
import { CopyResponseSchema } from '@/lib/schemas';
import { buildCopyPrompt, buildCopyRetryPrompt } from '@/modules/copy/copyPrompt';
import { validateCompleteness } from '@/modules/copy/parseCopy';
import type { SectionType, StrategyOutput, SectionCopy, LandingGoal } from '@/types/generation';
import { sectionTypes, vibes, awarenessLevels, landingGoals } from '@/types/generation';

export const dynamic = 'force-dynamic';

// Max retry attempts for parsing failures
const MAX_RETRIES = 2;

// Strategy schema
const StrategySchema = z.object({
  oneReader: z.object({
    who: z.string(),
    coreDesire: z.string(),
    corePain: z.string(),
    beliefs: z.string(),
    awareness: z.enum(awarenessLevels as unknown as [string, ...string[]]),
    sophistication: z.enum(['low', 'medium', 'high']),
    emotionalState: z.string(),
  }),
  oneIdea: z.object({
    bigBenefit: z.string(),
    uniqueMechanism: z.string(),
    reasonToBelieve: z.string(),
  }),
  sections: z.array(z.enum(sectionTypes as unknown as [string, ...string[]])),
  vibe: z.enum(vibes as unknown as [string, ...string[]]),
  featureAnalysis: z.array(
    z.object({
      feature: z.string(),
      benefit: z.string(),
      benefitOfBenefit: z.string(),
    })
  ),
  objections: z.array(
    z.object({
      thought: z.string(),
      section: z.enum(sectionTypes as unknown as [string, ...string[]]),
    })
  ),
});

// Request schema
const GenerateCopyRequestSchema = z.object({
  strategy: StrategySchema,
  uiblocks: z.record(z.string()),
  productName: z.string().min(1, 'Product name is required'),
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
  offer: z.string().min(1, 'Offer is required'),
  landingGoal: z.enum(landingGoals as unknown as [string, ...string[]]),
  // Features as string array - benefits already in strategy.featureAnalysis
  features: z.array(z.string()).min(1, 'At least one feature is required'),
});

async function generateCopyHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request
    const body = await req.json();
    const validation = GenerateCopyRequestSchema.safeParse(body);

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

    // 3. Build copy prompt
    const prompt = buildCopyPrompt({
      strategy: strategy as StrategyOutput,
      uiblocks: uiblocks as Record<SectionType, string>,
      productName,
      oneLiner,
      offer,
      landingGoal: landingGoal as LandingGoal,
      features,
    });

    // 4. Call AI with structured outputs (with retry)
    logger.dev('[generate-copy] PROMPT:', prompt);

    let sections: Record<string, SectionCopy> | null = null;
    let lastError: string | null = null;
    let attempts = 0;
    let currentPrompt = prompt;

    while (attempts <= MAX_RETRIES && !sections) {
      attempts++;
      logger.dev(`[generate-copy] Attempt ${attempts}/${MAX_RETRIES + 1}`);

      try {
        const response = await generateWithSchema(
          'copy',
          [{ role: 'user', content: currentPrompt }],
          CopyResponseSchema,
          'copy_generation'
        );
        logger.dev('[generate-copy] RESPONSE:', response);

        // Transform response to expected format
        sections = response as Record<string, SectionCopy>;
      } catch (aiError: any) {
        lastError = aiError.message || 'AI generation failed';
        logger.error(`AI copy generation failed (attempt ${attempts}):`, aiError);

        // Build retry prompt for next attempt
        if (attempts <= MAX_RETRIES) {
          currentPrompt = buildCopyRetryPrompt(prompt, lastError || 'Unknown error', '');
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

    // 6. Validate completeness
    const { complete, missingSections } = validateCompleteness(
      sections,
      uiblocks as Record<SectionType, string>
    );

    if (!complete) {
      logger.warn('Copy generation incomplete, missing sections:', missingSections);
      // Don't fail, just log - partial results are usable
    }

    // 7. Consume credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.GENERATE_COPY,
      CREDIT_COSTS.GENERATE_COPY,
      {
        endpoint: '/api/v2/generate-copy',
        duration: Date.now() - startTime,
        metadata: {
          productName,
          landingGoal,
          sectionsGenerated: Object.keys(sections).length,
          attempts,
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
    logger.error('Generate copy endpoint error:', error);
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

export const POST = withAIRateLimit(generateCopyHandler);
