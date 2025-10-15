import { NextRequest, NextResponse } from "next/server"
import { parseAiResponse, applyManualPreferredDefaults } from "@/modules/prompt/parseAiResponse"
import { generateMockResponse } from "@/modules/prompt/mockResponseGenerator"
import { buildStrategyPrompt } from "@/modules/prompt/buildStrategyPrompt"
import { buildStrategicCopyPrompt, buildFullPrompt, generateCardRequirementsReport } from "@/modules/prompt/buildPrompt"
import { parseStrategyResponse, applyCardCountConstraints } from "@/modules/prompt/parseStrategyResponse"
import { getCompleteElementsMap } from "@/modules/sections/elementDetermination"
import { logger } from '@/lib/logger'
import { withAIRateLimit } from '@/lib/rateLimit'

// Debug mode environment variables
const DEBUG_AI_PROMPTS = process.env.DEBUG_AI_PROMPTS === 'true';
const DEBUG_AI_RESPONSES = process.env.DEBUG_AI_RESPONSES === 'true';
const DEBUG_ELEMENT_SELECTION = process.env.DEBUG_ELEMENT_SELECTION === 'true';

/**
 * Smart truncation for logging large content
 */
function smartTruncate(content: string, maxLength: number = 1000): string {
  if (content.length <= maxLength) return content;

  const truncated = content.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const cutPoint = lastSpace > maxLength * 0.8 ? lastSpace : maxLength;

  return content.substring(0, cutPoint) + `... [truncated, total: ${content.length} chars]`;
}

/**
 * Logs AI prompt with smart formatting and truncation
 */
function logAIPrompt(promptType: string, prompt: string, metadata?: any) {
  const promptLength = prompt.length;
  const sections = prompt.split('\n\n').length;

  logger.debug(`🤖 ${promptType} Prompt Generated:`, {
    length: promptLength,
    sections,
    ...metadata
  });

  if (DEBUG_AI_PROMPTS) {
    logger.debug(`📝 Full ${promptType} Prompt:`, prompt);
  } else {
    logger.debug(`📝 ${promptType} Prompt Preview:`, smartTruncate(prompt, 800));
  }
}

/**
 * Logs AI response with detailed analysis
 */
function logAIResponse(responseType: string, response: any, metadata?: any) {
  const content = response.choices?.[0]?.message?.content || '';
  const usage = response.usage;

  logger.debug(`🔄 ${responseType} AI Response Received:`, {
    contentLength: content.length,
    usage: usage ? {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens
    } : 'Not available',
    hasChoices: !!response.choices?.length,
    ...metadata
  });

  if (DEBUG_AI_RESPONSES) {
    logger.debug(`📤 Full ${responseType} Response:`, content);
  } else {
    logger.debug(`📤 ${responseType} Response Preview:`, smartTruncate(content, 1000));
  }
}

/**
 * Classifies error types to help with debugging and recovery
 */
function classifyError(error: any): {
  type: 'validation' | 'network' | 'parsing' | 'schema' | 'ai_provider' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverySuggestion: string;
  category: string;
} {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : '';

  // Validation errors
  if (message.includes('Missing required store data') ||
      message.includes('missing layout sections') ||
      message.includes('validation')) {
    return {
      type: 'validation',
      severity: 'high',
      recoverySuggestion: 'Check onboarding and page store data integrity',
      category: 'Input Validation'
    };
  }

  // Schema/Layout errors
  if (message.includes('layoutElementSchema') ||
      message.includes('unified schema') ||
      message.includes('Elements map generation failed') ||
      (stack && stack.includes('layoutElementSchema'))) {
    return {
      type: 'schema',
      severity: 'critical',
      recoverySuggestion: 'Check unified schema migration and element determination logic',
      category: 'Schema Migration'
    };
  }

  // AI Provider errors
  if (message.includes('AI provider call failed') ||
      message.includes('OpenAI') ||
      message.includes('Nebius') ||
      message.includes('callAIProvider')) {
    return {
      type: 'ai_provider',
      severity: 'medium',
      recoverySuggestion: 'Check API keys, rate limits, and network connectivity',
      category: 'AI Provider'
    };
  }

  // Strategy/Parsing errors
  if (message.includes('Strategy prompt building failed') ||
      message.includes('parsing') ||
      message.includes('buildStrategyPrompt')) {
    return {
      type: 'parsing',
      severity: 'high',
      recoverySuggestion: 'Check prompt building logic and data formatting',
      category: 'Prompt Generation'
    };
  }

  // Network errors
  if (message.includes('fetch') ||
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('ENOTFOUND')) {
    return {
      type: 'network',
      severity: 'medium',
      recoverySuggestion: 'Check network connectivity and API endpoints',
      category: 'Network'
    };
  }

  return {
    type: 'unknown',
    severity: 'high',
    recoverySuggestion: 'Review full error details and stack trace',
    category: 'Unknown'
  };
}

async function generateLandingHandler(req: NextRequest) {
  logger.dev("🚀 /api/generate-landing route called")
  try {
    const body = await req.json()
    const { prompt, onboardingStore, pageStore, layoutRequirements, use2Phase = true } = body

    logger.dev("📝 Request received:", {
      hasPrompt: !!prompt,
      promptLength: prompt?.length || 0,
      hasOnboardingStore: !!onboardingStore,
      hasPageStore: !!pageStore,
      hasLayoutRequirements: !!layoutRequirements,
      use2Phase
    })

    // Validate request format
    if (use2Phase && (!onboardingStore || !pageStore)) {
      return NextResponse.json({
        error: "Invalid request",
        detail: "onboardingStore and pageStore required for 2-phase generation"
      }, { status: 400 })
    }

    if (!use2Phase && (!prompt || typeof prompt !== 'string')) {
      return NextResponse.json({
        error: "Invalid request",
        detail: "Prompt is required for single-phase generation"
      }, { status: 400 })
    }

    const DEMO_TOKEN = "lessgodemomockdata"
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "").trim()
    
    logger.dev("🔍 Environment check:", {
      NEXT_PUBLIC_USE_MOCK_GPT: process.env.NEXT_PUBLIC_USE_MOCK_GPT,
      token: token.substring(0, 10) + '...',
      isDemoToken: token === DEMO_TOKEN
    })

    // Check for mock data usage
    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" || token === DEMO_TOKEN) {
      logger.dev("🤖 Using mock response for AI copy generation")
      const mockPrompt = use2Phase ? buildFullPrompt(onboardingStore, pageStore) : prompt
      const mockResponse = generateMockResponse(mockPrompt)
      logger.dev("📦 Mock response content:", mockResponse.choices[0].message.content.substring(0, 500) + '...')
      const parsed = parseAiResponse(mockResponse.choices[0].message.content)

      // Apply default placeholders to manual_preferred fields (for mock responses too)
      if (use2Phase && pageStore) {
        parsed.content = applyManualPreferredDefaults(parsed.content, pageStore);
      }

      logger.dev("📊 Parsed result:", {
        success: parsed.success,
        contentKeys: Object.keys(parsed.content),
        errors: parsed.errors,
        warnings: parsed.warnings
      })
      return NextResponse.json(parsed)
    }

    const useOpenAI = process.env.USE_OPENAI === "true"
    // Upgraded to GPT-4o-mini for better copy quality at minimal cost increase
    const model = useOpenAI ? "gpt-4o-mini" : "mistralai/Mixtral-8x7B-Instruct-v0.1"

    // Determine generation approach
    if (use2Phase) {
      // 2-Phase Strategic Generation
      logger.dev("🧠 Starting 2-phase strategic copy generation")

      try {
        // Phase 1: Strategic Analysis
        logger.dev("📊 Phase 1: Strategic Analysis")

        // Step 1: Validate input data
        logger.dev("🔍 Step 1: Validating input data...")
        if (!onboardingStore || !pageStore) {
          throw new Error("Missing required store data for 2-phase generation");
        }

        if (!pageStore.layout?.sections) {
          throw new Error("PageStore missing layout sections data");
        }

        logger.dev("✅ Input validation passed:", {
          sections: pageStore.layout.sections.length,
          hasOnboardingData: !!onboardingStore.oneLiner,
          hasFeatures: !!onboardingStore.featuresFromAI?.length
        });

        // Step 2: Generate elements map
        logger.dev("🗺️ Step 2: Generating complete elements map...");
        let elementsMap;
        try {
          elementsMap = getCompleteElementsMap(onboardingStore, pageStore);
          logger.dev("✅ Elements map generated successfully:", {
            sectionsProcessed: Object.keys(elementsMap).length,
            firstSection: Object.keys(elementsMap)[0]
          });
        } catch (mapError) {
          logger.error("❌ Failed to generate elements map:", {
            error: mapError instanceof Error ? mapError.message : String(mapError),
            onboardingStoreKeys: Object.keys(onboardingStore),
            pageStoreLayout: pageStore.layout
          });
          throw new Error(`Elements map generation failed: ${mapError instanceof Error ? mapError.message : String(mapError)}`);
        }

        const userFeatureCount = onboardingStore.featuresFromAI?.length;

        // Log card requirements analysis
        if (layoutRequirements) {
          const cardRequirementsReport = generateCardRequirementsReport(
            elementsMap,
            {}, // Empty strategy counts for initial analysis
            userFeatureCount
          );
          logger.debug("🎯 Card Requirements Analysis:", cardRequirementsReport);
        }

        // Step 3: Build strategy prompt
        logger.dev("📝 Step 3: Building strategy prompt...");
        let strategyPrompt;
        try {
          strategyPrompt = buildStrategyPrompt(onboardingStore, pageStore, layoutRequirements);
          logger.dev("✅ Strategy prompt built successfully:", {
            promptLength: strategyPrompt.length,
            hasLayoutRequirements: !!layoutRequirements,
            sections: layoutRequirements?.sections?.length || 0
          });
        } catch (promptError) {
          logger.error("❌ Failed to build strategy prompt:", {
            error: promptError instanceof Error ? promptError.message : String(promptError),
            stackTrace: promptError instanceof Error ? promptError.stack : undefined
          });
          throw new Error(`Strategy prompt building failed: ${promptError instanceof Error ? promptError.message : String(promptError)}`);
        }

        // Log strategy prompt
        logAIPrompt("Strategy", strategyPrompt, {
          hasLayoutRequirements: !!layoutRequirements,
          userFeatureCount,
          sectionsCount: Object.keys(elementsMap).length
        });

        // Step 4: Call AI provider for strategy
        logger.dev("🤖 Step 4: Calling AI provider for strategy generation...");
        let strategyResult;
        try {
          strategyResult = await callAIProvider(strategyPrompt, useOpenAI, model);
          logger.dev("✅ AI provider call completed:", {
            success: strategyResult.success,
            provider: useOpenAI ? 'OpenAI' : 'Nebius',
            model,
            hasData: !!strategyResult.data,
            hasError: !!strategyResult.error
          });
        } catch (aiError) {
          logger.error("❌ AI provider call failed:", {
            error: aiError instanceof Error ? aiError.message : String(aiError),
            provider: useOpenAI ? 'OpenAI' : 'Nebius',
            model,
            promptLength: strategyPrompt.length
          });
          throw new Error(`AI provider call failed: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
        }

        // Log strategy response
        if (strategyResult.success) {
          logAIResponse("Strategy", strategyResult.data, {
            provider: useOpenAI ? 'OpenAI' : 'Nebius',
            model
          });
        }

        // If strategy phase fails, try secondary provider
        if (!strategyResult.success) {
          logger.warn(`Strategy phase failed with primary provider, trying secondary...`)
          strategyResult = await callAIProvider(strategyPrompt, !useOpenAI, !useOpenAI ? "gpt-4o-mini" : "mistralai/Mixtral-8x7B-Instruct-v0.1")
        }

        // If strategy phase completely fails, fallback to single-phase
        if (!strategyResult.success) {
          logger.warn("❌ Strategy phase failed, falling back to single-phase generation")
          const fallbackPrompt = buildFullPrompt(onboardingStore, pageStore)
          const fallbackResult = await callAIProvider(fallbackPrompt, useOpenAI, model)

          if (fallbackResult.success) {
            const parsed = parseAiResponse(fallbackResult.data.choices[0]?.message?.content || "")
            parsed.content = applyManualPreferredDefaults(parsed.content, pageStore);
            parsed.warnings = parsed.warnings || []
            parsed.warnings.push("Strategy phase failed, used single-phase fallback")
            return NextResponse.json(parsed)
          } else {
            throw new Error("Both strategy and fallback generation failed")
          }
        }

        // Parse strategy response
        const strategyContent = strategyResult.data.choices[0]?.message?.content
        if (!strategyContent) {
          throw new Error("No strategy content received from AI provider")
        }

        const strategy = parseStrategyResponse(strategyContent, layoutRequirements)
        if (!strategy.success) {
          logger.warn("❌ Strategy parsing failed:", {
            errors: strategy.errors,
            warnings: strategy.warnings
          });
          logger.warn("❌ Strategy parsing failed, falling back to single-phase generation")
          const fallbackPrompt = buildFullPrompt(onboardingStore, pageStore)
          const fallbackResult = await callAIProvider(fallbackPrompt, useOpenAI, model)

          if (fallbackResult.success) {
            const parsed = parseAiResponse(fallbackResult.data.choices[0]?.message?.content || "")
            parsed.content = applyManualPreferredDefaults(parsed.content, pageStore);
            parsed.warnings = parsed.warnings || []
            parsed.warnings.push("Strategy parsing failed, used single-phase fallback")
            return NextResponse.json(parsed)
          } else {
            throw new Error("Both strategy parsing and fallback generation failed")
          }
        }

        logger.dev("✅ Strategy parsed successfully:", {
          bigIdea: strategy.copyStrategy?.bigIdea,
          cardCounts: strategy.cardCounts,
          errors: strategy.errors,
          warnings: strategy.warnings
        })

        // Map strategy card counts to actual UIBlocks if layout requirements available
        let mappedCardCounts: Record<string, number> = strategy.cardCounts
        if (layoutRequirements) {
          const { mapStrategyToUIBlocks } = await import('@/modules/sections/getLayoutRequirements')
          mappedCardCounts = mapStrategyToUIBlocks(strategy.cardCounts, layoutRequirements)
          logger.dev("📊 Mapped card counts to UIBlocks:", {
            originalCounts: strategy.cardCounts,
            mappedCounts: mappedCardCounts,
            sectionsCount: layoutRequirements.sections.length
          })

          // Generate post-mapping card requirements report
          const postMappingReport = generateCardRequirementsReport(
            elementsMap,
            mappedCardCounts,
            userFeatureCount
          );
          logger.debug("🎯 Post-Mapping Card Requirements Analysis:", postMappingReport);
        }

        // Apply constraints based on available features
        const constrainedCardCounts = applyCardCountConstraints(
          mappedCardCounts,
          onboardingStore.featuresFromAI?.length
        );

        const constrainedStrategy = {
          ...strategy,
          cardCounts: {
            ...strategy.cardCounts,
            ...constrainedCardCounts
          },
          layoutRequirements // Include layout requirements in strategy
        }

        // Phase 2: Strategic Copy Generation
        logger.dev("✍️ Phase 2: Strategic Copy Generation")
        const copyPrompt = buildStrategicCopyPrompt(onboardingStore, pageStore, constrainedStrategy, elementsMap)

        // Log copy prompt
        logAIPrompt("Copy", copyPrompt, {
          constrainedCardCounts: constrainedCardCounts,
          totalCards: Object.values(constrainedCardCounts).reduce((sum, count) => sum + count, 0),
          sectionsWithCards: Object.keys(constrainedCardCounts).length
        });

        let copyResult = await callAIProvider(copyPrompt, useOpenAI, model)

        // Log copy response
        if (copyResult.success) {
          logAIResponse("Copy", copyResult.data, {
            provider: useOpenAI ? 'OpenAI' : 'Nebius',
            model,
            expectedCards: Object.values(constrainedCardCounts).reduce((sum, count) => sum + count, 0)
          });
        }

        // If copy phase fails, try secondary provider
        if (!copyResult.success) {
          logger.warn(`Copy phase failed with primary provider, trying secondary...`)
          copyResult = await callAIProvider(copyPrompt, !useOpenAI, !useOpenAI ? "gpt-4o-mini" : "mistralai/Mixtral-8x7B-Instruct-v0.1")
        }

        // If copy phase fails, try fallback
        if (!copyResult.success) {
          logger.warn("❌ Copy phase failed, falling back to single-phase generation")
          const fallbackPrompt = buildFullPrompt(onboardingStore, pageStore)
          const fallbackResult = await callAIProvider(fallbackPrompt, useOpenAI, model)

          if (fallbackResult.success) {
            const parsed = parseAiResponse(fallbackResult.data.choices[0]?.message?.content || "")
            parsed.content = applyManualPreferredDefaults(parsed.content, pageStore);
            parsed.warnings = parsed.warnings || []
            parsed.warnings.push("Copy phase failed, used single-phase fallback")
            return NextResponse.json(parsed)
          } else {
            throw new Error("Both copy generation and fallback failed")
          }
        }

        // Parse and validate copy response
        const copyContent = copyResult.data.choices[0]?.message?.content
        if (!copyContent) {
          throw new Error("No copy content received from AI provider")
        }

        logger.debug("🔍 Starting copy content parsing and validation")
        const parsed = parseAiResponse(
          copyContent,
          constrainedStrategy.cardCounts
        )

        // Apply default placeholders to manual_preferred fields
        parsed.content = applyManualPreferredDefaults(parsed.content, pageStore);

        // Log parsing results
        logger.debug("✅ Copy parsing completed:", {
          success: parsed.success,
          contentSections: Object.keys(parsed.content).length,
          errors: parsed.errors,
          warnings: parsed.warnings,
          isPartial: parsed.isPartial
        });

        // Validate against expected card counts
        if (layoutRequirements && parsed.success) {
          const { validateGeneratedJSON } = await import('@/modules/prompt/buildPrompt');
          const validation = validateGeneratedJSON(
            parsed.content,
            elementsMap,
            constrainedStrategy.cardCounts,
            userFeatureCount
          );

          logger.debug("🎯 JSON Validation Results:", {
            isValid: validation.isValid,
            errors: validation.errors,
            warnings: validation.warnings,
            summary: validation.summary
          });

          // Add validation results to response
          if (!validation.isValid) {
            parsed.warnings = parsed.warnings || [];
            parsed.warnings.push(...validation.errors);
            parsed.warnings.push("Generated content failed card count validation");
          }
        }

        // Add strategy metadata to response
        parsed.strategy = constrainedStrategy
        parsed.warnings = parsed.warnings || []
        if (constrainedStrategy.warnings?.length > 0) {
          parsed.warnings.push(...constrainedStrategy.warnings)
        }

        logger.dev("✅ 2-phase generation completed successfully:", {
          finalSections: Object.keys(parsed.content).length,
          hasStrategy: !!parsed.strategy,
          totalWarnings: parsed.warnings.length,
          totalErrors: parsed.errors.length,
          elementsMapSections: Object.keys(elementsMap).length
        });

        // Include elementsMap in response for client-side exclusion handling
        // Debug logging to verify elementsMap structure
        logger.dev("📦 Elements map being sent to client:", {
          hasElementsMap: !!elementsMap,
          sections: elementsMap ? Object.keys(elementsMap) : [],
          firstSection: elementsMap && Object.keys(elementsMap)[0] ? {
            sectionId: Object.keys(elementsMap)[0],
            data: elementsMap[Object.keys(elementsMap)[0]]
          } : null,
          hasExclusions: elementsMap ? Object.values(elementsMap).some((s: any) => s.excludedElements?.length > 0) : false,
          totalExclusions: elementsMap ? Object.values(elementsMap).reduce((sum: number, s: any) => sum + (s.excludedElements?.length || 0), 0) : 0
        });

        const responseWithElementsMap = {
          ...parsed,
          elementsMap: elementsMap  // ✅ ADDED: Pass elementsMap to client
        };

        return NextResponse.json(responseWithElementsMap)

      } catch (error) {
        // Classify error for better debugging
        const errorClassification = classifyError(error);

        // Enhanced error logging with full context
        const errorDetails = {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined,
          type: typeof error,
          classification: errorClassification,
          context: {
            hasOnboardingStore: !!onboardingStore,
            hasPageStore: !!pageStore,
            hasLayoutRequirements: !!layoutRequirements,
            sections: pageStore?.layout?.sections?.length || 0,
            featuresCount: onboardingStore?.featuresFromAI?.length || 0,
          },
          timestamp: new Date().toISOString()
        };

        logger.error(`❌ 2-phase generation failed [${errorClassification.category} - ${errorClassification.severity.toUpperCase()}]:`, errorDetails);
        logger.error(`💡 Recovery suggestion: ${errorClassification.recoverySuggestion}`);

        // Log the full error object for debugging
        if (process.env.NODE_ENV === 'development') {
          logger.error("🔍 Full error object:", error);
        }

        // Final fallback to single-phase
        try {
          logger.dev("🔄 Attempting final single-phase fallback")
          const fallbackPrompt = buildFullPrompt(onboardingStore, pageStore)
          const fallbackResult = await callAIProvider(fallbackPrompt, useOpenAI, model)

          if (fallbackResult.success) {
            const parsed = parseAiResponse(fallbackResult.data.choices[0]?.message?.content || "")
            parsed.content = applyManualPreferredDefaults(parsed.content, pageStore);
            parsed.warnings = parsed.warnings || []
            parsed.warnings.push("2-phase generation failed, used emergency single-phase fallback")
            return NextResponse.json(parsed)
          }
        } catch (fallbackError) {
          const fallbackErrorDetails = {
            message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
            name: fallbackError instanceof Error ? fallbackError.name : 'Unknown',
            stack: fallbackError instanceof Error ? fallbackError.stack : undefined,
            originalError: errorDetails,
            timestamp: new Date().toISOString()
          };

          logger.error("❌ Emergency fallback also failed:", fallbackErrorDetails);

          if (process.env.NODE_ENV === 'development') {
            logger.error("🔍 Full fallback error object:", fallbackError);
          }
        }

        throw error
      }
    } else {
      // Single-Phase Legacy Generation
      logger.dev("📝 Using single-phase legacy generation")

      // Log single-phase prompt
      logAIPrompt("Single-Phase", prompt, {
        promptType: "legacy",
        useOpenAI,
        model
      });

      // Try primary AI provider
      let result = await callAIProvider(prompt, useOpenAI, model)

      // Log single-phase response
      if (result.success) {
        logAIResponse("Single-Phase", result.data, {
          provider: useOpenAI ? 'OpenAI' : 'Nebius',
          model
        });
      }

      // If primary fails, try secondary provider
      if (!result.success) {
        logger.warn(`Primary AI provider (${useOpenAI ? 'OpenAI' : 'Nebius'}) failed, trying secondary...`)
        result = await callAIProvider(prompt, !useOpenAI, !useOpenAI ? "gpt-4o-mini" : "mistralai/Mixtral-8x7B-Instruct-v0.1")
      }

      // If both AI providers fail, return graceful degradation
      if (!result.success) {
        logger.error("Both AI providers failed, returning mock response")
        const mockResponse = generateMockResponse(prompt)
        const parsed = parseAiResponse(mockResponse.choices[0].message.content)
        // Apply defaults if we have pageStore (for single-phase with 2-phase fallback)
        if (pageStore) {
          parsed.content = applyManualPreferredDefaults(parsed.content, pageStore);
        }
        parsed.isPartial = true
        parsed.warnings = parsed.warnings || []
        parsed.warnings.push("AI providers unavailable, using template content")
        return NextResponse.json(parsed)
      }

      // Parse and validate AI response
      const aiContent = result.data.choices[0]?.message?.content
      if (!aiContent) {
        throw new Error("No content received from AI provider")
      }

      const parsed = parseAiResponse(aiContent)
      // Apply defaults if we have pageStore (for single-phase with 2-phase fallback)
      if (pageStore) {
        parsed.content = applyManualPreferredDefaults(parsed.content, pageStore);
      }
      return NextResponse.json(parsed)
    }

  } catch (err) {
    logger.error("Server error:", err)
    
    // Last resort: return basic mock response
    try {
      const body = await req.json()
      const { prompt, onboardingStore, pageStore, use2Phase } = body
      const fallbackPrompt = use2Phase && onboardingStore && pageStore
        ? buildFullPrompt(onboardingStore, pageStore)
        : prompt || ""

      const mockResponse = generateMockResponse(fallbackPrompt)
      const parsed = parseAiResponse(mockResponse.choices[0].message.content)
      // Apply defaults if we have pageStore
      if (pageStore) {
        parsed.content = applyManualPreferredDefaults(parsed.content, pageStore);
      }
      parsed.isPartial = true
      parsed.warnings = ["Server error occurred, using fallback content"]
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({
        error: "Internal server error",
        isPartial: true,
        content: {},
        warnings: ["Complete system failure"]
      }, { status: 500 })
    }
  }
}

// Apply rate limiting to the POST handler
export const POST = withAIRateLimit(generateLandingHandler);

async function callAIProvider(prompt: string, useOpenAI: boolean, model: string) {
  try {
    const apiURL = useOpenAI
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.studio.nebius.ai/v1/chat/completions"

    const apiKey = useOpenAI
      ? process.env.OPENAI_API_KEY
      : process.env.NEBIUS_API_KEY

    if (!apiKey) {
      logger.error(`Missing API key for ${useOpenAI ? 'OpenAI' : 'Nebius'}`)
      return { success: false, error: "Missing API key" }
    }

    const body = {
      model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5, // Reduced for more consistent business copy
    }

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    if (!response.ok) {
      logger.error(`${useOpenAI ? "OpenAI" : "Nebius"} API Error:`, result)
      return { success: false, error: result }
    }

    return { success: true, data: result }

  } catch (error) {
    logger.error(`Error calling ${useOpenAI ? 'OpenAI' : 'Nebius'}:`, error)
    return { success: false, error }
  }
}