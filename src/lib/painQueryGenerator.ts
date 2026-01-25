/**
 * Generate focused search queries for pain point research.
 */
import { openai } from '@/lib/openaiClient';
import { logger } from '@/lib/logger';

export interface PainQueryInput {
  category: string;
  audience: string;
  productDescription: string;
}

export interface PainQueryOutput {
  success: true;
  queries: string[];
  model: string;
}

export interface PainQueryError {
  success: false;
  error: string;
}

const QUERY_GEN_PROMPT = `Generate a search query plan to find REAL customer complaints about {category} products for {audience}.

Product: {productDescription}

## RULES (non-negotiable)

### 1. Query Skeleton (every query must have all 4 parts)
(ANCHORS) (PAIN_TRIGGERS) (SOURCE) (NEGATIVES)

- ANCHORS: product category, app/tool type, or competitor names
- PAIN_TRIGGERS: complaint verbs from the bank below
- SOURCE: site:reddit.com OR site:g2.com OR (review OR reddit)
- NEGATIVES: universal + category-specific

### 2. Boolean Syntax
- Every OR MUST be inside parentheses: ("doesn't work" OR "too buggy")
- NEVER use ungrouped OR
- Keep queries SHORT (6-14 words)

### 3. Source Targeting
- Use site:reddit.com (NOT the word "reddit")
- Use site:g2.com, site:capterra.com for reviews
- Example: site:reddit.com ("workout app") ("doesn't work")

### 4. User Language (CRITICAL)
Convert product description to USER complaint language:
- BAD: "real-time adaptation" (internal jargon)
- GOOD: "doesn't adapt", "keeps giving same thing", "too generic"

### 5. Pain Trigger Bank (use 1-2 per query)
Core: frustrating, annoying, hate, complaint, problem
Failure: "doesn't work", "not worth it", "too buggy", crash, broken
Value: "too expensive", "waste of money", refund, cancel
Support: "no response", "support ignored", ghosted
Fit: "too complex", "hard to use", "not for beginners"

### 6. Negatives (two layers)
Universal: -coupon -deal -discount -promo -affiliate -template -pdf
Category-specific: generate 5-10 based on category (e.g., fitness: -gym -membership -class -facility -"near me")

### 7. Query Types (generate one of each)
1. Product failure pain (doesn't do X, wrong output)
2. Business model pain (pricing, cancel, subscription)
3. Reliability pain (bugs, crash, slow)
4. Competitor pain (CompA OR CompB with pain triggers)

## OUTPUT FORMAT (JSON only)
{
  "microQueries": [
    "query 1",
    "query 2",
    "query 3",
    "query 4"
  ],
  "categoryNegatives": ["-term1", "-term2", ...],
  "inferredCompetitors": ["Comp1", "Comp2", "Comp3"]
}

## EXAMPLES

BAD (ungrouped OR, "reddit" as word):
"AI trainer" frustrating reddit "doesn't work" OR "not personalized"

GOOD (grouped OR, site: prefix):
site:reddit.com ("AI personal trainer" OR "workout app") ("doesn't work" OR "too generic") -gym -membership`;

export async function generatePainQueries(
  input: PainQueryInput
): Promise<PainQueryOutput | PainQueryError> {
  const prompt = QUERY_GEN_PROMPT
    .replace('{category}', input.category)
    .replace('{audience}', input.audience)
    .replace('{productDescription}', input.productDescription);

  logger.dev(`[painQuery] Generating queries for: ${input.category}/${input.audience}`);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: 'empty_response' };
    }

    const parsed = JSON.parse(content);

    // Handle new structured format (microQueries) or legacy format (queries)
    const rawQueries = parsed.microQueries || parsed.queries;

    if (!Array.isArray(rawQueries) || rawQueries.length < 1) {
      return { success: false, error: 'invalid_queries_structure' };
    }

    // Append category negatives to each query if provided
    const categoryNegatives = parsed.categoryNegatives || [];
    const negativeString = categoryNegatives.join(' ');

    const queries = rawQueries.slice(0, 5).map((q: string) => {
      // Only append negatives if not already present
      if (negativeString && !q.includes(categoryNegatives[0])) {
        return `${q} ${negativeString}`;
      }
      return q;
    });

    logger.dev('[painQuery] Generated queries:', queries);
    if (parsed.inferredCompetitors?.length) {
      logger.dev('[painQuery] Inferred competitors:', parsed.inferredCompetitors);
    }
    if (categoryNegatives.length) {
      logger.dev('[painQuery] Category negatives:', categoryNegatives);
    }

    return {
      success: true,
      queries,
      model: 'gpt-4o-mini',
    };
  } catch (error: any) {
    logger.error('Pain query generation failed:', error);
    return { success: false, error: error.message || 'query_gen_failed' };
  }
}
