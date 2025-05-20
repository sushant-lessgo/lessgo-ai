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
  // console.log("Token:", token)

  if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" && token === DEMO_TOKEN) {
    return NextResponse.json(mockGPTOutput)
  }

  const body = {
    model: "gpt-3.5-turbo",
    messages: buildPrompt(productIdea),
    temperature: 0.7,
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const result = await response.json()

  const parsed = gptProcessor(result)
  return NextResponse.json(parsed)
}

