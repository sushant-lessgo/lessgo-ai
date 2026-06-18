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
import { ScrapeWebsiteSchema, ScrapeWebsiteServiceSchema } from '@/lib/schemas';
import type { ScrapeWebsiteData, ScrapeWebsiteServiceData } from '@/lib/schemas';
import { buildServiceScrapePrompt } from '@/modules/audience/service/promptScrape';
import { isDemoMode } from '@/lib/mockMode';
import { scrapeSite, ScrapeError } from '@/lib/scrape/fetchSite';

export const dynamic = 'force-dynamic';

// audienceType selects the extraction schema + prompt + mock; the fetch/crawl/
// SSRF/credit/auth plumbing is audience-agnostic.
const ScrapeRequestSchema = z.object({
  url: z.string().url('Enter a valid website URL'),
  audienceType: z.enum(['product', 'service']).optional().default('product'),
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

RULES:
- Extract only what is stated or strongly implied across the pages — do NOT invent.
- Copy testimonial quotes WORD-FOR-WORD. Do not paraphrase, shorten, or fix grammar. Preserve any numbers/metrics exactly (e.g. "boosted yield by 50%"). If author name or role is missing, use "".
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
    const { url, audienceType } = validation.data;
    const isService = audienceType === 'service';

    // 2. Auth
    const authCheck = await requireAuth(req);
    if (!authCheck.allowed) {
      return createSecureResponse(
        { success: false, error: 'unauthorized', message: authCheck.error },
        authCheck.statusCode || 401
      );
    }
    const userId = authCheck.userId!;

    // 2b. Demo/mock mode — no network, no AI call.
    if (isDemoMode(req)) {
      logger.info(`[scrape-website] Using mock response (${audienceType})`);
      return createSecureResponse({
        success: true,
        data: isService ? MOCK_DATA_SERVICE : MOCK_DATA,
        creditsUsed: 0,
        creditsRemaining: 999,
      });
    }

    // 3. SSRF-safe fetch + crawl + strip
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

    // 4. ONE AI call with structured outputs (audience-specific schema + prompt)
    let data: ScrapeWebsiteData | ScrapeWebsiteServiceData;
    try {
      data = isService
        ? await generateWithSchema(
            'understand', // reuse the cheap-tier model config
            [{ role: 'user', content: buildServiceScrapePrompt(combinedText) }],
            ScrapeWebsiteServiceSchema,
            'scrape_website_service'
          )
        : await generateWithSchema(
            'understand',
            [{ role: 'user', content: buildScrapePrompt(combinedText) }],
            ScrapeWebsiteSchema,
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
      data,
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
