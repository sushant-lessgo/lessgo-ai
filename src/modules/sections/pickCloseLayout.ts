import type { LayoutPickerInput } from "./layoutPickerInput";

export type CloseLayout =
  | "MockupWithCTA"
  | "BonusStackCTA"
  | "LeadMagnetCard"
  | "EnterpriseContactBox"
  | "ValueReinforcementBlock"
  | "LivePreviewEmbed"
  | "SideBySideOfferCards"
  | "MultistepCTAStack";

/**
 * Selects the optimal Close section layout based on user context and conversion goals
 * Close sections are critical for conversion - prioritizes layouts that drive action
 */
export function pickCloseLayout(input: LayoutPickerInput): CloseLayout {
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
  
  // 1. Enterprise sales process - needs professional contact flow
  if (
    targetAudienceGroup === "enterprise" &&
    (landingGoalType === "contact-sales" || landingGoalType === "demo" || landingGoalType === "book-call") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "EnterpriseContactBox";
  }

  // 2. Technical product demos - show actual product in action
  if (
    (targetAudienceGroup === "builders" || targetAudienceGroup === "enterprise") &&
    (landingGoalType === "demo" || landingGoalType === "free-trial") &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools" || marketCategory === "No-Code & Low-Code Platforms")
  ) {
    return "LivePreviewEmbed";
  }

  // 3. Lead magnets for content/educational goals
  if (
    (landingGoalType === "download" || landingGoalType === "waitlist" || landingGoalType === "join-community") &&
    (targetAudienceGroup === "creators" || targetAudienceGroup === "founders" || targetAudienceGroup === "marketers")
  ) {
    return "LeadMagnetCard";
  }

  // 4. High-value offers with bonuses for purchase intent
  if (
    (landingGoalType === "buy-now" || landingGoalType === "subscribe") &&
    (pricingModifier === "discount" || pricingModifier === "money-back") &&
    toneProfile === "bold-persuasive"
  ) {
    return "BonusStackCTA";
  }

  // 5. Complex signup processes - break down the steps
  if (
    (landingGoalType === "signup" || landingGoalType === "free-trial") &&
    marketSophisticationLevel >= "level-3" &&
    (pricingCommitmentOption === "card-required" || pricingCommitmentOption === "paid-trial")
  ) {
    return "MultistepCTAStack";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<CloseLayout, number> = {
    MockupWithCTA: 0,
    BonusStackCTA: 0,
    LeadMagnetCard: 0,
    EnterpriseContactBox: 0,
    ValueReinforcementBlock: 0,
    LivePreviewEmbed: 0,
    SideBySideOfferCards: 0,
    MultistepCTAStack: 0,
  };

  // Landing Goal Scoring (Highest Weight: 4-5 points)
  if (landingGoalType === "buy-now" || landingGoalType === "subscribe") {
    scores.BonusStackCTA += 5;
    scores.SideBySideOfferCards += 3;
    scores.MockupWithCTA += 2;
  } else if (landingGoalType === "free-trial") {
    scores.MockupWithCTA += 4;
    scores.LivePreviewEmbed += 4;
    scores.MultistepCTAStack += 3;
  } else if (landingGoalType === "demo") {
    scores.LivePreviewEmbed += 5;
    scores.EnterpriseContactBox += 3;
    scores.MockupWithCTA += 2;
  } else if (landingGoalType === "contact-sales" || landingGoalType === "book-call") {
    scores.EnterpriseContactBox += 5;
    scores.MultistepCTAStack += 2;
  } else if (landingGoalType === "signup") {
    scores.MultistepCTAStack += 4;
    scores.LeadMagnetCard += 3;
    scores.MockupWithCTA += 3;
  } else if (landingGoalType === "download" || landingGoalType === "waitlist") {
    scores.LeadMagnetCard += 5;
    scores.ValueReinforcementBlock += 2;
  } else if (landingGoalType === "early-access") {
    scores.BonusStackCTA += 4;
    scores.LeadMagnetCard += 3;
    scores.ValueReinforcementBlock += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudienceGroup === "enterprise") {
    scores.EnterpriseContactBox += 4;
    scores.MultistepCTAStack += 3;
    scores.SideBySideOfferCards += 2;
  } else if (targetAudienceGroup === "builders") {
    scores.LivePreviewEmbed += 4;
    scores.MockupWithCTA += 3;
    scores.MultistepCTAStack += 2;
  } else if (targetAudienceGroup === "businesses") {
    scores.SideBySideOfferCards += 4;
    scores.EnterpriseContactBox += 3;
    scores.BonusStackCTA += 2;
  } else if (targetAudienceGroup === "founders" || targetAudienceGroup === "creators") {
    scores.LeadMagnetCard += 4;
    scores.ValueReinforcementBlock += 3;
    scores.MockupWithCTA += 2;
  } else if (targetAudienceGroup === "marketers") {
    scores.BonusStackCTA += 3;
    scores.SideBySideOfferCards += 3;
    scores.LeadMagnetCard += 2;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.ValueReinforcementBlock += 4;
    scores.LeadMagnetCard += 3;
    scores.MockupWithCTA += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.SideBySideOfferCards += 4;
    scores.MultistepCTAStack += 3;
    scores.LivePreviewEmbed += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.BonusStackCTA += 4;
    scores.LivePreviewEmbed += 3;
    scores.EnterpriseContactBox += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.ValueReinforcementBlock += 4;
    scores.LeadMagnetCard += 3;
    scores.MockupWithCTA += 2;
  } else if (copyIntent === "desire-led") {
    scores.BonusStackCTA += 4;
    scores.LivePreviewEmbed += 3;
    scores.SideBySideOfferCards += 2;
  }

  // Pricing Model Scoring (Medium Weight: 2-3 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.LeadMagnetCard += 3;
    scores.LivePreviewEmbed += 2;
    scores.ValueReinforcementBlock += 2;
  } else if (pricingModel === "tiered") {
    scores.SideBySideOfferCards += 3;
    scores.BonusStackCTA += 2;
  } else if (pricingModel === "custom-quote") {
    scores.EnterpriseContactBox += 3;
    scores.MultistepCTAStack += 2;
  } else if (pricingModel === "trial-free" || pricingModel === "trial-paid") {
    scores.MockupWithCTA += 3;
    scores.MultistepCTAStack += 2;
  }

  // Pricing Modifier Scoring (Medium Weight: 2-3 points)
  if (pricingModifier === "discount") {
    scores.BonusStackCTA += 3;
    scores.MockupWithCTA += 2;
  } else if (pricingModifier === "money-back") {
    scores.MockupWithCTA += 3;
    scores.BonusStackCTA += 2;
  }

  // Market Sophistication Scoring (Medium Weight: 2-3 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.MockupWithCTA += 3;
    scores.ValueReinforcementBlock += 2;
    scores.LeadMagnetCard += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.SideBySideOfferCards += 3;
    scores.MultistepCTAStack += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.EnterpriseContactBox += 3;
    scores.LivePreviewEmbed += 2;
    scores.MultistepCTAStack += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "bold-persuasive") {
    scores.BonusStackCTA += 3;
    scores.MockupWithCTA += 2;
  } else if (toneProfile === "confident-playful") {
    scores.LivePreviewEmbed += 3;
    scores.SideBySideOfferCards += 2;
  } else if (toneProfile === "friendly-helpful") {
    scores.ValueReinforcementBlock += 3;
    scores.LeadMagnetCard += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.MultistepCTAStack += 3;
    scores.LivePreviewEmbed += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.EnterpriseContactBox += 3;
    scores.SideBySideOfferCards += 2;
  }

  // Startup Stage Scoring (Low Weight: 1-2 points)
  if (startupStageGroup === "idea" || startupStageGroup === "mvp") {
    scores.LeadMagnetCard += 2;
    scores.ValueReinforcementBlock += 1;
  } else if (startupStageGroup === "traction") {
    scores.MockupWithCTA += 2;
    scores.LivePreviewEmbed += 1;
  } else if (startupStageGroup === "growth") {
    scores.SideBySideOfferCards += 2;
    scores.BonusStackCTA += 1;
  } else if (startupStageGroup === "scale") {
    scores.EnterpriseContactBox += 2;
    scores.MultistepCTAStack += 1;
  }

  // Problem Type Scoring (Low Weight: 1-2 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.BonusStackCTA += 2;
    scores.SideBySideOfferCards += 1;
  } else if (problemType === "compliance-or-risk") {
    scores.EnterpriseContactBox += 2;
    scores.MultistepCTAStack += 1;
  } else if (problemType === "creative-empowerment") {
    scores.LivePreviewEmbed += 2;
    scores.MockupWithCTA += 1;
  } else if (problemType === "time-freedom-or-automation") {
    scores.ValueReinforcementBlock += 2;
    scores.LeadMagnetCard += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.LivePreviewEmbed += 2;
    scores.MultistepCTAStack += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.BonusStackCTA += 2;
    scores.SideBySideOfferCards += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.MockupWithCTA += 2;
    scores.LivePreviewEmbed += 1;
  }

  // Pricing Commitment Scoring (Low Weight: 1-2 points)
  if (pricingCommitmentOption === "no-card") {
    scores.LeadMagnetCard += 2;
    scores.ValueReinforcementBlock += 1;
  } else if (pricingCommitmentOption === "card-required" || pricingCommitmentOption === "paid-trial") {
    scores.MultistepCTAStack += 2;
    scores.MockupWithCTA += 1;
  } else if (pricingCommitmentOption === "talk-to-sales") {
    scores.EnterpriseContactBox += 2;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as CloseLayout, score } : max,
    { layout: "MockupWithCTA" as CloseLayout, score: 0 }
  );

  // Return top scoring layout, fallback to universal default
  return topLayout.score > 0 ? topLayout.layout : "MockupWithCTA";
}