import type { LayoutPickerInput } from "./layoutPickerInput";

export type PricingLayout =
  | "TierCards"
  | "ToggleableMonthlyYearly"
  | "FeatureMatrix"
  | "SegmentBasedPricing"
  | "SliderPricing"
  | "CallToQuotePlan"
  | "CardWithTestimonial"
  | "MiniStackedCards";

/**
 * Selects the optimal Pricing section layout based on pricing model and purchase decision complexity
 * Pricing sections drive conversion decisions - prioritizes clarity and purchase confidence
 */
export function pickPricingLayout(input: LayoutPickerInput): PricingLayout {
  const {
  awarenessLevel,
  toneProfile,
  startupStage,             // ✅ FIXED
  marketCategory,
  landingPageGoals,         // ✅ FIXED
  targetAudience,           // ✅ FIXED
  pricingModel,
  pricingModifier,
  pricingCommitmentOption,
  marketSophisticationLevel,
  copyIntent,
  problemType,

  // PHASE 2.2: Flow-aware context fields
  positionInFlow,
  previousSection,
  nextSection,
  flowTone,
} = input;

  // ===== PHASE 2.2: FLOW-AWARE HARD RULES (HIGHEST PRIORITY) =====

  // HR-4.13.2: Most-Aware + Early Positioning = OFFER IMMEDIATELY
  if (
    awarenessLevel === 'most-aware' &&
    positionInFlow !== undefined && positionInFlow <= 4
  ) {
    // They want the offer immediately
    if (pricingModel === 'tiered') {
      return "TierCards";  // Clear, upfront pricing
    }
    return "MiniStackedCards";  // Simple pricing display
  }

  // NOTE: HR-4.13.3 (Custom Quote for Enterprise) removed - already handled by existing rule at line 76-82
  // which is more specific (requires enterprise + custom-quote + sales goal combination)

  // HR-4.13.4: Before Objection Handling = JUSTIFY VALUE
  if (
    nextSection?.type === 'objectionHandling' &&
    positionInFlow !== undefined && positionInFlow >= 6
  ) {
    // Pricing sets up price objections
    if (startupStage === 'growth' || startupStage === 'scale') {
      return "CardWithTestimonial";  // Pre-emptive justification
    }
    return "TierCards";  // Clear value per tier
  }

  // ===== EXISTING: High-Priority Rules (Return immediately if matched) =====
  
  // 1. Enterprise custom pricing always needs sales contact
  if (
    (pricingModel === "custom-quote" || pricingCommitmentOption === "talk-to-sales") &&
    (targetAudience === "enterprise" || targetAudience === "businesses") &&
    (landingPageGoals === "contact-sales" || landingPageGoals === "book-call")
  ) {
    return "CallToQuotePlan";
  }

  // 2. Usage-based or per-seat pricing needs calculator
  if (
    (pricingModel === "usage-based" || pricingModel === "per-seat") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "SliderPricing";
  }

  // 3. Complex feature comparison for sophisticated buyers
  if (
    pricingModel === "tiered" &&
    targetAudience === "enterprise" &&
    marketSophisticationLevel >= "level-4" &&
    (awarenessLevel === "product-aware" || awarenessLevel === "most-aware")
  ) {
    return "FeatureMatrix";
  }

  // 4. Segment-specific pricing for diverse audiences
  if (
    marketSophisticationLevel >= "level-3" &&
    (targetAudience === "businesses" || targetAudience === "enterprise") &&
    (marketCategory === "Marketing & Sales Tools" || marketCategory === "Business Productivity Tools" || marketCategory === "HR & People Operations Tools")
  ) {
    return "SegmentBasedPricing";
  }

  // 5. Trust-building with social proof for established companies
  if (
    (startupStage === "growth" || startupStage === "scale") &&
    (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "CardWithTestimonial";
  }

  // Medium-Priority Rules (Scoring system)

  const scores: Record<PricingLayout, number> = {
    TierCards: 0,
    ToggleableMonthlyYearly: 0,
    FeatureMatrix: 0,
    SegmentBasedPricing: 0,
    SliderPricing: 0,
    CallToQuotePlan: 0,
    CardWithTestimonial: 0,
    MiniStackedCards: 0,
  };

  // ===== PHASE 2.2: FLOW-AWARE SCORING =====

  // Awareness + Position Combo (5 points)
  if (awarenessLevel === 'most-aware') {
    if (positionInFlow !== undefined && positionInFlow <= 4) {
      // Early positioning: They want it NOW
      scores.TierCards += 5;
      scores.MiniStackedCards += 5;
      scores.FeatureMatrix -= 3;  // Too detailed for eager buyers
    }
  }

  // Previous Section Context (4 points)
  if (previousSection?.type === 'features' || previousSection?.type === 'results') {
    // After value sections: Now justify the price
    scores.CardWithTestimonial += 4;
    scores.FeatureMatrix += 4;
    scores.TierCards += 3;
  }

  // Next Section Context (4 points)
  if (nextSection?.type === 'objectionHandling') {
    // Pricing → Objection handling
    scores.CardWithTestimonial += 4;  // Pre-emptive value justification
    scores.TierCards += 3;
  } else if (nextSection?.type === 'cta') {
    // Pricing → CTA (unusual, but direct)
    scores.MiniStackedCards += 4;  // Keep it simple
    scores.TierCards += 3;
  }

  // Flow Tone Adjustments (3 points)
  if (flowTone === 'emotional') {
    scores.CardWithTestimonial += 3;
    scores.MiniStackedCards += 3;
    scores.FeatureMatrix -= 2;  // Too analytical
  } else if (flowTone === 'analytical') {
    scores.FeatureMatrix += 3;
    scores.SliderPricing += 3;
    scores.MiniStackedCards -= 2;
  }

  // ===== EXISTING SCORING (PRESERVED) =====

  // Pricing Model Scoring (Highest Weight: 4-5 points)
  if (pricingModel === "tiered") {
    scores.TierCards += 5;
    scores.FeatureMatrix += 4;
    scores.ToggleableMonthlyYearly += 4;
    scores.SegmentBasedPricing += 3;
  } else if (pricingModel === "freemium") {
    scores.TierCards += 4;
    scores.MiniStackedCards += 4;
    scores.ToggleableMonthlyYearly += 3;
  } else if (pricingModel === "usage-based" || pricingModel === "per-seat") {
    scores.SliderPricing += 5;
    scores.SegmentBasedPricing += 3;
    scores.TierCards += 2;
  } else if (pricingModel === "custom-quote") {
    scores.CallToQuotePlan += 5;
    scores.SegmentBasedPricing += 3;
  } else if (pricingModel === "flat-monthly") {
    scores.MiniStackedCards += 4;
    scores.ToggleableMonthlyYearly += 4;
    scores.TierCards += 3;
  } else if (pricingModel === "free") {
    scores.MiniStackedCards += 4;
    scores.TierCards += 3;
  } else if (pricingModel === "trial-free" || pricingModel === "trial-paid") {
    scores.TierCards += 4;
    scores.CardWithTestimonial += 3;
    scores.ToggleableMonthlyYearly += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudience === "enterprise") {
    scores.FeatureMatrix += 4;
    scores.CallToQuotePlan += 4;
    scores.SegmentBasedPricing += 4;
    scores.CardWithTestimonial += 3;
  } else if (targetAudience === "builders") {
    scores.TierCards += 4;
    scores.SliderPricing += 3;
    scores.MiniStackedCards += 2;
  } else if (targetAudience === "businesses") {
    scores.SegmentBasedPricing += 4;
    scores.TierCards += 4;
    scores.CallToQuotePlan += 3;
    scores.CardWithTestimonial += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.MiniStackedCards += 4;
    scores.TierCards += 3;
    scores.ToggleableMonthlyYearly += 2;
  } else if (targetAudience === "marketers") {
    scores.SegmentBasedPricing += 4;
    scores.TierCards += 3;
    scores.SliderPricing += 2;
  }

  // Landing Goal Scoring (High Weight: 3-4 points)
  if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.CardWithTestimonial += 4;
    scores.ToggleableMonthlyYearly += 4;
    scores.TierCards += 3;
    scores.MiniStackedCards += 2;
  } else if (landingPageGoals === "contact-sales" || landingPageGoals === "book-call") {
    scores.CallToQuotePlan += 4;
    scores.SegmentBasedPricing += 3;
    scores.FeatureMatrix += 2;
  } else if (landingPageGoals === "free-trial") {
    scores.TierCards += 4;
    scores.ToggleableMonthlyYearly += 3;
    scores.SliderPricing += 2;
  } else if (landingPageGoals === "demo") {
    scores.FeatureMatrix += 4;
    scores.SliderPricing += 3;
    scores.CallToQuotePlan += 2;
  } else if (landingPageGoals === "signup") {
    scores.MiniStackedCards += 4;
    scores.TierCards += 3;
  }

  // Market Sophistication Scoring (High Weight: 3-4 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.MiniStackedCards += 4;
    scores.TierCards += 4;
    scores.ToggleableMonthlyYearly += 3;
  } else if (marketSophisticationLevel === "level-3") {
    scores.TierCards += 4;
    scores.SegmentBasedPricing += 3;
    scores.CardWithTestimonial += 3;
    scores.ToggleableMonthlyYearly += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.FeatureMatrix += 4;
    scores.SliderPricing += 4;
    scores.CallToQuotePlan += 3;
    scores.SegmentBasedPricing += 3;
  }

  // Awareness Level Scoring (Medium Weight: 2-3 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.MiniStackedCards += 3;
    scores.TierCards += 3;
    scores.CardWithTestimonial += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.SegmentBasedPricing += 3;
    scores.TierCards += 3;
    scores.ToggleableMonthlyYearly += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.FeatureMatrix += 3;
    scores.SliderPricing += 3;
    scores.CallToQuotePlan += 2;
  }

  // Copy Intent Scoring (Medium Weight: 2-3 points)
  if (copyIntent === "pain-led") {
    scores.MiniStackedCards += 3;
    scores.TierCards += 3;
    scores.CardWithTestimonial += 2;
  } else if (copyIntent === "desire-led") {
    scores.ToggleableMonthlyYearly += 3;
    scores.FeatureMatrix += 3;
    scores.SliderPricing += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.MiniStackedCards += 3;
    scores.TierCards += 2;
    scores.ToggleableMonthlyYearly += 1;
  } else if (startupStage === "traction") {
    scores.TierCards += 3;
    scores.SegmentBasedPricing += 2;
    scores.ToggleableMonthlyYearly += 2;
  } else if (startupStage === "growth") {
    scores.CardWithTestimonial += 3;
    scores.FeatureMatrix += 2;
    scores.SegmentBasedPricing += 2;
  } else if (startupStage === "scale") {
    scores.CallToQuotePlan += 3;
    scores.FeatureMatrix += 2;
    scores.CardWithTestimonial += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "bold-persuasive") {
    scores.ToggleableMonthlyYearly += 3;
    scores.CardWithTestimonial += 2;
    scores.MiniStackedCards += 2;
  } else if (toneProfile === "confident-playful") {
    scores.MiniStackedCards += 3;
    scores.ToggleableMonthlyYearly += 2;
    scores.TierCards += 2;
  } else if (toneProfile === "friendly-helpful") {
    scores.TierCards += 3;
    scores.MiniStackedCards += 2;
    scores.CardWithTestimonial += 1;
  } else if (toneProfile === "minimal-technical") {
    scores.FeatureMatrix += 3;
    scores.SliderPricing += 2;
    scores.TierCards += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.CallToQuotePlan += 3;
    scores.FeatureMatrix += 3;
    scores.CardWithTestimonial += 2;
  }

  // Pricing Modifier Scoring (Low Weight: 1-2 points)
  if (pricingModifier === "discount") {
    scores.ToggleableMonthlyYearly += 2;
    scores.MiniStackedCards += 2;
    scores.CardWithTestimonial += 1;
  } else if (pricingModifier === "money-back") {
    scores.TierCards += 2;
    scores.CardWithTestimonial += 1;
  }

  // Problem Type Scoring (Low Weight: 1-2 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.SliderPricing += 2;
    scores.FeatureMatrix += 1;
  } else if (problemType === "compliance-or-risk") {
    scores.CallToQuotePlan += 2;
    scores.FeatureMatrix += 1;
  } else if (problemType === "manual-repetition") {
    scores.SegmentBasedPricing += 2;
    scores.TierCards += 1;
  } else if (problemType === "time-freedom-or-automation") {
    scores.SliderPricing += 2;
    scores.ToggleableMonthlyYearly += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Marketing & Sales Tools") {
    scores.SegmentBasedPricing += 2;
    scores.SliderPricing += 1;
  } else if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.SliderPricing += 2;
    scores.FeatureMatrix += 1;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.TierCards += 2;
    scores.SegmentBasedPricing += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.TierCards += 2;
    scores.MiniStackedCards += 1;
  }

  // Pricing Commitment Scoring (Low Weight: 1-2 points)
  if (pricingCommitmentOption === "no-card") {
    scores.MiniStackedCards += 2;
    scores.TierCards += 1;
  } else if (pricingCommitmentOption === "card-required" || pricingCommitmentOption === "paid-trial") {
    scores.ToggleableMonthlyYearly += 2;
    scores.CardWithTestimonial += 1;
  } else if (pricingCommitmentOption === "talk-to-sales") {
    scores.CallToQuotePlan += 2;
    scores.SegmentBasedPricing += 1;
  } else if (pricingCommitmentOption === "annual-only") {
    scores.ToggleableMonthlyYearly += 2;
    scores.CardWithTestimonial += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as PricingLayout, score } : max,
    { layout: "TierCards" as PricingLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "TierCards";
}