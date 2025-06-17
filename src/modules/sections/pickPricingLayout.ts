
export type PricingModel =
  | "free"
  | "freemium"
  | "trial-free"
  | "trial-paid"
  | "flat-monthly"
  | "tiered"
  | "per-seat"
  | "usage-based"
  | "custom-quote";

export type TargetAudience =
  | "founders"
  | "creators"
  | "marketers"
  | "businesses"
  | "builders"
  | "enterprise"
  | "community";

export type ToneProfile =
  | "confident-playful"
  | "minimal-technical"
  | "bold-persuasive"
  | "friendly-helpful"
  | "luxury-expert";

export type PricingLayout =
  | "TierCards"
  | "ToggleableMonthlyYearly"
  | "FeatureMatrix"
  | "SegmentBasedPricing"
  | "SliderPricing"
  | "CallToQuotePlan"
  | "CardWithTestimonial"
  | "MiniStackedCards";

interface LayoutPickerInput {
  pricingModel: PricingModel;
  targetAudience: TargetAudience;
  toneProfile: ToneProfile;
}

export function pickPricingLayout({
  pricingModel,
  targetAudience,
  toneProfile,
}: LayoutPickerInput): PricingLayout {
  // Priority rules
  if (pricingModel === "custom-quote" || targetAudience === "enterprise") {
    return "CallToQuotePlan";
  }

  if (pricingModel === "per-seat" || pricingModel === "tiered") {
    return "TierCards";
  }

  if (pricingModel === "usage-based") {
    return "SliderPricing";
  }

  if (
    pricingModel === "freemium" ||
    pricingModel === "trial-free" ||
    pricingModel === "trial-paid"
  ) {
    return "ToggleableMonthlyYearly";
  }

  if (targetAudience === "creators" || toneProfile === "confident-playful") {
    return "MiniStackedCards";
  }

  if (toneProfile === "minimal-technical") {
    return "FeatureMatrix";
  }

  if (targetAudience === "community" || toneProfile === "friendly-helpful") {
    return "CardWithTestimonial";
  }

  // Fallback default
  return "SegmentBasedPricing";
}
