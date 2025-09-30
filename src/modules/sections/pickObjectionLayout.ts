import type { LayoutPickerInput } from "./layoutPickerInput";

export type ObjectionLayout =
  | "ObjectionAccordion"
  | "MythVsRealityGrid"
  | "QuoteBackedAnswers"
  | "VisualObjectionTiles"
  | "ProblemToReframeBlocks"
  | "SkepticToBelieverSteps"
  | "BoldGuaranteePanel";
  // | "ObjectionCarousel"; // Temporarily disabled - not useful currently

/**
 * Selects the optimal Objection section layout based on skepticism level and trust-building needs
 * Objection sections address concerns and build confidence - prioritizes credibility and persuasion
 */
export function pickObjectionLayout(input: LayoutPickerInput): ObjectionLayout {
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
  
  // 1. High-stakes enterprise decisions need authoritative proof
  if (
    targetAudience === "enterprise" &&
    marketSophisticationLevel >= "level-4" &&
    (problemType === "compliance-or-risk" || problemType === "lost-revenue-or-inefficiency") &&
    (startupStage === "growth" || startupStage === "scale")
  ) {
    return "QuoteBackedAnswers";
  }

  // 2. Purchase-focused with guarantees and risk reversal
  if (
    (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") &&
    (pricingModifier === "money-back" || pricingCommitmentOption === "upfront-payment") &&
    toneProfile === "bold-persuasive"
  ) {
    return "BoldGuaranteePanel";
  }

  // 3. Sophisticated markets with entrenched misconceptions
  if (
    marketSophisticationLevel >= "level-4" &&
    (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools" || marketCategory === "Data & Analytics Tools") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  ) {
    return "MythVsRealityGrid";
  }

  // 4. Converting skeptics through education journey
  if (
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware") &&
    marketSophisticationLevel >= "level-3" &&
    copyIntent === "desire-led" &&
    (targetAudience === "businesses" || targetAudience === "enterprise")
  ) {
    return "SkepticToBelieverSteps";
  }

  // 5. Early stage or simple products with basic concerns
  if (
    (startupStage === "idea" || startupStage === "mvp") &&
    marketSophisticationLevel <= "level-2" &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware")
  ) {
    return "VisualObjectionTiles";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<ObjectionLayout, number> = {
    ObjectionAccordion: 0,
    MythVsRealityGrid: 0,
    QuoteBackedAnswers: 0,
    VisualObjectionTiles: 0,
    ProblemToReframeBlocks: 0,
    SkepticToBelieverSteps: 0,
    BoldGuaranteePanel: 0,
    // ObjectionCarousel: 0, // Temporarily disabled
  };

  // Market Sophistication Scoring (Highest Weight: 4-5 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.VisualObjectionTiles += 5;
    // scores.ObjectionCarousel += 4; // Temporarily disabled
    scores.ObjectionAccordion += 3;
    scores.ProblemToReframeBlocks += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.ObjectionAccordion += 4;
    scores.ProblemToReframeBlocks += 4;
    scores.SkepticToBelieverSteps += 3;
    scores.BoldGuaranteePanel += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.MythVsRealityGrid += 5;
    scores.QuoteBackedAnswers += 5;
    scores.SkepticToBelieverSteps += 4;
    scores.ProblemToReframeBlocks += 3;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.VisualObjectionTiles += 4;
    // scores.ObjectionCarousel += 4; // Temporarily disabled
    scores.ProblemToReframeBlocks += 3;
    scores.ObjectionAccordion += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.SkepticToBelieverSteps += 4;
    scores.MythVsRealityGrid += 4;
    scores.ProblemToReframeBlocks += 3;
    scores.ObjectionAccordion += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.QuoteBackedAnswers += 4;
    scores.MythVsRealityGrid += 4;
    scores.BoldGuaranteePanel += 3;
    scores.SkepticToBelieverSteps += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudience === "enterprise") {
    scores.QuoteBackedAnswers += 4;
    scores.SkepticToBelieverSteps += 4;
    scores.MythVsRealityGrid += 3;
    scores.ObjectionAccordion += 2;
  } else if (targetAudience === "builders") {
    scores.MythVsRealityGrid += 4;
    scores.ObjectionAccordion += 3;
    scores.QuoteBackedAnswers += 2;
  } else if (targetAudience === "businesses") {
    scores.SkepticToBelieverSteps += 4;
    scores.BoldGuaranteePanel += 3;
    scores.QuoteBackedAnswers += 3;
    scores.ObjectionAccordion += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.VisualObjectionTiles += 4;
    // scores.ObjectionCarousel += 3; // Temporarily disabled
    scores.ProblemToReframeBlocks += 3;
    scores.ObjectionAccordion += 2;
  } else if (targetAudience === "marketers") {
    scores.ProblemToReframeBlocks += 4;
    scores.SkepticToBelieverSteps += 3;
    scores.ObjectionAccordion += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.VisualObjectionTiles += 4;
    scores.ProblemToReframeBlocks += 4;
    // scores.ObjectionCarousel += 3; // Temporarily disabled
    scores.ObjectionAccordion += 2;
  } else if (copyIntent === "desire-led") {
    scores.SkepticToBelieverSteps += 4;
    scores.MythVsRealityGrid += 4;
    scores.QuoteBackedAnswers += 3;
    scores.BoldGuaranteePanel += 3;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "bold-persuasive") {
    scores.BoldGuaranteePanel += 3;
    scores.MythVsRealityGrid += 3;
    scores.SkepticToBelieverSteps += 2;
  } else if (toneProfile === "confident-playful") {
    // scores.ObjectionCarousel += 3; // Temporarily disabled
    scores.VisualObjectionTiles += 3;
    scores.ProblemToReframeBlocks += 2;
  } else if (toneProfile === "friendly-helpful") {
    scores.VisualObjectionTiles += 3;
    scores.ObjectionAccordion += 3;
    // scores.ObjectionCarousel += 2; // Temporarily disabled
  } else if (toneProfile === "minimal-technical") {
    scores.ObjectionAccordion += 3;
    scores.MythVsRealityGrid += 2;
    scores.QuoteBackedAnswers += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.QuoteBackedAnswers += 3;
    scores.SkepticToBelieverSteps += 3;
    scores.MythVsRealityGrid += 2;
  }

  // Landing Goal Scoring (Medium Weight: 2-3 points)
  if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.BoldGuaranteePanel += 3;
    scores.SkepticToBelieverSteps += 2;
    scores.QuoteBackedAnswers += 2;
  } else if (landingPageGoals === "contact-sales" || landingPageGoals === "demo") {
    scores.QuoteBackedAnswers += 3;
    scores.SkepticToBelieverSteps += 2;
    scores.ObjectionAccordion += 2;
  } else if (landingPageGoals === "free-trial") {
    scores.MythVsRealityGrid += 3;
    scores.ObjectionAccordion += 2;
    scores.BoldGuaranteePanel += 1;
  } else if (landingPageGoals === "signup") {
    scores.ObjectionAccordion += 3;
    scores.VisualObjectionTiles += 2;
  } else if (landingPageGoals === "waitlist" || landingPageGoals === "early-access") {
    scores.ProblemToReframeBlocks += 3;
    scores.VisualObjectionTiles += 2;
  }

  // Problem Type Scoring (Medium Weight: 2-3 points)
  if (problemType === "compliance-or-risk") {
    scores.QuoteBackedAnswers += 3;
    scores.MythVsRealityGrid += 2;
    scores.SkepticToBelieverSteps += 2;
  } else if (problemType === "lost-revenue-or-inefficiency") {
    scores.SkepticToBelieverSteps += 3;
    scores.QuoteBackedAnswers += 2;
    scores.BoldGuaranteePanel += 2;
  } else if (problemType === "manual-repetition") {
    scores.ProblemToReframeBlocks += 3;
    scores.MythVsRealityGrid += 2;
  } else if (problemType === "burnout-or-overload") {
    scores.VisualObjectionTiles += 3;
    scores.ProblemToReframeBlocks += 2;
  } else if (problemType === "creative-empowerment") {
    // scores.ObjectionCarousel += 3; // Temporarily disabled
    scores.VisualObjectionTiles += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.VisualObjectionTiles += 3;
    // scores.ObjectionCarousel += 2; // Temporarily disabled
    scores.ProblemToReframeBlocks += 2;
  } else if (startupStage === "traction") {
    scores.ObjectionAccordion += 3;
    scores.ProblemToReframeBlocks += 2;
    scores.SkepticToBelieverSteps += 1;
  } else if (startupStage === "growth") {
    scores.QuoteBackedAnswers += 3;
    scores.SkepticToBelieverSteps += 2;
    scores.MythVsRealityGrid += 2;
  } else if (startupStage === "scale") {
    scores.QuoteBackedAnswers += 3;
    scores.MythVsRealityGrid += 2;
    scores.BoldGuaranteePanel += 2;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools") {
    scores.MythVsRealityGrid += 2;
    scores.QuoteBackedAnswers += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.SkepticToBelieverSteps += 2;
    scores.ProblemToReframeBlocks += 1;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.ObjectionAccordion += 2;
    scores.VisualObjectionTiles += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    // scores.ObjectionCarousel += 2; // Temporarily disabled
    scores.VisualObjectionTiles += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.MythVsRealityGrid += 2;
    scores.QuoteBackedAnswers += 1;
  }

  // Pricing Modifier Scoring (Low Weight: 1-2 points)
  if (pricingModifier === "money-back") {
    scores.BoldGuaranteePanel += 2;
    scores.SkepticToBelieverSteps += 1;
  } else if (pricingModifier === "discount") {
    scores.BoldGuaranteePanel += 2;
    // scores.ObjectionCarousel += 1; // Temporarily disabled
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.VisualObjectionTiles += 2;
    // scores.ObjectionCarousel += 1; // Temporarily disabled
  } else if (pricingModel === "custom-quote") {
    scores.QuoteBackedAnswers += 2;
    scores.SkepticToBelieverSteps += 1;
  } else if (pricingModel === "tiered") {
    scores.ObjectionAccordion += 2;
    scores.MythVsRealityGrid += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as ObjectionLayout, score } : max,
    { layout: "ObjectionAccordion" as ObjectionLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "ObjectionAccordion";
}