import type { GPTOutput } from "@/modules/prompt/types"

export function gptProcessor(raw: any): GPTOutput {
  try {
    const text = raw.choices[0].message.content
    const parsed = JSON.parse(text)
    return parsed as GPTOutput
  } catch (err) {
    console.error("GPT Processor Error:", err)
    throw new Error("Invalid GPT output")
  }
}
