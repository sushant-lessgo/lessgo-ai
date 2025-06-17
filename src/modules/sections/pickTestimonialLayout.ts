
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

export type TargetAudience =
  | "founders"
  | "creators"
  | "marketers"
  | "businesses"
  | "builders"
  | "enterprise"
  | "community";

export type TestimonialLayout =
  | "QuoteGrid"
  | "VideoTestimonials"
  | "AvatarCarousel"
  | "BeforeAfterQuote"
  | "SegmentedTestimonials"
  | "RatingCards"
  | "PullQuoteStack"
  | "InteractiveTestimonialMap";

interface LayoutPickerInput {
  awarenessLevel: AwarenessLevel;
  toneProfile: ToneProfile;
  targetAudience: TargetAudience;
}

export function pickTestimonialLayout({
  awarenessLevel,
  toneProfile,
  targetAudience,
}: LayoutPickerInput): TestimonialLayout {
  // Priority rules
  if (targetAudience === "enterprise" || awarenessLevel === "Product-Aware") {
    return "SegmentedTestimonials";
  }

  if (toneProfile === "confident-playful" || targetAudience === "creators") {
    return "AvatarCarousel";
  }

  if (toneProfile === "luxury-expert" || toneProfile === "bold-persuasive") {
    return "VideoTestimonials";
  }

  if (targetAudience === "founders" && awarenessLevel === "Solution-Aware") {
    return "BeforeAfterQuote";
  }

  if (targetAudience === "marketers" || toneProfile === "friendly-helpful") {
    return "RatingCards";
  }

  if (toneProfile === "minimal-technical") {
    return "QuoteGrid";
  }

  if (targetAudience === "community") {
    return "InteractiveTestimonialMap";
  }

  // Fallback default
  return "PullQuoteStack";
}
