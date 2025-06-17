
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

export type ComparisonLayout =
  | "BasicFeatureGrid"
  | "CheckmarkComparison"
  | "YouVsThemHighlight"
  | "ToggleableComparison"
  | "CompetitorCallouts"
  | "AnimatedUpgradePath"
  | "PersonaUseCaseCompare"
  | "LiteVsProVsEnterprise";

interface LayoutPickerInput {
  awarenessLevel: AwarenessLevel;
  toneProfile: ToneProfile;
  sophisticationLevel: SophisticationLevel;
}

export function pickComparisonLayout({
  awarenessLevel,
  toneProfile,
  sophisticationLevel,
}: LayoutPickerInput): ComparisonLayout {
  // Priority rules
  if (sophisticationLevel === "level-1" || awarenessLevel === "Solution-Aware") {
    return "CheckmarkComparison";
  }

  if (sophisticationLevel === "level-2" && toneProfile === "bold-persuasive") {
    return "YouVsThemHighlight";
  }

  if (sophisticationLevel === "level-3") {
    return "CompetitorCallouts";
  }

  if (sophisticationLevel === "level-4" && toneProfile === "luxury-expert") {
    return "ToggleableComparison";
  }

  if (toneProfile === "minimal-technical") {
    return "BasicFeatureGrid";
  }

  if (toneProfile === "confident-playful") {
    return "AnimatedUpgradePath";
  }

  if (awarenessLevel === "Product-Aware" || awarenessLevel === "Most-Aware") {
    return "LiteVsProVsEnterprise";
  }

  // Fallback default
  return "PersonaUseCaseCompare";
}
