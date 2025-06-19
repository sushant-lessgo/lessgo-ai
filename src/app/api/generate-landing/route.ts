import { NextResponse } from "next/server"
import { parseAiResponse } from "@/modules/prompt/parseAiResponse"
import { generateMockResponse } from "@/modules/prompt/mockResponseGenerator"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ 
        error: "Invalid request", 
        detail: "Prompt is required and must be a string" 
      }, { status: 400 })
    }

    const DEMO_TOKEN = "lessgodemomockdata"
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace("Bearer ", "").trim()

    // Check for mock data usage
    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" || token === DEMO_TOKEN) {
      console.log("Using mock response for AI copy generation")
      const mockResponse = generateMockResponse(prompt)
      const parsed = parseAiResponse(mockResponse.choices[0].message.content)
      return NextResponse.json(parsed)
    }

    const useOpenAI = process.env.USE_OPENAI === "true"
    const model = useOpenAI ? "gpt-3.5-turbo" : "mistralai/Mixtral-8x7B-Instruct-v0.1"

    // Try primary AI provider
    let result = await callAIProvider(prompt, useOpenAI, model)
    
    // If primary fails, try secondary provider
    if (!result.success) {
      console.warn(`Primary AI provider (${useOpenAI ? 'OpenAI' : 'Nebius'}) failed, trying secondary...`)
      result = await callAIProvider(prompt, !useOpenAI, !useOpenAI ? "gpt-3.5-turbo" : "mistralai/Mixtral-8x7B-Instruct-v0.1")
    }

    // If both AI providers fail, return graceful degradation
    if (!result.success) {
      console.error("Both AI providers failed, returning mock response")
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

  } catch (err) {
    console.error("Server error:", err)
    
    // Last resort: return basic mock response
    try {
      const { prompt } = await req.json()
      const mockResponse = generateMockResponse(prompt || "")
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

async function callAIProvider(prompt: string, useOpenAI: boolean, model: string) {
  try {
    const apiURL = useOpenAI
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.studio.nebius.ai/v1/chat/completions"

    const apiKey = useOpenAI
      ? process.env.OPENAI_API_KEY
      : process.env.NEBIUS_API_KEY

    if (!apiKey) {
      console.error(`Missing API key for ${useOpenAI ? 'OpenAI' : 'Nebius'}`)
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
      temperature: 0.7,
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
      console.error(`${useOpenAI ? "OpenAI" : "Nebius"} API Error:`, result)
      return { success: false, error: result }
    }

    return { success: true, data: result }

  } catch (error) {
    console.error(`Error calling ${useOpenAI ? 'OpenAI' : 'Nebius'}:`, error)
    return { success: false, error }
  }
}