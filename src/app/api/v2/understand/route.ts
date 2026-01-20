/**
 * /api/v2/understand - Product understanding endpoint
 *
 * Flow:
 * 1. Validate request
 * 2. Auth check (1 credit)
 * 3. Build extraction prompt
 * 4. Call AI with structured outputs
 * 5. Consume credits, return understanding data
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAuth } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { generateWithSchema } from '@/lib/aiClient';
import { UnderstandingResponseSchema } from '@/lib/schemas';
import type { UnderstandingData } from '@/types/generation';

export const dynamic = 'force-dynamic';

// Request schema
const UnderstandRequestSchema = z.object({
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
});

function buildUnderstandPrompt(oneLiner: string): string {
  return `Extract product information from this description:

"${oneLiner}"

Return a JSON object with:
- categories: 1-3 market categories (e.g., ["Invoicing", "Finance", "Productivity"])
- audiences: 1-3 target audiences (e.g., ["Freelancers", "Small businesses"])
- whatItDoes: A single clear sentence describing the core function
- features: 3-6 key product features (short phrases, e.g., ["AI-powered creation", "Multi-currency support"])

Be specific and practical. Extract what's stated or strongly implied.`;
}

async function understandHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request
    const body = await req.json();
    const validation = UnderstandRequestSchema.safeParse(body);

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

    const { oneLiner } = validation.data;

    // 2. Auth check
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

    // 3. Build prompt
    const prompt = buildUnderstandPrompt(oneLiner);

    // 4. Call AI with structured outputs
    logger.dev('[understand] PROMPT:', prompt);

    let understandingData: UnderstandingData;
    try {
      understandingData = await generateWithSchema(
        'understand',
        [{ role: 'user', content: prompt }],
        UnderstandingResponseSchema,
        'understanding'
      );
      logger.dev('[understand] RESPONSE:', understandingData);
    } catch (error: any) {
      logger.error('AI understand call failed:', error);
      return createSecureResponse(
        {
          success: false,
          error: 'ai_error',
          message: error.message || 'AI service error',
          recoverable: true,
        },
        500
      );
    }

    // 6. Consume credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.UNDERSTAND,
      CREDIT_COSTS.UNDERSTAND,
      {
        endpoint: '/api/v2/understand',
        duration: Date.now() - startTime,
        metadata: {
          oneLinerLength: oneLiner.length,
          categoriesCount: understandingData.categories.length,
          audiencesCount: understandingData.audiences.length,
          featuresCount: understandingData.features.length,
        },
      }
    );

    if (!creditResult.success) {
      logger.warn(`Credit consumption failed: ${creditResult.error}`);
      // Still return success - we have the data
    }

    logger.dev(`Understand completed in ${Date.now() - startTime}ms`);

    return createSecureResponse({
      success: true,
      data: understandingData,
      creditsUsed: CREDIT_COSTS.UNDERSTAND,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    logger.error('Understand handler error:', error);
    return createSecureResponse(
      {
        success: false,
        error: 'internal_error',
        message: 'An unexpected error occurred',
        recoverable: true,
      },
      500
    );
  }
}

export const POST = withAIRateLimit(understandHandler);
