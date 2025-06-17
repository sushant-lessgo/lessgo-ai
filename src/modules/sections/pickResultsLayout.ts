
export type CopyIntent = "pain-led" | "desire-led";

export type ToneProfile =
  | "confident-playful"
  | "minimal-technical"
  | "bold-persuasive"
  | "friendly-helpful"
  | "luxury-expert";

export type TargetAudience =
  | "founders"
  | "creators"
  | "marketers"
  | "businesses"
  | "builders"
  | "enterprise"
  | "community";

export type ResultsLayout =
  | "StatBlocks"
  | "BeforeAfterStats"
  | "QuoteWithMetric"
  | "EmojiOutcomeGrid"
  | "TimelineResults"
  | "OutcomeIcons"
  | "StackedWinsList"
  | "PersonaResultPanels";

interface LayoutPickerInput {
  copyIntent: CopyIntent;
  toneProfile: ToneProfile;
  targetAudience: TargetAudience;
}

export function pickResultsLayout({
  copyIntent,
  toneProfile,
  targetAudience,
}: LayoutPickerInput): ResultsLayout {
  // Priority rules
  if (copyIntent === "pain-led" && toneProfile === "bold-persuasive") {
    return "BeforeAfterStats";
  }

  if (copyIntent === "desire-led" && toneProfile === "luxury-expert") {
    return "QuoteWithMetric";
  }

  if (targetAudience === "creators" || toneProfile === "confident-playful") {
    return "EmojiOutcomeGrid";
  }

  if (toneProfile === "minimal-technical") {
    return "StatBlocks";
  }

  if (targetAudience === "enterprise" || targetAudience === "businesses") {
    return "TimelineResults";
  }

  if (targetAudience === "community" || toneProfile === "friendly-helpful") {
    return "OutcomeIcons";
  }

  if (targetAudience === "founders" || targetAudience === "builders") {
    return "StackedWinsList";
  }

  // Fallback default
  return "PersonaResultPanels";
}
