import type { GPTOutput } from "@/modules/prompt/types"

export function gptProcessor(raw: any): GPTOutput {
  try {
    const text = raw.choices?.[0]?.message?.content
    if (!text) throw new Error("Missing content in GPT response")

    const parsed = JSON.parse(text)

    // Optional: Light validation of top-level structure
    if (
      !parsed.hero ||
      !parsed.before_after ||
      !parsed.how_it_works ||
      !parsed.testimonials ||
      !parsed.offer ||
      !parsed.faq ||
      !parsed.explanation
    ) {
      throw new Error("Incomplete GPT output")
    }

    return parsed as GPTOutput
  } catch (err) {
    console.error("GPT Processor Error:", err)
    throw new Error("Invalid GPT output. Could not parse response.")
  }
}
