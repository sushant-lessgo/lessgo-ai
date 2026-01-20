/**
 * Perplexity API client for IVOC research.
 * Uses built-in web search to find real customer voice data.
 */
import { logger } from '@/lib/logger';
import type { IVOC } from '@/types/generation';

interface PerplexitySource {
  title: string;
  url: string;
}

type PerplexitySuccessResult = {
  success: true;
  data: IVOC;
  model: string;
  sources: PerplexitySource[];
};

type PerplexityErrorResult = {
  success: false;
  error: string;
  recoverable: boolean;
};

export type PerplexityResult = PerplexitySuccessResult | PerplexityErrorResult;

// Domains to search for real customer voice
const SEARCH_DOMAINS = [
  'reddit.com',
  'g2.com',
  'capterra.com',
  'trustpilot.com',
  'producthunt.com',
  'indiehackers.com',
];

// JSON schema for structured output
const IVOC_JSON_SCHEMA = {
  type: 'object',
  properties: {
    pains: {
      type: 'array',
      items: { type: 'string' },
      description: 'Real complaints and frustrations (5-8 items)',
    },
    desires: {
      type: 'array',
      items: { type: 'string' },
      description: 'What they want and need (5-8 items)',
    },
    objections: {
      type: 'array',
      items: { type: 'string' },
      description: 'Buying concerns and doubts (5-8 items)',
    },
    firmBeliefs: {
      type: 'array',
      items: { type: 'string' },
      description: 'Strong beliefs about the problem (3-5 items)',
    },
    shakableBeliefs: {
      type: 'array',
      items: { type: 'string' },
      description: 'Beliefs that could change with evidence (3-5 items)',
    },
    commonPhrases: {
      type: 'array',
      items: { type: 'string' },
      description: 'Exact expressions customers use (5-8 items)',
    },
  },
  required: ['pains', 'desires', 'objections', 'firmBeliefs', 'shakableBeliefs', 'commonPhrases'],
};

/**
 * Build the IVOC research prompt.
 */
function buildPrompt(category: string, audience: string, productDescription?: string): string {
  const productContext = productDescription
    ? `\nProduct context: ${productDescription}`
    : '';

  return `Search for real customer discussions about "${category}" products for "${audience}".${productContext}

Find complaints, desires, and concerns from Reddit, forums, and review sites.
Use EXACT language from real posts - short phrases, first-person, specific.

IMPORTANT RULES:
- Use actual words customers say, NOT marketing speak
- Keep phrases SHORT (under 10 words)
- Use FIRST PERSON where possible ("I can't...", "I wish...", "I hate...")
- Be SPECIFIC, not generic

BAD examples (do NOT output these):
- "concerns about pricing transparency"
- "challenges your target audience faces"
- "pain points and frustrations"

GOOD examples (use this style):
- "they charged me twice and ghosted support"
- "I tried 5 apps and they all suck"
- "why is this so complicated"
- "just want something that works"

Return JSON with:
- pains (5-8): Real complaints/frustrations
- desires (5-8): What they want
- objections (5-8): Buying concerns
- firmBeliefs (3-5): Strong beliefs about this market
- shakableBeliefs (3-5): Beliefs that could change
- commonPhrases (5-8): Exact expressions used`;
}

/**
 * Research IVOC using Perplexity's built-in web search.
 * Single API call that searches and synthesizes customer voice data.
 */
export async function researchWithPerplexity(
  category: string,
  audience: string,
  productDescription?: string
): Promise<PerplexityResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    logger.error('PERPLEXITY_API_KEY not configured');
    return {
      success: false,
      error: 'perplexity_not_configured',
      recoverable: false,
    };
  }

  const model = process.env.PERPLEXITY_MODEL || 'sonar';
  const prompt = buildPrompt(category, audience, productDescription);

  logger.dev('[perplexity] PROMPT:', prompt);
  logger.dev('[perplexity] MODEL:', model);
  logger.dev('[perplexity] DOMAINS:', SEARCH_DOMAINS);

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        search_domain_filter: SEARCH_DOMAINS,
        search_recency_filter: 'year',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'ivoc_research',
            strict: true,
            schema: IVOC_JSON_SCHEMA,
          },
        },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text();
      logger.error(`Perplexity API error: ${status}`, errorText);

      // Rate limit = recoverable
      if (status === 429) {
        return {
          success: false,
          error: 'perplexity_rate_limit',
          recoverable: true,
        };
      }

      // Auth error = not recoverable
      if (status === 401) {
        return {
          success: false,
          error: 'perplexity_auth_error',
          recoverable: false,
        };
      }

      return {
        success: false,
        error: `perplexity_error_${status}`,
        recoverable: status >= 500,
      };
    }

    const data = await response.json();
    logger.dev('[perplexity] RESPONSE:', JSON.stringify(data, null, 2));

    // Extract content from response
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      logger.error('Perplexity returned empty content');
      return {
        success: false,
        error: 'perplexity_empty_response',
        recoverable: true,
      };
    }

    // Parse IVOC JSON
    let ivoc: IVOC;
    try {
      ivoc = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse Perplexity response as JSON:', content);
      return {
        success: false,
        error: 'perplexity_parse_error',
        recoverable: true,
      };
    }

    // Validate IVOC structure
    if (!validateIVOC(ivoc)) {
      logger.error('Invalid IVOC structure from Perplexity:', ivoc);
      return {
        success: false,
        error: 'perplexity_invalid_ivoc',
        recoverable: true,
      };
    }

    // Extract sources/citations from response
    const sources: PerplexitySource[] = (data.citations || []).map((url: string) => ({
      title: url,
      url,
    }));

    return {
      success: true,
      data: ivoc,
      model,
      sources,
    };
  } catch (error: any) {
    logger.error('Perplexity request failed:', error);
    return {
      success: false,
      error: error.message || 'perplexity_network_error',
      recoverable: true,
    };
  }
}

/**
 * Validate IVOC structure has all required arrays.
 */
function validateIVOC(ivoc: any): ivoc is IVOC {
  return (
    ivoc &&
    Array.isArray(ivoc.pains) &&
    Array.isArray(ivoc.desires) &&
    Array.isArray(ivoc.objections) &&
    Array.isArray(ivoc.firmBeliefs) &&
    Array.isArray(ivoc.shakableBeliefs) &&
    Array.isArray(ivoc.commonPhrases)
  );
}

/**
 * Quality gate to detect garbage/generic IVOC output.
 * Returns true if IVOC contains low-quality generic phrases.
 */
export function isLowQualityIVOC(ivoc: IVOC): boolean {
  const GARBAGE_PHRASES = [
    'target audience',
    'pain points',
    'market research',
    'pricing transparency',
    'customer service concerns',
    'challenges your target',
    'frustrations they face',
    'common complaints',
    'typical concerns',
    'general issues',
  ];

  const allText = [
    ...ivoc.pains,
    ...ivoc.desires,
    ...ivoc.objections,
    ...ivoc.commonPhrases,
  ]
    .join(' ')
    .toLowerCase();

  const hasGarbage = GARBAGE_PHRASES.some((phrase) => allText.includes(phrase));

  if (hasGarbage) {
    logger.warn('[perplexity] Low quality IVOC detected - contains generic phrases');
  }

  return hasGarbage;
}
