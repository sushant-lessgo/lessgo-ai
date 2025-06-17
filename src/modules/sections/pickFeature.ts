// types.ts
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

export type FeatureLayoutVariant =
  | "IconGrid"
  | "SplitAlternating"
  | "Tabbed"
  | "Timeline"
  | "FeatureTestimonial"
  | "MetricTiles"
  | "MiniCards"
  | "Carousel";

// input interface
interface LayoutSelectorInput {
  awarenessLevel: AwarenessLevel;
  copyIntent: CopyIntent;
  toneProfile: ToneProfile;
  features: string[];
}

// selection function
export function pickFeatureLayout({
  awarenessLevel,
  copyIntent,
  toneProfile,
  features,
}: LayoutSelectorInput): FeatureLayoutVariant {
  const featureCount = features.length;

  // Priority Rules
  if (featureCount >= 7 && toneProfile === "confident-playful") {
    return "MiniCards";
  }

  if (featureCount >= 6 && toneProfile === "luxury-expert" && copyIntent === "desire-led") {
    return "Carousel";
  }

  if (featureCount <= 4 && awarenessLevel === "Product-Aware") {
    return "SplitAlternating";
  }

  if (
    copyIntent === "pain-led" &&
    awarenessLevel === "Problem-Aware" &&
    (toneProfile === "friendly-helpful" || toneProfile === "bold-persuasive")
  ) {
    return "FeatureTestimonial";
  }

  if (featureCount > 6 && toneProfile === "minimal-technical") {
    return "Tabbed";
  }

  if (copyIntent === "desire-led" && awarenessLevel === "Solution-Aware") {
    return "MetricTiles";
  }

  if (featureCount >= 5 && awarenessLevel === "Unaware") {
    return "Timeline";
  }

  // Fallback default
  return "IconGrid";
}
