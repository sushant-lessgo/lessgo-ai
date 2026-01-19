/**
 * /api/v2/research - IVOC research endpoint
 *
 * Flow:
 * 1. Validate request (category, audience, forceRefresh?)
 * 2. Normalize keys for cache lookup
 * 3. Check cache → return if hit (0 credits)
 * 4. Auth + credits check (3 credits)
 * 5. Tavily search
 * 6. LLM extraction → IVOC
 * 7. Store in cache with metadata
 * 8. Consume credits, return IVOC
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAuth } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { normalizeIVOCKeys } from '@/lib/normalize';
import { searchTavily, formatTavilySnippets } from '@/lib/tavily';
import { extractIVOC, generateIVOCFallback } from '@/lib/ivocExtractor';
import type { IVOC } from '@/types/generation';

export const dynamic = 'force-dynamic';

// Request schema
const ResearchRequestSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  audience: z.string().min(1, 'Audience is required'),
  forceRefresh: z.boolean().optional().default(false),
});

async function researchHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request
    const body = await req.json();
    const validation = ResearchRequestSchema.safeParse(body);

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

    const { category, audience, forceRefresh } = validation.data;

    // 2. Normalize keys for cache lookup
    const { categoryKey, audienceKey, categoryRaw, audienceRaw } = normalizeIVOCKeys(
      category,
      audience
    );

    // 3. Check cache first (before auth - cache hits are free)
    if (!forceRefresh) {
      const cached = await prisma.iVOCCache.findUnique({
        where: {
          categoryKey_audienceKey: {
            categoryKey,
            audienceKey,
          },
        },
      });

      if (cached) {
        const cachedData = {
          pains: cached.pains,
          desires: cached.desires,
          objections: cached.objections,
          firmBeliefs: cached.firmBeliefs,
          shakableBeliefs: cached.shakableBeliefs,
          commonPhrases: cached.commonPhrases,
        } as IVOC;
        logger.dev(`[research] CACHE HIT for ${categoryKey}/${audienceKey}:`, JSON.stringify(cachedData, null, 2));
        return createSecureResponse({
          success: true,
          data: cachedData,
          cached: true,
          creditsUsed: 0,
        });
      }
    }

    // 4. Auth check (only needed if cache miss)
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

    // 5. Tavily search
    const tavilyResult = await searchTavily(categoryRaw, audienceRaw);

    let ivocData: IVOC;
    let source: string;
    let model: string;
    let rawSources: any;
    let query: string;

    if (tavilyResult.success) {
      // 6a. Extract IVOC from Tavily results
      const snippets = formatTavilySnippets(tavilyResult.data.results);
      rawSources = tavilyResult.data.results;
      query = tavilyResult.data.query;

      const extractionResult = await extractIVOC(categoryRaw, audienceRaw, snippets);

      if (extractionResult.success) {
        ivocData = extractionResult.data;
        source = 'tavily';
        model = extractionResult.model;
      } else {
        // 6b. Tavily worked but extraction failed - try fallback
        logger.warn(`IVOC extraction failed for ${categoryKey}/${audienceKey}, trying fallback`);
        const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);

        if (!fallbackResult.success) {
          return createSecureResponse(
            {
              success: false,
              error: 'research_failed',
              message: 'Failed to extract IVOC from research data',
              recoverable: true,
            },
            500
          );
        }

        ivocData = fallbackResult.data;
        source = 'gpt-fallback';
        model = fallbackResult.model;
        rawSources = []; // No Tavily sources for fallback
        query = `fallback: ${categoryRaw} ${audienceRaw}`;
      }
    } else {
      // 6c. Tavily failed - try GPT-4o fallback
      logger.warn(`Tavily failed for ${categoryKey}/${audienceKey}: ${tavilyResult.error.error}`);

      const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);

      if (!fallbackResult.success) {
        return createSecureResponse(
          {
            success: false,
            error: 'research_failed',
            message: 'Research service unavailable',
            recoverable: tavilyResult.error.recoverable,
          },
          503
        );
      }

      ivocData = fallbackResult.data;
      source = 'gpt-fallback';
      model = fallbackResult.model;
      rawSources = [];
      query = `fallback: ${categoryRaw} ${audienceRaw}`;
    }

    // 7. Store in cache
    await prisma.iVOCCache.upsert({
      where: {
        categoryKey_audienceKey: {
          categoryKey,
          audienceKey,
        },
      },
      create: {
        categoryKey,
        audienceKey,
        categoryRaw,
        audienceRaw,
        pains: ivocData.pains,
        desires: ivocData.desires,
        objections: ivocData.objections,
        firmBeliefs: ivocData.firmBeliefs,
        shakableBeliefs: ivocData.shakableBeliefs,
        commonPhrases: ivocData.commonPhrases,
        query,
        rawSources,
        model,
        source,
        version: 1,
      },
      update: {
        pains: ivocData.pains,
        desires: ivocData.desires,
        objections: ivocData.objections,
        firmBeliefs: ivocData.firmBeliefs,
        shakableBeliefs: ivocData.shakableBeliefs,
        commonPhrases: ivocData.commonPhrases,
        query,
        rawSources,
        model,
        source,
      },
    });

    // 8. Consume credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.IVOC_RESEARCH,
      CREDIT_COSTS.IVOC_RESEARCH,
      {
        endpoint: '/api/v2/research',
        duration: Date.now() - startTime,
        metadata: { category: categoryRaw, audience: audienceRaw, source },
      }
    );

    if (!creditResult.success) {
      // Still return success since we have the data, but warn about credit issue
      logger.warn(`Credit consumption failed for user ${userId}: ${creditResult.error}`);
    }

    return createSecureResponse({
      success: true,
      data: ivocData,
      cached: false,
      source,
      creditsUsed: CREDIT_COSTS.IVOC_RESEARCH,
      creditsRemaining: creditResult.remaining,
    });
  } catch (error: any) {
    logger.error('Research endpoint error:', error);
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

export const POST = withAIRateLimit(researchHandler);
