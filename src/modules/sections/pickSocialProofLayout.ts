import type { LayoutPickerInput } from "./layoutPickerInput";

export type SocialProofLayout =
  | "LogoWall"
  | "MediaMentions"
  | "UserCountBar"
  | "IndustryBadgeLine"
  | "MapHeatSpots"
  | "StackedStats"
  | "StripWithReviews"
  | "SocialProofStrip";

/**
 * Selects the optimal Social Proof section layout based on credibility needs and proof type available
 * Social Proof sections build trust and reduce risk perception - prioritizes credibility and social validation
 */
export function pickSocialProofLayout(input: LayoutPickerInput): SocialProofLayout {
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
  
  // 1. Enterprise audiences need established customer logos
  if (
    targetAudience === "enterprise" &&
    (startupStage === "growth" || startupStage === "scale") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "LogoWall";
  }

  // 2. Consumer/growth stage with significant user base
  if (
    (startupStage === "growth" || startupStage === "scale") &&
    (landingPageGoals === "signup" || landingPageGoals === "free-trial") &&
    (targetAudience === "founders" || targetAudience === "creators" || targetAudience === "marketers")
  ) {
    return "UserCountBar";
  }

  // 3. Media coverage and PR for credibility
  if (
    (startupStage === "growth" || startupStage === "scale") &&
    marketSophisticationLevel >= "level-3" &&
    toneProfile === "luxury-expert"
  ) {
    return "MediaMentions";
  }

  // 4. Review-heavy products with ratings focus
  if (
    (startupStage === "traction" || startupStage === "growth") &&
    (marketCategory === "Marketing & Sales Tools" || marketCategory === "Work & Productivity Tools" || marketCategory === "Design & Creative Tools") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "StripWithReviews";
  }

  // 5. Global/distributed user base visualization
  if (
    (targetAudience === "founders" || targetAudience === "creators") &&
    marketSophisticationLevel <= "level-2" &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware")
  ) {
    return "MapHeatSpots";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<SocialProofLayout, number> = {
    LogoWall: 0,
    MediaMentions: 0,
    UserCountBar: 0,
    IndustryBadgeLine: 0,
    MapHeatSpots: 0,
    StackedStats: 0,
    StripWithReviews: 0,
    SocialProofStrip: 0,
  };

  // Startup Stage Scoring (Highest Weight: 4-5 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.IndustryBadgeLine += 4;
    scores.StackedStats += 3;
    scores.MapHeatSpots += 3;
    scores.SocialProofStrip += 2;
  } else if (startupStage === "traction") {
    scores.UserCountBar += 4;
    scores.StackedStats += 4;
    scores.StripWithReviews += 3;
    scores.IndustryBadgeLine += 2;
  } else if (startupStage === "growth") {
    scores.LogoWall += 5;
    scores.UserCountBar += 4;
    scores.MediaMentions += 4;
    scores.StripWithReviews += 3;
  } else if (startupStage === "scale") {
    scores.LogoWall += 5;
    scores.MediaMentions += 4;
    scores.SocialProofStrip += 4;
    scores.UserCountBar += 3;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudience === "enterprise") {
    scores.LogoWall += 4;
    scores.SocialProofStrip += 4;
    scores.MediaMentions += 3;
    scores.IndustryBadgeLine += 2;
  } else if (targetAudience === "builders") {
    scores.StackedStats += 4;
    scores.UserCountBar += 3;
    scores.LogoWall += 2;
  } else if (targetAudience === "businesses") {
    scores.LogoWall += 4;
    scores.StripWithReviews += 4;
    scores.SocialProofStrip += 3;
    scores.IndustryBadgeLine += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.UserCountBar += 4;
    scores.MapHeatSpots += 4;
    scores.StackedStats += 3;
    scores.StripWithReviews += 2;
  } else if (targetAudience === "marketers") {
    scores.StripWithReviews += 4;
    scores.UserCountBar += 3;
    scores.MediaMentions += 3;
    scores.SocialProofStrip += 2;
  }

  // Market Sophistication Scoring (High Weight: 3-4 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.MapHeatSpots += 4;
    scores.StackedStats += 4;
    scores.IndustryBadgeLine += 3;
    scores.UserCountBar += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.UserCountBar += 4;
    scores.StripWithReviews += 3;
    scores.LogoWall += 3;
    scores.StackedStats += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.LogoWall += 4;
    scores.MediaMentions += 4;
    scores.SocialProofStrip += 3;
    scores.StripWithReviews += 2;
  }

  // Copy Intent Scoring (Medium Weight: 2-3 points)
  if (copyIntent === "pain-led") {
    scores.StackedStats += 3;
    scores.IndustryBadgeLine += 3;
    scores.MapHeatSpots += 2;
  } else if (copyIntent === "desire-led") {
    scores.MediaMentions += 3;
    scores.UserCountBar += 3;
    scores.StripWithReviews += 3;
    scores.SocialProofStrip += 2;
  }

  // Awareness Level Scoring (Medium Weight: 2-3 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.StackedStats += 3;
    scores.MapHeatSpots += 3;
    scores.IndustryBadgeLine += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.StripWithReviews += 3;
    scores.UserCountBar += 3;
    scores.LogoWall += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.LogoWall += 3;
    scores.MediaMentions += 3;
    scores.SocialProofStrip += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.MapHeatSpots += 3;
    scores.UserCountBar += 2;
    scores.StackedStats += 2;
  } else if (toneProfile === "confident-playful") {
    scores.UserCountBar += 3;
    scores.MapHeatSpots += 2;
    scores.StripWithReviews += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.StackedStats += 3;
    scores.MediaMentions += 2;
    scores.UserCountBar += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.LogoWall += 3;
    scores.StackedStats += 2;
    scores.SocialProofStrip += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.MediaMentions += 3;
    scores.LogoWall += 3;
    scores.SocialProofStrip += 2;
  }

  // Problem Type Scoring (Medium Weight: 2-3 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.LogoWall += 3;
    scores.StackedStats += 2;
    scores.StripWithReviews += 2;
  } else if (problemType === "compliance-or-risk") {
    scores.LogoWall += 3;
    scores.SocialProofStrip += 3;
    scores.IndustryBadgeLine += 2;
  } else if (problemType === "professional-image-or-branding") {
    scores.MediaMentions += 3;
    scores.LogoWall += 2;
    scores.SocialProofStrip += 2;
  } else if (problemType === "creative-empowerment") {
    scores.UserCountBar += 3;
    scores.StripWithReviews += 2;
  } else if (problemType === "burnout-or-overload") {
    scores.StackedStats += 3;
    scores.UserCountBar += 2;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingPageGoals === "contact-sales" || landingPageGoals === "demo") {
    scores.LogoWall += 2;
    scores.MediaMentions += 2;
    scores.SocialProofStrip += 1;
  } else if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.StripWithReviews += 2;
    scores.LogoWall += 2;
    scores.UserCountBar += 1;
  } else if (landingPageGoals === "free-trial") {
    scores.UserCountBar += 2;
    scores.StripWithReviews += 1;
  } else if (landingPageGoals === "signup") {
    scores.UserCountBar += 2;
    scores.StackedStats += 1;
  } else if (landingPageGoals === "join-community" || landingPageGoals === "waitlist") {
    scores.MapHeatSpots += 2;
    scores.UserCountBar += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Marketing & Sales Tools") {
    scores.StripWithReviews += 2;
    scores.LogoWall += 1;
  } else if (marketCategory === "Work & Productivity Tools") {
    scores.LogoWall += 2;
    scores.UserCountBar += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.UserCountBar += 2;
    scores.StripWithReviews += 1;
  } else if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.StackedStats += 2;
    scores.LogoWall += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.LogoWall += 2;
    scores.StackedStats += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.UserCountBar += 2;
    scores.MapHeatSpots += 1;
  } else if (pricingModel === "custom-quote") {
    scores.LogoWall += 2;
    scores.MediaMentions += 1;
  } else if (pricingModel === "tiered") {
    scores.StripWithReviews += 2;
    scores.LogoWall += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as SocialProofLayout, score } : max,
    { layout: "LogoWall" as SocialProofLayout, score: 0 }
  );

  // Return top scoring layout, fallback to universal default
  return topLayout.score > 0 ? topLayout.layout : "LogoWall";
}