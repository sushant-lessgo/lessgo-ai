/**
 * /api/audience/work/regenerate-story — WORK story-interview (Sugarman) regen.
 *
 * Design decision #6: the work story section regenerates on the SAME strong
 * `work-copy` path phase-3 generate-copy uses (contract-validated), NOT the
 * legacy /api/regenerate-section (hard-coded gpt-3.5-turbo/Mixtral, unvalidated
 * coercion). /api/regenerate-section stays byte-identical.
 *
 *  1. Guards: requireAICredits(SECTION_REGEN, 2) — SAME cost/event as
 *     regenerate-section, NO new credit event — then assertProjectOwner (owner
 *     gate BEFORE any charge/cross-tenant read; skipped in mock/demo).
 *  2. Validate the body (tokenId + sectionId + the 3 interview answers). The
 *     Brief is NOT client-supplied — it is resolved SERVER-side from the
 *     project row (behind the owner gate) and read via getWorkFacts.
 *  3. Derive price position + voice (pure code); build the story-interview prompt.
 *  4. Call the AI raw JSON on endpoint 'work-copy' (same strong model as phase-3
 *     copy), server-side retry (MAX_RETRIES=2).
 *  5. parseWorkCopy (the phase-3 work parser) → VALIDATE the `about` shape
 *     against workElementContract.about (validateStoryAbout) — reject on
 *     mismatch BEFORE returning.
 *  6. Return `content` (the about elements) for the CLIENT to apply — the route
 *     does NOT persist (mirrors regenerate-section's contract). Carry meta.mock.
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSecureResponse, assertProjectOwner } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAICredits } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { generateRawJson } from '@/lib/aiClient';
import { CopyResponseSchema } from '@/lib/schemas/copy.schema';
import type { SectionCopy } from '@/types/generation';
import { prisma } from '@/lib/prisma';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import { derivePricePosition } from '@/modules/audience/work/pricePosition';
import {
  selectWorkVoice,
  type Establishment,
  type WorkProfessionRow,
} from '@/modules/audience/work/voice';
import { DEFAULT_ESTABLISHMENT } from '@/modules/audience/work/slimStrategy';
import { buildWorkCopyRetryPrompt } from '@/modules/audience/work/copyPrompt';
import {
  buildStoryInterviewPrompt,
  validateStoryAbout,
  STORY_SECTION_KEY,
} from '@/modules/audience/work/storyInterview';
import { parseWorkCopy } from '@/modules/audience/work/parseCopy';
import { generateMockWorkCopy } from '@/modules/prompt/mockResponseGeneratorWork';

export const dynamic = 'force-dynamic';

const DEMO_TOKEN = 'lessgodemomockdata';
const MAX_RETRIES = 2;

const InterviewAnswersSchema = z.object({
  origin: z.string(),
  moment: z.string(),
  belief: z.string(),
});

const RegenerateStoryRequestSchema = z.object({
  tokenId: z.string().min(1),
  sectionId: z.string().min(1),
  interviewAnswers: InterviewAnswersSchema,
});

// The identity uiblocks map for the single about section (parity with the copy
// route — the parser resolves the section's contract schema through this).
const ABOUT_UIBLOCKS = { [STORY_SECTION_KEY]: STORY_SECTION_KEY } as const;

async function regenerateStoryHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Auth + credits — SAME cost/event as regenerate-section (NO new event).
    //    Safe AHEAD of the owner gate: it authenticates and reads only the
    //    caller's OWN plan/usage — no cross-tenant read and no charge (the
    //    charge is consumeCredits, below, after generation).
    const creditCheck = await requireAICredits(
      req,
      UsageEventType.SECTION_REGEN,
      CREDIT_COSTS.SECTION_REGENERATION
    );
    if (!creditCheck.allowed) {
      return creditCheck.response!;
    }
    const userId = creditCheck.userId!;

    // 2. Validate the body.
    const body = await req.json();
    const validation = RegenerateStoryRequestSchema.safeParse(body);
    if (!validation.success) {
      logger.error('[work-regenerate-story] Validation failed:', validation.error.issues);
      return createSecureResponse(
        { success: false, error: 'validation_error', details: validation.error.issues },
        400
      );
    }
    const { tokenId, sectionId, interviewAnswers } = validation.data;

    const isMock =
      process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true' || tokenId === DEMO_TOKEN;

    // 2b. Mock mode — canned, renderable about; parseWorkCopy + validation still
    //     run. Runs BEFORE the owner gate / Brief read / facts guard: the demo
    //     token has NO Project row (assertProjectOwner short-circuits it), so
    //     the mock path must not require one, nor resolvable facts. Voice/price
    //     are unused here (generateMockWorkCopy is canned/facts-agnostic).
    if (isMock) {
      const mockRaw = generateMockWorkCopy({
        facts: {},
        sections: [STORY_SECTION_KEY],
      }) as Record<string, SectionCopy>;
      const processed = parseWorkCopy(mockRaw, ABOUT_UIBLOCKS, undefined);
      const check = validateStoryAbout(processed);
      if (!check.valid) {
        return createSecureResponse(
          { success: false, error: 'generation_failed', message: check.reason, recoverable: true },
          500
        );
      }
      return createSecureResponse({
        success: true,
        content: processed[STORY_SECTION_KEY]?.elements ?? {},
        sectionId,
        regenerationType: 'story',
        creditsUsed: 0,
        creditsRemaining: 999,
        meta: { attempts: 0, mock: true },
      });
    }

    // 2c. Ownership gate — BEFORE any charge or cross-tenant read (mirrors
    //     regenerate-section).
    const access = await assertProjectOwner(userId, tokenId, {
      action: 'regenerate-story',
    });
    if (!access.ok) {
      return createSecureResponse({ success: false, error: access.error }, access.status);
    }

    // 2d. Resolve the Brief SERVER-side (never client-supplied). The owner gate
    //     above selects `userId` only, so this is a separate read — behind the
    //     gate. Plain cast, not a parse: getWorkFacts safeParses the work bag.
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { brief: true },
    });
    const storedBrief = project?.brief as
      | { businessType?: string; facts?: Record<string, unknown> }
      | null
      | undefined;

    // 2e. Work facts guard. (A missing project row is unreachable in production
    //     — assertProjectOwner already 404s it above — but the branch stays
    //     defensive rather than relying on that ordering.)
    const facts = getWorkFacts(storedBrief?.facts);
    if (!facts) {
      return createSecureResponse(
        {
          success: false,
          error: 'validation_error',
          message: 'brief.facts.work is required for work story regeneration',
        },
        400
      );
    }

    // 3. Derive price position + voice (pure code) from the STORED Brief.
    const pricePosition = derivePricePosition(facts);
    const establishment: Establishment = facts.establishment ?? DEFAULT_ESTABLISHMENT;
    const professionRow: WorkProfessionRow | null = storedBrief?.businessType
      ? ({ key: storedBrief.businessType } as WorkProfessionRow)
      : null;
    const voice = selectWorkVoice({ professionRow, pricePosition, establishment });

    // 4. Build the story-interview prompt + AI loop (server-side retry ×2).
    const prompt = buildStoryInterviewPrompt({ answers: interviewAnswers, facts, voice });
    logger.dev('[work-regenerate-story] PROMPT:', prompt);

    let processed: Record<string, SectionCopy> | null = null;
    let lastError: string | null = null;
    let attempts = 0;
    let currentPrompt = prompt;

    while (attempts <= MAX_RETRIES && !processed) {
      attempts++;
      try {
        const response = await generateRawJson('work-copy', currentPrompt, CopyResponseSchema);
        // 5. Parse + VALIDATE the `about` shape against the contract.
        const parsed = parseWorkCopy(
          response as Record<string, SectionCopy>,
          ABOUT_UIBLOCKS,
          facts.praise
        );
        const check = validateStoryAbout(parsed);
        if (!check.valid) {
          lastError = check.reason ?? 'invalid story shape';
          logger.warn(`[work-regenerate-story] Attempt ${attempts} rejected: ${lastError}`);
          if (attempts <= MAX_RETRIES) {
            currentPrompt = buildWorkCopyRetryPrompt(prompt, lastError, '');
          }
          continue;
        }
        processed = parsed;
      } catch (aiError: any) {
        lastError = aiError?.message || 'AI generation failed';
        logger.error(`[work-regenerate-story] Attempt ${attempts} failed:`, aiError);
        if (attempts <= MAX_RETRIES) {
          currentPrompt = buildWorkCopyRetryPrompt(prompt, lastError || 'Unknown error', '');
        }
      }
    }

    if (!processed) {
      return createSecureResponse(
        {
          success: false,
          error: 'generation_failed',
          message: lastError || 'Failed to generate a valid story after retries',
          recoverable: true,
        },
        500
      );
    }

    // 6. Credits — SAME event/cost as regenerate-section (NO new event).
    const consumption = await consumeCredits(
      userId,
      UsageEventType.SECTION_REGEN,
      CREDIT_COSTS.SECTION_REGENERATION,
      {
        endpoint: '/api/audience/work/regenerate-story',
        duration: Date.now() - startTime,
        sectionId,
        metadata: { version: 'work-story', attempts },
      }
    );
    if (!consumption.success) {
      // The charge failed AFTER generation → the output is DISCARDED (no free
      // output). The requireAICredits pre-gate above already 402s a 0-credit
      // user before any AI work; this is the check→charge race loser.
      if (consumption.error === 'charge_conflict') {
        // Solvent user, lost the write race → recoverable. The error code AND
        // message deliberately avoid the substring "credit": the client rails
        // regex-match /credit/i and would strand a paying user on the buy wall.
        logger.error(
          `[work-regenerate-story] Charge conflict for user ${userId} — nothing charged, output discarded`
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
          message: consumption.error || 'Insufficient credits',
          creditsRequired: CREDIT_COSTS.SECTION_REGENERATION,
          creditsRemaining: consumption.remaining,
        },
        402
      );
    }

    // Return the about elements for the CLIENT to apply — route does NOT persist.
    return createSecureResponse({
      success: true,
      content: processed[STORY_SECTION_KEY]?.elements ?? {},
      sectionId,
      regenerationType: 'story',
      creditsUsed: CREDIT_COSTS.SECTION_REGENERATION,
      creditsRemaining: consumption.remaining,
      meta: { attempts, mock: false },
    });
  } catch (error: any) {
    logger.error('[work-regenerate-story] Endpoint error:', error);
    return createSecureResponse(
      {
        success: false,
        error: 'internal_error',
        message: error?.message || 'An unexpected error occurred',
        recoverable: true,
      },
      500
    );
  }
}

export const POST = withAIRateLimit(regenerateStoryHandler);
