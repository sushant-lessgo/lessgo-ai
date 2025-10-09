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

  // NOTE: Hero is position 1 - no flow context received
  // BUT: Hero ESTABLISHES flowTone and flowComplexity for subsequent sections:
  // - centerStacked → flowTone: 'balanced', flowComplexity: 'simple'
  // - imageFirst → flowTone: 'moderate', flowComplexity: 'moderate'
  // - splitScreen → flowTone: 'analytical', flowComplexity: 'moderate'
  // - leftCopyRightImage → flowTone: 'balanced', flowComplexity: 'detailed'

  // ===== PHASE 2.2: FLOW-AWARE HARD RULES (HIGHEST PRIORITY) =====

  // HR-4.1.1: MVP Stage + Unaware Audience = SIMPLE VALUE PROP
  if (
    (startupStage === 'idea' || startupStage === 'mvp') &&
    awarenessLevel === 'unaware'
  ) {
    return "centerStacked";  // Clear, simple value prop
  }

  // HR-4.1.2: Product-Aware + Visual Product = SHOW IMMEDIATELY
  if (
    (awarenessLevel === 'product-aware' || awarenessLevel === 'most-aware') &&
    marketCategory === 'Design & Creative Tools' &&
    assetAvailability?.productImages
  ) {
    return "imageFirst";  // Show product immediately
  }

  // HR-4.1.3: Technical Product + Sophisticated + Demo Available
  if (
    marketSophisticationLevel >= 'level-4' &&
    (targetAudience === 'builders' || targetAudience === 'enterprise') &&
    assetAvailability?.demoVideo
  ) {
    return "imageFirst";  // Show, don't tell (video hero)
  }

  // ===== EXISTING: High-Priority Rules (Return immediately if matched) =====
  
  // 1. Visual-first products that need to show the product immediately
  if (
    (marketCategory === "Design & Creative Tools" || marketCategory === "AI Tools" || marketCategory === "No-Code & Development Platforms") &&
    (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") &&
    (landingPageGoals === "demo" || landingPageGoals === "free-trial")
  ) {
    return "imageFirst";
  }

  // 2. Enterprise audiences with complex value propositions
  if (
    targetAudience === "enterprise" &&
    marketSophisticationLevel >= "level-4" &&
    (landingPageGoals === "contact-sales" || landingPageGoals === "demo" || landingPageGoals === "book-call")
  ) {
    return "leftCopyRightImage";
  }

  // 3. Early-stage products building awareness with simple message
  if (
    (startupStage === "idea" || startupStage === "mvp") &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") &&
    (landingPageGoals === "waitlist" || landingPageGoals === "early-access" || landingPageGoals === "signup")
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
    (targetAudience === "builders" || targetAudience === "enterprise") &&
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

  // ===== PHASE 2.2: FLOW-AWARE SCORING =====

  // NOTE: Hero establishes the initial tone for entire page
  // Layout choice influences flowTone and flowComplexity:
  // - centerStacked → 'balanced', 'simple'
  // - imageFirst → 'moderate', 'moderate'
  // - splitScreen → 'analytical', 'moderate'
  // - leftCopyRightImage → 'balanced', 'detailed'

  // Market Sophistication + Awareness Combo (5 points)
  if (marketSophisticationLevel >= 'level-4' && (awarenessLevel === 'product-aware' || awarenessLevel === 'most-aware')) {
    scores.imageFirst += 5;  // They know what they want - show it
    scores.splitScreen += 4;
  } else if (marketSophisticationLevel <= 'level-2' && awarenessLevel === 'unaware') {
    scores.centerStacked += 5;  // Keep it simple and clear
  }

  // MVP Stage Special Handling (5 points)
  if (startupStage === 'idea' || startupStage === 'mvp') {
    scores.centerStacked += 5;  // Simple, focused messaging
    scores.imageFirst -= 3;     // May not have polished product images
  }

  // ===== EXISTING SCORING (PRESERVED) =====

  // Landing Goal Scoring (Highest Weight: 4-5 points)
  if (landingPageGoals === "contact-sales" || landingPageGoals === "demo" || landingPageGoals === "book-call") {
    scores.leftCopyRightImage += 5;
    scores.splitScreen += 3;
    scores.centerStacked += 2;
  } else if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.splitScreen += 5;
    scores.leftCopyRightImage += 4;
    scores.imageFirst += 2;
  } else if (landingPageGoals === "free-trial") {
    scores.imageFirst += 5;
    scores.leftCopyRightImage += 4;
    scores.centerStacked += 2;
  } else if (landingPageGoals === "signup") {
    scores.centerStacked += 5;
    scores.leftCopyRightImage += 3;
    scores.splitScreen += 2;
  } else if (landingPageGoals === "waitlist" || landingPageGoals === "early-access") {
    scores.centerStacked += 5;
    scores.splitScreen += 3;
    scores.imageFirst += 2;
  } else if (landingPageGoals === "download") {
    scores.centerStacked += 4;
    scores.leftCopyRightImage += 3;
    scores.imageFirst += 2;
  } else if (landingPageGoals === "join-community") {
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
  if (targetAudience === "enterprise") {
    scores.leftCopyRightImage += 4;
    scores.splitScreen += 3;
    scores.centerStacked += 2;
  } else if (targetAudience === "builders") {
    scores.leftCopyRightImage += 4;
    scores.imageFirst += 3;
    scores.splitScreen += 2;
  } else if (targetAudience === "businesses") {
    scores.splitScreen += 4;
    scores.leftCopyRightImage += 3;
    scores.centerStacked += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.centerStacked += 4;
    scores.imageFirst += 3;
    scores.splitScreen += 2;
  } else if (targetAudience === "marketers") {
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
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.centerStacked += 3;
    scores.leftCopyRightImage += 2;
    scores.imageFirst += 1;
  } else if (startupStage === "traction") {
    scores.leftCopyRightImage += 3;
    scores.splitScreen += 2;
    scores.centerStacked += 1;
  } else if (startupStage === "growth") {
    scores.splitScreen += 3;
    scores.leftCopyRightImage += 2;
    scores.imageFirst += 2;
  } else if (startupStage === "scale") {
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
  } else if (marketCategory === "Business Productivity Tools") {
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

  // Sprint 7: Asset-Aware Scoring Adjustments
  if (assetAvailability && !assetAvailability.productImages) {
    // Heavily penalize image-dependent layouts without product images
    scores.imageFirst -= 100;
    scores.leftCopyRightImage -= 50;
    scores.splitScreen -= 50;

    // Boost text-focused layout
    scores.centerStacked += 30;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) =>
    score > max.score ? { layout: layout as HeroLayout, score } : max,
    { layout: "leftCopyRightImage" as HeroLayout, score: 0 }
  );

  // Check for randomization between leftCopyRightImage and centerStacked
  // If they have similar scores (within 2 points), randomize for variety
  const leftCopyScore = scores.leftCopyRightImage;
  const centerStackedScore = scores.centerStacked;
  const scoreDifference = Math.abs(leftCopyScore - centerStackedScore);

  if (scoreDifference <= 2 &&
      (topLayout.layout === "leftCopyRightImage" || topLayout.layout === "centerStacked") &&
      (leftCopyScore >= 8 || centerStackedScore >= 8)) { // Only randomize if both have decent scores

    // Randomize between the two equally good layouts
    const randomChoice = Math.random() < 0.5 ? "leftCopyRightImage" : "centerStacked";
    return randomChoice;
  }

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "leftCopyRightImage";
}