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
