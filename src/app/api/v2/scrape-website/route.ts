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
  ScrapeWebsiteExtendedSchema,
  ScrapeWebsiteManufacturerSchema,
  ScrapeWebsiteServiceSchema,
  EntryScrapeSchema,
  entryClassificationPromptBlock,
  entryPrefillDeltaPromptBlock,
} from '@/lib/schemas';
import type {
  ScrapeWebsiteData,
  ScrapeWebsiteExtendedData,
  ScrapeWebsiteManufacturerData,
  ScrapeWebsiteServiceData,
  EntryScrapeData,
} from '@/lib/schemas';
// Entry mode (scale-02 phase 3, D6): pure brief module — engine resolution +
// Brief construction happen server-side here, never in the AI call.
import { buildBriefDraft, type EntrySignals } from '@/modules/brief/classify';
import { buildServiceScrapePrompt } from '@/modules/audience/service/promptScrape';
import { isManufacturerFlow } from '@/modules/audience/product/manufacturerFlow';
// scale-06 phase 7: businessType-keyed extraction. The wizard/entry path selects
// its extraction schema by businessType (never by audienceType/templateId).
import { businessTypeKeys, type BusinessTypeKey } from '@/modules/businessTypes/config';
import { extractionForBusinessType, hasEntryEnrichment } from '@/lib/schemas/extraction';
import { isDemoMode } from '@/lib/mockMode';
import { scrapeSite, ScrapeError } from '@/lib/scrape/fetchSite';
import type { ScrapedPage } from '@/lib/scrape/fetchSite';
import {
  normalizeUrlKey,
  getFreshSiteContext,
  upsertSiteContext,
} from '@/lib/siteContext';

export const dynamic = 'force-dynamic';

// audienceType selects the extraction schema + prompt + mock; the fetch/crawl/
// SSRF/credit/auth plumbing is audience-agnostic.
// templateId (optional) carries the manufacturer signal (onboarding1, D1) —
// absent → SaaS extraction, unchanged.
const ScrapeRequestSchema = z.object({
  url: z.string().url('Enter a valid website URL'),
  audienceType: z.enum(['product', 'service']).optional().default('product'),
  templateId: z.string().optional(),
  // Entry-mode classification flag (scale-02 phase 3). Absent/false ⇒ the
  // route behaves byte-identically to before; true ⇒ EntryScrapeSchema
  // + appended classification prompt block + server-side briefDraft.
  entry: z.boolean().optional(),
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

// Manufacturer / trade-supplier variant (onboarding1, D2/D3). Superset of the
// SaaS extraction (the manufacturer schema extends the extended schema), plus
// the 4 manufacturer keys with anti-synonym / anti-fluff guidance. The SaaS
// buildScrapePrompt above is untouched.
function buildManufacturerScrapePrompt(combinedText: string): string {
  return `You are extracting landing-page inputs from the text of a MANUFACTURER / TRADE-SUPPLIER website (multiple pages concatenated, each under a "## PAGE:" marker).

WEBSITE TEXT:
"""
${combinedText}
"""

Return a JSON object:
- oneLiner: one clear sentence describing what the business makes/supplies and who buys it (>= 10 chars)
- productName: the business/brand name, or "" if not clearly stated
- whatYouMake: one clear sentence describing what this business manufactures or supplies (the physical goods, not the mission)
- industriesServed: 1-3 END-CUSTOMER verticals this business sells into (e.g., ["Hospitality", "Healthcare", "Security"])
- productCategories: 1-8 CONCRETE product types they make (e.g., ["Chef coats", "Scrubs", "Hi-vis jackets"])
- valueAdds: 1-8 CONCRETE differentiators (e.g., ["Custom embroidery", "Low MOQ", "48h dispatch", "In-house dyeing"])
- categories: 1-3 market categories
- audiences: 1-3 target buyer types
- whatItDoes: a single clear sentence describing the core business
- features: 3-6 key capabilities/services (short phrases)
- offer: the main call-to-action / offer the visitor gets (e.g. "Request a quote", "Send enquiry"), or "" if none is evident
- landingGoal: best-guess primary goal — one of waitlist | signup | free-trial | buy | demo | download | enquiry — or null if unclear
- testimonials: up to 3 REAL customer testimonials found anywhere in the text, each { quote, author_name, author_role }
- facts: 10-25 ATOMIC claims about the business, each { fact, topic, confidence }.
  - One claim per fact, in your own words (materials, founding year, certifications, volumes, MOQs, locations, client segments, differentiators, delivery/logistics, people).
  - topic: one of company | product | service | proof | logistics | people | other.
  - confidence: high = literally stated in the text; medium = strongly implied; low = inferred. When in doubt, rate LOWER.
- excerpts: 5-12 strong REAL lines copied WORD-FOR-WORD from the text, each { text, kind }.
  - Pick lines that show how the business talks or that carry real proof: founder voice, capability claims, proof phrasing. Keep each under ~300 characters.
  - kind: one of voice | proof | value-prop | testimonial. Duplicate the testimonials here as kind "testimonial".
  - NEVER paraphrase, shorten, or fix grammar in an excerpt — verbatim only.

STRICT RULES — no synonyms, no fluff:
- productCategories must be actual product types a buyer would order — NOT synonyms or restatements of the business itself ("uniforms", "workwear solutions" are NOT categories if the site names specific garments).
- industriesServed must be end-customer verticals — NEVER vague groups like "businesses", "professionals", or "companies".
- valueAdds must be concrete, verifiable capabilities or terms — NEVER quality-platitudes like "attention to detail", "commitment to quality", or "customer satisfaction".
- Extract only what is stated or strongly implied across the pages — do NOT invent.
- Copy testimonial quotes WORD-FOR-WORD. Do not paraphrase, shorten, or fix grammar. Preserve any numbers/metrics exactly. If author name or role is missing, use "".
- If there are no real testimonials, return an empty array. Never fabricate testimonials, customer names, or numbers.`;
}

const MOCK_DATA: ScrapeWebsiteData = {
  oneLiner: 'IoT climate control systems for commercial mushroom farmers',
  productName: 'Naayom',
  categories: ['Agritech', 'IoT', 'Automation'],
  audiences: ['Commercial mushroom growers', 'Agritech operators'],
  whatItDoes:
    'Provides stage-based precision climate control and real-time monitoring to optimize mushroom farm yield.',
  features: [
    'Stage-based precision control',
    'Real-time multi-chamber monitoring',
    'Data analytics & trend graphs',
    'Energy savings',
  ],
  offer: 'Contact sales',
  landingGoal: 'demo',
  testimonials: [
    {
      quote: 'Naayom AWS has significantly boosted my Cordyceps crop yield by 50%.',
      author_name: 'Mycoforest',
      author_role: 'Gwalior',
    },
  ],
};

// Manufacturer mock mirrors the client-facing shape (facts/excerpts are
// stripped from real responses, so the mock omits them too — same as MOCK_DATA).
const MOCK_DATA_MANUFACTURER: Omit<ScrapeWebsiteManufacturerData, 'facts' | 'excerpts'> = {
  oneLiner: 'Custom workwear and uniform manufacturer for hospitality, healthcare, and security buyers',
  productName: 'Golden Shadow Trading',
  whatYouMake:
    'We manufacture custom workwear and uniforms — chef coats, scrubs, and hi-vis gear — for institutional buyers.',
  industriesServed: ['Hospitality', 'Healthcare', 'Security'],
  productCategories: ['Chef coats', 'Scrubs', 'Hi-vis jackets', 'Corporate shirts'],
  valueAdds: ['Custom embroidery', 'Low MOQ', '48h dispatch', 'In-house dyeing'],
  categories: ['Workwear', 'Uniform manufacturing'],
  audiences: ['Hotel procurement teams', 'Hospital administrators', 'Facility managers'],
  whatItDoes:
    'Manufactures and supplies custom uniforms and workwear in bulk for institutional buyers.',
  features: [
    'Custom embroidery and branding',
    'Low minimum order quantities',
    'Fast 48h dispatch',
    'In-house fabric dyeing',
  ],
  offer: 'Request a quote',
  landingGoal: 'enquiry',
  testimonials: [
    {
      quote: 'Golden Shadow delivered 500 embroidered chef coats in under a week.',
      author_name: 'Hotel Marigold',
      author_role: 'Procurement',
    },
  ],
};

const MOCK_DATA_SERVICE: ScrapeWebsiteServiceData = {
  oneLiner: 'Boutique branding studio for direct-to-consumer skincare brands',
  businessName: 'Studio Hearth',
  whatYouDo:
    'We build conversion-focused brand identities and marketing sites that turn skincare browsers into buyers.',
  services: ['Brand identity', 'Packaging design', 'Marketing site'],
  targetClients: ['DTC skincare founders', 'Early-stage beauty brands'],
  outcomes: ['Launch-ready in 4 weeks', 'Senior designers only', 'Conversion-focused copy'],
  deliveryModel: 'remote',
  offer: 'Free 30-min brand audit, no obligation',
  goal: 'book-call',
  testimonials: [
    {
      quote: 'Studio Hearth rebranded us and our launch sold out in 48 hours.',
      author_name: 'Priya Shah',
      author_role: 'Founder, Lumen Skin',
    },
  ],
};

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
  // scale-06 phase 7: select the extraction by businessType key when known.
  // Engine-specific fields ENRICH the neutral entry base; with no delta
  // (thing/trust/work) this is byte-identical to the base entry path.
  const extraction = businessType ? extractionForBusinessType(businessType) : null;
  const enriched = !!extraction && hasEntryEnrichment(extraction);
  const entryScrapeSchema = enriched
    ? EntryScrapeSchema.extend(extraction!.entryEnrichmentFields)
    : EntryScrapeSchema;

  // Compose EntrySignals from the entry scrape extract, then fold engine
  // enrichment additively (base signals lead, never overwritten).
  const toSignals = (data: Omit<EntryScrapeData, 'facts' | 'excerpts'>): EntrySignals => {
    const base = mapEntryScrapeToSignals(data);
    return extraction
      ? extraction.enrichSignals(data as unknown as Record<string, unknown>, base)
      : base;
  };

  // Demo/mock mode — agency-shaped fixture, no network, no AI call, 0 credits.
  if (isDemoMode(req)) {
    logger.info('[scrape-website] Using mock response (entry)');
    return createSecureResponse({
      success: true,
      data: MOCK_DATA_ENTRY,
      briefDraft: buildBriefDraft(toSignals(MOCK_DATA_ENTRY), url),
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

  // ONE AI call: existing extraction prompt + appended entry blocks
  // (+ engine enrichment block when a businessType was supplied).
  const enrichBlock = extraction ? extraction.entryEnrichmentPrompt() : '';
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
    // Server-side Brief construction (D1/D6) — engine via code lookup; safe
    // for place/quick-yes by construction (copyEngine omitted, D2).
    briefDraft = buildBriefDraft(toSignals(data), url);
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
    const { url, audienceType, templateId, entry, businessType } = validation.data;
    // LEGACY (old-wizard) schema selection — used ONLY on the non-entry path
    // below. The convergent wizard/entry path selects by businessType key and
    // does NOT read isManufacturerFlow/templateId. Deleted in scale-06 phase 10.
    const isService = audienceType === 'service';
    const isManufacturer = !isService && isManufacturerFlow(templateId);

    // 2. Auth
    const authCheck = await requireAuth(req);
    if (!authCheck.allowed) {
      return createSecureResponse(
        { success: false, error: 'unauthorized', message: authCheck.error },
        authCheck.statusCode || 401
      );
    }
    const userId = authCheck.userId!;

    // 2a. Entry-mode branch (scale-02 phase 3 + scale-06 phase 7 businessType
    // enrichment). Fully additive: when the `entry` flag is absent, everything
    // below is byte-identical to before.
    if (entry === true) {
      return handleEntryScrape(req, url, userId, startTime, businessType);
    }

    // ===== LEGACY PATH (old product/service wizards) — scale-06 phase 10 kill.
    // Everything from here down is the pre-convergence audienceType +
    // isManufacturerFlow(templateId) schema switch. Preserved byte-for-byte so
    // old-wizard requests (no `entry` flag) behave exactly as before. The
    // convergent wizard never reaches here.

    // 2b. Demo/mock mode — no network, no AI call.
    if (isDemoMode(req)) {
      logger.info(
        `[scrape-website] Using mock response (${isManufacturer ? 'manufacturer' : audienceType})`
      );
      return createSecureResponse({
        success: true,
        data: isService
          ? MOCK_DATA_SERVICE
          : isManufacturer
          ? MOCK_DATA_MANUFACTURER
          : MOCK_DATA,
        creditsUsed: 0,
        creditsRemaining: 999,
      });
    }

    // 2c. Cache check FIRST (SiteContext, global URL-keyed, TTL-gated) — a fresh
    // stored scrape returns instantly: no crawl, no AI call, 0 credits.
    try {
      const cached = await getFreshSiteContext(normalizeUrlKey(url), audienceType);
      // Manufacturer flow requires the 4 manufacturer keys in the extract; a
      // cache entry written by a SaaS-shaped scrape lacks them → fall through
      // to a fresh crawl+extract instead of returning an incomplete shape.
      const cacheUsable =
        cached && (!isManufacturer || 'whatYouMake' in ((cached.extract as object) ?? {}));
      if (cached && cacheUsable) {
        logger.info(`[scrape-website] cache hit for ${url} (${audienceType}) — 0 credits`);
        return createSecureResponse({
          success: true,
          data: cached.extract,
          cached: true,
          creditsUsed: 0,
          creditsRemaining: undefined,
        });
      }
    } catch (e) {
      // Cache lookup failure must never block a scrape — fall through to crawl.
      logger.warn('[scrape-website] cache lookup failed, proceeding to crawl:', e as Error);
    }

    // 3. SSRF-safe fetch + crawl + strip
    let combinedText: string;
    let pageCount: number;
    let sitePages: ScrapedPage[] = [];
    try {
      const site = await scrapeSite(url);
      combinedText = site.combinedText;
      pageCount = site.pages.length;
      sitePages = site.pages;
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

    // 4. ONE AI call with structured outputs (audience-specific schema + prompt).
    //    Product uses the EXTENDED schema (facts + verbatim excerpts) — same
    //    single call, the site read is already paid for.
    let data:
      | ScrapeWebsiteData
      | ScrapeWebsiteExtendedData
      | ScrapeWebsiteManufacturerData
      | ScrapeWebsiteServiceData;
    try {
      data = isService
        ? await generateWithSchema(
            'understand', // reuse the cheap-tier model config
            [{ role: 'user', content: buildServiceScrapePrompt(combinedText) }],
            ScrapeWebsiteServiceSchema,
            'scrape_website_service'
          )
        : isManufacturer
        ? await generateWithSchema(
            'understand',
            [{ role: 'user', content: buildManufacturerScrapePrompt(combinedText) }],
            ScrapeWebsiteManufacturerSchema,
            'scrape_website_manufacturer'
          )
        : await generateWithSchema(
            'understand',
            [{ role: 'user', content: buildScrapePrompt(combinedText) }],
            ScrapeWebsiteExtendedSchema,
            'scrape_website'
          );
    } catch (error: any) {
      logger.error('[scrape-website] AI extraction failed:', error);
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

    // 4b. Persist SiteContext (never blocks the response). Product carries
    //     facts/excerpts from the extended schema; service stores empty arrays
    //     (extraction mirroring deferred until service needs it). The client
    //     response carries the STRIPPED extract — same shape as before this
    //     feature (and as the cached path).
    const { facts, excerpts, ...extract } = data as Partial<ScrapeWebsiteExtendedData> & Record<string, unknown>;
    await upsertSiteContext({
      urlRaw: url,
      audienceType,
      pages: sitePages,
      extract,
      facts: (facts as any) ?? [],
      excerpts: (excerpts as any) ?? [],
    });

    // 5. Consume credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.SCRAPE_WEBSITE,
      CREDIT_COSTS.SCRAPE_WEBSITE,
      {
        endpoint: '/api/v2/scrape-website',
        duration: Date.now() - startTime,
        metadata: {
          audienceType,
          pageCount,
          textLength: combinedText.length,
          testimonialsFound: data.testimonials.length,
        },
      }
    );
    if (!creditResult.success) {
      logger.warn(`[scrape-website] Credit consumption failed: ${creditResult.error}`);
    }

    logger.dev(`[scrape-website] completed in ${Date.now() - startTime}ms`);

    return createSecureResponse({
      success: true,
      data: extract,
      cached: false,
      creditsUsed: CREDIT_COSTS.SCRAPE_WEBSITE,
      creditsRemaining: creditResult.remaining,
    });
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
