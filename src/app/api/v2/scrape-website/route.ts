/**
 * /api/v2/scrape-website - Onboarding website import (Product flow)
 *
 * Flow (mirrors /api/v2/understand):
 * 1. Validate request ({ url })
 * 2. Auth check
 * 3. SSRF-safe fetch + bounded crawl + HTML→text (src/lib/scrape/fetchSite)
 * 4. ONE AI call with structured outputs → copy + verbatim testimonials
 * 5. Consume credits (SCRAPE_WEBSITE = 1), return extracted data
 *
 * Replaces the /understand call on the import path (no double charge): the
 * client hydrates `understanding` directly from this response.
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
  EntryScrapeSchema,
  entryClassificationPromptBlock,
  entryPrefillDeltaPromptBlock,
} from '@/lib/schemas';
import type { EntryScrapeData } from '@/lib/schemas';
// Entry mode (scale-02 phase 3, D6): pure brief module — engine resolution +
// Brief construction happen server-side here, never in the AI call.
import { buildBriefDraft, type EntrySignals } from '@/modules/brief/classify';
// scale-06 phase 7: businessType-keyed extraction. The wizard/entry path selects
// its extraction schema by businessType (never by audienceType/templateId).
import { businessTypeKeys, type BusinessTypeKey } from '@/modules/businessTypes/config';
import {
  extractionForBusinessType,
  hasEntryEnrichment,
  entryUnionEnrichment,
  entryExtractionForSignals,
  type EngineExtraction,
} from '@/lib/schemas/extraction';
import { isDemoMode } from '@/lib/mockMode';
import { scrapeSite, ScrapeError } from '@/lib/scrape/fetchSite';

export const dynamic = 'force-dynamic';

// As of scale-06 phase 10 the only path is the convergent entry scrape; the
// legacy audienceType/templateId schema-switch fields were removed with the old
// wizards. Extra keys sent by older clients (audienceType/templateId/entry) are
// harmlessly stripped by the non-strict z.object.
const ScrapeRequestSchema = z.object({
  url: z.string().url('Enter a valid website URL'),
  // scale-06 phase 7: OPTIONAL businessType for the wizard/entry path. When the
  // caller already knows the businessType (e.g. a wizard re-extraction), the
  // entry scrape schema is ENRICHED with that engine's extraction fields via
  // the registry. Absent ⇒ the neutral entry base (first-touch) — unchanged.
  businessType: z.enum(businessTypeKeys).optional(),
});

function buildScrapePrompt(combinedText: string): string {
  return `You are extracting landing-page inputs from the text of an existing website (multiple pages concatenated, each under a "## PAGE:" marker).

WEBSITE TEXT:
"""
${combinedText}
"""

Return a JSON object:
- oneLiner: one clear sentence describing what the business offers and who it's for (>= 10 chars)
- productName: the business/product name, or "" if not clearly stated
- categories: 1-3 market categories
- audiences: 1-3 target audiences
- whatItDoes: a single clear sentence describing the core function
- features: 3-6 key features/services (short phrases)
- offer: the main call-to-action / offer the visitor gets (e.g. "Contact sales", "Free trial"), or "" if none is evident
- landingGoal: best-guess primary goal — one of waitlist | signup | free-trial | buy | demo | download — or null if unclear
- testimonials: up to 3 REAL customer testimonials found anywhere in the text, each { quote, author_name, author_role }
- facts: 10-25 ATOMIC claims about the business, each { fact, topic, confidence }.
  - One claim per fact, in your own words (materials, founding year, certifications, volumes, locations, client segments, differentiators, delivery/logistics, people).
  - topic: one of company | product | service | proof | logistics | people | other.
  - confidence: high = literally stated in the text; medium = strongly implied; low = inferred. When in doubt, rate LOWER.
- excerpts: 5-12 strong REAL lines copied WORD-FOR-WORD from the text, each { text, kind }.
  - Pick lines that show how the business talks or that carry real proof: founder voice, value claims, proof phrasing. Keep each under ~300 characters.
  - kind: one of voice | proof | value-prop | testimonial. Duplicate the testimonials here as kind "testimonial".
  - NEVER paraphrase, shorten, or fix grammar in an excerpt — verbatim only.

RULES:
- Extract only what is stated or strongly implied across the pages — do NOT invent.
- Copy testimonial quotes WORD-FOR-WORD. Do not paraphrase, shorten, or fix grammar. Preserve any numbers/metrics exactly (e.g. "boosted yield by 50%"). If author name or role is missing, use "".
- If there are no real testimonials, return an empty array. Never fabricate testimonials, customer names, or numbers.`;
}

// ===== Entry mode (scale-02 phase 3, plan D6) =====
// Same single AI call, EXTENDED schema (base scrape fields — incl. verbatim
// testimonials/facts/excerpts — plus entry classification signals). Engine
// resolution + Brief construction are CODE (buildBriefDraft), server-side.

// Map the entry scrape extract into the phase-1 EntrySignals shape.
// Base scrape fields double as the neutral prefill (oneLiner/productName/
// categories/audiences/offer); rich testimonials flatten to quote strings.
function mapEntryScrapeToSignals(
  data: Omit<EntryScrapeData, 'facts' | 'excerpts'>
): EntrySignals {
  return {
    businessTypeGuess: data.businessTypeGuess,
    businessTypeConfidence: data.businessTypeConfidence,
    category: data.category,
    goalIntentGuess: data.goalIntentGuess,
    tiebreaker: data.tiebreaker,
    structureHint: data.structureHint,
    designStyleHint: data.designStyleHint,
    platformNeeds: data.platformNeeds,
    summary: data.summary,
    businessName: data.productName,
    offerings: data.offerings,
    audiences: data.audiences,
    categories: data.categories,
    outcomes: data.outcomes,
    deliveryModel: data.deliveryModel,
    offer: data.offer,
    oneLiner: data.oneLiner,
    proofAvailable: data.proofAvailable,
    socialProfiles: data.socialProfiles,
    testimonials: data.testimonials.map((t) => t.quote),
  };
}

// Demo-mode entry fixture — agency-shaped so the SERVE path is testable free
// (agency ⇒ known businessType ⇒ engine 'trust' by lookup). Client-facing
// shape (facts/excerpts stripped, same as the other mocks).
const MOCK_DATA_ENTRY: Omit<EntryScrapeData, 'facts' | 'excerpts'> = {
  oneLiner:
    'Growth marketing agency for SaaS companies that turns paid traffic into booked demos',
  productName: 'Scale Growth Co',
  categories: ['Growth marketing', 'Performance marketing'],
  audiences: ['B2B SaaS founders', 'Marketing leads'],
  whatItDoes:
    'Runs paid acquisition and conversion-focused landing pages that turn traffic into booked demos.',
  features: ['Paid social campaigns', 'Landing page CRO', 'Growth strategy'],
  offer: 'Free growth audit',
  landingGoal: 'demo',
  testimonials: [
    {
      quote: 'Scale Growth Co took us from 12 to 60 booked demos a month.',
      author_name: 'Ana Torres',
      author_role: 'CMO, Flowstack',
    },
  ],
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
  offerings: ['Paid social campaigns', 'Landing page CRO', 'Growth strategy'],
  outcomes: ['3.2x average ROAS', 'Pipeline in 60 days'],
  deliveryModel: 'remote',
  proofAvailable: ['testimonials', 'case studies'],
  socialProfiles: [],
};

async function handleEntryScrape(
  req: NextRequest,
  url: string,
  userId: string,
  startTime: number,
  businessType?: BusinessTypeKey
): Promise<Response> {
  // scale-06 phase 7: when the businessType is KNOWN, select that engine's
  // extraction and ENRICH the neutral entry base with its delta (byte-identical
  // explicit path). F19 (entry-capture): when it is ABSENT — the real
  // first-touch entry where the SAME call both classifies AND extracts — extend
  // with the UNION of every engine's enrichment (built mechanically from the
  // registry) and resolve the fold engine in-code AFTER the call. Union is
  // computed ONCE and reused for schema + prompt.
  const explicitExtraction = businessType ? extractionForBusinessType(businessType) : null;
  const union = businessType ? null : entryUnionEnrichment();
  const entryScrapeSchema = explicitExtraction
    ? hasEntryEnrichment(explicitExtraction)
      ? EntryScrapeSchema.extend(explicitExtraction.entryEnrichmentFields)
      : EntryScrapeSchema
    : EntryScrapeSchema.extend(union!.fields);

  // Compose EntrySignals from the entry scrape extract, then fold the resolved
  // engine's enrichment additively (base signals lead, never overwritten).
  // Foreign union keys drop naturally in enrichSignals / foldCollectionsIntoSignals.
  const toSignals = (
    data: Omit<EntryScrapeData, 'facts' | 'excerpts'>,
    foldExtraction: EngineExtraction | null
  ): EntrySignals => {
    const base = mapEntryScrapeToSignals(data);
    return foldExtraction
      ? foldExtraction.enrichSignals(data as unknown as Record<string, unknown>, base)
      : base;
  };

  // Demo/mock mode — agency-shaped fixture, no network, no AI call, 0 credits.
  if (isDemoMode(req)) {
    logger.info('[scrape-website] Using mock response (entry)');
    // Resolve the fold engine from the fixture's guess ('agency' → trust) on the
    // no-businessType path; explicit path uses its known engine.
    const foldExtraction = explicitExtraction ?? entryExtractionForSignals(MOCK_DATA_ENTRY);
    return createSecureResponse({
      success: true,
      data: MOCK_DATA_ENTRY,
      briefDraft: buildBriefDraft(toSignals(MOCK_DATA_ENTRY, foldExtraction), url),
      creditsUsed: 0,
      creditsRemaining: 999,
    });
  }

  // No SiteContext cache on the entry path (conservative): cached extracts
  // lack the signal fields, and writing entry-shaped extracts would change
  // what the non-entry cached path returns.

  // SSRF-safe fetch + crawl + strip (same plumbing as the default path).
  let combinedText: string;
  let pageCount: number;
  try {
    const site = await scrapeSite(url);
    combinedText = site.combinedText;
    pageCount = site.pages.length;
  } catch (err) {
    if (err instanceof ScrapeError) {
      logger.warn(`[scrape-website] scrape failed (${err.code}) for ${url}`);
      return createSecureResponse(
        { success: false, error: err.code, message: err.message, recoverable: true },
        err.code === 'blocked_host' || err.code === 'invalid_url' ? 400 : 502
      );
    }
    throw err;
  }

  if (!combinedText || combinedText.trim().length < 40) {
    return createSecureResponse(
      {
        success: false,
        error: 'no_content',
        message: "We couldn't read enough text from that site.",
        recoverable: true,
      },
      422
    );
  }

  // ONE AI call: existing extraction prompt + appended entry blocks. The
  // enrichment block is the explicit engine's prompt when a businessType was
  // supplied, else the UNION prompt (real first-touch entry).
  const enrichBlock = explicitExtraction ? explicitExtraction.entryEnrichmentPrompt() : union!.prompt;
  const prompt = `${buildScrapePrompt(combinedText)}

${entryPrefillDeltaPromptBlock()}

${entryClassificationPromptBlock()}${enrichBlock ? `\n\n${enrichBlock}` : ''}`;

  let data: EntryScrapeData;
  let briefDraft;
  try {
    data = (await generateWithSchema(
      'understand',
      [{ role: 'user', content: prompt }],
      entryScrapeSchema,
      'entry_scrape_website'
    )) as EntryScrapeData;
    // Resolve the fold engine AFTER the call: explicit engine when known, else
    // from the just-classified guess (foreign union keys drop in the fold).
    const foldExtraction = explicitExtraction ?? entryExtractionForSignals(data);
    // Server-side Brief construction (D1/D6) — engine via code lookup; safe
    // for place/quick-yes by construction (copyEngine omitted, D2).
    briefDraft = buildBriefDraft(toSignals(data, foldExtraction), url);
  } catch (error: any) {
    logger.error('[scrape-website] AI entry extraction failed:', error);
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

  // Client response carries the STRIPPED extract (same convention as the
  // default path — facts/excerpts stay server-side).
  const { facts, excerpts, ...extract } = data;

  const creditResult = await consumeCredits(
    userId,
    UsageEventType.SCRAPE_WEBSITE,
    CREDIT_COSTS.SCRAPE_WEBSITE,
    {
      endpoint: '/api/v2/scrape-website',
      duration: Date.now() - startTime,
      metadata: {
        extractionShape: 'entry',
        pageCount,
        textLength: combinedText.length,
        testimonialsFound: data.testimonials.length,
      },
    }
  );
  if (!creditResult.success) {
    logger.warn(`[scrape-website] Credit consumption failed: ${creditResult.error}`);
  }

  logger.dev(`[scrape-website] entry completed in ${Date.now() - startTime}ms`);

  return createSecureResponse({
    success: true,
    data: extract,
    briefDraft,
    creditsUsed: CREDIT_COSTS.SCRAPE_WEBSITE,
    creditsRemaining: creditResult.remaining,
  });
}

async function scrapeHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Validate request
    const body = await req.json();
    const validation = ScrapeRequestSchema.safeParse(body);
    if (!validation.success) {
      return createSecureResponse(
        { success: false, error: 'validation_error', details: validation.error.issues },
        400
      );
    }
    const { url, businessType } = validation.data;

    // 2. Auth
    const authCheck = await requireAuth(req);
    if (!authCheck.allowed) {
      return createSecureResponse(
        { success: false, error: 'unauthorized', message: authCheck.error },
        authCheck.statusCode || 401
      );
    }
    const userId = authCheck.userId!;

    // scale-06 phase 10: every request now flows through the convergent entry
    // scrape. The legacy audienceType + per-template manufacturer schema
    // switch was removed with the old product/service wizards that used it —
    // the unified wizard is the only caller and always sends the entry payload.
    // businessType, when known, enriches the entry extraction via the registry.
    return handleEntryScrape(req, url, userId, startTime, businessType);
  } catch (error: any) {
    logger.error('[scrape-website] handler error:', error);
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

export const POST = withAIRateLimit(scrapeHandler);
