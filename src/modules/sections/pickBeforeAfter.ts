import type { LayoutPickerInput } from "./layoutPickerInput";

export type BeforeAfterLayout =
  | "SideBySideBlocks"
  | "StackedTextVisual"
  | "BeforeAfterSlider"
  | "SplitCard"
  | "TextListTransformation"
  | "VisualStoryline"
  | "StatComparison"
  | "PersonaJourney";

export function pickBeforeAfterLayout({
  awarenessLevel,
  toneProfile,
  startupStageGroup,
  marketCategory,
}: LayoutPickerInput): BeforeAfterLayout {
  // Priority rules
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    return "TextListTransformation";
  }

  if (toneProfile === "confident-playful" && marketCategory === "Design & Creative Tools") {
    return "BeforeAfterSlider";
  }

  if (toneProfile === "minimal-technical" && awarenessLevel === "product-aware") {
    return "StatComparison";
  }

  if (startupStageGroup === "idea" && toneProfile === "friendly-helpful") {
    return "StackedTextVisual";
  }

  if (marketCategory === "AI Tools" && awarenessLevel === "solution-aware") {
    return "VisualStoryline";
  }

  if (toneProfile === "luxury-expert") {
    return "SplitCard";
  }

  if (marketCategory === "Work & Productivity Tools" && awarenessLevel === "most-aware") {
    return "PersonaJourney";
  }

  // Fallback default
  return "SideBySideBlocks";
}
