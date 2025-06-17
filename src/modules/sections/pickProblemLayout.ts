
export type AwarenessLevel =
  | "Unaware"
  | "Problem-Aware"
  | "Solution-Aware"
  | "Product-Aware"
  | "Most-Aware";

export type CopyIntent = "pain-led" | "desire-led";

export type ToneProfile =
  | "confident-playful"
  | "minimal-technical"
  | "bold-persuasive"
  | "friendly-helpful"
  | "luxury-expert";

export type ProblemLayout =
  | "StackedPainBullets"
  | "BeforeImageAfterText"
  | "SideBySideSplit"
  | "EmotionalQuotes"
  | "CollapsedCards"
  | "PainMeterChart"
  | "PersonaPanels"
  | "ProblemChecklist";

interface LayoutPickerInput {
  awarenessLevel: AwarenessLevel;
  copyIntent: CopyIntent;
  toneProfile: ToneProfile;
}

export function pickProblemLayout({
  awarenessLevel,
  copyIntent,
  toneProfile,
}: LayoutPickerInput): ProblemLayout {
  // Priority rules
  if (copyIntent === "pain-led" && awarenessLevel === "Unaware") {
    return "EmotionalQuotes";
  }

  if (copyIntent === "pain-led" && awarenessLevel === "Problem-Aware") {
    return "StackedPainBullets";
  }

  if (copyIntent === "pain-led" && toneProfile === "bold-persuasive") {
    return "SideBySideSplit";
  }

  if (toneProfile === "confident-playful") {
    return "CollapsedCards";
  }

  if (toneProfile === "minimal-technical") {
    return "PainMeterChart";
  }

  if (copyIntent === "desire-led" && awarenessLevel === "Solution-Aware") {
    return "BeforeImageAfterText";
  }

  if (toneProfile === "luxury-expert") {
    return "PersonaPanels";
  }

  // Fallback default
  return "ProblemChecklist";
}
