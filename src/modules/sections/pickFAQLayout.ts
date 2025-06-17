
export type AwarenessLevel =
  | "Unaware"
  | "Problem-Aware"
  | "Solution-Aware"
  | "Product-Aware"
  | "Most-Aware";

export type ToneProfile =
  | "confident-playful"
  | "minimal-technical"
  | "bold-persuasive"
  | "friendly-helpful"
  | "luxury-expert";

export type SophisticationLevel =
  | "level-1"
  | "level-2"
  | "level-3"
  | "level-4"
  | "level-5";

export type FAQLayout =
  | "AccordionFAQ"
  | "TwoColumnFAQ"
  | "InlineQnAList"
  | "SegmentedFAQTabs"
  | "QuoteStyleAnswers"
  | "IconWithAnswers"
  | "TestimonialFAQs"
  | "ChatBubbleFAQ";

interface LayoutPickerInput {
  awarenessLevel: AwarenessLevel;
  toneProfile: ToneProfile;
  sophisticationLevel: SophisticationLevel;
}

export function pickFAQLayout({
  awarenessLevel,
  toneProfile,
  sophisticationLevel,
}: LayoutPickerInput): FAQLayout {
  // Priority rules
  if (sophisticationLevel === "level-4" || sophisticationLevel === "level-5") {
    return "QuoteStyleAnswers";
  }

  if (awarenessLevel === "Unaware" || toneProfile === "friendly-helpful") {
    return "ChatBubbleFAQ";
  }

  if (awarenessLevel === "Product-Aware" || awarenessLevel === "Most-Aware") {
    return "TwoColumnFAQ";
  }

  if (toneProfile === "minimal-technical") {
    return "AccordionFAQ";
  }

  if (toneProfile === "confident-playful" || awarenessLevel === "Solution-Aware") {
    return "IconWithAnswers";
  }

  if (sophisticationLevel === "level-3") {
    return "TestimonialFAQs";
  }

  if (toneProfile === "luxury-expert") {
    return "SegmentedFAQTabs";
  }

  // Fallback default
  return "InlineQnAList";
}
