import type { LayoutPickerInput } from "./layoutPickerInput";

export type HeroLayout =
  | "leftCopyRightImage"
  | "centerStacked"
  | "splitScreen"
  | "imageFirst";

/**
 * Selects the optimal Hero section layout based on first impression and conversion goals
 * Hero sections are the most critical for conversion - prioritizes clarity and immediate value communication
 */
export function pickHeroLayout(input: LayoutPickerInput): HeroLayout {
  const {
    awarenessLevel,
    toneProfile,
    startupStageGroup,
    marketCategory,
    landingGoalType,
    targetAudienceGroup,
    pricingModel,
    pricingModifier,
    pricingCommitmentOption,
    marketSophisticationLevel,
    copyIntent,
    problemType,
  } = input;

  // High-Priority Rules (Return immediately if matched)
  
  // 1. Visual-first products that need to show the product immediately
  if (
    (marketCategory === "Design & Creative Tools" || marketCategory === "AI Tools" || marketCategory === "No-Code & Low-Code Platforms") &&
    (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") &&
    (landingGoalType === "demo" || landingGoalType === "free-trial")
  ) {
    return "imageFirst";
  }

  // 2. Enterprise audiences with complex value propositions
  if (
    targetAudienceGroup === "enterprise" &&
    marketSophisticationLevel >= "level-4" &&
    (landingGoalType === "contact-sales" || landingGoalType === "demo" || landingGoalType === "book-call")
  ) {
    return "leftCopyRightImage";
  }

  // 3. Early-stage products building awareness with simple message
  if (
    (startupStageGroup === "idea" || startupStageGroup === "mvp") &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") &&
    (landingGoalType === "waitlist" || landingGoalType === "early-access" || landingGoalType === "signup")
  ) {
    return "centerStacked";
  }

  // 4. Bold, dramatic positioning for competitive markets
  if (
    marketSophisticationLevel >= "level-4" &&
    toneProfile === "bold-persuasive" &&
    (problemType === "lost-revenue-or-inefficiency" || problemType === "compliance-or-risk")
  ) {
    return "splitScreen";
  }

  // 5. Technical products needing detailed explanation
  if (
    (targetAudienceGroup === "builders" || targetAudienceGroup === "enterprise") &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "Data & Analytics Tools") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "leftCopyRightImage";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<HeroLayout, number> = {
    leftCopyRightImage: 0,
    centerStacked: 0,
    splitScreen: 0,
    imageFirst: 0,
  };

  // Landing Goal Scoring (Highest Weight: 4-5 points)
  if (landingGoalType === "contact-sales" || landingGoalType === "demo" || landingGoalType === "book-call") {
    scores.leftCopyRightImage += 5;
    scores.splitScreen += 3;
    scores.centerStacked += 2;
  } else if (landingGoalType === "buy-now" || landingGoalType === "subscribe") {
    scores.splitScreen += 5;
    scores.leftCopyRightImage += 4;
    scores.imageFirst += 2;
  } else if (landingGoalType === "free-trial") {
    scores.imageFirst += 5;
    scores.leftCopyRightImage += 4;
    scores.centerStacked += 2;
  } else if (landingGoalType === "signup") {
    scores.centerStacked += 5;
    scores.leftCopyRightImage += 3;
    scores.splitScreen += 2;
  } else if (landingGoalType === "waitlist" || landingGoalType === "early-access") {
    scores.centerStacked += 5;
    scores.splitScreen += 3;
    scores.imageFirst += 2;
  } else if (landingGoalType === "download") {
    scores.centerStacked += 4;
    scores.leftCopyRightImage += 3;
    scores.imageFirst += 2;
  } else if (landingGoalType === "join-community") {
    scores.centerStacked += 4;
    scores.imageFirst += 2;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware") {
    scores.centerStacked += 4;
    scores.leftCopyRightImage += 3;
    scores.splitScreen += 2;
  } else if (awarenessLevel === "problem-aware") {
    scores.leftCopyRightImage += 4;
    scores.centerStacked += 3;
    scores.splitScreen += 3;
  } else if (awarenessLevel === "solution-aware") {
    scores.splitScreen += 4;
    scores.leftCopyRightImage += 3;
    scores.imageFirst += 2;
  } else if (awarenessLevel === "product-aware") {
    scores.imageFirst += 4;
    scores.splitScreen += 3;
    scores.leftCopyRightImage += 2;
  } else if (awarenessLevel === "most-aware") {
    scores.imageFirst += 4;
    scores.splitScreen += 4;
    scores.leftCopyRightImage += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudienceGroup === "enterprise") {
    scores.leftCopyRightImage += 4;
    scores.splitScreen += 3;
    scores.centerStacked += 2;
  } else if (targetAudienceGroup === "builders") {
    scores.leftCopyRightImage += 4;
    scores.imageFirst += 3;
    scores.splitScreen += 2;
  } else if (targetAudienceGroup === "businesses") {
    scores.splitScreen += 4;
    scores.leftCopyRightImage += 3;
    scores.centerStacked += 2;
  } else if (targetAudienceGroup === "founders" || targetAudienceGroup === "creators") {
    scores.centerStacked += 4;
    scores.imageFirst += 3;
    scores.splitScreen += 2;
  } else if (targetAudienceGroup === "marketers") {
    scores.splitScreen += 4;
    scores.leftCopyRightImage += 3;
    scores.imageFirst += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.leftCopyRightImage += 4;
    scores.centerStacked += 3;
    scores.splitScreen += 2;
  } else if (copyIntent === "desire-led") {
    scores.splitScreen += 4;
    scores.imageFirst += 4;
    scores.leftCopyRightImage += 2;
  }

  // Market Sophistication Scoring (Medium Weight: 2-3 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.centerStacked += 3;
    scores.leftCopyRightImage += 2;
    scores.imageFirst += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.leftCopyRightImage += 3;
    scores.splitScreen += 2;
    scores.centerStacked += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.splitScreen += 3;
    scores.leftCopyRightImage += 3;
    scores.imageFirst += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.centerStacked += 3;
    scores.leftCopyRightImage += 2;
    scores.imageFirst += 2;
  } else if (toneProfile === "confident-playful") {
    scores.imageFirst += 3;
    scores.centerStacked += 2;
    scores.splitScreen += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.leftCopyRightImage += 3;
    scores.imageFirst += 2;
    scores.centerStacked += 1;
  } else if (toneProfile === "bold-persuasive") {
    scores.splitScreen += 3;
    scores.leftCopyRightImage += 2;
    scores.centerStacked += 1;
  } else if (toneProfile === "luxury-expert") {
    scores.splitScreen += 3;
    scores.leftCopyRightImage += 3;
    scores.imageFirst += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStageGroup === "idea" || startupStageGroup === "mvp") {
    scores.centerStacked += 3;
    scores.leftCopyRightImage += 2;
    scores.imageFirst += 1;
  } else if (startupStageGroup === "traction") {
    scores.leftCopyRightImage += 3;
    scores.splitScreen += 2;
    scores.centerStacked += 1;
  } else if (startupStageGroup === "growth") {
    scores.splitScreen += 3;
    scores.leftCopyRightImage += 2;
    scores.imageFirst += 2;
  } else if (startupStageGroup === "scale") {
    scores.leftCopyRightImage += 3;
    scores.splitScreen += 3;
    scores.imageFirst += 1;
  }

  // Problem Type Scoring (Low Weight: 1-2 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.splitScreen += 2;
    scores.leftCopyRightImage += 2;
  } else if (problemType === "compliance-or-risk") {
    scores.leftCopyRightImage += 2;
    scores.splitScreen += 1;
  } else if (problemType === "manual-repetition") {
    scores.imageFirst += 2;
    scores.splitScreen += 1;
  } else if (problemType === "creative-empowerment") {
    scores.imageFirst += 2;
    scores.centerStacked += 1;
  } else if (problemType === "burnout-or-overload") {
    scores.centerStacked += 2;
    scores.leftCopyRightImage += 1;
  } else if (problemType === "time-freedom-or-automation") {
    scores.splitScreen += 2;
    scores.imageFirst += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Design & Creative Tools") {
    scores.imageFirst += 2;
    scores.splitScreen += 1;
  } else if (marketCategory === "AI Tools") {
    scores.imageFirst += 2;
    scores.splitScreen += 1;
  } else if (marketCategory === "Engineering & Development Tools") {
    scores.leftCopyRightImage += 2;
    scores.imageFirst += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.splitScreen += 2;
    scores.leftCopyRightImage += 1;
  } else if (marketCategory === "Work & Productivity Tools") {
    scores.leftCopyRightImage += 2;
    scores.centerStacked += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.leftCopyRightImage += 2;
    scores.splitScreen += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.centerStacked += 2;
    scores.imageFirst += 1;
  } else if (pricingModel === "tiered") {
    scores.splitScreen += 2;
    scores.leftCopyRightImage += 1;
  } else if (pricingModel === "custom-quote") {
    scores.leftCopyRightImage += 2;
    scores.splitScreen += 1;
  } else if (pricingModel === "trial-free" || pricingModel === "trial-paid") {
    scores.imageFirst += 2;
    scores.centerStacked += 1;
  }

  // Pricing Modifier Scoring (Low Weight: 1 point)
  if (pricingModifier === "discount") {
    scores.splitScreen += 1;
    scores.centerStacked += 1;
  } else if (pricingModifier === "money-back") {
    scores.leftCopyRightImage += 1;
    scores.centerStacked += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as HeroLayout, score } : max,
    { layout: "leftCopyRightImage" as HeroLayout, score: 0 }
  );

  // Return top scoring layout, fallback to universal default
  return topLayout.score > 0 ? topLayout.layout : "leftCopyRightImage";
}