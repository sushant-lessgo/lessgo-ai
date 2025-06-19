import type { LayoutPickerInput } from "./layoutPickerInput";

export type UniqueMechanismLayout =
  | "StackedHighlights"
  | "VisualFlywheel"
  | "PillarIcons"
  | "IllustratedModel"
  | "ExplainerWithTags"
  | "ComparisonTable"
  | "PatentStrip"
  | "SingleBigIdea";

/**
 * Selects the optimal Unique Mechanism section layout based on differentiation complexity and technical depth
 * Unique Mechanism sections explain competitive advantage - prioritizes clarity and differentiation
 */
export function pickUniqueMechanismLayout(input: LayoutPickerInput): UniqueMechanismLayout {
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
  
  // 1. Technical products with patent/IP protection
  if (
    (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools" || marketCategory === "Data & Analytics Tools") &&
    (startupStageGroup === "growth" || startupStageGroup === "scale") &&
    (targetAudienceGroup === "builders" || targetAudienceGroup === "enterprise") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "PatentStrip";
  }

  // 2. Complex system/platform products with interconnected components
  if (
    (marketCategory === "Engineering & Development Tools" || marketCategory === "Work & Productivity Tools" || marketCategory === "Data & Analytics Tools") &&
    (targetAudienceGroup === "builders" || targetAudienceGroup === "enterprise") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "VisualFlywheel";
  }

  // 3. Competitive markets needing direct comparison
  if (
    marketSophisticationLevel >= "level-4" &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware") &&
    (targetAudienceGroup === "enterprise" || targetAudienceGroup === "businesses") &&
    (marketCategory === "Marketing & Sales Tools" || marketCategory === "Work & Productivity Tools")
  ) {
    return "ComparisonTable";
  }

  // 4. Simple, focused products with one clear differentiator
  if (
    (startupStageGroup === "idea" || startupStageGroup === "mvp") &&
    marketSophisticationLevel <= "level-2" &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware")
  ) {
    return "SingleBigIdea";
  }

  // 5. Technical products needing detailed explanation
  if (
    (targetAudienceGroup === "builders" || targetAudienceGroup === "enterprise") &&
    (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools") &&
    marketSophisticationLevel >= "level-3" &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  ) {
    return "ExplainerWithTags";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<UniqueMechanismLayout, number> = {
    StackedHighlights: 0,
    VisualFlywheel: 0,
    PillarIcons: 0,
    IllustratedModel: 0,
    ExplainerWithTags: 0,
    ComparisonTable: 0,
    PatentStrip: 0,
    SingleBigIdea: 0,
  };

  // Market Sophistication Scoring (Highest Weight: 4-5 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.SingleBigIdea += 5;
    scores.IllustratedModel += 4;
    scores.PillarIcons += 4;
    scores.StackedHighlights += 3;
  } else if (marketSophisticationLevel === "level-3") {
    scores.StackedHighlights += 4;
    scores.PillarIcons += 4;
    scores.VisualFlywheel += 3;
    scores.ExplainerWithTags += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.ComparisonTable += 5;
    scores.PatentStrip += 5;
    scores.ExplainerWithTags += 4;
    scores.VisualFlywheel += 3;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.SingleBigIdea += 4;
    scores.IllustratedModel += 4;
    scores.PillarIcons += 3;
    scores.StackedHighlights += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.ComparisonTable += 4;
    scores.VisualFlywheel += 4;
    scores.ExplainerWithTags += 3;
    scores.StackedHighlights += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.ExplainerWithTags += 4;
    scores.PatentStrip += 4;
    scores.ComparisonTable += 3;
    scores.VisualFlywheel += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudienceGroup === "enterprise") {
    scores.ComparisonTable += 4;
    scores.PatentStrip += 4;
    scores.VisualFlywheel += 3;
    scores.ExplainerWithTags += 2;
  } else if (targetAudienceGroup === "builders") {
    scores.ExplainerWithTags += 4;
    scores.PatentStrip += 3;
    scores.VisualFlywheel += 3;
    scores.ComparisonTable += 2;
  } else if (targetAudienceGroup === "businesses") {
    scores.StackedHighlights += 4;
    scores.ComparisonTable += 3;
    scores.PillarIcons += 3;
    scores.VisualFlywheel += 2;
  } else if (targetAudienceGroup === "founders" || targetAudienceGroup === "creators") {
    scores.SingleBigIdea += 4;
    scores.IllustratedModel += 4;
    scores.PillarIcons += 3;
    scores.StackedHighlights += 2;
  } else if (targetAudienceGroup === "marketers") {
    scores.StackedHighlights += 4;
    scores.PillarIcons += 3;
    scores.ComparisonTable += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.IllustratedModel += 4;
    scores.SingleBigIdea += 3;
    scores.PillarIcons += 3;
    scores.StackedHighlights += 2;
  } else if (copyIntent === "desire-led") {
    scores.ComparisonTable += 4;
    scores.PatentStrip += 4;
    scores.VisualFlywheel += 3;
    scores.ExplainerWithTags += 3;
  }

  // Market Category Scoring (Medium Weight: 2-3 points)
  if (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools") {
    scores.PatentStrip += 3;
    scores.ExplainerWithTags += 3;
    scores.VisualFlywheel += 2;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.VisualFlywheel += 3;
    scores.ComparisonTable += 3;
    scores.ExplainerWithTags += 2;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.ComparisonTable += 3;
    scores.StackedHighlights += 3;
    scores.PillarIcons += 2;
  } else if (marketCategory === "Work & Productivity Tools") {
    scores.StackedHighlights += 3;
    scores.PillarIcons += 2;
    scores.VisualFlywheel += 2;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.IllustratedModel += 3;
    scores.PillarIcons += 2;
    scores.SingleBigIdea += 2;
  } else if (marketCategory === "No-Code & Low-Code Platforms") {
    scores.VisualFlywheel += 3;
    scores.ExplainerWithTags += 2;
    scores.PillarIcons += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStageGroup === "idea" || startupStageGroup === "mvp") {
    scores.SingleBigIdea += 3;
    scores.IllustratedModel += 3;
    scores.PillarIcons += 2;
  } else if (startupStageGroup === "traction") {
    scores.StackedHighlights += 3;
    scores.PillarIcons += 2;
    scores.VisualFlywheel += 2;
  } else if (startupStageGroup === "growth") {
    scores.ComparisonTable += 3;
    scores.ExplainerWithTags += 2;
    scores.VisualFlywheel += 2;
  } else if (startupStageGroup === "scale") {
    scores.PatentStrip += 3;
    scores.ComparisonTable += 2;
    scores.ExplainerWithTags += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "bold-persuasive") {
    scores.ComparisonTable += 3;
    scores.StackedHighlights += 3;
    scores.PatentStrip += 2;
  } else if (toneProfile === "confident-playful") {
    scores.VisualFlywheel += 3;
    scores.PillarIcons += 2;
    scores.SingleBigIdea += 2;
  } else if (toneProfile === "friendly-helpful") {
    scores.IllustratedModel += 3;
    scores.PillarIcons += 2;
    scores.SingleBigIdea += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.ExplainerWithTags += 3;
    scores.PatentStrip += 2;
    scores.ComparisonTable += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.PatentStrip += 3;
    scores.ComparisonTable += 3;
    scores.ExplainerWithTags += 2;
  }

  // Problem Type Scoring (Low Weight: 1-2 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.ComparisonTable += 2;
    scores.StackedHighlights += 2;
    scores.VisualFlywheel += 1;
  } else if (problemType === "manual-repetition") {
    scores.VisualFlywheel += 2;
    scores.ExplainerWithTags += 1;
  } else if (problemType === "compliance-or-risk") {
    scores.PatentStrip += 2;
    scores.ComparisonTable += 1;
  } else if (problemType === "creative-empowerment") {
    scores.IllustratedModel += 2;
    scores.SingleBigIdea += 1;
  } else if (problemType === "time-freedom-or-automation") {
    scores.VisualFlywheel += 2;
    scores.StackedHighlights += 1;
  } else if (problemType === "professional-image-or-branding") {
    scores.PillarIcons += 2;
    scores.StackedHighlights += 1;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingGoalType === "contact-sales" || landingGoalType === "demo") {
    scores.ComparisonTable += 2;
    scores.PatentStrip += 2;
    scores.ExplainerWithTags += 1;
  } else if (landingGoalType === "buy-now" || landingGoalType === "subscribe") {
    scores.StackedHighlights += 2;
    scores.ComparisonTable += 1;
  } else if (landingGoalType === "free-trial") {
    scores.VisualFlywheel += 2;
    scores.ExplainerWithTags += 1;
  } else if (landingGoalType === "signup") {
    scores.SingleBigIdea += 2;
    scores.PillarIcons += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "custom-quote") {
    scores.PatentStrip += 2;
    scores.ComparisonTable += 1;
  } else if (pricingModel === "free" || pricingModel === "freemium") {
    scores.SingleBigIdea += 2;
    scores.IllustratedModel += 1;
  } else if (pricingModel === "tiered") {
    scores.StackedHighlights += 2;
    scores.PillarIcons += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as UniqueMechanismLayout, score } : max,
    { layout: "StackedHighlights" as UniqueMechanismLayout, score: 0 }
  );

  // Return top scoring layout, fallback to universal default
  return topLayout.score > 0 ? topLayout.layout : "StackedHighlights";
}