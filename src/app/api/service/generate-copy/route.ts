/**
 * /api/service/generate-copy — Service-route copy generation endpoint
 *
 * Mirrors /api/v3/generate-copy:
 *  1. Validate request (assembled strategy + uiblocks + understanding)
 *  2. Auth + credits check (3 credits, reuses GENERATE_COPY cost)
 *  3. Build copy prompt with Hearth voice spec
 *  4. Call AI raw JSON (CopyResponseSchema is z.record — no structured outputs)
 *     with retry on parse failure (max 2 retries)
 *  5. Apply schema defaults + italic-em fallback + completeness check
 *  6. Consume credits, return sections map
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
import {
  buildServiceCopyPrompt,
  buildServiceCopyRetryPrompt,
} from '@/modules/service/copy/copyPromptService';
import {
  processServiceCopy,
  validateServiceCopyCompleteness,
} from '@/modules/service/copy/parseCopyService';
import { generateMockServiceCopy } from '@/modules/prompt/mockResponseGeneratorService';
import {
  serviceTypes,
  serviceGoals,
  serviceAwarenessStates,
} from '@/types/service';
import type { SectionCopy } from '@/types/generation';

export const dynamic = 'force-dynamic';

const DEMO_TOKEN = 'lessgodemomockdata';
const MAX_RETRIES = 2;

const AssembledStrategySchema = z.object({
  awareness: z.enum(serviceAwarenessStates as unknown as [string, ...string[]]),
  oneClient: z.object({
    who: z.string(),
    coreDesire: z.string(),
    corePain: z.string(),
    pains: z.array(z.string()),
    desires: z.array(z.string()),
    objections: z.array(z.string()),
  }),
  ourPosition: z.object({
    promise: z.string(),
    approach: z.string(),
    credibility: z.string(),
  }),
  servicePresentation: z.object({
    format: z.enum(['packages', 'quote-only', 'hybrid']),
    showProcess: z.boolean(),
    showCaseStudies: z.boolean(),
  }),
  sectionDecisions: z.object({
    includeTransformation: z.boolean(),
    includeProblem: z.boolean(),
    includeApproach: z.boolean(),
    isHighTouch: z.boolean(),
  }),
  uiblockDecisions: z.object({
    heroBlock: z.string().nullable().optional(),
    servicesBlock: z.string().nullable().optional(),
    processBlock: z.string().nullable().optional(),
    packagesBlock: z.string().nullable().optional(),
    casestudiesBlock: z.string().nullable().optional(),
    testimonialsBlock: z.string().nullable().optional(),
    ctaBlock: z.string().nullable().optional(),
  }),
  sections: z.array(z.string()),
  uiblocks: z.record(z.string()),
});

const GenerateServiceCopyRequestSchema = z.object({
  strategy: AssembledStrategySchema,
  uiblocks: z.record(z.string()),
  oneLiner: z.string().min(10),
  offer: z.string().min(1),
  goal: z.enum(serviceGoals as unknown as [string, ...string[]]),
  understanding: z.object({
    serviceType: z.enum(serviceTypes as unknown as [string, ...string[]]),
    serviceCategories: z.array(z.string()).default([]),
    industries: z.array(z.string()).default([]),
    targetClients: z.string(),
    services: z.array(z.string()).min(1),
    deliveryModel: z.enum(['remote', 'in-person', 'hybrid']),
  }),
});

async function serviceCopyHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Validate
    const body = await req.json();
    const validation = GenerateServiceCopyRequestSchema.safeParse(body);
    if (!validation.success) {
      logger.error('[service-generate-copy] Validation failed:', validation.error.issues);
      return createSecureResponse(
        { success: false, error: 'validation_error', details: validation.error.issues },
        400
      );
    }
    const { strategy, uiblocks, oneLiner, offer, goal, understanding } = validation.data;

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
      logger.info('[Service Copy] Using mock response');
      const mockSections = generateMockServiceCopy({
        strategy: strategy as any,
        uiblocks,
        oneLiner,
        offer,
      });
      const processed = processServiceCopy(mockSections, uiblocks);
      return createSecureResponse({
        success: true,
        sections: processed,
        creditsUsed: 0,
        creditsRemaining: 999,
        meta: { attempts: 0, complete: true },
      });
    }

    // 3. Build prompt
    const prompt = buildServiceCopyPrompt({
      strategy: strategy as any,
      uiblocks,
      oneLiner,
      offer,
      goal: goal as any,
      understanding: understanding as any,
    });
    logger.dev('[service-generate-copy] PROMPT:', prompt);

    // 4. AI loop
    let sections: Record<string, SectionCopy> | null = null;
    let lastError: string | null = null;
    let attempts = 0;
    let currentPrompt = prompt;

    while (attempts <= MAX_RETRIES && !sections) {
      attempts++;
      logger.dev(`[service-generate-copy] Attempt ${attempts}/${MAX_RETRIES + 1}`);
      try {
        const response = await generateRawJson('copy', currentPrompt, CopyResponseSchema);
        sections = response as Record<string, SectionCopy>;
      } catch (aiError: any) {
        lastError = aiError.message || 'AI generation failed';
        logger.error(`[service-generate-copy] Attempt ${attempts} failed:`, aiError);
        if (attempts <= MAX_RETRIES) {
          currentPrompt = buildServiceCopyRetryPrompt(prompt, lastError || 'Unknown error', '');
        }
      }
    }

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

    // 5. Process — schema defaults + italic-em fallback
    const processed = processServiceCopy(sections, uiblocks);

    const { complete, missingSections } = validateServiceCopyCompleteness(processed, uiblocks);
    if (!complete) {
      logger.warn('[service-generate-copy] Copy incomplete, missing sections:', missingSections);
    }

    // 6. Credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.GENERATE_COPY,
      CREDIT_COSTS.GENERATE_COPY,
      {
        endpoint: '/api/service/generate-copy',
        duration: Date.now() - startTime,
        metadata: {
          version: 'service',
          serviceType: understanding.serviceType,
          goal,
          sectionsGenerated: Object.keys(processed).length,
          attempts,
        },
      }
    );
    if (!creditResult.success) {
      logger.warn(`[service-generate-copy] Credit consumption failed for user ${userId}: ${creditResult.error}`);
    }

    return createSecureResponse({
      success: true,
      sections: processed,
      creditsUsed: CREDIT_COSTS.GENERATE_COPY,
      creditsRemaining: creditResult.remaining,
      meta: {
        attempts,
        complete,
        missingSections: complete ? undefined : missingSections,
      },
    });
  } catch (error: any) {
    logger.error('[service-generate-copy] Endpoint error:', error);
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

export const POST = withAIRateLimit(serviceCopyHandler);
