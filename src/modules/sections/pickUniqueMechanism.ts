import type { LayoutPickerInput } from "./layoutPickerInput";

export type UniqueMechanismLayout =
  | "AlgorithmExplainer"
  | "InnovationTimeline"
  | "MethodologyBreakdown"
  | "ProcessFlowDiagram"
  | "PropertyComparisonMatrix"
  | "SecretSauceReveal"
  | "StackedHighlights"
  | "SystemArchitecture"
  | "TechnicalAdvantage";

/**
 * Selects the optimal Unique Mechanism section layout based on differentiation complexity and technical depth
 * Unique Mechanism sections explain competitive advantage - prioritizes clarity and differentiation
 */
export function pickUniqueMechanismLayout(input: LayoutPickerInput): UniqueMechanismLayout {
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
  
  // 1. Technical products with patent/IP protection
  if (
    (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools" || marketCategory === "Data & Analytics Tools") &&
    (startupStage === "growth" || startupStage === "scale") &&
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "SecretSauceReveal";
  }

  // 2. Complex system/platform products with interconnected components
  if (
    (marketCategory === "Engineering & Development Tools" || marketCategory === "Business Productivity Tools" || marketCategory === "Data & Analytics Tools") &&
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "ProcessFlowDiagram";
  }

  // 3. Competitive markets needing direct comparison
  if (
    marketSophisticationLevel >= "level-4" &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware") &&
    (targetAudience === "enterprise" || targetAudience === "businesses") &&
    (marketCategory === "Marketing & Sales Tools" || marketCategory === "Business Productivity Tools")
  ) {
    return "PropertyComparisonMatrix";
  }

  // 4. Simple, focused products with one clear differentiator
  if (
    (startupStage === "idea" || startupStage === "mvp") &&
    marketSophisticationLevel <= "level-2" &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware")
  ) {
    return "TechnicalAdvantage";
  }

  // 5. Technical products needing detailed explanation
  if (
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools") &&
    marketSophisticationLevel >= "level-3" &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  ) {
    return "MethodologyBreakdown";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<UniqueMechanismLayout, number> = {
    AlgorithmExplainer: 0,
    InnovationTimeline: 0,
    MethodologyBreakdown: 0,
    ProcessFlowDiagram: 0,
    PropertyComparisonMatrix: 0,
    SecretSauceReveal: 0,
    StackedHighlights: 0,
    SystemArchitecture: 0,
    TechnicalAdvantage: 0,
  };

  // Market Sophistication Scoring (Highest Weight: 4-5 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.TechnicalAdvantage += 5;
    scores.SystemArchitecture += 4;
    scores.StackedHighlights += 4;
    scores.StackedHighlights += 3;
  } else if (marketSophisticationLevel === "level-3") {
    scores.StackedHighlights += 4;
    scores.StackedHighlights += 4;
    scores.ProcessFlowDiagram += 3;
    scores.MethodologyBreakdown += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.PropertyComparisonMatrix += 5;
    scores.SecretSauceReveal += 5;
    scores.MethodologyBreakdown += 4;
    scores.ProcessFlowDiagram += 3;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.TechnicalAdvantage += 4;
    scores.SystemArchitecture += 4;
    scores.StackedHighlights += 3;
    scores.StackedHighlights += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.PropertyComparisonMatrix += 4;
    scores.ProcessFlowDiagram += 4;
    scores.MethodologyBreakdown += 3;
    scores.StackedHighlights += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.MethodologyBreakdown += 4;
    scores.SecretSauceReveal += 4;
    scores.PropertyComparisonMatrix += 3;
    scores.ProcessFlowDiagram += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudience === "enterprise") {
    scores.PropertyComparisonMatrix += 4;
    scores.SecretSauceReveal += 4;
    scores.ProcessFlowDiagram += 3;
    scores.MethodologyBreakdown += 2;
  } else if (targetAudience === "builders") {
    scores.MethodologyBreakdown += 4;
    scores.SecretSauceReveal += 3;
    scores.ProcessFlowDiagram += 3;
    scores.PropertyComparisonMatrix += 2;
  } else if (targetAudience === "businesses") {
    scores.StackedHighlights += 4;
    scores.PropertyComparisonMatrix += 3;
    scores.StackedHighlights += 3;
    scores.ProcessFlowDiagram += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.TechnicalAdvantage += 4;
    scores.SystemArchitecture += 4;
    scores.StackedHighlights += 3;
    scores.StackedHighlights += 2;
  } else if (targetAudience === "marketers") {
    scores.StackedHighlights += 4;
    scores.StackedHighlights += 3;
    scores.PropertyComparisonMatrix += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.SystemArchitecture += 4;
    scores.TechnicalAdvantage += 3;
    scores.StackedHighlights += 3;
    scores.StackedHighlights += 2;
  } else if (copyIntent === "desire-led") {
    scores.PropertyComparisonMatrix += 4;
    scores.SecretSauceReveal += 4;
    scores.ProcessFlowDiagram += 3;
    scores.MethodologyBreakdown += 3;
  }

  // Market Category Scoring (Medium Weight: 2-3 points)
  if (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools") {
    scores.SecretSauceReveal += 3;
    scores.MethodologyBreakdown += 3;
    scores.ProcessFlowDiagram += 2;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.ProcessFlowDiagram += 3;
    scores.PropertyComparisonMatrix += 3;
    scores.MethodologyBreakdown += 2;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.PropertyComparisonMatrix += 3;
    scores.StackedHighlights += 3;
    scores.StackedHighlights += 2;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.StackedHighlights += 3;
    scores.StackedHighlights += 2;
    scores.ProcessFlowDiagram += 2;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.SystemArchitecture += 3;
    scores.StackedHighlights += 2;
    scores.TechnicalAdvantage += 2;
  } else if (marketCategory === "No-Code & Development Platforms") {
    scores.ProcessFlowDiagram += 3;
    scores.MethodologyBreakdown += 2;
    scores.StackedHighlights += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.TechnicalAdvantage += 3;
    scores.SystemArchitecture += 3;
    scores.StackedHighlights += 2;
  } else if (startupStage === "traction") {
    scores.StackedHighlights += 3;
    scores.StackedHighlights += 2;
    scores.ProcessFlowDiagram += 2;
  } else if (startupStage === "growth") {
    scores.PropertyComparisonMatrix += 3;
    scores.MethodologyBreakdown += 2;
    scores.ProcessFlowDiagram += 2;
  } else if (startupStage === "scale") {
    scores.SecretSauceReveal += 3;
    scores.PropertyComparisonMatrix += 2;
    scores.MethodologyBreakdown += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "bold-persuasive") {
    scores.PropertyComparisonMatrix += 3;
    scores.StackedHighlights += 3;
    scores.SecretSauceReveal += 2;
  } else if (toneProfile === "confident-playful") {
    scores.ProcessFlowDiagram += 3;
    scores.StackedHighlights += 2;
    scores.TechnicalAdvantage += 2;
  } else if (toneProfile === "friendly-helpful") {
    scores.SystemArchitecture += 3;
    scores.StackedHighlights += 2;
    scores.TechnicalAdvantage += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.MethodologyBreakdown += 3;
    scores.SecretSauceReveal += 2;
    scores.PropertyComparisonMatrix += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.SecretSauceReveal += 3;
    scores.PropertyComparisonMatrix += 3;
    scores.MethodologyBreakdown += 2;
  }

  // Problem Type Scoring (Low Weight: 1-2 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.PropertyComparisonMatrix += 2;
    scores.StackedHighlights += 2;
    scores.ProcessFlowDiagram += 1;
  } else if (problemType === "manual-repetition") {
    scores.ProcessFlowDiagram += 2;
    scores.MethodologyBreakdown += 1;
  } else if (problemType === "compliance-or-risk") {
    scores.SecretSauceReveal += 2;
    scores.PropertyComparisonMatrix += 1;
  } else if (problemType === "creative-empowerment") {
    scores.SystemArchitecture += 2;
    scores.TechnicalAdvantage += 1;
  } else if (problemType === "time-freedom-or-automation") {
    scores.ProcessFlowDiagram += 2;
    scores.StackedHighlights += 1;
  } else if (problemType === "professional-image-or-branding") {
    scores.StackedHighlights += 2;
    scores.StackedHighlights += 1;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingPageGoals === "contact-sales" || landingPageGoals === "demo") {
    scores.PropertyComparisonMatrix += 2;
    scores.SecretSauceReveal += 2;
    scores.MethodologyBreakdown += 1;
  } else if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.StackedHighlights += 2;
    scores.PropertyComparisonMatrix += 1;
  } else if (landingPageGoals === "free-trial") {
    scores.ProcessFlowDiagram += 2;
    scores.MethodologyBreakdown += 1;
  } else if (landingPageGoals === "signup") {
    scores.TechnicalAdvantage += 2;
    scores.StackedHighlights += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "custom-quote") {
    scores.SecretSauceReveal += 2;
    scores.PropertyComparisonMatrix += 1;
  } else if (pricingModel === "free" || pricingModel === "freemium") {
    scores.TechnicalAdvantage += 2;
    scores.SystemArchitecture += 1;
  } else if (pricingModel === "tiered") {
    scores.StackedHighlights += 2;
    scores.StackedHighlights += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as UniqueMechanismLayout, score } : max,
    { layout: "StackedHighlights" as UniqueMechanismLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "StackedHighlights";
}