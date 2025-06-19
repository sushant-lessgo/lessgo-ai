import type { LayoutPickerInput } from "./layoutPickerInput";

export type PrimaryCTALayout =
  | "CenteredHeadlineCTA"
  | "CTAWithBadgeRow"
  | "VisualCTAWithMockup"
  | "SideBySideCTA"
  | "CountdownLimitedCTA"
  | "CTAWithFormField"
  | "ValueStackCTA"
  | "TestimonialCTACombo";

/**
 * Selects the optimal Primary CTA section layout based on conversion goals and urgency needs
 * Primary CTA sections are critical conversion points - prioritizes action-driving and friction reduction
 */
export function pickPrimaryCTALayout(input: LayoutPickerInput): PrimaryCTALayout {
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
  
  // 1. Urgent sales with time-sensitive offers
  if (
    (landingGoalType === "buy-now" || landingGoalType === "early-access") &&
    (pricingModifier === "discount" || pricingCommitmentOption === "upfront-payment") &&
    toneProfile === "bold-persuasive"
  ) {
    return "CountdownLimitedCTA";
  }

  // 2. High-value offers with stacked benefits
  if (
    (landingGoalType === "buy-now" || landingGoalType === "subscribe") &&
    toneProfile === "bold-persuasive" &&
    (pricingModel === "tiered" || pricingModel === "flat-monthly")
  ) {
    return "ValueStackCTA";
  }

  // 3. Product demonstration with visual proof
  if (
    (marketCategory === "Design & Creative Tools" || marketCategory === "AI Tools" || marketCategory === "No-Code & Low-Code Platforms") &&
    (landingGoalType === "demo" || landingGoalType === "free-trial") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  ) {
    return "VisualCTAWithMockup";
  }

  // 4. Lead generation with form integration
  if (
    (landingGoalType === "download" || landingGoalType === "waitlist" || landingGoalType === "signup") &&
    (targetAudienceGroup === "enterprise" || pricingCommitmentOption === "no-card") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "CTAWithFormField";
  }

  // 5. Trust-building for established companies
  if (
    (startupStageGroup === "growth" || startupStageGroup === "scale") &&
    (landingGoalType === "contact-sales" || landingGoalType === "buy-now") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "TestimonialCTACombo";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<PrimaryCTALayout, number> = {
    CenteredHeadlineCTA: 0,
    CTAWithBadgeRow: 0,
    VisualCTAWithMockup: 0,
    SideBySideCTA: 0,
    CountdownLimitedCTA: 0,
    CTAWithFormField: 0,
    ValueStackCTA: 0,
    TestimonialCTACombo: 0,
  };

  // Landing Goal Scoring (Highest Weight: 4-5 points)
  if (landingGoalType === "buy-now") {
    scores.ValueStackCTA += 5;
    scores.CountdownLimitedCTA += 4;
    scores.TestimonialCTACombo += 3;
    scores.SideBySideCTA += 2;
  } else if (landingGoalType === "subscribe") {
    scores.ValueStackCTA += 5;
    scores.SideBySideCTA += 4;
    scores.TestimonialCTACombo += 3;
  } else if (landingGoalType === "free-trial") {
    scores.VisualCTAWithMockup += 5;
    scores.SideBySideCTA += 4;
    scores.CenteredHeadlineCTA += 3;
  } else if (landingGoalType === "demo") {
    scores.VisualCTAWithMockup += 5;
    scores.TestimonialCTACombo += 3;
    scores.SideBySideCTA += 2;
  } else if (landingGoalType === "contact-sales" || landingGoalType === "book-call") {
    scores.TestimonialCTACombo += 4;
    scores.CTAWithFormField += 4;
    scores.SideBySideCTA += 3;
  } else if (landingGoalType === "signup") {
    scores.CenteredHeadlineCTA += 4;
    scores.CTAWithFormField += 4;
    scores.CTAWithBadgeRow += 3;
  } else if (landingGoalType === "download" || landingGoalType === "waitlist") {
    scores.CTAWithFormField += 5;
    scores.CenteredHeadlineCTA += 3;
    scores.CTAWithBadgeRow += 2;
  } else if (landingGoalType === "early-access") {
    scores.CountdownLimitedCTA += 5;
    scores.ValueStackCTA += 3;
    scores.CTAWithFormField += 2;
  } else if (landingGoalType === "join-community") {
    scores.CTAWithBadgeRow += 4;
    scores.CenteredHeadlineCTA += 3;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.CenteredHeadlineCTA += 4;
    scores.CTAWithBadgeRow += 3;
    scores.ValueStackCTA += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.SideBySideCTA += 4;
    scores.VisualCTAWithMockup += 3;
    scores.TestimonialCTACombo += 3;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.VisualCTAWithMockup += 4;
    scores.CountdownLimitedCTA += 4;
    scores.ValueStackCTA += 3;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.CenteredHeadlineCTA += 4;
    scores.CTAWithBadgeRow += 3;
    scores.TestimonialCTACombo += 2;
  } else if (copyIntent === "desire-led") {
    scores.ValueStackCTA += 4;
    scores.CountdownLimitedCTA += 4;
    scores.VisualCTAWithMockup += 3;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudienceGroup === "enterprise") {
    scores.TestimonialCTACombo += 4;
    scores.CTAWithFormField += 4;
    scores.SideBySideCTA += 3;
  } else if (targetAudienceGroup === "builders") {
    scores.VisualCTAWithMockup += 4;
    scores.SideBySideCTA += 3;
    scores.CenteredHeadlineCTA += 2;
  } else if (targetAudienceGroup === "businesses") {
    scores.ValueStackCTA += 4;
    scores.TestimonialCTACombo += 3;
    scores.SideBySideCTA += 2;
  } else if (targetAudienceGroup === "founders" || targetAudienceGroup === "creators") {
    scores.CTAWithBadgeRow += 4;
    scores.CenteredHeadlineCTA += 3;
    scores.VisualCTAWithMockup += 2;
  } else if (targetAudienceGroup === "marketers") {
    scores.ValueStackCTA += 4;
    scores.CountdownLimitedCTA += 3;
    scores.SideBySideCTA += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "bold-persuasive") {
    scores.CountdownLimitedCTA += 3;
    scores.ValueStackCTA += 3;
    scores.TestimonialCTACombo += 2;
  } else if (toneProfile === "confident-playful") {
    scores.VisualCTAWithMockup += 3;
    scores.CTAWithBadgeRow += 3;
    scores.CountdownLimitedCTA += 2;
  } else if (toneProfile === "friendly-helpful") {
    scores.CenteredHeadlineCTA += 3;
    scores.CTAWithBadgeRow += 2;
    scores.SideBySideCTA += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.SideBySideCTA += 3;
    scores.CenteredHeadlineCTA += 2;
    scores.CTAWithFormField += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.TestimonialCTACombo += 3;
    scores.SideBySideCTA += 3;
    scores.ValueStackCTA += 2;
  }

  // Market Sophistication Scoring (Medium Weight: 2-3 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.CenteredHeadlineCTA += 3;
    scores.CTAWithBadgeRow += 3;
    scores.ValueStackCTA += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.SideBySideCTA += 3;
    scores.VisualCTAWithMockup += 2;
    scores.TestimonialCTACombo += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.TestimonialCTACombo += 3;
    scores.CTAWithFormField += 3;
    scores.CountdownLimitedCTA += 2;
  }

  // Pricing Modifier Scoring (Medium Weight: 2-3 points)
  if (pricingModifier === "discount") {
    scores.CountdownLimitedCTA += 3;
    scores.ValueStackCTA += 3;
    scores.CTAWithBadgeRow += 2;
  } else if (pricingModifier === "money-back") {
    scores.ValueStackCTA += 3;
    scores.TestimonialCTACombo += 2;
    scores.SideBySideCTA += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStageGroup === "idea" || startupStageGroup === "mvp") {
    scores.CenteredHeadlineCTA += 3;
    scores.CTAWithBadgeRow += 2;
    scores.CTAWithFormField += 2;
  } else if (startupStageGroup === "traction") {
    scores.SideBySideCTA += 3;
    scores.VisualCTAWithMockup += 2;
    scores.CenteredHeadlineCTA += 1;
  } else if (startupStageGroup === "growth") {
    scores.TestimonialCTACombo += 3;
    scores.ValueStackCTA += 2;
    scores.CountdownLimitedCTA += 2;
  } else if (startupStageGroup === "scale") {
    scores.TestimonialCTACombo += 3;
    scores.CTAWithFormField += 2;
    scores.ValueStackCTA += 2;
  }

  // Problem Type Scoring (Low Weight: 1-2 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.ValueStackCTA += 2;
    scores.CountdownLimitedCTA += 2;
    scores.TestimonialCTACombo += 1;
  } else if (problemType === "time-freedom-or-automation") {
    scores.VisualCTAWithMockup += 2;
    scores.SideBySideCTA += 1;
  } else if (problemType === "creative-empowerment") {
    scores.VisualCTAWithMockup += 2;
    scores.CTAWithBadgeRow += 1;
  } else if (problemType === "burnout-or-overload") {
    scores.CenteredHeadlineCTA += 2;
    scores.CTAWithBadgeRow += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Design & Creative Tools") {
    scores.VisualCTAWithMockup += 2;
    scores.CTAWithBadgeRow += 1;
  } else if (marketCategory === "AI Tools") {
    scores.VisualCTAWithMockup += 2;
    scores.CountdownLimitedCTA += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.ValueStackCTA += 2;
    scores.TestimonialCTACombo += 1;
  } else if (marketCategory === "Work & Productivity Tools") {
    scores.SideBySideCTA += 2;
    scores.CenteredHeadlineCTA += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.CenteredHeadlineCTA += 2;
    scores.CTAWithBadgeRow += 1;
  } else if (pricingModel === "tiered") {
    scores.ValueStackCTA += 2;
    scores.SideBySideCTA += 1;
  } else if (pricingModel === "custom-quote") {
    scores.TestimonialCTACombo += 2;
    scores.CTAWithFormField += 1;
  }

  // Pricing Commitment Scoring (Low Weight: 1-2 points)
  if (pricingCommitmentOption === "no-card") {
    scores.CTAWithFormField += 2;
    scores.CenteredHeadlineCTA += 1;
  } else if (pricingCommitmentOption === "card-required") {
    scores.ValueStackCTA += 2;
    scores.TestimonialCTACombo += 1;
  } else if (pricingCommitmentOption === "upfront-payment") {
    scores.CountdownLimitedCTA += 2;
    scores.ValueStackCTA += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as PrimaryCTALayout, score } : max,
    { layout: "CenteredHeadlineCTA" as PrimaryCTALayout, score: 0 }
  );

  // Return top scoring layout, fallback to universal default
  return topLayout.score > 0 ? topLayout.layout : "CenteredHeadlineCTA";
}