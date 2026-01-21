/**
 * Tavily API client for IVOC research.
 */
import { logger } from '@/lib/logger';

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  results: TavilyResult[];
  query: string;
}

export interface TavilyError {
  error: string;
  recoverable: boolean;
}

/**
 * Search Tavily for voice of customer data.
 * Query includes reddit, forum, alternatives for better VOC coverage.
 */
export async function searchTavily(
  category: string,
  audience: string
): Promise<{ success: true; data: TavilySearchResponse } | { success: false; error: TavilyError }> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    logger.error('TAVILY_API_KEY not configured');
    return {
      success: false,
      error: { error: 'tavily_not_configured', recoverable: false },
    };
  }

  // Build query for better VOC coverage
  const query = `${category} ${audience} pain points reviews reddit forum alternatives complaints`;

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 10,
        include_raw_content: false,
        include_answer: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      logger.error(`Tavily API error: ${status}`);

      // Rate limit = recoverable
      if (status === 429) {
        return {
          success: false,
          error: { error: 'tavily_rate_limit', recoverable: true },
        };
      }

      return {
        success: false,
        error: { error: `tavily_error_${status}`, recoverable: status >= 500 },
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        results: data.results || [],
        query,
      },
    };
  } catch (error: any) {
    logger.error('Tavily search failed:', error);
    return {
      success: false,
      error: { error: 'tavily_network_error', recoverable: true },
    };
  }
}

/**
 * Format Tavily results into snippets for LLM extraction.
 */
export function formatTavilySnippets(results: TavilyResult[]): string {
  if (!results || results.length === 0) {
    return 'No search results found.';
  }

  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`)
    .join('\n\n');
}

// ============================================
// Advanced multi-query search (tavily-deep)
// ============================================

/**
 * Filter results to keep only Voice of Customer content.
 * Removes editorial, listicles, B2B/operator content.
 */
function filterVoCResults(results: TavilyAdvancedResult[]): TavilyAdvancedResult[] {
  // URL blacklist patterns (editorial/B2B content)
  const urlBlacklist = [
    /\/best-/i,
    /\/top-\d+/i,
    /learn\./i,
    /blog\./i,
    /\/guide\//i,
    /\/how-to-/i,
    /\/what-is-/i,
    /template/i,
    /\/pricing/i,
    /\/compare/i,
    /\/alternatives/i,
  ];

  // URL whitelist patterns (user voice content) - takes priority
  const urlWhitelist = [
    /reddit\.com\/r\/.*\/comments/i,
    /\/reviews\//i,
    /\/review\//i,
    /trustpilot\.com/i,
    /capterra\.com\/.*\/reviews/i,
    /g2\.com\/products\/.*\/reviews/i,
    /apps\.apple\.com/i,
    /play\.google\.com/i,
  ];

  // Title blacklist (listicle signals)
  const titleBlacklist = [
    /best.*software/i,
    /top \d+/i,
    /\d+ best/i,
    /comparison/i,
    / vs\.? /i,
    /alternatives? to/i,
    /pricing/i,
    /guide to/i,
    /how to choose/i,
  ];

  return results.filter(r => {
    // Whitelist takes priority - always include
    if (urlWhitelist.some(p => p.test(r.url))) return true;

    // Blacklist URL
    if (urlBlacklist.some(p => p.test(r.url))) return false;

    // Blacklist title
    if (titleBlacklist.some(p => p.test(r.title))) return false;

    return true;
  });
}

export interface TavilyAdvancedResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score: number;
}

export interface TavilyMultiSearchResponse {
  results: TavilyAdvancedResult[];
  queries: string[];
  totalResults: number;
}

/**
 * Search Tavily with multiple queries in parallel.
 * Uses advanced settings for deeper content.
 */
export async function searchTavilyMulti(
  queries: string[]
): Promise<{ success: true; data: TavilyMultiSearchResponse } | { success: false; error: TavilyError }> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    logger.error('TAVILY_API_KEY not configured');
    return {
      success: false,
      error: { error: 'tavily_not_configured', recoverable: false },
    };
  }

  try {
    // Execute all queries in parallel
    const promises = queries.map(query =>
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'advanced',
          max_results: 8,
          include_raw_content: true,
          include_answer: false,
        }),
      }).then(r => r.ok ? r.json() : null)
    );

    const responses = await Promise.all(promises);

    // Merge and dedupe results by URL
    const seenUrls = new Set<string>();
    const allResults: TavilyAdvancedResult[] = [];

    for (const response of responses) {
      if (!response?.results) continue;

      for (const result of response.results) {
        if (seenUrls.has(result.url)) continue;
        seenUrls.add(result.url);

        // Truncate raw_content if present
        if (result.raw_content && result.raw_content.length > 2000) {
          result.raw_content = result.raw_content.slice(0, 2000) + '...';
        }

        allResults.push(result);
      }
    }

    // Sort by score descending, take top 20
    allResults.sort((a, b) => b.score - a.score);
    const topResults = allResults.slice(0, 20);

    // Filter out editorial/B2B content
    const filtered = filterVoCResults(topResults);

    logger.dev(`[tavily-multi] ${queries.length} queries -> ${allResults.length} unique -> top ${topResults.length} -> ${filtered.length} VoC`);

    // Log results for debugging
    if (process.env.DEBUG_AI_RESPONSES === 'true') {
      logger.dev('[tavily-multi] VoC Results:', JSON.stringify(filtered.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content.slice(0, 200) + '...',
        raw_content_length: r.raw_content?.length || 0,
        score: r.score,
      })), null, 2));
    }

    return {
      success: true,
      data: {
        results: filtered,
        queries,
        totalResults: allResults.length,
      },
    };
  } catch (error: any) {
    logger.error('Tavily multi-search failed:', error);
    return {
      success: false,
      error: { error: 'tavily_network_error', recoverable: true },
    };
  }
}

/**
 * Format advanced Tavily results for LLM extraction.
 * Includes raw_content for richer context.
 */
export function formatTavilyAdvancedSnippets(results: TavilyAdvancedResult[]): string {
  if (!results || results.length === 0) {
    return 'No search results found.';
  }

  return results
    .map((r, i) => {
      let snippet = `[${i + 1}] ${r.title}\nSource: ${r.url}\n${r.content}`;
      if (r.raw_content) {
        snippet += `\n\nFull excerpt:\n${r.raw_content}`;
      }
      return snippet;
    })
    .join('\n\n---\n\n');
}
