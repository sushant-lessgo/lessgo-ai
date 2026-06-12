/**
 * /api/audience/service/strategy — Service-route strategy generation endpoint
 *
 * Mirrors /api/v3/strategy:
 *  1. Validate request (service shape: oneLiner + understanding + goal + offer + assets + paletteId)
 *  2. Auth + credits check (2 credits, reuses STRATEGY_GENERATION cost)
 *  3. Build service strategy prompt + Hearth voice context
 *  4. Call AI with structured outputs (ServiceStrategyResponseSchema)
 *  5. Deterministic section selection + uiblock map (pilot: hardcoded)
 *  6. Consume credits, return assembled ServiceStrategyOutputAssembled
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAuth } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { generateWithSchema } from '@/lib/aiClient';
import { ServiceStrategyResponseSchema } from '@/lib/schemas/strategyService.schema';
import { buildServiceStrategyPrompt } from '@/modules/audience/service/strategy/promptsService';
import { assembleServiceStrategy } from '@/modules/audience/service/strategy/parseStrategyService';
import { generateMockServiceStrategy } from '@/modules/prompt/mockResponseGeneratorService';
import {
  serviceTypes,
  serviceGoals,
} from '@/types/service';

export const dynamic = 'force-dynamic';

const DEMO_TOKEN = 'lessgodemomockdata';

const ServiceStrategyRequestSchema = z.object({
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
  understanding: z.object({
    serviceType: z.enum(serviceTypes as unknown as [string, ...string[]]),
    serviceCategories: z.array(z.string()).default([]),
    industries: z.array(z.string()).default([]),
    targetClients: z.string().min(1, 'Target clients required'),
    services: z.array(z.string()).min(1, 'At least one service required'),
    deliveryModel: z.enum(['remote', 'in-person', 'hybrid']),
  }),
  goal: z.enum(serviceGoals as unknown as [string, ...string[]]),
  offer: z.string().min(1, 'Offer required'),
  assets: z.object({
    hasTestimonials: z.boolean(),
    hasClientLogos: z.boolean(),
    hasOutcomes: z.boolean(),
    hasCaseStudies: z.boolean(),
    hasTeamPhotos: z.boolean(),
    hasFounderPhoto: z.boolean(),
    testimonialType: z
      .enum(['text', 'photos', 'video', 'transformation'])
      .nullable()
      .default(null),
  }),
  // Template-agnostic slug (palettes are template-scoped and grow per template).
  // The route never receives templateId (firewall — must not reach prompts), so
  // template↔palette validity is enforced at the picker + saveDraft, not here.
  // Mirrors the DraftSaveSchema.paletteId widening (11a gap #9).
  paletteId: z.string().max(50).regex(/^[a-z0-9-]+$/, 'Invalid palette id'),
});

async function serviceStrategyHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Validate request
    const body = await req.json();
    const validation = ServiceStrategyRequestSchema.safeParse(body);
    if (!validation.success) {
      return createSecureResponse(
        { success: false, error: 'validation_error', details: validation.error.issues },
        400
      );
    }
    const data = validation.data as z.infer<typeof ServiceStrategyRequestSchema>;

    // 2. Auth
    const authCheck = await requireAuth(req);
    if (!authCheck.allowed) {
      return createSecureResponse(
        { success: false, error: 'unauthorized', message: authCheck.error },
        authCheck.statusCode || 401
      );
    }
    const userId = authCheck.userId!;

    // 2b. Mock mode
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true' || token === DEMO_TOKEN) {
      logger.info('[Service Strategy] Using mock response');
      const mockStrategy = generateMockServiceStrategy({
        oneLiner: data.oneLiner,
        understanding: data.understanding as any,
        goal: data.goal as any,
        offer: data.offer,
        assets: data.assets as any,
      });
      return createSecureResponse({
        success: true,
        data: mockStrategy,
        creditsUsed: 0,
        creditsRemaining: 999,
      });
    }

    // 3. Build prompt
    const prompt = buildServiceStrategyPrompt({
      oneLiner: data.oneLiner,
      understanding: data.understanding as any,
      goal: data.goal as any,
      offer: data.offer,
      assets: data.assets as any,
    });
    logger.dev('[service-strategy] PROMPT:', prompt);

    // 4. Call AI with structured outputs
    let llmResponse;
    try {
      llmResponse = await generateWithSchema(
        'strategy',
        [{ role: 'user', content: prompt }],
        ServiceStrategyResponseSchema,
        'serviceStrategy'
      );
      logger.info('[Service Strategy] Awareness:', llmResponse.awareness);
      logger.info('[Service Strategy] Section decisions:', llmResponse.sectionDecisions);
    } catch (aiError: any) {
      logger.error('[Service Strategy] AI call failed:', aiError);
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

    // 5. Assemble (deterministic sections + uiblocks)
    const strategyData = assembleServiceStrategy({
      llmResponse,
      goal: data.goal as any,
      assets: data.assets as any,
    });
    logger.info('[Service Strategy] Final sections:', strategyData.sections);
    logger.info('[Service Strategy] Final UIBlocks:', strategyData.uiblocks);

    // 6. Consume credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.STRATEGY_GENERATION,
      CREDIT_COSTS.STRATEGY_GENERATION,
      {
        endpoint: '/api/audience/service/strategy',
        duration: Date.now() - startTime,
        metadata: {
          version: 'service',
          serviceType: data.understanding.serviceType,
          goal: data.goal,
          paletteId: data.paletteId,
          awareness: strategyData.awareness,
          sectionsCount: strategyData.sections.length,
        },
      }
    );
    if (!creditResult.success) {
      logger.warn(`[Service Strategy] Credit consumption failed for user ${userId}: ${creditResult.error}`);
    }

    return createSecureResponse({
      success: true,
      data: strategyData,
      creditsUsed: CREDIT_COSTS.STRATEGY_GENERATION,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    logger.error('[Service Strategy] Endpoint error:', error);
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

export const POST = withAIRateLimit(serviceStrategyHandler);
