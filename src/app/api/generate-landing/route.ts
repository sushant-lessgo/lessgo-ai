// import { OpenAIStream, StreamingTextResponse } from "ai" // optional for streaming later
import { NextResponse } from "next/server"
import { buildPrompt } from "@/modules/gpt/gptPromptBuilder"
import { gptProcessor } from "@/modules/gpt/gptProcessor"

export const runtime = "edge"

export async function POST(req: Request) {
  const { productIdea } = await req.json()

  const body = {
    model: "gpt-4",
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
