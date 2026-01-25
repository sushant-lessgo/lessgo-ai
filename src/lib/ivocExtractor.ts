/**
 * LLM-based IVOC extraction from Tavily search results.
 */
import { openai } from '@/lib/openaiClient';
import { logger } from '@/lib/logger';
import type { IVOC } from '@/types/generation';

const IVOC_EXTRACTION_PROMPT = `You are a Voice of Customer analyst. Extract customer insights from the provided search results.

Given these search results about "{category}" products for "{audience}":

{snippets}

Extract the following (use actual phrases from the results when possible):

1. pains (5-8): Problems, frustrations, complaints mentioned
2. desires (5-8): What they want, wish for, need
3. objections (5-8): Concerns or doubts before buying
4. firmBeliefs (3-5): Strong beliefs about this problem/market
5. shakableBeliefs (3-5): Beliefs that could change with evidence
6. commonPhrases (5-8): Exact phrases or expressions they use

Output valid JSON only, no explanation:
{
  "pains": ["..."],
  "desires": ["..."],
  "objections": ["..."],
  "firmBeliefs": ["..."],
  "shakableBeliefs": ["..."],
  "commonPhrases": ["..."]
}`;

/**
 * Extract IVOC from search snippets using GPT.
 */
export async function extractIVOC(
  category: string,
  audience: string,
  snippets: string
): Promise<{ success: true; data: IVOC; model: string } | { success: false; error: string }> {
  const prompt = IVOC_EXTRACTION_PROMPT
    .replace('{category}', category)
    .replace('{audience}', audience)
    .replace('{snippets}', snippets);

  logger.dev('[research/extractIVOC] PROMPT:', prompt);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    logger.dev('[research/extractIVOC] RESPONSE:', content);

    if (!content) {
      return { success: false, error: 'empty_response' };
    }

    const parsed = JSON.parse(content) as IVOC;

    // Validate required fields
    if (!validateIVOC(parsed)) {
      logger.error('Invalid IVOC structure:', parsed);
      return { success: false, error: 'invalid_ivoc_structure' };
    }

    return { success: true, data: parsed, model: 'gpt-4o-mini' };
  } catch (error: any) {
    logger.error('IVOC extraction failed:', error);
    return { success: false, error: error.message || 'extraction_failed' };
  }
}

/**
 * Generate IVOC without search results (fallback when Tavily fails).
 * Uses GPT's general knowledge about the category/audience.
 */
export async function generateIVOCFallback(
  category: string,
  audience: string
): Promise<{ success: true; data: IVOC; model: string } | { success: false; error: string }> {
  const prompt = `You are a Voice of Customer analyst. Generate typical customer insights for the following market segment.

Category: ${category}
Target Audience: ${audience}

Based on your knowledge of this market, generate:

1. pains (5-8): Typical problems/frustrations this audience has
2. desires (5-8): What they typically want
3. objections (5-8): Common buying concerns
4. firmBeliefs (3-5): Strong beliefs they typically hold
5. shakableBeliefs (3-5): Beliefs that could change
6. commonPhrases (5-8): Phrases they commonly use

Output valid JSON only:
{
  "pains": ["..."],
  "desires": ["..."],
  "objections": ["..."],
  "firmBeliefs": ["..."],
  "shakableBeliefs": ["..."],
  "commonPhrases": ["..."]
}`;

  logger.dev('[research/fallback] PROMPT:', prompt);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    logger.dev('[research/fallback] RESPONSE:', content);

    if (!content) {
      return { success: false, error: 'empty_response' };
    }

    const parsed = JSON.parse(content) as IVOC;

    if (!validateIVOC(parsed)) {
      return { success: false, error: 'invalid_ivoc_structure' };
    }

    return { success: true, data: parsed, model: 'gpt-4o' };
  } catch (error: any) {
    logger.error('IVOC fallback generation failed:', error);
    return { success: false, error: error.message || 'fallback_failed' };
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

// ============================================
// Pain-only extraction (tavily-deep mode)
// ============================================

const PAIN_EXTRACTION_PROMPT = `You are a Voice of Customer analyst specializing in pain point extraction.

Given these search results about "{category}" products for "{audience}":

{snippets}

Extract ONLY customer PAINS - complaints, frustrations, problems, things that annoy them.

RULES:
- Use EXACT language from the results when possible
- Keep phrases SHORT (under 12 words)
- Use FIRST PERSON ("I can't...", "I hate...", "so frustrating when...")
- Be SPECIFIC, not generic
- Include emotional language they actually use

BAD (do NOT output):
- "challenges with pricing transparency"
- "pain points and frustrations"
- "concerns about customer service"

GOOD (use this style):
- "spent 3 hours on hold and got nothing"
- "why do I have to click 10 times to do one thing"
- "the app crashes every time I try to export"
- "cancellation process is a nightmare"

Output valid JSON only:
{
  "pains": ["...", "...", ...],
  "painCategories": {
    "product": ["pains about the product itself"],
    "support": ["pains about customer service"],
    "pricing": ["pains about cost/value"],
    "ux": ["pains about usability"],
    "reliability": ["pains about bugs/crashes/downtime"]
  }
}

Return 10-15 pains total, distributed across relevant categories.`;

export interface PainExtractionResult {
  pains: string[];
  painCategories: {
    product: string[];
    support: string[];
    pricing: string[];
    ux: string[];
    reliability: string[];
  };
}

/**
 * Extract ONLY pain points from search snippets.
 * More focused than full IVOC extraction.
 */
export async function extractPainsOnly(
  category: string,
  audience: string,
  snippets: string
): Promise<{ success: true; data: PainExtractionResult; model: string } | { success: false; error: string }> {
  const prompt = PAIN_EXTRACTION_PROMPT
    .replace('{category}', category)
    .replace('{audience}', audience)
    .replace('{snippets}', snippets);

  logger.dev('[extractPains] Snippets length:', snippets.length);

  // Log snippet preview for debugging
  if (process.env.DEBUG_AI_PROMPTS === 'true') {
    logger.dev('[extractPains] Snippets preview (first 3000 chars):', snippets.slice(0, 3000));
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: 'empty_response' };
    }

    const parsed = JSON.parse(content) as PainExtractionResult;

    if (!Array.isArray(parsed.pains) || parsed.pains.length === 0) {
      return { success: false, error: 'no_pains_extracted' };
    }

    logger.dev(`[extractPains] Extracted ${parsed.pains.length} pains`);

    return { success: true, data: parsed, model: 'gpt-4o-mini' };
  } catch (error: any) {
    logger.error('Pain extraction failed:', error);
    return { success: false, error: error.message || 'extraction_failed' };
  }
}
