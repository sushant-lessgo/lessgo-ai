/**
 * /api/audience/work/generate-copy — WORK per-page copy generation (plan phase 3).
 *
 * MIRRORS /api/audience/product/generate-copy:
 *  1. Validate request (assembled work strategy + page + uiblocks + Brief).
 *  2. Auth + credits (reuses GENERATE_COPY cost/event — NO new credit event).
 *  3. Derive price position + voice (pure code); build the FACTS-BOUND copy
 *     prompt (WORK LIBRARY, verbatim prices, anti-invention, anti-padding,
 *     primary-language directive — NEVER templateId).
 *  4. Call the AI raw JSON on endpoint 'work-copy' (CopyResponseSchema is
 *     z.record — no structured outputs), server-side retry (MAX_RETRIES=2).
 *  5. parseWorkCopy = contract defaults + VERBATIM praise injection + id backfill.
 *  6. Consume credits, return the sections map + degraded meta signals.
 *
 * STRUCTURE comes from the strategy sitemap / page.sections — NOT the inert
 * uiblocks identity map (which is passed for parity + schema resolution only).
 *
 * Mock path (NEXT_PUBLIC_USE_MOCK_GPT or the DEMO_TOKEN bearer) returns canned,
 * renderable copy with meta.mock and burns no credits.
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
import { CopyResponseSchema } from '@/lib/schemas/copy.schema';
import type { SectionCopy } from '@/types/generation';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import { derivePricePosition } from '@/modules/audience/work/pricePosition';
import {
  selectWorkVoice,
  type Establishment,
  type WorkProfessionRow,
} from '@/modules/audience/work/voice';
import { DEFAULT_ESTABLISHMENT } from '@/modules/audience/work/slimStrategy';
import {
  buildWorkCopyPrompt,
  buildWorkCopyRetryPrompt,
  type WorkCopyPage,
} from '@/modules/audience/work/copyPrompt';
import type { WorkStrategyOutput } from '@/modules/audience/work/strategy/parseStrategyWork';
import {
  parseWorkCopy,
  validateWorkCopyCompleteness,
} from '@/modules/audience/work/parseCopy';
import { generateMockWorkCopy } from '@/modules/prompt/mockResponseGeneratorWork';
import {
  getFreshSiteContext,
  normalizeUrlKey,
  buildSiteContextPromptBlock,
} from '@/lib/siteContext';

export const dynamic = 'force-dynamic';

const DEMO_TOKEN = 'lessgodemomockdata';
const MAX_RETRIES = 2;

// The assembled work strategy (WorkStrategyOutput). Permissive (passthrough) —
// the deterministic half is produced by our own assembler, not user input; we
// only assert the fields the prompt/parse read.
const WorkStrategySchema = z
  .object({
    positioningAngle: z.string(),
    storyAngle: z.string(),
    voiceNotes: z.array(z.string()),
    sections: z.array(z.string()),
    uiblocks: z.record(z.string()),
    sitemap: z.array(
      z.object({
        archetypeKey: z.string(),
        title: z.string(),
        pathSlug: z.string(),
        sections: z.array(z.string()),
      })
    ),
    archetype: z.string(),
    leadGroups: z.array(z.string()),
    storyBranch: z.enum(['new', 'established']),
    primaryLanguage: z.string(),
    wording: z.record(z.any()),
  })
  .passthrough();

const WorkCopyPageSchema = z.object({
  archetypeKey: z.string().min(1),
  title: z.string().min(1),
  pathSlug: z.string().min(1),
  isHome: z.boolean(),
  sections: z.array(z.string()).min(1),
});

const GenerateWorkCopyRequestSchema = z.object({
  strategy: WorkStrategySchema,
  // Which page of the sitemap THIS call writes. Absent ⇒ default to home.
  page: WorkCopyPageSchema.optional(),
  // Section → contract section type (identity map). Passed for parity + schema
  // resolution; NOT the source of page structure.
  uiblocks: z.record(z.string()).optional(),
  // The resolved Brief carries facts.work (read via getWorkFacts).
  brief: BriefSchema,
  // SiteContext lookup key — the SERVER fetches facts/excerpts; never trust a
  // client-passed content blob.
  sourceUrl: z.string().url().optional(),
});

async function workCopyHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Validate.
    const body = await req.json();
    const validation = GenerateWorkCopyRequestSchema.safeParse(body);
    if (!validation.success) {
      logger.error('[work-generate-copy] Validation failed:', validation.error.issues);
      return createSecureResponse(
        { success: false, error: 'validation_error', details: validation.error.issues },
        400
      );
    }
    const { strategy, page, uiblocks, brief, sourceUrl } =
      validation.data as unknown as {
        strategy: WorkStrategyOutput;
        page?: WorkCopyPage;
        uiblocks?: Record<string, string>;
        brief: typeof validation.data.brief;
        sourceUrl?: string;
      };

    // 1b. Work facts.
    const facts = getWorkFacts(brief.facts);
    if (!facts) {
      return createSecureResponse(
        {
          success: false,
          error: 'validation_error',
          message: 'brief.facts.work is required for work copy generation',
        },
        400
      );
    }

    // 1c. Resolve the page to write (default = home: chrome-inclusive sections).
    const home = strategy.sitemap[0];
    const targetPage: WorkCopyPage = page ?? {
      archetypeKey: home?.archetypeKey ?? 'home',
      title: home?.title ?? 'Home',
      pathSlug: home?.pathSlug ?? '/',
      isHome: true,
      sections: strategy.sections,
    };

    // Ensure uiblocks covers every section on the page (identity fallback — work
    // uiblocks map section → contract section type, which is the section key).
    const pageUiblocks: Record<string, string> = {};
    for (const section of targetPage.sections) {
      pageUiblocks[section] = uiblocks?.[section] ?? section;
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
    const professionRow: WorkProfessionRow | null = brief.businessType
      ? ({ key: brief.businessType } as WorkProfessionRow)
      : null;

    // 2b. Mock mode — canned, renderable copy; parseWorkCopy still runs.
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true' || token === DEMO_TOKEN) {
      logger.warn(
        '[Work Copy] Using MOCK response — no real copy generated (NEXT_PUBLIC_USE_MOCK_GPT or demo token)'
      );
      const mockRaw = generateMockWorkCopy({
        facts,
        sections: targetPage.sections,
      }) as Record<string, SectionCopy>;
      const processed = parseWorkCopy(mockRaw, pageUiblocks, facts.praise, facts.groups);
      const { complete, missingSections } = validateWorkCopyCompleteness(
        processed,
        pageUiblocks
      );
      return createSecureResponse({
        success: true,
        sections: processed,
        creditsUsed: 0,
        creditsRemaining: 999,
        meta: {
          attempts: 0,
          complete,
          mock: true,
          missingSections: complete ? undefined : missingSections,
        },
      });
    }

    // 2b-bis. Credit PRE-GATE — check the balance BEFORE any AI work (one
    //     charging model: check → generate → charge on success). Placed AFTER the
    //     mock/demo short-circuit above, exactly where consumeCredits already
    //     applied, so mock/demo runs stay both uncharged and ungated.
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
        endpoint: '/api/audience/work/generate-copy',
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

    // 2c. SiteContext — SERVER-side lookup by sourceUrl (facts = claim backbone,
    //     excerpts = tone-only). Absent/stale → empty block. Never blocks.
    let siteContextBlock = '';
    if (sourceUrl) {
      try {
        const ctx = await getFreshSiteContext(normalizeUrlKey(sourceUrl), 'work');
        if (ctx) siteContextBlock = buildSiteContextPromptBlock(ctx.facts, ctx.excerpts);
      } catch (e) {
        logger.warn('[work-generate-copy] SiteContext lookup failed (continuing without):', e as Error);
      }
    }

    // 3. Derive price position + voice (pure code), then build the copy prompt.
    const pricePosition = derivePricePosition(facts);
    const establishment: Establishment = facts.establishment ?? DEFAULT_ESTABLISHMENT;
    const voice = selectWorkVoice({ professionRow, pricePosition, establishment });
    const prompt = buildWorkCopyPrompt({
      strategy,
      page: targetPage,
      facts,
      voice,
      siteContextBlock,
    });
    logger.dev('[work-generate-copy] PROMPT:', prompt);

    // 4. AI loop (server-side retry ×2).
    let sections: Record<string, SectionCopy> | null = null;
    let lastError: string | null = null;
    let attempts = 0;
    let currentPrompt = prompt;

    while (attempts <= MAX_RETRIES && !sections) {
      attempts++;
      logger.dev(`[work-generate-copy] Attempt ${attempts}/${MAX_RETRIES + 1}`);
      try {
        const response = await generateRawJson('work-copy', currentPrompt, CopyResponseSchema);
        sections = response as Record<string, SectionCopy>;
      } catch (aiError: any) {
        lastError = aiError.message || 'AI generation failed';
        logger.error(`[work-generate-copy] Attempt ${attempts} failed:`, aiError);
        if (attempts <= MAX_RETRIES) {
          currentPrompt = buildWorkCopyRetryPrompt(prompt, lastError || 'Unknown error', '');
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

    // 5. Parse: contract defaults + VERBATIM praise injection + verbatim package
    //    bullets (facts.groups) + id backfill. `facts.groups` is threaded here on
    //    the SAME first-gen path as `facts.praise` (mirrors the injectPraise data-
    //    flow) so injectPackages' facts-verbatim bullets are LIVE on first-gen.
    const processed = parseWorkCopy(sections, pageUiblocks, facts.praise, facts.groups);
    const { complete, missingSections } = validateWorkCopyCompleteness(processed, pageUiblocks);
    if (!complete) {
      logger.warn('[work-generate-copy] Copy incomplete, missing sections:', missingSections);
    }

    // 6. Credits — SAME event/cost as the product/service copy call (no new event).
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.GENERATE_COPY,
      CREDIT_COSTS.GENERATE_COPY,
      {
        endpoint: '/api/audience/work/generate-copy',
        duration: Date.now() - startTime,
        metadata: {
          version: 'work',
          page: targetPage.pathSlug,
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
          `[work-generate-copy] Charge conflict for user ${userId} — nothing charged, output discarded`
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
    logger.error('[work-generate-copy] Endpoint error:', error);
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

export const POST = withAIRateLimit(workCopyHandler);
