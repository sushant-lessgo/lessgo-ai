/**
 * /api/audience/service/generate-copy — Service-route copy generation endpoint
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
import {
  checkCredits,
  consumeCredits,
  logUsageEvent,
  CREDIT_COSTS,
  UsageEventType,
} from '@/lib/creditSystem';
import { generateRawJson } from '@/lib/aiClient';
import { CopyResponseSchema } from '@/lib/schemas';
import {
  buildServiceCopyPrompt,
  buildServiceCopyRetryPrompt,
} from '@/modules/audience/service/copyPrompt';
import { resolvePromptLanguage } from '@/lib/i18n/projectLocale';
import {
  processServiceCopy,
  validateServiceCopyCompleteness,
  injectRealTestimonials,
  normalizeServiceCopy,
} from '@/modules/audience/service/parseCopy';
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
  businessName: z.string().optional(),
  offer: z.string().min(1),
  goal: z.enum(serviceGoals as unknown as [string, ...string[]]),
  understanding: z.object({
    serviceType: z.enum(serviceTypes as unknown as [string, ...string[]]),
    whatYouDo: z.string().min(1),
    services: z.array(z.string()).min(1),
    targetClients: z.array(z.string()).min(1),
    outcomes: z.array(z.string()).default([]),
    deliveryModel: z.enum(['remote', 'in-person', 'hybrid']),
  }),
  // Verbatim testimonials imported from the user's site (optional).
  realTestimonials: z
    .array(
      z.object({
        quote: z.string(),
        author_name: z.string(),
        author_role: z.string(),
      })
    )
    .optional(),
  // language-settings phase 4 (ruling 11) — the onboarding-declared site
  // language, a bare ISO code. Typed `z.unknown()` DELIBERATELY: validation is
  // SEMANTIC (`resolvePromptLanguage` → 'en' fallback), so no value of any shape
  // can 400 a paid generation run over language. The raw value never reaches the
  // prompt — only the validated English exonym does.
  language: z.unknown().optional(),
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
    const { strategy, uiblocks, oneLiner, businessName, offer, goal, understanding, realTestimonials, language } = validation.data;

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
      // silent-fallback: MOCK copy is canned, not AI-written — warn (not info) so
      // a degraded run is visible in logs, and flag it in meta so the client can
      // surface/telemeter it instead of treating it as a normal success.
      logger.warn('[Service Copy] Using MOCK response — no real copy generated (NEXT_PUBLIC_USE_MOCK_GPT or demo token)');
      let mockSections = generateMockServiceCopy({
        strategy: strategy as any,
        uiblocks,
        oneLiner,
        offer,
      });
      if (realTestimonials?.length) {
        mockSections = injectRealTestimonials(mockSections, realTestimonials);
      }
      const processed = processServiceCopy(mockSections, uiblocks);
      return createSecureResponse({
        success: true,
        sections: processed,
        creditsUsed: 0,
        creditsRemaining: 999,
        meta: { attempts: 0, complete: true, mock: true },
      });
    }

    // 2c. Credit PRE-GATE — check the balance BEFORE any AI work (one charging
    //     model: check → generate → charge on success). Placed AFTER the mock/
    //     demo short-circuit above, exactly where consumeCredits already applied,
    //     so mock/demo runs stay both uncharged and ungated.
    //     The failed attempt is still ledgered here — it mirrors the success:false
    //     UsageEvent consumeCredits used to write once the AI had already run.
    const preCheck = await checkCredits(userId, CREDIT_COSTS.GENERATE_COPY);
    if (!preCheck.allowed) {
      await logUsageEvent({
        userId,
        eventType: UsageEventType.GENERATE_COPY,
        creditsUsed: 0,
        success: false,
        errorMessage: 'Insufficient credits',
        endpoint: '/api/audience/service/generate-copy',
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
    const prompt = buildServiceCopyPrompt({
      strategy: strategy as any,
      uiblocks,
      oneLiner,
      businessName,
      offer,
      goal: goal as any,
      understanding: understanding as any,
      // Validated + mapped to an English exonym here (ruling 11).
      language: resolvePromptLanguage(language),
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
        // Generate permissively, then tolerate a collapsed collection-only section
        // (gpt-4o-mini sometimes makes `elements` the array itself) by rewrapping
        // before strict validation. A genuine miss still throws → retry.
        const raw = await generateRawJson('copy', currentPrompt, z.record(z.string(), z.any()));
        const normalized = normalizeServiceCopy(raw as Record<string, any>, uiblocks);
        sections = CopyResponseSchema.parse(normalized) as Record<string, SectionCopy>;
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

    // 5. Inject verbatim imported testimonials (before processing so defaults
    // still apply), then process — schema defaults + italic-em fallback.
    if (realTestimonials?.length) {
      sections = injectRealTestimonials(sections, realTestimonials);
    }
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
        endpoint: '/api/audience/service/generate-copy',
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
      // The charge failed AFTER generation → the output is DISCARDED (no free output).
      if (creditResult.error === 'charge_conflict') {
        // Solvent user, lost the write race → recoverable. The error code AND
        // message deliberately avoid the substring "credit": the client rails
        // regex-match /credit/i and would strand a paying user on the buy wall.
        logger.error(
          `[service-generate-copy] Charge conflict for user ${userId} — nothing charged, output discarded`
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
          creditsRequired: CREDIT_COSTS.GENERATE_COPY,
          creditsRemaining: creditResult.remaining,
        },
        402
      );
    }

    return createSecureResponse({
      success: true,
      sections: processed,
      creditsUsed: CREDIT_COSTS.GENERATE_COPY,
      creditsRemaining: creditResult.remaining,
      meta: {
        attempts,
        complete,
        mock: false,
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
