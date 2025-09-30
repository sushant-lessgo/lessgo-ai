import type { LayoutPickerInput } from "./layoutPickerInput";

export type ProblemLayout =
  | "StackedPainBullets"
  | "BeforeImageAfterText"
  // TODO: Temporarily disabled | "SideBySideSplit"
  | "EmotionalQuotes"
  | "CollapsedCards"
  // TODO: Disabled for MVP | "PainMeterChart"
  | "PersonaPanels";
  // TODO: Temporarily disabled - not useful currently | "ProblemChecklist";

/**
 * Selects the optimal Problem section layout based on pain intensity and audience connection needs
 * Problem sections establish pain and create urgency - prioritizes emotional resonance and problem clarity
 */
export function pickProblemLayout(input: LayoutPickerInput): ProblemLayout {
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
  
  // 1. Emotional, personal problems need human connection
  if (
    (problemType === "burnout-or-overload" || problemType === "personal-growth-or-productivity") &&
    copyIntent === "pain-led" &&
    (targetAudience === "founders" || targetAudience === "creators")
  ) {
    return "EmotionalQuotes";
  }

  // 2. Complex business problems for sophisticated audiences
  if (
    (problemType === "compliance-or-risk" || problemType === "lost-revenue-or-inefficiency") &&
    targetAudience === "enterprise" &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "CollapsedCards";
  }

  // 3. Multiple persona types with different pain points
  if (
    marketSophisticationLevel >= "level-3" &&
    (targetAudience === "businesses" || targetAudience === "enterprise") &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware")
  ) {
    return "PersonaPanels";
  }

  // TODO: Disabled for MVP - 4. Quantifiable problems that can be measured
  // if (
  //   (problemType === "lost-revenue-or-inefficiency" || problemType === "time-freedom-or-automation") &&
  //   (targetAudience === "businesses" || targetAudience === "marketers") &&
  //   copyIntent === "pain-led"
  // ) {
  //   return "PainMeterChart";
  // }

  // 5. Visual before/after for creative or design problems
  if (
    (marketCategory === "Design & Creative Tools" || marketCategory === "Marketing & Sales Tools") &&
    (problemType === "creative-empowerment" || problemType === "professional-image-or-branding") &&
    (awarenessLevel === "problem-aware" || awarenessLevel === "solution-aware")
  ) {
    return "BeforeImageAfterText";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<ProblemLayout, number> = {
    StackedPainBullets: 0,
    BeforeImageAfterText: 0,
    // TODO: Temporarily disabled - SideBySideSplit: 0,
    EmotionalQuotes: 0,
    CollapsedCards: 0,
    // TODO: Disabled for MVP - PainMeterChart: 0,
    PersonaPanels: 0,
    // TODO: Temporarily disabled - not useful currently - ProblemChecklist: 0,
  };

  // Copy Intent Scoring (Highest Weight: 4-5 points)
  if (copyIntent === "pain-led") {
    scores.StackedPainBullets += 5;
    scores.EmotionalQuotes += 5;
    // TODO: Disabled for MVP - scores.PainMeterChart += 4;
    scores.PersonaPanels += 4;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 3;
  } else if (copyIntent === "desire-led") {
    // TODO: Temporarily disabled - scores.SideBySideSplit += 4;
    scores.BeforeImageAfterText += 4;
    scores.CollapsedCards += 3;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 3;
  }

  // Problem Type Scoring (High Weight: 3-4 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    // TODO: Disabled for MVP - scores.PainMeterChart += 4;
    scores.StackedPainBullets += 4;
    scores.PersonaPanels += 3;
    scores.CollapsedCards += 2;
  } else if (problemType === "burnout-or-overload") {
    scores.EmotionalQuotes += 4;
    scores.StackedPainBullets += 3;
    // TODO: Disabled for MVP - scores.PainMeterChart += 2;
  } else if (problemType === "manual-repetition") {
    scores.StackedPainBullets += 4;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 3;
    scores.BeforeImageAfterText += 2;
  } else if (problemType === "compliance-or-risk") {
    scores.CollapsedCards += 4;
    scores.PersonaPanels += 3;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 2;
  } else if (problemType === "creative-empowerment") {
    scores.BeforeImageAfterText += 4;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 3;
    scores.EmotionalQuotes += 2;
  } else if (problemType === "time-freedom-or-automation") {
    // TODO: Disabled for MVP - scores.PainMeterChart += 4;
    scores.StackedPainBullets += 3;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 2;
  } else if (problemType === "professional-image-or-branding") {
    scores.BeforeImageAfterText += 4;
    scores.PersonaPanels += 3;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 2;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware") {
    scores.StackedPainBullets += 4;
    scores.PersonaPanels += 4;
    scores.EmotionalQuotes += 3;
    // TODO: Disabled for MVP - scores.PainMeterChart += 2;
  } else if (awarenessLevel === "problem-aware") {
    // TODO: Temporarily disabled - scores.SideBySideSplit += 4;
    scores.BeforeImageAfterText += 4;
    scores.CollapsedCards += 3;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 3;
  } else if (awarenessLevel === "solution-aware") {
    // TODO: Temporarily disabled - scores.ProblemChecklist += 4;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 3;
    scores.CollapsedCards += 3;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.CollapsedCards += 4;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 3;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudience === "enterprise") {
    scores.CollapsedCards += 4;
    scores.PersonaPanels += 4;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 3;
    // TODO: Disabled for MVP - scores.PainMeterChart += 2;
  } else if (targetAudience === "builders") {
    scores.StackedPainBullets += 4;
    scores.CollapsedCards += 3;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 2;
  } else if (targetAudience === "businesses") {
    // TODO: Disabled for MVP - scores.PainMeterChart += 4;
    scores.PersonaPanels += 4;
    scores.StackedPainBullets += 3;
    scores.CollapsedCards += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.EmotionalQuotes += 4;
    scores.StackedPainBullets += 3;
    scores.BeforeImageAfterText += 3;
    scores.PersonaPanels += 2;
  } else if (targetAudience === "marketers") {
    scores.BeforeImageAfterText += 4;
    // TODO: Disabled for MVP - scores.PainMeterChart += 3;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 3;
    scores.PersonaPanels += 2;
  }

  // Market Sophistication Scoring (Medium Weight: 2-3 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.StackedPainBullets += 3;
    scores.EmotionalQuotes += 3;
    scores.BeforeImageAfterText += 2;
    // TODO: Disabled for MVP - scores.PainMeterChart += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.PersonaPanels += 3;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 3;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.CollapsedCards += 3;
    scores.PersonaPanels += 3;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.EmotionalQuotes += 3;
    scores.StackedPainBullets += 3;
    scores.BeforeImageAfterText += 2;
  } else if (toneProfile === "confident-playful") {
    scores.BeforeImageAfterText += 3;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 3;
    // TODO: Disabled for MVP - scores.PainMeterChart += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.StackedPainBullets += 3;
    // TODO: Disabled for MVP - scores.PainMeterChart += 3;
    scores.EmotionalQuotes += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.CollapsedCards += 3;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 2;
    scores.StackedPainBullets += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.PersonaPanels += 3;
    scores.CollapsedCards += 3;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.StackedPainBullets += 3;
    scores.EmotionalQuotes += 2;
    scores.BeforeImageAfterText += 2;
  } else if (startupStage === "traction") {
    scores.PersonaPanels += 3;
    // TODO: Disabled for MVP - scores.PainMeterChart += 2;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 2;
  } else if (startupStage === "growth") {
    scores.CollapsedCards += 3;
    scores.PersonaPanels += 2;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 2;
  } else if (startupStage === "scale") {
    scores.PersonaPanels += 3;
    scores.CollapsedCards += 2;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 2;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Design & Creative Tools") {
    scores.BeforeImageAfterText += 2;
    // TODO: Temporarily disabled - scores.SideBySideSplit += 2;
    scores.EmotionalQuotes += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    // TODO: Disabled for MVP - scores.PainMeterChart += 2;
    scores.BeforeImageAfterText += 2;
    scores.PersonaPanels += 1;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.StackedPainBullets += 2;
    // TODO: Temporarily disabled - scores.ProblemChecklist += 1;
  } else if (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools") {
    scores.CollapsedCards += 2;
    scores.StackedPainBullets += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    // TODO: Disabled for MVP - scores.PainMeterChart += 2;
    scores.CollapsedCards += 1;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    // TODO: Disabled for MVP - scores.PainMeterChart += 2;
    scores.StackedPainBullets += 2;
    scores.EmotionalQuotes += 1;
  } else if (landingPageGoals === "free-trial" || landingPageGoals === "demo") {
    // TODO: Temporarily disabled - scores.SideBySideSplit += 2;
    scores.BeforeImageAfterText += 1;
  } else if (landingPageGoals === "contact-sales") {
    scores.PersonaPanels += 2;
    scores.CollapsedCards += 1;
  } else if (landingPageGoals === "signup" || landingPageGoals === "download") {
    // TODO: Temporarily disabled - scores.ProblemChecklist += 2;
    scores.StackedPainBullets += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.StackedPainBullets += 2;
    scores.EmotionalQuotes += 1;
  } else if (pricingModel === "custom-quote") {
    scores.PersonaPanels += 2;
    scores.CollapsedCards += 1;
  } else if (pricingModel === "tiered") {
    scores.PersonaPanels += 2;
    // TODO: Disabled for MVP - scores.PainMeterChart += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as ProblemLayout, score } : max,
    { layout: "StackedPainBullets" as ProblemLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "StackedPainBullets";
}