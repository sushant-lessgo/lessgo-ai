/**
 * /api/audience/product/generate-copy — Meridian product copy generation (P3)
 *
 * Mirrors /api/audience/service/generate-copy:
 *  1. Validate request (assembled product strategy + uiblocks + product inputs)
 *  2. Auth + credits check (3 credits, reuses GENERATE_COPY cost)
 *  3. Build copy prompt with the Meridian "Modern Tech" voice
 *  4. Call AI raw JSON (CopyResponseSchema is z.record — no structured outputs)
 *     with retry on parse failure (max 2 retries)
 *  5. processProductCopy = schema defaults + recursive id backfill + accent-<em>
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
import { CopyResponseSchema } from '@/lib/schemas/copy.schema';
import {
  buildProductCopyPrompt,
  buildProductCopyRetryPrompt,
} from '@/modules/audience/product/copyPrompt';
import {
  processProductCopy,
  autoMapLinkHrefs,
  validateProductCopyCompleteness,
  injectRealTestimonials,
} from '@/modules/audience/product/parseCopy';
import { generateMockMeridianCopy } from '@/modules/prompt/mockResponseGeneratorProduct';
import { landingGoals } from '@/types/generation';
import type { SectionCopy } from '@/types/generation';

export const dynamic = 'force-dynamic';

const DEMO_TOKEN = 'lessgodemomockdata';
const MAX_RETRIES = 2;

const AssembledStrategySchema = z.object({
  awareness: z.enum([
    'problem-aware-cold',
    'problem-aware-hot',
    'solution-aware-skeptical',
    'solution-aware-eager',
  ]),
  oneReader: z.object({
    personaDescription: z.string(),
    pain: z.array(z.string()),
    desire: z.array(z.string()),
    objections: z.array(z.string()),
  }),
  oneIdea: z.object({
    bigBenefit: z.string(),
    uniqueMechanism: z.string(),
    reasonToBelieve: z.string(),
  }),
  featureAnalysis: z.array(
    z.object({
      feature: z.string(),
      benefit: z.string(),
      benefitOfBenefit: z.string(),
    })
  ),
  sections: z.array(z.string()),
  uiblocks: z.record(z.string()),
});

const GenerateProductCopyRequestSchema = z.object({
  strategy: AssembledStrategySchema,
  uiblocks: z.record(z.string()),
  productName: z.string().min(1),
  oneLiner: z.string().min(10),
  offer: z.string().min(1),
  landingGoal: z.enum(landingGoals as unknown as [string, ...string[]]),
  features: z.array(z.string()),
  // Real testimonials imported from the user's website — injected verbatim,
  // overriding AI-invented quotes. Optional; omitted on the manual path.
  realTestimonials: z
    .array(
      z.object({
        quote: z.string(),
        author_name: z.string(),
        author_role: z.string(),
      })
    )
    .optional(),
});

async function productCopyHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Validate
    const body = await req.json();
    const validation = GenerateProductCopyRequestSchema.safeParse(body);
    if (!validation.success) {
      logger.error('[product-generate-copy] Validation failed:', validation.error.issues);
      return createSecureResponse(
        { success: false, error: 'validation_error', details: validation.error.issues },
        400
      );
    }
    const {
      strategy,
      uiblocks,
      productName,
      oneLiner,
      offer,
      landingGoal,
      features,
      realTestimonials,
    } = validation.data;

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
      logger.info('[Product Copy] Using mock response');
      const mockSections = generateMockMeridianCopy({
        strategy: strategy as any,
        uiblocks,
        productName,
        oneLiner,
        offer,
      });
      const withReal = realTestimonials?.length
        ? injectRealTestimonials(mockSections, realTestimonials)
        : mockSections;
      const processed = autoMapLinkHrefs(
        processProductCopy(withReal, uiblocks),
        new Set(Object.keys(uiblocks))
      );
      return createSecureResponse({
        success: true,
        sections: processed,
        creditsUsed: 0,
        creditsRemaining: 999,
        meta: { attempts: 0, complete: true },
      });
    }

    // 3. Build prompt
    const prompt = buildProductCopyPrompt({
      strategy: strategy as any,
      uiblocks,
      productName,
      oneLiner,
      offer,
      landingGoal: landingGoal as any,
      features,
    });
    logger.dev('[product-generate-copy] PROMPT:', prompt);

    // 4. AI loop
    let sections: Record<string, SectionCopy> | null = null;
    let lastError: string | null = null;
    let attempts = 0;
    let currentPrompt = prompt;

    while (attempts <= MAX_RETRIES && !sections) {
      attempts++;
      logger.dev(`[product-generate-copy] Attempt ${attempts}/${MAX_RETRIES + 1}`);
      try {
        const response = await generateRawJson('copy', currentPrompt, CopyResponseSchema);
        sections = response as Record<string, SectionCopy>;
      } catch (aiError: any) {
        lastError = aiError.message || 'AI generation failed';
        logger.error(`[product-generate-copy] Attempt ${attempts} failed:`, aiError);
        if (attempts <= MAX_RETRIES) {
          currentPrompt = buildProductCopyRetryPrompt(prompt, lastError || 'Unknown error', '');
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

    // 5. Inject verbatim website testimonials (before processing so backfill
    //    assigns collection ids), then schema defaults + id backfill + accent-<em>.
    if (realTestimonials?.length) {
      sections = injectRealTestimonials(sections, realTestimonials);
    }
    let processed = processProductCopy(sections, uiblocks);
    // Auto-map nav/footer link targets to on-page section anchors by label
    // (user-overridable in the editor). presentTypes = section types on this page.
    processed = autoMapLinkHrefs(processed, new Set(Object.keys(uiblocks)));

    const { complete, missingSections } = validateProductCopyCompleteness(processed, uiblocks);
    if (!complete) {
      logger.warn('[product-generate-copy] Copy incomplete, missing sections:', missingSections);
    }

    // 6. Credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.GENERATE_COPY,
      CREDIT_COSTS.GENERATE_COPY,
      {
        endpoint: '/api/audience/product/generate-copy',
        duration: Date.now() - startTime,
        metadata: {
          version: 'product-meridian',
          landingGoal,
          sectionsGenerated: Object.keys(processed).length,
          attempts,
        },
      }
    );
    if (!creditResult.success) {
      logger.warn(`[product-generate-copy] Credit consumption failed for user ${userId}: ${creditResult.error}`);
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
    logger.error('[product-generate-copy] Endpoint error:', error);
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

export const POST = withAIRateLimit(productCopyHandler);
