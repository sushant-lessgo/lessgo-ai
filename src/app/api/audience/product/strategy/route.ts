/**
 * /api/audience/product/strategy — Meridian product strategy generation (P3)
 *
 * Mirrors /api/audience/service/strategy:
 *  1. Validate request (product shape: productName + oneLiner + features +
 *     landingGoal + offer + audience + categories; asset flags optional/ignored)
 *  2. Auth + credits check (2 credits, reuses STRATEGY_GENERATION cost)
 *  3. Build LEAN product strategy prompt (awareness/oneReader/oneIdea/featureAnalysis)
 *  4. Call AI with structured outputs (ProductStrategyResponseSchema — no vibe/decisions)
 *  5. Assemble with the deterministic fixed section list + Meridian block map
 *  6. Consume credits, return assembled ProductStrategyOutput
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAuth } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { generateWithSchema } from '@/lib/aiClient';
import {
  ProductStrategyResponseSchema,
  ProductStrategyWithSitemapSchema,
} from '@/lib/schemas/productStrategy.schema';
import { buildProductStrategyPrompt } from '@/modules/audience/product/strategy/promptsProduct';
import { isManufacturerFlow } from '@/modules/audience/product/manufacturerFlow';
import type { ProductVoiceId } from '@/modules/audience/product/voice';
import {
  getPageArchetypesForTemplate,
  isMultipage,
} from '@/modules/audience/product/pageArchetypes';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { capabilityIds } from '@/types/brief';
import { assembleProductStrategy } from '@/modules/audience/product/strategy/parseStrategyProduct';
import { generateMockMeridianStrategy } from '@/modules/prompt/mockResponseGeneratorProduct';
import { landingGoals } from '@/types/generation';

export const dynamic = 'force-dynamic';

const DEMO_TOKEN = 'lessgodemomockdata';

const ProductStrategyRequestSchema = z.object({
  productName: z.string().min(1, 'Product name required'),
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
  features: z.array(z.string()).min(1, 'At least one feature required'),
  landingGoal: z.enum(landingGoals as unknown as [string, ...string[]]),
  offer: z.string().min(1, 'Offer required'),
  primaryAudience: z.string().min(1, 'Primary audience required'),
  otherAudiences: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  // Pilot locks palette/variant (mint/developer); accept-but-ignore for forward-compat.
  paletteId: z.string().optional(),
  // Asset flags — optional-but-ignored (forward-compat for P4 onboarding; pilot is fixed-7).
  hasTestimonials: z.boolean().optional(),
  hasSocialProof: z.boolean().optional(),
  hasConcreteResults: z.boolean().optional(),
  hasDemoVideo: z.boolean().optional(),
  // Manufacturer flow (onboarding1 D3): what the business makes — fed to the
  // strategy prompt's manufacturer branch only.
  whatYouMake: z.string().optional(),
  // Template-aware assembly (whitelist). Fed ONLY to assembleProductStrategy —
  // never to the prompt builder (firewall). vestria is admin-gated until GA metering.
  templateId: z.enum(['meridian', 'vestria']).optional(),
  // Proof hard rule (scale-06 phase 4) — OPTIONAL + additive. Absent ⇒ current
  // behavior (the OLD product wizard, which never sends this, is byte-identical).
  // When present, an unpromised proof section is dropped from the assembled
  // strategy so it is never generated. Fed ONLY to assembleProductStrategy.
  proof: z
    .object({
      hasTestimonials: z.boolean().optional(),
    })
    .optional(),
  // scale-07 phase 5 (phase-4 carryover a) — OPTIONAL + additive. The resolved
  // Brief (all fields optional in BriefSchema) + explicit capability inclusions
  // are fed ONLY to isMultipage detection + assembleProductStrategy so
  // Brief-required capability sections (meridian: M1 ⇒ lead-form ⇒ cta;
  // packages ⇒ pricing) re-enter the single-page list. NEVER fed to the prompt
  // builder (firewall). Absent ⇒ engine-core-only behavior (old senders are
  // byte-identical).
  brief: BriefSchema.optional(),
  requiredCapabilities: z.array(z.enum(capabilityIds)).optional(),
});

async function productStrategyHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Validate
    const body = await req.json();
    const validation = ProductStrategyRequestSchema.safeParse(body);
    if (!validation.success) {
      return createSecureResponse(
        { success: false, error: 'validation_error', details: validation.error.issues },
        400
      );
    }
    const data = validation.data;

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
      logger.info('[Product Strategy] Using mock response');
      const mockStrategy = generateMockMeridianStrategy({
        productName: data.productName,
        oneLiner: data.oneLiner,
        features: data.features,
        primaryAudience: data.primaryAudience,
        templateId: data.templateId,
        // scale-06 phase 5: honor the proof hard rule in mock mode too, so
        // mock/DEMO_TOKEN runs agree with the real assembleProductStrategy path.
        proof: data.proof,
      });
      return createSecureResponse({
        success: true,
        data: mockStrategy,
        creditsUsed: 0,
        creditsRemaining: 999,
      });
    }

    // 3. Build prompt. Multi-page runs (template declares the `multipage`
    //    capability; Brief structure.mode / businessType default can override —
    //    scale-07 phase 5 re-key) get the page-archetype MENU (capability data —
    //    templateId itself never reaches the prompt layer); single-page runs
    //    (meridian) get the exact prompt as before.
    const pageArchetypes = isMultipage(data.templateId, data.brief)
      ? getPageArchetypesForTemplate(data.templateId) ?? undefined
      : undefined;
    // Voice derivation (D4) — same pattern as generate-copy: the prompt layer
    // receives the derived VOICE, never templateId itself (firewall).
    const voiceId: ProductVoiceId = isManufacturerFlow(data.templateId)
      ? 'tailored-trade'
      : 'modern-tech';
    const prompt = buildProductStrategyPrompt({
      productName: data.productName,
      oneLiner: data.oneLiner,
      features: data.features,
      landingGoal: data.landingGoal as any,
      offer: data.offer,
      primaryAudience: data.primaryAudience,
      otherAudiences: data.otherAudiences,
      categories: data.categories,
      voiceId,
      whatYouMake: data.whatYouMake,
      pageArchetypes,
    });
    logger.dev('[product-strategy] PROMPT:', prompt);

    // 4. Call AI with structured outputs (sitemap-extended schema only when a
    //    menu exists — meridian responses stay byte-identical)
    let llmResponse;
    try {
      llmResponse = pageArchetypes
        ? await generateWithSchema(
            'strategy',
            [{ role: 'user', content: prompt }],
            ProductStrategyWithSitemapSchema,
            'productStrategySitemap'
          )
        : await generateWithSchema(
            'strategy',
            [{ role: 'user', content: prompt }],
            ProductStrategyResponseSchema,
            'productStrategy'
          );
      logger.info('[Product Strategy] Awareness:', llmResponse.awareness);
    } catch (aiError: any) {
      logger.error('[Product Strategy] AI call failed:', aiError);
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

    // 5. Assemble (deterministic per-template sections + block map; templateId
    //    is assembly-only — the prompt above never saw it). brief +
    //    requiredCapabilities (carryover a) let the single-page path re-surface
    //    Brief-required capability sections (meridian cta/pricing).
    const strategyData = assembleProductStrategy({
      llmResponse,
      templateId: data.templateId,
      proof: data.proof,
      brief: data.brief,
      requiredCapabilities: data.requiredCapabilities,
    });
    logger.info('[Product Strategy] Final sections:', strategyData.sections);
    logger.info('[Product Strategy] Final UIBlocks:', strategyData.uiblocks);

    // 6. Consume credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.STRATEGY_GENERATION,
      CREDIT_COSTS.STRATEGY_GENERATION,
      {
        endpoint: '/api/audience/product/strategy',
        duration: Date.now() - startTime,
        metadata: {
          version: 'product-meridian',
          landingGoal: data.landingGoal,
          awareness: strategyData.awareness,
          sectionsCount: strategyData.sections.length,
        },
      }
    );
    if (!creditResult.success) {
      logger.warn(`[Product Strategy] Credit consumption failed for user ${userId}: ${creditResult.error}`);
    }

    return createSecureResponse({
      success: true,
      data: strategyData,
      creditsUsed: CREDIT_COSTS.STRATEGY_GENERATION,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    logger.error('[Product Strategy] Endpoint error:', error);
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

export const POST = withAIRateLimit(productStrategyHandler);
