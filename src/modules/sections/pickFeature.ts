import type { LayoutPickerInput } from "./layoutPickerInput";

export type FeatureLayout =
  | "IconGrid"
  | "SplitAlternating"
  | "Tabbed"
  | "Timeline"
  | "FeatureTestimonial"
  | "MetricTiles"
  | "MiniCards"
  | "Carousel";

/**
 * Selects the optimal Features section layout based on feature complexity and audience needs
 * Features sections demonstrate value and capabilities - prioritizes clarity and engagement
 */
export function pickFeatureLayout(input: LayoutPickerInput): FeatureLayout {
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
} = input;

  // High-Priority Rules (Return immediately if matched)
  
  // 1. Complex technical products need detailed explanations
  if (
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    marketSophisticationLevel >= "level-4" &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools" || marketCategory === "Data & Analytics Tools")
  ) {
    return "SplitAlternating";
  }

  // 2. Process-oriented or workflow products
  if (
    (marketCategory === "Work & Productivity Tools" || marketCategory === "No-Code & Low-Code Platforms") &&
    (problemType === "manual-repetition" || problemType === "time-freedom-or-automation") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "Timeline";
  }

  // 3. Trust-building for established companies
  if (
    (startupStage === "growth" || startupStage === "scale") &&
    (landingPageGoals === "buy-now" || landingPageGoals === "contact-sales") &&
    targetAudience === "enterprise"
  ) {
    return "FeatureTestimonial";
  }

  // 4. Data-driven products showing quantifiable benefits
  if (
    (problemType === "lost-revenue-or-inefficiency" || problemType === "compliance-or-risk") &&
    (targetAudience === "businesses" || targetAudience === "enterprise") &&
    copyIntent === "desire-led"
  ) {
    return "MetricTiles";
  }

  // 5. Simple, early-stage products with clear value props
  if (
    (startupStage === "idea" || startupStage === "mvp") &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") &&
    marketSophisticationLevel <= "level-2"
  ) {
    return "IconGrid";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<FeatureLayout, number> = {
    IconGrid: 0,
    SplitAlternating: 0,
    Tabbed: 0,
    Timeline: 0,
    FeatureTestimonial: 0,
    MetricTiles: 0,
    MiniCards: 0,
    Carousel: 0,
  };

  // Awareness Level Scoring (Highest Weight: 4-5 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.IconGrid += 5;
    scores.MetricTiles += 4;
    scores.Carousel += 3;
    scores.MiniCards += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.SplitAlternating += 4;
    scores.Tabbed += 4;
    scores.FeatureTestimonial += 3;
    scores.Timeline += 3;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.Timeline += 5;
    scores.SplitAlternating += 4;
    scores.MiniCards += 3;
    scores.Tabbed += 2;
  }

  // Market Sophistication Scoring (High Weight: 3-4 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.IconGrid += 4;
    scores.Carousel += 4;
    scores.MetricTiles += 3;
    scores.MiniCards += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.Tabbed += 4;
    scores.SplitAlternating += 3;
    scores.FeatureTestimonial += 3;
    scores.Timeline += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.SplitAlternating += 4;
    scores.Timeline += 4;
    scores.MiniCards += 3;
    scores.FeatureTestimonial += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudience === "enterprise") {
    scores.SplitAlternating += 4;
    scores.FeatureTestimonial += 4;
    scores.Timeline += 3;
    scores.MetricTiles += 2;
  } else if (targetAudience === "builders") {
    scores.SplitAlternating += 4;
    scores.MiniCards += 3;
    scores.Timeline += 3;
    scores.Tabbed += 2;
  } else if (targetAudience === "businesses") {
    scores.MetricTiles += 4;
    scores.FeatureTestimonial += 3;
    scores.Tabbed += 3;
    scores.IconGrid += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.IconGrid += 4;
    scores.Carousel += 3;
    scores.MiniCards += 3;
    scores.MetricTiles += 2;
  } else if (targetAudience === "marketers") {
    scores.Tabbed += 4;
    scores.MetricTiles += 3;
    scores.FeatureTestimonial += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.IconGrid += 4;
    scores.MetricTiles += 4;
    scores.Carousel += 3;
    scores.MiniCards += 2;
  } else if (copyIntent === "desire-led") {
    scores.SplitAlternating += 4;
    scores.Timeline += 4;
    scores.FeatureTestimonial += 3;
    scores.Tabbed += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.IconGrid += 3;
    scores.Carousel += 3;
    scores.MiniCards += 2;
  } else if (toneProfile === "confident-playful") {
    scores.Carousel += 3;
    scores.Timeline += 3;
    scores.MiniCards += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.MiniCards += 3;
    scores.SplitAlternating += 2;
    scores.Tabbed += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.MetricTiles += 3;
    scores.FeatureTestimonial += 3;
    scores.SplitAlternating += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.SplitAlternating += 3;
    scores.FeatureTestimonial += 3;
    scores.Timeline += 2;
  }

  // Problem Type Scoring (Medium Weight: 2-3 points)
  if (problemType === "manual-repetition") {
    scores.Timeline += 3;
    scores.SplitAlternating += 2;
  } else if (problemType === "lost-revenue-or-inefficiency") {
    scores.MetricTiles += 3;
    scores.FeatureTestimonial += 2;
  } else if (problemType === "compliance-or-risk") {
    scores.SplitAlternating += 3;
    scores.FeatureTestimonial += 2;
  } else if (problemType === "creative-empowerment") {
    scores.Carousel += 3;
    scores.Timeline += 2;
  } else if (problemType === "burnout-or-overload") {
    scores.IconGrid += 3;
    scores.MiniCards += 2;
  } else if (problemType === "time-freedom-or-automation") {
    scores.Timeline += 3;
    scores.MetricTiles += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.IconGrid += 3;
    scores.Carousel += 2;
    scores.MiniCards += 2;
  } else if (startupStage === "traction") {
    scores.Tabbed += 3;
    scores.SplitAlternating += 2;
    scores.MetricTiles += 2;
  } else if (startupStage === "growth") {
    scores.FeatureTestimonial += 3;
    scores.Timeline += 2;
    scores.SplitAlternating += 2;
  } else if (startupStage === "scale") {
    scores.SplitAlternating += 3;
    scores.FeatureTestimonial += 2;
    scores.Timeline += 2;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.SplitAlternating += 2;
    scores.Timeline += 2;
    scores.MiniCards += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.MetricTiles += 2;
    scores.FeatureTestimonial += 2;
    scores.Tabbed += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.Carousel += 2;
    scores.Timeline += 2;
    scores.MiniCards += 1;
  } else if (marketCategory === "Work & Productivity Tools") {
    scores.Timeline += 2;
    scores.IconGrid += 2;
    scores.Tabbed += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.MetricTiles += 2;
    scores.SplitAlternating += 1;
  } else if (marketCategory === "No-Code & Low-Code Platforms") {
    scores.Timeline += 2;
    scores.Carousel += 1;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.FeatureTestimonial += 2;
    scores.MetricTiles += 2;
    scores.SplitAlternating += 1;
  } else if (landingPageGoals === "free-trial" || landingPageGoals === "demo") {
    scores.SplitAlternating += 2;
    scores.Timeline += 1;
  } else if (landingPageGoals === "contact-sales") {
    scores.FeatureTestimonial += 2;
    scores.SplitAlternating += 1;
  } else if (landingPageGoals === "signup") {
    scores.IconGrid += 2;
    scores.Tabbed += 1;
  } else if (landingPageGoals === "download" || landingPageGoals === "waitlist") {
    scores.Carousel += 2;
    scores.MiniCards += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.IconGrid += 2;
    scores.Carousel += 1;
  } else if (pricingModel === "tiered") {
    scores.Tabbed += 2;
    scores.MetricTiles += 1;
  } else if (pricingModel === "custom-quote") {
    scores.FeatureTestimonial += 2;
    scores.SplitAlternating += 1;
  } else if (pricingModel === "usage-based") {
    scores.MetricTiles += 2;
    scores.Timeline += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as FeatureLayout, score } : max,
    { layout: "IconGrid" as FeatureLayout, score: 0 }
  );

  // Return top scoring layout, fallback to universal default
  return topLayout.score > 0 ? topLayout.layout : "IconGrid";
}