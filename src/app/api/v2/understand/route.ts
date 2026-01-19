/**
 * /api/v2/understand - Product understanding endpoint
 *
 * Flow:
 * 1. Validate request
 * 2. Auth check (1 credit)
 * 3. Build extraction prompt
 * 4. Call OpenAI (gpt-4o-mini, temp 0.3)
 * 5. Parse response
 * 6. Consume credits, return understanding data
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAuth } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { openai } from '@/lib/openaiClient';
import type { UnderstandingData } from '@/types/generation';

export const dynamic = 'force-dynamic';

// Request schema
const UnderstandRequestSchema = z.object({
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
});

// Response validation
const UnderstandingResponseSchema = z.object({
  categories: z.array(z.string()).min(1).max(3),
  audiences: z.array(z.string()).min(1).max(3),
  whatItDoes: z.string().min(1),
  features: z.array(z.string()).min(1).max(8),
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

    // 4. Call OpenAI
    let understandingData: UnderstandingData;
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return createSecureResponse(
          {
            success: false,
            error: 'empty_response',
            message: 'AI returned empty response',
            recoverable: true,
          },
          500
        );
      }

      // 5. Parse response
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        logger.error('Failed to parse understand response:', content);
        return createSecureResponse(
          {
            success: false,
            error: 'parse_error',
            message: 'Failed to parse AI response',
            recoverable: true,
          },
          500
        );
      }

      // Validate structure
      const responseValidation = UnderstandingResponseSchema.safeParse(parsed);
      if (!responseValidation.success) {
        logger.error('Invalid understand response structure:', responseValidation.error);
        return createSecureResponse(
          {
            success: false,
            error: 'invalid_response',
            message: 'AI response missing required fields',
            recoverable: true,
          },
          500
        );
      }

      understandingData = responseValidation.data;
    } catch (error: any) {
      logger.error('OpenAI understand call failed:', error);
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
