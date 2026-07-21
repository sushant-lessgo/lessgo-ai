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
import {
  checkCredits,
  consumeCredits,
  logUsageEvent,
  CREDIT_COSTS,
  UsageEventType,
} from '@/lib/creditSystem';
import { generateWithSchema } from '@/lib/aiClient';
import { ServiceStrategyResponseSchema } from '@/lib/schemas/strategyService.schema';
import { buildServiceStrategyPrompt } from '@/modules/audience/service/strategy/promptsService';
import { resolvePromptLanguage } from '@/lib/i18n/projectLocale';
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
  businessName: z.string().optional(),
  understanding: z.object({
    serviceType: z.enum(serviceTypes as unknown as [string, ...string[]]),
    whatYouDo: z.string().min(1, 'What you do is required'),
    services: z.array(z.string()).min(1, 'At least one service required'),
    targetClients: z.array(z.string()).min(1, 'At least one target client required'),
    outcomes: z.array(z.string()).default([]),
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
  // template↔palette validity is enforced at the picker + saveDraft, not here.
  // Mirrors the DraftSaveSchema.paletteId widening (11a gap #9).
  paletteId: z.string().max(50).regex(/^[a-z0-9-]+$/, 'Invalid palette id'),
  // SELECTION-ONLY. templateId is used here solely to widen the section SET for
  // templates that declare extra section types (e.g. Surge → logos/about/
  // casestudies/stats). It is passed to assembleServiceStrategy → selectServiceSections
  // and is NEVER forwarded to buildServiceStrategyPrompt (assertNoTemplateLeak guards
  // the prompt input). The firewall boundary is the PROMPT, not the route.
  templateId: z.string().max(50).regex(/^[a-z0-9-]+$/, 'Invalid template id').optional(),
  // language-settings phase 4 (ruling 11) — the onboarding-declared site
  // language, a bare ISO code. Typed `z.unknown()` DELIBERATELY: validation is
  // SEMANTIC (`resolvePromptLanguage` → 'en' fallback), so no value of any shape
  // can 400 a paid generation run over language. The raw value never reaches the
  // prompt — only the validated English exonym does.
  language: z.unknown().optional(),
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
      // silent-fallback: MOCK strategy is canned, not AI-derived — warn (not info)
      // so a degraded run is visible in logs, and flag it in meta.
      logger.warn('[Service Strategy] Using MOCK response — no real strategy generated (NEXT_PUBLIC_USE_MOCK_GPT or demo token)');
      const mockStrategy = generateMockServiceStrategy({
        oneLiner: data.oneLiner,
        understanding: data.understanding as any,
        goal: data.goal as any,
        offer: data.offer,
        assets: data.assets as any,
        templateId: (data.templateId as any) ?? null,
      });
      return createSecureResponse({
        success: true,
        data: mockStrategy,
        creditsUsed: 0,
        creditsRemaining: 999,
        meta: { mock: true },
      });
    }

    // 2c. Credit PRE-GATE — check the balance BEFORE any AI work (one charging
    //     model: check → generate → charge on success). Placed AFTER the mock/
    //     demo short-circuit above, exactly where consumeCredits already applied,
    //     so mock/demo runs stay both uncharged and ungated.
    //     The failed attempt is still ledgered here — it mirrors the success:false
    //     UsageEvent consumeCredits used to write once the AI had already run.
    const preCheck = await checkCredits(userId, CREDIT_COSTS.STRATEGY_GENERATION);
    if (!preCheck.allowed) {
      await logUsageEvent({
        userId,
        eventType: UsageEventType.STRATEGY_GENERATION,
        creditsUsed: 0,
        success: false,
        errorMessage: 'Insufficient credits',
        endpoint: '/api/audience/service/strategy',
        duration: Date.now() - startTime,
      });
      return createSecureResponse(
        {
          success: false,
          error: 'insufficient_credits',
          message: `Insufficient credits. Required: ${preCheck.required}, Available: ${preCheck.remaining}`,
          creditsRequired: preCheck.required,
          creditsRemaining: preCheck.remaining,
        },
        402
      );
    }

    // 3. Build prompt
    const prompt = buildServiceStrategyPrompt({
      oneLiner: data.oneLiner,
      businessName: data.businessName,
      understanding: data.understanding as any,
      goal: data.goal as any,
      offer: data.offer,
      assets: data.assets as any,
      // Validated + mapped to an English exonym here (ruling 11).
      language: resolvePromptLanguage(data.language),
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

    // 5. Assemble (deterministic sections + uiblocks). templateId is passed for
    // SECTION SELECTION ONLY (widens the set for Surge); assembleServiceStrategy
    // deliberately does not write it onto the returned object, so it can't ride
    // into the copy prompt via the client request body.
    const strategyData = assembleServiceStrategy({
      llmResponse,
      goal: data.goal as any,
      assets: data.assets as any,
      templateId: (data.templateId as any) ?? null,
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
      // The charge failed AFTER generation → the output is DISCARDED (no free output).
      if (creditResult.error === 'charge_conflict') {
        // Solvent user, lost the write race → recoverable. The error code AND
        // message deliberately avoid the substring "credit": the client rails
        // regex-match /credit/i and would strand a paying user on the buy wall.
        logger.error(
          `[Service Strategy] Charge conflict for user ${userId} — nothing charged, output discarded`
        );
        return createSecureResponse(
          {
            success: false,
            error: 'charge_failed',
            message: 'Temporary billing conflict — please try again. You have not been charged.',
          },
          500
        );
      }
      return createSecureResponse(
        {
          success: false,
          error: 'insufficient_credits',
          message: creditResult.error || 'Insufficient credits',
          creditsRequired: CREDIT_COSTS.STRATEGY_GENERATION,
          creditsRemaining: creditResult.remaining,
        },
        402
      );
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
