
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

export type ObjectionLayout =
  | "ObjectionAccordion"
  | "MythVsRealityGrid"
  | "QuoteBackedAnswers"
  | "VisualObjectionTiles"
  | "ProblemToReframeBlocks"
  | "SkepticToBelieverSteps"
  | "BoldGuaranteePanel"
  | "ObjectionCarousel";

interface LayoutPickerInput {
  awarenessLevel: AwarenessLevel;
  toneProfile: ToneProfile;
  sophisticationLevel: SophisticationLevel;
}

export function pickObjectionLayout({
  awarenessLevel,
  toneProfile,
  sophisticationLevel,
}: LayoutPickerInput): ObjectionLayout {
  // Priority rules
  if (sophisticationLevel === "level-4" || sophisticationLevel === "level-5") {
    return "QuoteBackedAnswers";
  }

  if (toneProfile === "bold-persuasive" || awarenessLevel === "Solution-Aware") {
    return "MythVsRealityGrid";
  }

  if (toneProfile === "friendly-helpful") {
    return "ObjectionAccordion";
  }

  if (toneProfile === "confident-playful") {
    return "ObjectionCarousel";
  }

  if (toneProfile === "luxury-expert") {
    return "BoldGuaranteePanel";
  }

  if (toneProfile === "minimal-technical") {
    return "ProblemToReframeBlocks";
  }

  if (awarenessLevel === "Product-Aware" || awarenessLevel === "Most-Aware") {
    return "SkepticToBelieverSteps";
  }

  // Fallback default
  return "VisualObjectionTiles";
}
