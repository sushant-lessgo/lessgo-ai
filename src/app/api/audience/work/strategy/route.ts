/**
 * /api/audience/work/strategy — the ONE small AI strategy call for the WORK
 * copy engine (plan phase 2). Mirrors /api/audience/product/strategy:
 *
 *  1. Validate request (a Brief carrying `facts.work`; read via getWorkFacts)
 *  2. Auth + credits (2 credits, reuses STRATEGY_GENERATION — NO new event)
 *  3. Derive price position + voice (pure code); build the LEAN work strategy
 *     prompt (praise/dreamClient/price/profession/establishment — NO templateId)
 *  4. Call the AI (WorkStrategyResponseSchema — ONLY positioningAngle/storyAngle/
 *     voiceNotes; the schema is the enforcement point for "AI adds no structure")
 *  5. Assemble deterministic structure (assembleWorkStructure) + AI angles into a
 *     WorkStrategyOutput
 *  6. Consume credits, return
 *
 * Mock path (NEXT_PUBLIC_USE_MOCK_GPT or the DEMO_TOKEN bearer) returns a canned
 * strategy with meta.mock and burns no credits — offline verification.
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAuth } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { generateWithSchema } from '@/lib/aiClient';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import { WorkStrategyResponseSchema } from '@/lib/schemas/workStrategy.schema';
import { professionWording } from '@/modules/engines/workVocabulary';
import { derivePricePosition } from '@/modules/audience/work/pricePosition';
import {
  selectWorkVoice,
  formatWorkVoiceForPrompt,
  resolveWorkProfession,
  type Establishment,
  type WorkProfessionRow,
} from '@/modules/audience/work/voice';
import { DEFAULT_ESTABLISHMENT } from '@/modules/audience/work/slimStrategy';
import { buildWorkStrategyPrompt } from '@/modules/audience/work/strategy/promptsWork';
import { assembleWorkStrategy } from '@/modules/audience/work/strategy/parseStrategyWork';
import { generateMockWorkStrategy } from '@/modules/prompt/mockResponseGeneratorWork';

export const dynamic = 'force-dynamic';

const DEMO_TOKEN = 'lessgodemomockdata';

const WorkStrategyRequestSchema = z.object({
  // The resolved Brief carries `facts.work` (mirrors the product route's optional
  // Brief; here it is required — the work engine has nothing to say without facts).
  brief: BriefSchema,
});

async function workStrategyHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Validate request shape.
    const body = await req.json();
    const validation = WorkStrategyRequestSchema.safeParse(body);
    if (!validation.success) {
      return createSecureResponse(
        { success: false, error: 'validation_error', details: validation.error.issues },
        400
      );
    }
    const { brief } = validation.data;

    // 1b. Read work facts from the Brief.
    const facts = getWorkFacts(brief.facts);
    if (!facts) {
      return createSecureResponse(
        {
          success: false,
          error: 'validation_error',
          message: 'brief.facts.work is required for work strategy generation',
        },
        400
      );
    }

    // 2. Auth.
    const authCheck = await requireAuth(req);
    if (!authCheck.allowed) {
      return createSecureResponse(
        { success: false, error: 'unauthorized', message: authCheck.error },
        authCheck.statusCode || 401
      );
    }
    const userId = authCheck.userId!;

    // professionRow: business-type key only (firewall-safe — no templateId).
    // Brief.businessType is an OPEN string (validated at the serve gate, not
    // here); only `.key` is read + mapped by resolveWorkProfession, so the cast
    // onto the narrower WorkProfessionRow key union is safe.
    const professionRow: WorkProfessionRow | null = brief.businessType
      ? ({ key: brief.businessType } as WorkProfessionRow)
      : null;

    // 2b. Mock mode — canned strategy, no LLM, no credits.
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true' || token === DEMO_TOKEN) {
      logger.warn(
        '[Work Strategy] Using MOCK response — no real strategy generated (NEXT_PUBLIC_USE_MOCK_GPT or demo token)'
      );
      const mockStrategy = generateMockWorkStrategy({ facts, professionRow });
      return createSecureResponse({
        success: true,
        data: mockStrategy,
        creditsUsed: 0,
        creditsRemaining: 999,
        meta: { mock: true },
      });
    }

    // 3. Derive price position + voice (pure code), then build the lean prompt.
    const pricePosition = derivePricePosition(facts);
    const establishment: Establishment = facts.establishment ?? DEFAULT_ESTABLISHMENT;
    const voice = selectWorkVoice({ professionRow, pricePosition, establishment });
    const profession = resolveWorkProfession(professionRow?.key);
    const prompt = buildWorkStrategyPrompt({
      businessName: facts.identity?.name,
      profession,
      workNoun: professionWording[profession].workGroup,
      pricePosition,
      establishment,
      dreamClient: facts.dreamClient,
      praise: facts.praise ?? [],
      groupNames: (facts.groups ?? []).map((g) => g.name),
      primaryLanguage: facts.languages?.[0] ?? 'en',
      voiceBlock: formatWorkVoiceForPrompt(voice),
    });
    logger.dev('[work-strategy] PROMPT:', prompt);

    // 4. Call the AI with structured outputs (angle/story/voice ONLY).
    let llmResponse;
    try {
      llmResponse = await generateWithSchema(
        'work-strategy',
        [{ role: 'user', content: prompt }],
        WorkStrategyResponseSchema,
        'workStrategy'
      );
      logger.info('[Work Strategy] positioningAngle:', llmResponse.positioningAngle);
    } catch (aiError: any) {
      logger.error('[Work Strategy] AI call failed:', aiError);
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

    // 5. Assemble deterministic structure + AI angles.
    const strategyData = assembleWorkStrategy({ llmResponse, facts, professionRow });
    logger.info('[Work Strategy] archetype:', strategyData.archetype);
    logger.info('[Work Strategy] sections:', strategyData.sections);

    // 6. Consume credits — SAME event/cost as the product/service strategy call.
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.STRATEGY_GENERATION,
      CREDIT_COSTS.STRATEGY_GENERATION,
      {
        endpoint: '/api/audience/work/strategy',
        duration: Date.now() - startTime,
        metadata: {
          version: 'work',
          archetype: strategyData.archetype,
          pricePosition,
          sectionsCount: strategyData.sections.length,
        },
      }
    );
    if (!creditResult.success) {
      logger.warn(
        `[Work Strategy] Credit consumption failed for user ${userId}: ${creditResult.error}`
      );
    }

    return createSecureResponse({
      success: true,
      data: strategyData,
      creditsUsed: CREDIT_COSTS.STRATEGY_GENERATION,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    logger.error('[Work Strategy] Endpoint error:', error);
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

export const POST = withAIRateLimit(workStrategyHandler);
