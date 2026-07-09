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
  EntryUnderstandSchema,
  entryClassificationPromptBlock,
  entryPrefillDeltaPromptBlock,
} from '@/lib/schemas';
import { isDemoMode } from '@/lib/mockMode';
// Entry mode (scale-02 phase 3, D6): pure brief module — engine resolution +
// Brief construction happen server-side here, never in the AI call.
import { buildBriefDraft, type EntrySignals } from '@/modules/brief/classify';
// scale-06 phase 7: businessType-keyed extraction. The wizard/entry path selects
// its extraction schema by businessType (never by audienceType/templateId).
import { businessTypeKeys, type BusinessTypeKey } from '@/modules/businessTypes/config';
import { extractionForBusinessType, hasEntryEnrichment } from '@/lib/schemas/extraction';

export const dynamic = 'force-dynamic';

// Request schema. As of scale-06 phase 10 the only path is the convergent entry
// extraction; the legacy audienceType/templateId schema-switch fields were
// removed with the old wizards. Extra keys sent by older clients (audienceType/
// templateId/entry) are harmlessly stripped by the non-strict z.object.
const UnderstandRequestSchema = z.object({
  oneLiner: z.string().min(10, 'One-liner must be at least 10 characters'),
  // scale-06 phase 7: OPTIONAL businessType for the wizard/entry path. When the
  // caller already knows the businessType (e.g. a wizard re-extraction), the
  // entry schema is ENRICHED with that engine's extraction fields via the
  // registry. Absent ⇒ the neutral entry base (first-touch entry) — unchanged.
  businessType: z.enum(businessTypeKeys).optional(),
});

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

    const { oneLiner, businessType } = validation.data;

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

    // scale-06 phase 10: every request now flows through the convergent entry
    // path. The legacy audienceType + isManufacturerFlow(templateId) schema
    // switch was removed with the old product/service wizards that used it —
    // the unified wizard is the only caller and always sends the entry payload.
    // businessType, when known, enriches the entry extraction via the registry.
    return handleEntryUnderstand(req, oneLiner, userId, startTime, businessType);
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
