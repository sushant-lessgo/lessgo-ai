
export type SophisticationLevel =
  | "level-1"
  | "level-2"
  | "level-3"
  | "level-4"
  | "level-5";

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

export type UniqueMechanismLayout =
  | "StackedHighlights"
  | "VisualFlywheel"
  | "PillarIcons"
  | "IllustratedModel"
  | "ExplainerWithTags"
  | "ComparisonTable"
  | "PatentStrip"
  | "SingleBigIdea";

interface LayoutPickerInput {
  sophisticationLevel: SophisticationLevel;
  toneProfile: ToneProfile;
  awarenessLevel: AwarenessLevel;
}

export function pickUniqueMechanismLayout({
  sophisticationLevel,
  toneProfile,
  awarenessLevel,
}: LayoutPickerInput): UniqueMechanismLayout {
  // Priority rules
  if (sophisticationLevel === "level-1" || sophisticationLevel === "level-2") {
    return "StackedHighlights";
  }

  if (sophisticationLevel === "level-3") {
    return "IllustratedModel";
  }

  if (sophisticationLevel === "level-4" && toneProfile === "bold-persuasive") {
    return "VisualFlywheel";
  }

  if (sophisticationLevel === "level-4" && toneProfile === "luxury-expert") {
    return "PillarIcons";
  }

  if (sophisticationLevel === "level-5") {
    return "SingleBigIdea";
  }

  if (toneProfile === "minimal-technical" && awarenessLevel === "Solution-Aware") {
    return "ExplainerWithTags";
  }

  if (awarenessLevel === "Product-Aware" || awarenessLevel === "Most-Aware") {
    return "ComparisonTable";
  }

  // Fallback default
  return "StackedHighlights";
}
