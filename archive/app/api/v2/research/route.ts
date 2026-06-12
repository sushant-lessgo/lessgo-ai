/**
 * /api/v2/research - IVOC research endpoint
 *
 * Flow:
 * 1. Validate request (category, audience, productDescription?, forceRefresh?)
 * 2. Normalize keys for cache lookup
 * 3. Check cache → return if hit (0 credits) - provider-aware
 * 4. Auth + credits check (3 credits)
 * 5. Perplexity (if enabled) OR Tavily search
 * 6. LLM extraction → IVOC (Tavily only, Perplexity returns IVOC directly)
 * 7. Quality gate check
 * 8. Store in cache with metadata
 * 9. Consume credits, return IVOC
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
import { searchTavily, formatTavilySnippets, searchTavilyMulti, formatTavilyAdvancedSnippets } from '@/lib/tavily';
import { extractIVOC, generateIVOCFallback, extractPainsOnly } from '@/lib/ivocExtractor';
import { generatePainQueries } from '@/lib/painQueryGenerator';
import { researchWithPerplexity, searchWithPerplexity, isLowQualityIVOC } from '@/lib/perplexity';
import { isDemoMode } from '@/lib/mockMode';
import type { IVOC } from '@/types/generation';

export const dynamic = 'force-dynamic';

// Request schema
const ResearchRequestSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  audience: z.string().min(1, 'Audience is required'),
  productDescription: z.string().optional(),
  forceRefresh: z.boolean().optional().default(false),
});

/**
 * Get the configured research mode.
 * - tavily-deep: LLM-generated queries → parallel Tavily → pain extraction (best quality)
 * - perplexity-search: Perplexity for grounded search → LLM extraction
 * - perplexity-direct: Perplexity search + extraction in one call (may lack grounding)
 * - tavily: Tavily search → LLM extraction (default)
 */
function getResearchMode(): 'tavily-deep' | 'perplexity-search' | 'perplexity-direct' | 'tavily' {
  const mode = process.env.RESEARCH_MODE;

  if (mode === 'tavily-deep' && process.env.TAVILY_API_KEY) {
    return 'tavily-deep';
  }
  if (mode === 'perplexity-search' && process.env.PERPLEXITY_API_KEY) {
    return 'perplexity-search';
  }
  if ((mode === 'perplexity-direct' || mode === 'perplexity') && process.env.PERPLEXITY_API_KEY) {
    return 'perplexity-direct';
  }
  // Legacy support: RESEARCH_PROVIDER=perplexity → perplexity-direct
  if (process.env.RESEARCH_PROVIDER === 'perplexity' && process.env.PERPLEXITY_API_KEY) {
    return 'perplexity-direct';
  }
  return 'tavily';
}

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

    const { category, audience, productDescription, forceRefresh } = validation.data;

    // 2. Normalize keys for cache lookup
    const { categoryKey, audienceKey, categoryRaw, audienceRaw } = normalizeIVOCKeys(
      category,
      audience
    );

    // Determine which mode to use
    const mode = getResearchMode();
    logger.dev(`[research] Using mode: ${mode}`);

    // 3. Check cache first (before auth - cache hits are free)
    // Provider-aware: if Perplexity enabled but cache is from Tavily, treat as miss
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
        // Only use cache if: using tavily (accepts any) OR cache matches a perplexity source
        const isPerplexityMode = mode === 'perplexity-search' || mode === 'perplexity-direct';
        const cacheValid = mode === 'tavily' || (isPerplexityMode && cached.source.startsWith('perplexity'));

        if (cacheValid) {
          const cachedData = {
            pains: cached.pains,
            desires: cached.desires,
            objections: cached.objections,
            firmBeliefs: cached.firmBeliefs,
            shakableBeliefs: cached.shakableBeliefs,
            commonPhrases: cached.commonPhrases,
          } as IVOC;
          logger.dev(`[research] CACHE HIT for ${categoryKey}/${audienceKey} (source: ${cached.source}):`, JSON.stringify(cachedData, null, 2));
          return createSecureResponse({
            success: true,
            data: cachedData,
            cached: true,
            source: cached.source,
            creditsUsed: 0,
          });
        } else {
          logger.dev(`[research] CACHE SKIP - mode mismatch (cached: ${cached.source}, current: ${mode})`);
        }
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

    // 4b. Check for demo/mock mode - return mock IVOC without external calls
    if (isDemoMode(req)) {
      logger.info('[research] Using mock response');
      return createSecureResponse({
        success: true,
        data: {
          pains: [
            'Manual processes waste hours every week',
            'Hard to scale operations without adding headcount',
            'Lack of visibility into team performance',
            'Inconsistent quality across projects',
          ],
          desires: [
            'Automate repetitive tasks completely',
            'Save 10+ hours per week',
            'Scale without proportionally increasing costs',
            'Real-time visibility into everything',
          ],
          objections: [
            'Is my data secure with this tool?',
            'Will my team actually adopt it?',
            'What about integrations with existing tools?',
            'Is it worth the learning curve?',
          ],
          firmBeliefs: [
            'Quality matters more than speed',
            'Time is the most valuable resource',
            'The right tools make all the difference',
          ],
          shakableBeliefs: [
            'Current tools are good enough',
            'Automation is too complex to set up',
          ],
          commonPhrases: [
            'streamline workflow',
            'boost productivity',
            'save time',
            'reduce manual work',
          ],
        },
        cached: false,
        source: 'mock',
        creditsUsed: 0,
        creditsRemaining: 999,
      });
    }

    let ivocData!: IVOC;
    let source!: string;
    let model!: string;
    let rawSources!: any;
    let query!: string;
    let shouldCache = true;

    // 5. Research using configured mode
    if (mode === 'tavily-deep') {
      // 5a. Tavily deep mode: LLM-generated queries → parallel search → pain extraction
      logger.dev(`[research] Using tavily-deep mode for ${categoryRaw}/${audienceRaw}`);

      let tavilyDeepSuccess = false;

      // Requires productDescription for query generation
      if (productDescription) {
        const queryResult = await generatePainQueries({
          category: categoryRaw,
          audience: audienceRaw,
          productDescription,
        });

        if (queryResult.success) {
          logger.dev(`[research] Generated ${queryResult.queries.length} pain queries`);

          const searchResult = await searchTavilyMulti(queryResult.queries);

          if (searchResult.success && searchResult.data.results.length > 0) {
            const snippets = formatTavilyAdvancedSnippets(searchResult.data.results);

            const painResult = await extractPainsOnly(categoryRaw, audienceRaw, snippets);

            if (painResult.success) {
              // Build IVOC with enhanced pains, empty other fields for now
              ivocData = {
                pains: painResult.data.pains,
                desires: [],
                objections: [],
                firmBeliefs: [],
                shakableBeliefs: [],
                commonPhrases: [],
              };
              source = 'tavily-deep';
              model = `${queryResult.model}+${painResult.model}`;
              rawSources = searchResult.data.results;
              query = searchResult.data.queries.join(' | ');
              tavilyDeepSuccess = true;

              logger.dev(`[research] tavily-deep extracted ${painResult.data.pains.length} pains`);
            } else {
              logger.warn(`[research] Pain extraction failed: ${painResult.error}`);
            }
          } else {
            logger.warn(`[research] Tavily multi-search failed or empty results`);
          }
        } else {
          logger.warn(`[research] Query generation failed: ${queryResult.error}`);
        }
      } else {
        logger.warn(`[research] tavily-deep requires productDescription, falling back`);
      }

      // If tavily-deep failed at any step, fall back to standard tavily
      if (!tavilyDeepSuccess) {
        logger.dev(`[research] tavily-deep failed, falling back to standard tavily`);
        const tavilyResult = await searchTavily(categoryRaw, audienceRaw);

        if (tavilyResult.success) {
          const snippets = formatTavilySnippets(tavilyResult.data.results);
          rawSources = tavilyResult.data.results;
          query = tavilyResult.data.query;

          const extractionResult = await extractIVOC(categoryRaw, audienceRaw, snippets);

          if (extractionResult.success) {
            ivocData = extractionResult.data;
            source = 'tavily';
            model = extractionResult.model;
          } else {
            const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);
            if (!fallbackResult.success) {
              return createSecureResponse(
                { success: false, error: 'research_failed', message: 'All research methods failed', recoverable: true },
                500
              );
            }
            ivocData = fallbackResult.data;
            source = 'gpt-fallback';
            model = fallbackResult.model;
            rawSources = [];
            query = `fallback: ${categoryRaw} ${audienceRaw}`;
          }
        } else {
          const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);
          if (!fallbackResult.success) {
            return createSecureResponse(
              { success: false, error: 'research_failed', message: 'Research service unavailable', recoverable: true },
              503
            );
          }
          ivocData = fallbackResult.data;
          source = 'gpt-fallback';
          model = fallbackResult.model;
          rawSources = [];
          query = `fallback: ${categoryRaw} ${audienceRaw}`;
        }
      }
    } else if (mode === 'perplexity-search') {
      // 5a. Perplexity search-only mode: grounded search → LLM extraction
      logger.dev(`[research] Calling Perplexity SEARCH for ${categoryRaw}/${audienceRaw}`);
      const searchResult = await searchWithPerplexity(
        categoryRaw,
        audienceRaw,
        productDescription
      );

      if (searchResult.success) {
        logger.dev(`[research] Perplexity search returned ${searchResult.citations.length} citations`);

        // Extract IVOC from raw search content using existing extractor
        const extractionResult = await extractIVOC(categoryRaw, audienceRaw, searchResult.content);

        if (extractionResult.success) {
          // Quality gate check
          if (isLowQualityIVOC(extractionResult.data)) {
            logger.warn(`[research] Low quality IVOC from perplexity-search for ${categoryKey}/${audienceKey}, not caching`);
            shouldCache = false;
          }

          ivocData = extractionResult.data;
          source = 'perplexity-search';
          model = `${searchResult.model}+${extractionResult.model}`;
          rawSources = searchResult.citations;
          query = `perplexity-search: ${categoryRaw} for ${audienceRaw}`;
        } else {
          // Extraction failed - try GPT fallback
          logger.warn(`[research] IVOC extraction failed for perplexity-search, trying fallback`);
          const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);
          if (!fallbackResult.success) {
            return createSecureResponse(
              { success: false, error: 'research_failed', message: 'IVOC extraction failed', recoverable: true },
              500
            );
          }
          ivocData = fallbackResult.data;
          source = 'gpt-fallback';
          model = fallbackResult.model;
          rawSources = [];
          query = `fallback: ${categoryRaw} ${audienceRaw}`;
        }
      } else if (searchResult.recoverable) {
        // Perplexity search failed but recoverable - fall back to Tavily
        logger.warn(`[research] Perplexity search failed (recoverable), falling back to Tavily: ${searchResult.error}`);
        const tavilyResult = await searchTavily(categoryRaw, audienceRaw);

        if (tavilyResult.success) {
          const snippets = formatTavilySnippets(tavilyResult.data.results);
          rawSources = tavilyResult.data.results;
          query = tavilyResult.data.query;

          const extractionResult = await extractIVOC(categoryRaw, audienceRaw, snippets);

          if (extractionResult.success) {
            ivocData = extractionResult.data;
            source = 'tavily';
            model = extractionResult.model;
          } else {
            const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);
            if (!fallbackResult.success) {
              return createSecureResponse(
                { success: false, error: 'research_failed', message: 'All research methods failed', recoverable: true },
                500
              );
            }
            ivocData = fallbackResult.data;
            source = 'gpt-fallback';
            model = fallbackResult.model;
            rawSources = [];
            query = `fallback: ${categoryRaw} ${audienceRaw}`;
          }
        } else {
          const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);
          if (!fallbackResult.success) {
            return createSecureResponse(
              { success: false, error: 'research_failed', message: 'Research service unavailable', recoverable: true },
              503
            );
          }
          ivocData = fallbackResult.data;
          source = 'gpt-fallback';
          model = fallbackResult.model;
          rawSources = [];
          query = `fallback: ${categoryRaw} ${audienceRaw}`;
        }
      } else {
        // Non-recoverable error
        return createSecureResponse(
          { success: false, error: 'research_failed', message: `Perplexity search error: ${searchResult.error}`, recoverable: false },
          500
        );
      }
    } else if (mode === 'perplexity-direct') {
      // 5b. Perplexity direct mode: search + IVOC in one call (may lack grounding)
      logger.dev(`[research] Calling Perplexity DIRECT for ${categoryRaw}/${audienceRaw}`);
      const perplexityResult = await researchWithPerplexity(
        categoryRaw,
        audienceRaw,
        productDescription
      );

      if (perplexityResult.success) {
        // Quality gate check
        if (isLowQualityIVOC(perplexityResult.data)) {
          logger.warn(`[research] Low quality IVOC from Perplexity for ${categoryKey}/${audienceKey}, not caching`);
          shouldCache = false;
        }

        ivocData = perplexityResult.data;
        source = 'perplexity';
        model = perplexityResult.model;
        rawSources = perplexityResult.sources;
        query = `perplexity: ${categoryRaw} for ${audienceRaw}`;
      } else if (perplexityResult.recoverable) {
        // Perplexity failed but recoverable - fall back to Tavily
        logger.warn(`[research] Perplexity failed (recoverable), falling back to Tavily: ${perplexityResult.error}`);
        const tavilyResult = await searchTavily(categoryRaw, audienceRaw);

        if (tavilyResult.success) {
          const snippets = formatTavilySnippets(tavilyResult.data.results);
          rawSources = tavilyResult.data.results;
          query = tavilyResult.data.query;

          const extractionResult = await extractIVOC(categoryRaw, audienceRaw, snippets);

          if (extractionResult.success) {
            ivocData = extractionResult.data;
            source = 'tavily';
            model = extractionResult.model;
          } else {
            // Tavily extraction failed - try GPT fallback
            const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);
            if (!fallbackResult.success) {
              return createSecureResponse(
                { success: false, error: 'research_failed', message: 'All research methods failed', recoverable: true },
                500
              );
            }
            ivocData = fallbackResult.data;
            source = 'gpt-fallback';
            model = fallbackResult.model;
            rawSources = [];
            query = `fallback: ${categoryRaw} ${audienceRaw}`;
          }
        } else {
          // Tavily also failed - try GPT fallback
          const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);
          if (!fallbackResult.success) {
            return createSecureResponse(
              { success: false, error: 'research_failed', message: 'Research service unavailable', recoverable: true },
              503
            );
          }
          ivocData = fallbackResult.data;
          source = 'gpt-fallback';
          model = fallbackResult.model;
          rawSources = [];
          query = `fallback: ${categoryRaw} ${audienceRaw}`;
        }
      } else {
        // Perplexity failed non-recoverably - return error
        return createSecureResponse(
          { success: false, error: 'research_failed', message: `Perplexity error: ${perplexityResult.error}`, recoverable: false },
          500
        );
      }
    } else {
      // 5c. Tavily path (default)
      const tavilyResult = await searchTavily(categoryRaw, audienceRaw);

      if (tavilyResult.success) {
        const snippets = formatTavilySnippets(tavilyResult.data.results);
        rawSources = tavilyResult.data.results;
        query = tavilyResult.data.query;

        const extractionResult = await extractIVOC(categoryRaw, audienceRaw, snippets);

        if (extractionResult.success) {
          ivocData = extractionResult.data;
          source = 'tavily';
          model = extractionResult.model;
        } else {
          logger.warn(`IVOC extraction failed for ${categoryKey}/${audienceKey}, trying fallback`);
          const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);

          if (!fallbackResult.success) {
            return createSecureResponse(
              { success: false, error: 'research_failed', message: 'Failed to extract IVOC from research data', recoverable: true },
              500
            );
          }

          ivocData = fallbackResult.data;
          source = 'gpt-fallback';
          model = fallbackResult.model;
          rawSources = [];
          query = `fallback: ${categoryRaw} ${audienceRaw}`;
        }
      } else {
        logger.warn(`Tavily failed for ${categoryKey}/${audienceKey}: ${tavilyResult.error.error}`);

        const fallbackResult = await generateIVOCFallback(categoryRaw, audienceRaw);

        if (!fallbackResult.success) {
          return createSecureResponse(
            { success: false, error: 'research_failed', message: 'Research service unavailable', recoverable: tavilyResult.error.recoverable },
            503
          );
        }

        ivocData = fallbackResult.data;
        source = 'gpt-fallback';
        model = fallbackResult.model;
        rawSources = [];
        query = `fallback: ${categoryRaw} ${audienceRaw}`;
      }
    }

    // 7. Store in cache (skip if quality gate failed)
    if (shouldCache) {
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
    } else {
      logger.dev(`[research] Skipping cache for low quality IVOC`);
    }

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
