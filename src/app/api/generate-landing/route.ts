import { NextRequest, NextResponse } from "next/server"
import { parseAiResponse } from "@/modules/prompt/parseAiResponse"
import { generateMockResponse } from "@/modules/prompt/mockResponseGenerator"
import { buildStrategyPrompt } from "@/modules/prompt/buildStrategyPrompt"
import { buildStrategicCopyPrompt, buildFullPrompt } from "@/modules/prompt/buildPrompt"
import { parseStrategyResponse, applyCardCountConstraints } from "@/modules/prompt/parseStrategyResponse"
import { logger } from '@/lib/logger'
import { withAIRateLimit } from '@/lib/rateLimit'

async function generateLandingHandler(req: NextRequest) {
  logger.dev("🚀 /api/generate-landing route called")
  try {
    const body = await req.json()
    const { prompt, onboardingStore, pageStore, use2Phase = true } = body

    logger.dev("📝 Request received:", {
      hasPrompt: !!prompt,
      promptLength: prompt?.length || 0,
      hasOnboardingStore: !!onboardingStore,
      hasPageStore: !!pageStore,
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
        const strategyPrompt = buildStrategyPrompt(onboardingStore, pageStore)

        let strategyResult = await callAIProvider(strategyPrompt, useOpenAI, model)

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

        const strategy = parseStrategyResponse(strategyContent)
        if (!strategy.success) {
          logger.warn("❌ Strategy parsing failed, falling back to single-phase generation")
          const fallbackPrompt = buildFullPrompt(onboardingStore, pageStore)
          const fallbackResult = await callAIProvider(fallbackPrompt, useOpenAI, model)

          if (fallbackResult.success) {
            const parsed = parseAiResponse(fallbackResult.data.choices[0]?.message?.content || "")
            parsed.warnings = parsed.warnings || []
            parsed.warnings.push("Strategy parsing failed, used single-phase fallback")
            return NextResponse.json(parsed)
          } else {
            throw new Error("Both strategy parsing and fallback generation failed")
          }
        }

        logger.dev("✅ Strategy parsed successfully:", {
          bigIdea: strategy.copyStrategy.bigIdea,
          cardCounts: strategy.cardCounts
        })

        // Apply constraints based on available features
        const constrainedStrategy = {
          ...strategy,
          cardCounts: applyCardCountConstraints(
            strategy.cardCounts,
            onboardingStore.featuresFromAI?.length
          )
        }

        // Phase 2: Strategic Copy Generation
        logger.dev("✍️ Phase 2: Strategic Copy Generation")
        const copyPrompt = buildStrategicCopyPrompt(onboardingStore, pageStore, constrainedStrategy)

        let copyResult = await callAIProvider(copyPrompt, useOpenAI, model)

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

        const parsed = parseAiResponse(copyContent)

        // Add strategy metadata to response
        parsed.strategy = constrainedStrategy
        parsed.warnings = parsed.warnings || []
        if (constrainedStrategy.warnings?.length > 0) {
          parsed.warnings.push(...constrainedStrategy.warnings)
        }

        logger.dev("✅ 2-phase generation completed successfully")
        return NextResponse.json(parsed)

      } catch (error) {
        logger.error("❌ 2-phase generation failed:", error)

        // Final fallback to single-phase
        try {
          logger.dev("🔄 Attempting final single-phase fallback")
          const fallbackPrompt = buildFullPrompt(onboardingStore, pageStore)
          const fallbackResult = await callAIProvider(fallbackPrompt, useOpenAI, model)

          if (fallbackResult.success) {
            const parsed = parseAiResponse(fallbackResult.data.choices[0]?.message?.content || "")
            parsed.warnings = parsed.warnings || []
            parsed.warnings.push("2-phase generation failed, used emergency single-phase fallback")
            return NextResponse.json(parsed)
          }
        } catch (fallbackError) {
          logger.error("❌ Emergency fallback also failed:", fallbackError)
        }

        throw error
      }
    } else {
      // Single-Phase Legacy Generation
      logger.dev("📝 Using single-phase legacy generation")

      // Try primary AI provider
      let result = await callAIProvider(prompt, useOpenAI, model)

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