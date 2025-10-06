import type { LayoutPickerInput } from "./layoutPickerInput";

export type TestimonialLayout =
  | "QuoteGrid"
  | "VideoTestimonials"
  | "AvatarCarousel"
  | "BeforeAfterQuote"
  | "SegmentedTestimonials"
  | "RatingCards"
  | "PullQuoteStack"
  | "InteractiveTestimonialMap";

/**
 * Selects the optimal Testimonial section layout based on customer proof depth and trust building needs
 * Testimonial sections provide customer validation - prioritizes authenticity and relevance
 */
export function pickTestimonialLayout(input: LayoutPickerInput): TestimonialLayout {
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
  assetAvailability,        // Sprint 7: Asset-aware layout selection
} = input;
  // High-Priority Rules (Return immediately if matched)
  
  // 1. High-touch enterprise sales need video testimonials
  if (
    targetAudience === "enterprise" &&
    (landingPageGoals === "contact-sales" || landingPageGoals === "demo") &&
    (startupStage === "growth" || startupStage === "scale") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "VideoTestimonials";
  }

  // 2. Transformation-focused problems with before/after stories
  if (
    (problemType === "lost-revenue-or-inefficiency" || problemType === "manual-repetition" || problemType === "burnout-or-overload") &&
    copyIntent === "desire-led" &&
    (startupStage === "traction" || startupStage === "growth")
  ) {
    return "BeforeAfterQuote";
  }

  // 3. Diverse audience segments need segmented testimonials
  if (
    marketSophisticationLevel >= "level-3" &&
    (targetAudience === "businesses" || targetAudience === "marketers") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  ) {
    return "SegmentedTestimonials";
  }

  // 4. Review-heavy products with rating focus
  if (
    (marketCategory === "Marketing & Sales Tools" || marketCategory === "Design & Creative Tools" || marketCategory === "Business Productivity Tools") &&
    (startupStage === "traction" || startupStage === "growth") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "RatingCards";
  }

  // 5. Global/visual appeal for creators and founders
  if (
    (targetAudience === "founders" || targetAudience === "creators") &&
    marketSophisticationLevel <= "level-2" &&
    (toneProfile === "friendly-helpful" || toneProfile === "confident-playful")
  ) {
    return "InteractiveTestimonialMap";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<TestimonialLayout, number> = {
    QuoteGrid: 0,
    VideoTestimonials: 0,
    AvatarCarousel: 0,
    BeforeAfterQuote: 0,
    SegmentedTestimonials: 0,
    RatingCards: 0,
    PullQuoteStack: 0,
    InteractiveTestimonialMap: 0,
  };

  // Startup Stage Scoring (Highest Weight: 4-5 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.PullQuoteStack += 4;
    scores.InteractiveTestimonialMap += 3;
    scores.AvatarCarousel += 3;
    scores.QuoteGrid += 2;
  } else if (startupStage === "traction") {
    scores.QuoteGrid += 4;
    scores.BeforeAfterQuote += 4;
    scores.RatingCards += 3;
    scores.AvatarCarousel += 2;
  } else if (startupStage === "growth") {
    scores.VideoTestimonials += 5;
    scores.SegmentedTestimonials += 4;
    scores.RatingCards += 4;
    scores.BeforeAfterQuote += 3;
  } else if (startupStage === "scale") {
    scores.VideoTestimonials += 5;
    scores.SegmentedTestimonials += 4;
    scores.QuoteGrid += 3;
    scores.RatingCards += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudience === "enterprise") {
    scores.VideoTestimonials += 4;
    scores.SegmentedTestimonials += 4;
    scores.QuoteGrid += 3;
    scores.RatingCards += 2;
  } else if (targetAudience === "builders") {
    scores.QuoteGrid += 4;
    scores.VideoTestimonials += 3;
    scores.BeforeAfterQuote += 2;
  } else if (targetAudience === "businesses") {
    scores.SegmentedTestimonials += 4;
    scores.RatingCards += 4;
    scores.BeforeAfterQuote += 3;
    scores.VideoTestimonials += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.InteractiveTestimonialMap += 4;
    scores.AvatarCarousel += 4;
    scores.PullQuoteStack += 3;
    scores.BeforeAfterQuote += 2;
  } else if (targetAudience === "marketers") {
    scores.RatingCards += 4;
    scores.SegmentedTestimonials += 3;
    scores.BeforeAfterQuote += 3;
    scores.VideoTestimonials += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.PullQuoteStack += 4;
    scores.BeforeAfterQuote += 3;
    scores.AvatarCarousel += 3;
    scores.InteractiveTestimonialMap += 2;
  } else if (copyIntent === "desire-led") {
    scores.VideoTestimonials += 4;
    scores.RatingCards += 4;
    scores.SegmentedTestimonials += 3;
    scores.BeforeAfterQuote += 3;
  }

  // Problem Type Scoring (High Weight: 3-4 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.BeforeAfterQuote += 4;
    scores.VideoTestimonials += 3;
    scores.RatingCards += 2;
  } else if (problemType === "manual-repetition") {
    scores.BeforeAfterQuote += 4;
    scores.SegmentedTestimonials += 3;
    scores.QuoteGrid += 2;
  } else if (problemType === "burnout-or-overload") {
    scores.PullQuoteStack += 4;
    scores.BeforeAfterQuote += 3;
    scores.AvatarCarousel += 2;
  } else if (problemType === "compliance-or-risk") {
    scores.VideoTestimonials += 4;
    scores.SegmentedTestimonials += 3;
    scores.QuoteGrid += 2;
  } else if (problemType === "creative-empowerment") {
    scores.AvatarCarousel += 4;
    scores.InteractiveTestimonialMap += 3;
    scores.RatingCards += 2;
  } else if (problemType === "time-freedom-or-automation") {
    scores.BeforeAfterQuote += 4;
    scores.SegmentedTestimonials += 3;
    scores.RatingCards += 2;
  } else if (problemType === "professional-image-or-branding") {
    scores.VideoTestimonials += 4;
    scores.SegmentedTestimonials += 3;
    scores.QuoteGrid += 2;
  }

  // Market Sophistication Scoring (Medium Weight: 2-3 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.InteractiveTestimonialMap += 3;
    scores.AvatarCarousel += 3;
    scores.PullQuoteStack += 3;
    scores.QuoteGrid += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.QuoteGrid += 3;
    scores.RatingCards += 3;
    scores.BeforeAfterQuote += 2;
    scores.SegmentedTestimonials += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.VideoTestimonials += 3;
    scores.SegmentedTestimonials += 3;
    scores.RatingCards += 2;
    scores.QuoteGrid += 2;
  }

  // Awareness Level Scoring (Medium Weight: 2-3 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.PullQuoteStack += 3;
    scores.InteractiveTestimonialMap += 3;
    scores.AvatarCarousel += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.SegmentedTestimonials += 3;
    scores.BeforeAfterQuote += 3;
    scores.RatingCards += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.VideoTestimonials += 3;
    scores.RatingCards += 3;
    scores.QuoteGrid += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.AvatarCarousel += 3;
    scores.InteractiveTestimonialMap += 3;
    scores.PullQuoteStack += 2;
  } else if (toneProfile === "confident-playful") {
    scores.InteractiveTestimonialMap += 3;
    scores.AvatarCarousel += 2;
    scores.RatingCards += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.BeforeAfterQuote += 3;
    scores.VideoTestimonials += 2;
    scores.RatingCards += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.QuoteGrid += 3;
    scores.VideoTestimonials += 2;
    scores.SegmentedTestimonials += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.VideoTestimonials += 3;
    scores.SegmentedTestimonials += 3;
    scores.QuoteGrid += 2;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingPageGoals === "contact-sales" || landingPageGoals === "demo") {
    scores.VideoTestimonials += 2;
    scores.SegmentedTestimonials += 2;
    scores.QuoteGrid += 1;
  } else if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.RatingCards += 2;
    scores.BeforeAfterQuote += 2;
    scores.VideoTestimonials += 1;
  } else if (landingPageGoals === "free-trial") {
    scores.BeforeAfterQuote += 2;
    scores.RatingCards += 1;
  } else if (landingPageGoals === "signup") {
    scores.QuoteGrid += 2;
    scores.AvatarCarousel += 1;
  } else if (landingPageGoals === "join-community" || landingPageGoals === "waitlist") {
    scores.InteractiveTestimonialMap += 2;
    scores.AvatarCarousel += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Marketing & Sales Tools") {
    scores.RatingCards += 2;
    scores.SegmentedTestimonials += 1;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.BeforeAfterQuote += 2;
    scores.QuoteGrid += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.AvatarCarousel += 2;
    scores.InteractiveTestimonialMap += 1;
  } else if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.QuoteGrid += 2;
    scores.VideoTestimonials += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.VideoTestimonials += 2;
    scores.SegmentedTestimonials += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.InteractiveTestimonialMap += 2;
    scores.AvatarCarousel += 1;
  } else if (pricingModel === "custom-quote") {
    scores.VideoTestimonials += 2;
    scores.SegmentedTestimonials += 1;
  } else if (pricingModel === "tiered") {
    scores.SegmentedTestimonials += 2;
    scores.RatingCards += 1;
  }

  // Sprint 7: Asset-Aware Scoring Adjustments
  if (assetAvailability) {
    // Penalize video testimonials without demo video
    if (!assetAvailability.demoVideo) {
      scores.VideoTestimonials -= 100;
    }
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as TestimonialLayout, score } : max,
    { layout: "QuoteGrid" as TestimonialLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "QuoteGrid";
}