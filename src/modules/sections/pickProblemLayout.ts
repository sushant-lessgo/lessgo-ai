import type { LayoutPickerInput } from "./layoutPickerInput";

export type ProblemLayout =
  | "StackedPainBullets"
  | "BeforeImageAfterText"
  | "SideBySideSplit"
  | "EmotionalQuotes"
  | "CollapsedCards"
  | "PainMeterChart"
  | "PersonaPanels"
  | "ProblemChecklist";

/**
 * Selects the optimal Problem section layout based on pain intensity and audience connection needs
 * Problem sections establish pain and create urgency - prioritizes emotional resonance and problem clarity
 */
export function pickProblemLayout(input: LayoutPickerInput): ProblemLayout {
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
  
  // 1. Emotional, personal problems need human connection
  if (
    (problemType === "burnout-or-overload" || problemType === "personal-growth-or-productivity") &&
    copyIntent === "pain-led" &&
    (targetAudienceGroup === "founders" || targetAudienceGroup === "creators")
  ) {
    return "EmotionalQuotes";
  }

  // 2. Complex business problems for sophisticated audiences
  if (
    (problemType === "compliance-or-risk" || problemType === "lost-revenue-or-inefficiency") &&
    targetAudienceGroup === "enterprise" &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "CollapsedCards";
  }

  // 3. Multiple persona types with different pain points
  if (
    marketSophisticationLevel >= "level-3" &&
    (targetAudienceGroup === "businesses" || targetAudienceGroup === "enterprise") &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware")
  ) {
    return "PersonaPanels";
  }

  // 4. Quantifiable problems that can be measured
  if (
    (problemType === "lost-revenue-or-inefficiency" || problemType === "time-freedom-or-automation") &&
    (targetAudienceGroup === "businesses" || targetAudienceGroup === "marketers") &&
    copyIntent === "pain-led"
  ) {
    return "PainMeterChart";
  }

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
    SideBySideSplit: 0,
    EmotionalQuotes: 0,
    CollapsedCards: 0,
    PainMeterChart: 0,
    PersonaPanels: 0,
    ProblemChecklist: 0,
  };

  // Copy Intent Scoring (Highest Weight: 4-5 points)
  if (copyIntent === "pain-led") {
    scores.StackedPainBullets += 5;
    scores.EmotionalQuotes += 5;
    scores.PainMeterChart += 4;
    scores.PersonaPanels += 4;
    scores.ProblemChecklist += 3;
  } else if (copyIntent === "desire-led") {
    scores.SideBySideSplit += 4;
    scores.BeforeImageAfterText += 4;
    scores.CollapsedCards += 3;
    scores.ProblemChecklist += 3;
  }

  // Problem Type Scoring (High Weight: 3-4 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.PainMeterChart += 4;
    scores.StackedPainBullets += 4;
    scores.PersonaPanels += 3;
    scores.CollapsedCards += 2;
  } else if (problemType === "burnout-or-overload") {
    scores.EmotionalQuotes += 4;
    scores.StackedPainBullets += 3;
    scores.PainMeterChart += 2;
  } else if (problemType === "manual-repetition") {
    scores.StackedPainBullets += 4;
    scores.ProblemChecklist += 3;
    scores.BeforeImageAfterText += 2;
  } else if (problemType === "compliance-or-risk") {
    scores.CollapsedCards += 4;
    scores.PersonaPanels += 3;
    scores.ProblemChecklist += 2;
  } else if (problemType === "creative-empowerment") {
    scores.BeforeImageAfterText += 4;
    scores.SideBySideSplit += 3;
    scores.EmotionalQuotes += 2;
  } else if (problemType === "time-freedom-or-automation") {
    scores.PainMeterChart += 4;
    scores.StackedPainBullets += 3;
    scores.SideBySideSplit += 2;
  } else if (problemType === "professional-image-or-branding") {
    scores.BeforeImageAfterText += 4;
    scores.PersonaPanels += 3;
    scores.SideBySideSplit += 2;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware") {
    scores.StackedPainBullets += 4;
    scores.PersonaPanels += 4;
    scores.EmotionalQuotes += 3;
    scores.PainMeterChart += 2;
  } else if (awarenessLevel === "problem-aware") {
    scores.SideBySideSplit += 4;
    scores.BeforeImageAfterText += 4;
    scores.CollapsedCards += 3;
    scores.ProblemChecklist += 3;
  } else if (awarenessLevel === "solution-aware") {
    scores.ProblemChecklist += 4;
    scores.SideBySideSplit += 3;
    scores.CollapsedCards += 3;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.CollapsedCards += 4;
    scores.ProblemChecklist += 3;
    scores.SideBySideSplit += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudienceGroup === "enterprise") {
    scores.CollapsedCards += 4;
    scores.PersonaPanels += 4;
    scores.ProblemChecklist += 3;
    scores.PainMeterChart += 2;
  } else if (targetAudienceGroup === "builders") {
    scores.StackedPainBullets += 4;
    scores.CollapsedCards += 3;
    scores.ProblemChecklist += 2;
  } else if (targetAudienceGroup === "businesses") {
    scores.PainMeterChart += 4;
    scores.PersonaPanels += 4;
    scores.StackedPainBullets += 3;
    scores.CollapsedCards += 2;
  } else if (targetAudienceGroup === "founders" || targetAudienceGroup === "creators") {
    scores.EmotionalQuotes += 4;
    scores.StackedPainBullets += 3;
    scores.BeforeImageAfterText += 3;
    scores.PersonaPanels += 2;
  } else if (targetAudienceGroup === "marketers") {
    scores.BeforeImageAfterText += 4;
    scores.PainMeterChart += 3;
    scores.SideBySideSplit += 3;
    scores.PersonaPanels += 2;
  }

  // Market Sophistication Scoring (Medium Weight: 2-3 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.StackedPainBullets += 3;
    scores.EmotionalQuotes += 3;
    scores.BeforeImageAfterText += 2;
    scores.PainMeterChart += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.PersonaPanels += 3;
    scores.SideBySideSplit += 3;
    scores.ProblemChecklist += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.CollapsedCards += 3;
    scores.PersonaPanels += 3;
    scores.ProblemChecklist += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.EmotionalQuotes += 3;
    scores.StackedPainBullets += 3;
    scores.BeforeImageAfterText += 2;
  } else if (toneProfile === "confident-playful") {
    scores.BeforeImageAfterText += 3;
    scores.SideBySideSplit += 3;
    scores.PainMeterChart += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.StackedPainBullets += 3;
    scores.PainMeterChart += 3;
    scores.EmotionalQuotes += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.CollapsedCards += 3;
    scores.ProblemChecklist += 2;
    scores.StackedPainBullets += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.PersonaPanels += 3;
    scores.CollapsedCards += 3;
    scores.SideBySideSplit += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStageGroup === "idea" || startupStageGroup === "mvp") {
    scores.StackedPainBullets += 3;
    scores.EmotionalQuotes += 2;
    scores.BeforeImageAfterText += 2;
  } else if (startupStageGroup === "traction") {
    scores.PersonaPanels += 3;
    scores.PainMeterChart += 2;
    scores.SideBySideSplit += 2;
  } else if (startupStageGroup === "growth") {
    scores.CollapsedCards += 3;
    scores.PersonaPanels += 2;
    scores.ProblemChecklist += 2;
  } else if (startupStageGroup === "scale") {
    scores.PersonaPanels += 3;
    scores.CollapsedCards += 2;
    scores.ProblemChecklist += 2;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Design & Creative Tools") {
    scores.BeforeImageAfterText += 2;
    scores.SideBySideSplit += 2;
    scores.EmotionalQuotes += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.PainMeterChart += 2;
    scores.BeforeImageAfterText += 2;
    scores.PersonaPanels += 1;
  } else if (marketCategory === "Work & Productivity Tools") {
    scores.StackedPainBullets += 2;
    scores.ProblemChecklist += 1;
  } else if (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools") {
    scores.CollapsedCards += 2;
    scores.StackedPainBullets += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.PainMeterChart += 2;
    scores.CollapsedCards += 1;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingGoalType === "buy-now" || landingGoalType === "subscribe") {
    scores.PainMeterChart += 2;
    scores.StackedPainBullets += 2;
    scores.EmotionalQuotes += 1;
  } else if (landingGoalType === "free-trial" || landingGoalType === "demo") {
    scores.SideBySideSplit += 2;
    scores.BeforeImageAfterText += 1;
  } else if (landingGoalType === "contact-sales") {
    scores.PersonaPanels += 2;
    scores.CollapsedCards += 1;
  } else if (landingGoalType === "signup" || landingGoalType === "download") {
    scores.ProblemChecklist += 2;
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
    scores.PainMeterChart += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as ProblemLayout, score } : max,
    { layout: "StackedPainBullets" as ProblemLayout, score: 0 }
  );

  // Return top scoring layout, fallback to universal default
  return topLayout.score > 0 ? topLayout.layout : "StackedPainBullets";
}