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
  EntryUnderstandSchema,
  entryClassificationPromptBlock,
  entryPrefillDeltaPromptBlock,
} from '@/lib/schemas';
import { buildServiceUnderstandPrompt } from '@/modules/audience/service/promptUnderstand';
import { isManufacturerFlow } from '@/modules/audience/product/manufacturerFlow';
import { isDemoMode } from '@/lib/mockMode';
// Entry mode (scale-02 phase 3, D6): pure brief module — engine resolution +
// Brief construction happen server-side here, never in the AI call.
import { buildBriefDraft, type EntrySignals } from '@/modules/brief/classify';
// scale-06 phase 7: businessType-keyed extraction. The wizard/entry path selects
// its extraction schema by businessType (never by audienceType/templateId).
import { businessTypeKeys, type BusinessTypeKey } from '@/modules/businessTypes/config';
import { extractionForBusinessType, hasEntryEnrichment } from '@/lib/schemas/extraction';

export const dynamic = 'force-dynamic';

// Request schema. audienceType selects the extraction schema + prompt; the
// shared plumbing (auth, credits, rate-limit, demo) is audience-agnostic.
// templateId (optional) carries the manufacturer signal (onboarding1, D1) —
// absent → SaaS extraction, unchanged.
const UnderstandRequestSchema = z.object({
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
  audienceType: z.enum(['product', 'service']).optional().default('product'),
  templateId: z.string().optional(),
  // Entry-mode classification flag (scale-02 phase 3). Absent/false ⇒ the
  // route behaves byte-identically to before; true ⇒ EntryUnderstandSchema
  // + classification prompt + server-side briefDraft.
  entry: z.boolean().optional(),
  // scale-06 phase 7: OPTIONAL businessType for the wizard/entry path. When the
  // caller already knows the businessType (e.g. a wizard re-extraction), the
  // entry schema is ENRICHED with that engine's extraction fields via the
  // registry. Absent ⇒ the neutral entry base (first-touch entry) — unchanged.
  businessType: z.enum(businessTypeKeys).optional(),
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

// ===== Entry mode (scale-02 phase 3, plan D6) =====
// One AI call emits raw EntrySignals only (guesses + neutral prefill); the
// copy engine is resolved by CODE (businessTypes lookup / tiebreaker ladder)
// inside buildBriefDraft — the prompt explicitly forbids the AI to decide it.

function buildEntryUnderstandPrompt(oneLiner: string): string {
  return `Extract business information and classification signals from this description:

"${oneLiner}"

Return a JSON object with ALL of the following fields.

NEUTRAL BUSINESS FIELDS:
- oneLiner: one clear sentence describing what the business offers and who it's for (may lightly rephrase the input)
- businessName: the business/brand name, or "" if not stated
- categories: 1-3 market categories
- audiences: 1-3 target audiences/clients
- offer: the main call-to-action offer a visitor gets (e.g. "Free 30-min audit"), or "" if none is evident
- testimonials: verbatim customer quotes if any are included in the description (word-for-word strings), else an empty array

${entryPrefillDeltaPromptBlock()}

${entryClassificationPromptBlock()}

RULES:
- Extract only what is stated or strongly implied. Do not invent facts, names, or numbers.
- Signals are GUESSES for downstream code — never decide the engine, template, or serve outcome.`;
}

// Demo-mode entry fixture — agency-shaped so the SERVE path is testable free
// (agency ⇒ known businessType ⇒ engine 'trust' by lookup).
const ENTRY_DEMO_SIGNALS: EntrySignals = {
  businessTypeGuess: 'agency',
  businessTypeConfidence: 0.9,
  category: 'Growth marketing',
  goalIntentGuess: 'book-call',
  tiebreaker: 'expertise',
  structureHint: 'single',
  designStyleHint: 'bold-performance',
  platformNeeds: 'none',
  summary:
    'A growth marketing agency that runs paid acquisition and conversion-focused landing pages for SaaS companies.',
  businessName: 'Scale Growth Co',
  offerings: ['Paid social campaigns', 'Landing page CRO', 'Growth strategy'],
  audiences: ['B2B SaaS founders', 'Marketing leads'],
  categories: ['Growth marketing', 'Performance marketing'],
  outcomes: ['3.2x average ROAS', 'Pipeline in 60 days'],
  deliveryModel: 'remote',
  offer: 'Free growth audit',
  oneLiner:
    'Growth marketing agency for SaaS companies that turns paid traffic into booked demos',
  proofAvailable: ['testimonials', 'case studies'],
  socialProfiles: [],
  testimonials: [],
};

async function handleEntryUnderstand(
  req: NextRequest,
  oneLiner: string,
  userId: string,
  startTime: number,
  businessType?: BusinessTypeKey
): Promise<Response> {
  // scale-06 phase 7: select the extraction by businessType key when known.
  // The engine-specific fields ENRICH the neutral entry base; when the engine
  // has no delta (thing/trust/work) this is byte-identical to the base path.
  const extraction = businessType ? extractionForBusinessType(businessType) : null;
  const enriched = !!extraction && hasEntryEnrichment(extraction);
  const understandSchema = enriched
    ? EntryUnderstandSchema.extend(extraction!.entryEnrichmentFields)
    : EntryUnderstandSchema;

  // Demo/mock mode — agency-shaped fixture, no AI call, 0 credits.
  if (isDemoMode(req)) {
    logger.info('[understand] Using mock response (entry)');
    const demoSignals = extraction
      ? extraction.enrichSignals(
          ENTRY_DEMO_SIGNALS as unknown as Record<string, unknown>,
          ENTRY_DEMO_SIGNALS
        )
      : ENTRY_DEMO_SIGNALS;
    return createSecureResponse({
      success: true,
      data: demoSignals,
      briefDraft: buildBriefDraft(demoSignals, oneLiner),
      creditsUsed: 0,
      creditsRemaining: 999,
    });
  }

  const enrichBlock = extraction ? extraction.entryEnrichmentPrompt() : '';
  const prompt = enrichBlock
    ? `${buildEntryUnderstandPrompt(oneLiner)}\n\n${enrichBlock}`
    : buildEntryUnderstandPrompt(oneLiner);
  logger.dev('[understand] ENTRY PROMPT:', prompt);

  let signals: EntrySignals;
  let briefDraft;
  try {
    const raw = await generateWithSchema(
      'understand',
      [{ role: 'user', content: prompt }],
      understandSchema,
      'entry_understanding'
    );
    // Base signals are the EntrySignals subset; enrichment folds engine
    // fields into the existing signal fields (additive, base leads).
    signals = extraction
      ? extraction.enrichSignals(raw as Record<string, unknown>, raw as EntrySignals)
      : (raw as EntrySignals);
    logger.dev('[understand] ENTRY RESPONSE:', signals);
    // Server-side Brief construction (D1/D6) — engine via code lookup; safe
    // for place/quick-yes by construction (copyEngine omitted, D2).
    briefDraft = buildBriefDraft(signals, oneLiner);
  } catch (error: any) {
    logger.error('AI entry understand call failed:', error);
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

  const creditResult = await consumeCredits(
    userId,
    UsageEventType.UNDERSTAND,
    CREDIT_COSTS.UNDERSTAND,
    {
      endpoint: '/api/v2/understand',
      duration: Date.now() - startTime,
      metadata: {
        extractionShape: 'entry',
        oneLinerLength: oneLiner.length,
      },
    }
  );
  if (!creditResult.success) {
    logger.warn(`Credit consumption failed: ${creditResult.error}`);
    // Still return success - we have the data
  }

  logger.dev(`Understand (entry) completed in ${Date.now() - startTime}ms`);

  return createSecureResponse({
    success: true,
    data: signals,
    briefDraft,
    creditsUsed: CREDIT_COSTS.UNDERSTAND,
    creditsRemaining: creditResult.remaining,
  });
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

    const { oneLiner, audienceType, templateId, entry, businessType } = validation.data;
    // LEGACY (old-wizard) schema selection — used ONLY on the non-entry path
    // below. The convergent wizard/entry path selects by businessType key and
    // does NOT read isManufacturerFlow/templateId. Deleted in scale-06 phase 10.
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

    // 2a. Entry-mode branch (scale-02 phase 3 + scale-06 phase 7 businessType
    // enrichment). Fully additive: when the `entry` flag is absent, everything
    // below is byte-identical to before.
    if (entry === true) {
      return handleEntryUnderstand(req, oneLiner, userId, startTime, businessType);
    }

    // ===== LEGACY PATH (old product/service wizards) — scale-06 phase 10 kill.
    // Everything from here down is the pre-convergence audienceType +
    // isManufacturerFlow(templateId) schema switch. Preserved byte-for-byte so
    // old-wizard requests (no `entry` flag) behave exactly as before. The
    // convergent wizard never reaches here.

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
