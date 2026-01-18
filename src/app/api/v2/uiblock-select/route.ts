/**
 * /api/v2/uiblock-select - UIBlock selection endpoint
 *
 * Flow:
 * 1. Validate request
 * 2. Auth + credits check (1 credit)
 * 3. Build selection prompt
 * 4. Call OpenAI (gpt-4o-mini)
 * 5. Parse response
 * 6. Post-validate composition (auto-fix violations)
 * 7. If questions exist, return needsInput response
 * 8. Consume credits, return UIBlocks
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAuth } from '@/lib/middleware/planCheck';
import { consumeCredits, CREDIT_COSTS, UsageEventType } from '@/lib/creditSystem';
import { openai } from '@/lib/openaiClient';
import {
  buildSelectionPrompt,
  buildSelectionPromptWithAnswers,
  parseSelectionResponse,
  getLayoutsForSection,
} from '@/modules/uiblock/selectionPrompt';
import { ensureValidComposition } from '@/modules/uiblock/compositionRules';
import type {
  SectionType,
  StrategyOutput,
  UIBlockQuestion,
  UIBlockSelectResponse,
} from '@/types/generation';
import { sectionTypes, vibes, awarenessLevels } from '@/types/generation';

export const dynamic = 'force-dynamic';

// Strategy schema (same as strategy route output)
const StrategySchema = z.object({
  oneReader: z.object({
    who: z.string(),
    coreDesire: z.string(),
    corePain: z.string(),
    beliefs: z.string(),
    awareness: z.enum(awarenessLevels as unknown as [string, ...string[]]),
    sophistication: z.enum(['low', 'medium', 'high']),
    emotionalState: z.string(),
  }),
  oneIdea: z.object({
    bigBenefit: z.string(),
    uniqueMechanism: z.string(),
    reasonToBelieve: z.string(),
  }),
  sections: z.array(z.enum(sectionTypes as unknown as [string, ...string[]])),
  vibe: z.enum(vibes as unknown as [string, ...string[]]),
  featureAnalysis: z.array(
    z.object({
      feature: z.string(),
      benefit: z.string(),
      benefitOfBenefit: z.string(),
      whatItMeans: z.string(),
    })
  ),
  objections: z.array(
    z.object({
      thought: z.string(),
      section: z.enum(sectionTypes as unknown as [string, ...string[]]),
    })
  ),
});

// Request schema
const UIBlockSelectRequestSchema = z.object({
  strategy: StrategySchema,
  productName: z.string().min(1, 'Product name is required'),
  assets: z.object({
    hasTestimonials: z.boolean(),
    hasSocialProof: z.boolean(),
    hasConcreteResults: z.boolean(),
  }),
  answers: z.record(z.string()).optional(),
});

async function uiblockSelectHandler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request
    const body = await req.json();
    const validation = UIBlockSelectRequestSchema.safeParse(body);

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

    const { strategy, productName, answers } = validation.data;

    // 2. Auth + credits check
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

    // 3. Build selection prompt
    const prompt = answers
      ? buildSelectionPromptWithAnswers(
          strategy as StrategyOutput,
          productName,
          {}, // Previous selections not tracked in this flow
          answers
        )
      : buildSelectionPrompt(strategy as StrategyOutput, productName);

    // 4. Call OpenAI
    let aiResponse: string;
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4, // Lower temp for more consistent selections
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return createSecureResponse(
          {
            success: false,
            error: 'empty_response',
            message: 'AI returned empty response',
            recoverable: true,
          },
          500
        );
      }

      aiResponse = content;
    } catch (aiError: any) {
      logger.error('OpenAI UIBlock selection failed:', aiError);
      return createSecureResponse(
        {
          success: false,
          error: 'ai_error',
          message: aiError.message || 'AI generation failed',
          recoverable: true,
        },
        500
      );
    }

    // 5. Parse response
    const parseResult = parseSelectionResponse(aiResponse);
    if (!parseResult) {
      logger.error('UIBlock selection parse failed');
      return createSecureResponse(
        {
          success: false,
          error: 'parse_error',
          message: 'Failed to parse AI response',
          recoverable: true,
        },
        500
      );
    }

    const { selections, questions } = parseResult;

    // Check for unresolved sections (null values or questions)
    const unresolvedSections = Object.entries(selections)
      .filter(([_, layout]) => layout === null)
      .map(([section]) => section as SectionType);

    // If we have questions or unresolved sections, return needsInput
    if (questions.length > 0 || unresolvedSections.length > 0) {
      // Convert AI questions to UIBlockQuestion format (add candidates)
      const aiQuestions: UIBlockQuestion[] = questions.map((q) => ({
        ...q,
        candidates: getLayoutsForSection(q.section),
      }));

      // Build questions for unresolved sections that don't have questions
      for (const section of unresolvedSections) {
        const hasQuestion = aiQuestions.some((q) => q.section === section);
        if (!hasQuestion) {
          // Auto-generate a question for this section
          const layouts = getLayoutsForSection(section);
          if (layouts.length > 0) {
            aiQuestions.push({
              id: `${section}.layout`,
              section,
              question: `Which layout would you prefer for the ${section} section?`,
              options: layouts.slice(0, 4), // Max 4 options
              candidates: layouts, // All available layouts for second pass
            });
          }
        }
      }

      const completeQuestions = aiQuestions;

      // Consume credits even for partial results
      const creditResult = await consumeCredits(
        userId,
        UsageEventType.UIBLOCK_SELECT,
        CREDIT_COSTS.UIBLOCK_SELECT,
        {
          endpoint: '/api/v2/uiblock-select',
          duration: Date.now() - startTime,
          metadata: {
            productName,
            questionsCount: completeQuestions.length,
            partial: true,
          },
        }
      );

      return createSecureResponse({
        success: true,
        needsInput: true,
        uiblocks: selections as Partial<Record<SectionType, string | null>>,
        questions: completeQuestions,
        creditsUsed: CREDIT_COSTS.UIBLOCK_SELECT,
        creditsRemaining: creditResult.remaining,
      });
    }

    // 6. Post-validate composition (all sections resolved)
    const resolvedSelections = selections as Record<SectionType, string>;
    const sections = strategy.sections as SectionType[];

    const { selections: fixedSelections, wasFixed, originalViolations } =
      ensureValidComposition(sections, resolvedSelections);

    if (wasFixed) {
      logger.info('Composition auto-fixed:', {
        violations: originalViolations.map((v) => v.rule),
      });
    }

    // 7. Consume credits
    const creditResult = await consumeCredits(
      userId,
      UsageEventType.UIBLOCK_SELECT,
      CREDIT_COSTS.UIBLOCK_SELECT,
      {
        endpoint: '/api/v2/uiblock-select',
        duration: Date.now() - startTime,
        metadata: {
          productName,
          sectionsCount: sections.length,
          wasFixed,
        },
      }
    );

    if (!creditResult.success) {
      logger.warn(`Credit consumption failed for user ${userId}: ${creditResult.error}`);
    }

    // 8. Return resolved UIBlocks
    const response: UIBlockSelectResponse = {
      success: true,
      uiblocks: fixedSelections,
      creditsUsed: CREDIT_COSTS.UIBLOCK_SELECT,
      creditsRemaining: creditResult.remaining,
    };

    return createSecureResponse(response);
  } catch (error: any) {
    logger.error('UIBlock select endpoint error:', error);
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

export const POST = withAIRateLimit(uiblockSelectHandler);
