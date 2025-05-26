import type { GPTOutput } from "@/modules/prompt/types"

export function gptProcessor(raw: any): GPTOutput {
  try {
    const text = raw.choices?.[0]?.message?.content;
    if (!text) throw new Error("Missing content in GPT response");

    const parsed = JSON.parse(text);

    // Basic validation
    if (
      !parsed.meta ||
      !parsed.theme ||
      !parsed.hero ||
      !parsed.before_after ||
      !parsed.how_it_works ||
      !parsed.testimonials ||
      !parsed.offer ||
      !parsed.faq
    ) {
      throw new Error("Incomplete GPT output");
    }

    // ✅ Inject visibleSections if missing
    if (!parsed.visibleSections) {
      parsed.visibleSections = {
        hero: true,
        before_after: true,
        how_it_works: true,
        testimonials: true,
        offer: true,
        faq: true,
      };
    }

    return parsed as GPTOutput;
  } catch (err) {
    console.error("GPT Processor Error:", err);
    throw new Error("Invalid GPT output. Could not parse response.");
  }
}

