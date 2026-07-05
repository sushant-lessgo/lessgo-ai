/**
 * /api/v2/understand - Product understanding endpoint
 *
 * Flow:
 * 1. Validate request
 * 2. Auth check (1 credit)
 * 3. Build extraction prompt
 * 4. Call AI with structured outputs
 * 5. Consume credits, return understanding data
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
  UnderstandingResponseSchema,
  ServiceUnderstandingResponseSchema,
  ManufacturerUnderstandingResponseSchema,
} from '@/lib/schemas';
import { buildServiceUnderstandPrompt } from '@/modules/audience/service/promptUnderstand';
import { isManufacturerFlow } from '@/modules/audience/product/manufacturerFlow';
import { isDemoMode } from '@/lib/mockMode';

export const dynamic = 'force-dynamic';

// Request schema. audienceType selects the extraction schema + prompt; the
// shared plumbing (auth, credits, rate-limit, demo) is audience-agnostic.
// templateId (optional) carries the manufacturer signal (onboarding1, D1) —
// absent → SaaS extraction, unchanged.
const UnderstandRequestSchema = z.object({
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
  audienceType: z.enum(['product', 'service']).optional().default('product'),
  templateId: z.string().optional(),
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

// Manufacturer / trade-supplier extraction (onboarding1, D2/D3). Parallel to
// buildUnderstandPrompt — SaaS prompt above is untouched.
function buildManufacturerUnderstandPrompt(oneLiner: string): string {
  return `Extract manufacturer / trade-supplier information from this business description:

"${oneLiner}"

Return a JSON object with:
- whatYouMake: one clear sentence describing what this business manufactures or supplies (the physical goods, not the mission)
- industriesServed: 1-3 END-CUSTOMER verticals this business sells into (e.g., ["Hospitality", "Healthcare", "Security"])
- productCategories: 1-8 CONCRETE product types they make (e.g., ["Chef coats", "Scrubs", "Hi-vis jackets"])
- valueAdds: 1-8 CONCRETE differentiators (e.g., ["Custom embroidery", "Low MOQ", "48h dispatch", "In-house dyeing"])

STRICT RULES — no synonyms, no fluff:
- productCategories must be actual product types a buyer would order — NOT synonyms or restatements of the business itself ("uniforms", "workwear solutions" are NOT categories if the description names specific garments).
- industriesServed must be end-customer verticals — NEVER vague groups like "businesses", "professionals", or "companies".
- valueAdds must be concrete, verifiable capabilities or terms — NEVER quality-platitudes like "attention to detail", "commitment to quality", or "customer satisfaction".
- Extract only what is stated or strongly implied. Do not invent.`;
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

    const { oneLiner, audienceType, templateId } = validation.data;
    const isService = audienceType === 'service';
    const isManufacturer = !isService && isManufacturerFlow(templateId);

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

    // 2b. Check for demo/mock mode - return mock data without AI call
    if (isDemoMode(req)) {
      logger.info(
        `[understand] Using mock response (${isManufacturer ? 'manufacturer' : audienceType})`
      );
      return createSecureResponse({
        success: true,
        data: isManufacturer
          ? {
              whatYouMake:
                'We manufacture custom workwear and uniforms for institutional buyers',
              industriesServed: ['Hospitality', 'Healthcare', 'Security'],
              productCategories: [
                'Chef coats',
                'Scrubs',
                'Hi-vis jackets',
                'Corporate shirts',
              ],
              valueAdds: [
                'Custom embroidery',
                'Low MOQ',
                '48h dispatch',
                'In-house dyeing',
              ],
            }
          : isService
          ? {
              whatYouDo:
                'We help brands launch conversion-focused marketing sites that turn visitors into booked calls',
              services: ['Brand identity', 'Marketing site', 'Conversion copy'],
              targetClients: ['DTC founders', 'Early-stage SaaS teams'],
              outcomes: [
                'Launch-ready in 4 weeks',
                'Senior-only team',
                'Conversion-focused copy',
              ],
              deliveryModel: 'remote',
            }
          : {
              categories: ['SaaS', 'Productivity', 'Automation'],
              audiences: ['Small Business Owners', 'Entrepreneurs', 'Teams'],
              whatItDoes:
                'Helps users streamline their workflow and boost productivity',
              features: [
                'Easy setup in minutes',
                'Automated workflows',
                'Real-time analytics',
                'Team collaboration',
                'Custom integrations',
              ],
            },
        creditsUsed: 0,
        creditsRemaining: 999,
      });
    }

    // 3. Build prompt (audience-specific; manufacturer branches within product)
    const prompt = isService
      ? buildServiceUnderstandPrompt(oneLiner)
      : isManufacturer
      ? buildManufacturerUnderstandPrompt(oneLiner)
      : buildUnderstandPrompt(oneLiner);

    // 4. Call AI with structured outputs
    logger.dev('[understand] PROMPT:', prompt);

    let understandingData: any;
    try {
      understandingData = await generateWithSchema(
        'understand',
        [{ role: 'user', content: prompt }],
        isService
          ? ServiceUnderstandingResponseSchema
          : isManufacturer
          ? ManufacturerUnderstandingResponseSchema
          : UnderstandingResponseSchema,
        isService
          ? 'service_understanding'
          : isManufacturer
          ? 'manufacturer_understanding'
          : 'understanding'
      );
      logger.dev('[understand] RESPONSE:', understandingData);
    } catch (error: any) {
      logger.error('AI understand call failed:', error);
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
        metadata: isService
          ? {
              audienceType,
              oneLinerLength: oneLiner.length,
              servicesCount: understandingData.services.length,
              targetClientsCount: understandingData.targetClients.length,
              outcomesCount: understandingData.outcomes.length,
            }
          : isManufacturer
          ? {
              audienceType,
              extractionShape: 'manufacturer',
              oneLinerLength: oneLiner.length,
              industriesServedCount: understandingData.industriesServed.length,
              productCategoriesCount: understandingData.productCategories.length,
              valueAddsCount: understandingData.valueAdds.length,
            }
          : {
              audienceType,
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
