import { NextResponse } from "next/server"
import { buildPrompt } from "@/modules/gpt/gptPromptBuilder"
import { gptProcessor } from "@/modules/gpt/gptProcessor"
import { mockGPTOutput } from "@/modules/prompt/mockData"

// export const runtime = "edge"

export async function POST(req: Request) {
  const { productIdea } = await req.json()

  const DEMO_TOKEN = "lessgodemomockdata"
  const authHeader = req.headers.get("Authorization") || ""
  const token = authHeader.replace("Bearer ", "").trim()

  if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" && token === DEMO_TOKEN) {
    return NextResponse.json(mockGPTOutput)
  }

  const useOpenAI = process.env.USE_OPENAI === "true"
  const model = useOpenAI ? "gpt-3.5-turbo" : "mistralai/Mixtral-8x7B-Instruct-v0.1"

  const body = {
    model,
    messages: buildPrompt(productIdea),
    temperature: 0.7,
  }

  try {
    const apiURL = useOpenAI
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.studio.nebius.ai/v1/chat/completions"

    const apiKey = useOpenAI
      ? process.env.OPENAI_API_KEY
      : process.env.NEBIUS_API_KEY

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
      return NextResponse.json({ error: "AI model error", detail: result }, { status: 500 })
    }

    const parsed = gptProcessor(result)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Server error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
