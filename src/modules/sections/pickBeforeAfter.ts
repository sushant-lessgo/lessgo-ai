import type { LayoutPickerInput } from "./layoutPickerInput";

export type BeforeAfterLayout =
  | "SideBySideBlocks"
  | "StackedTextVisual"
  | "BeforeAfterSlider"
  | "SplitCard"
  | "TextListTransformation"
  | "VisualStoryline"
  | "StatComparison"
  | "PersonaJourney";

/**
 * Selects the optimal Before/After layout based on user context and business logic
 * Prioritizes copy-effectiveness and conversion optimization
 */
export function pickBeforeAfterLayout(input: LayoutPickerInput): BeforeAfterLayout {
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

  // PHASE 2.1: Flow-aware context fields
  previousSection,
  flowTone,
  positionInFlow,
} = input;

  // ===== PHASE 2.1: FLOW-AWARE HARD RULES (HIGHEST PRIORITY) =====

  // HR-4.3.1: MVP STAGE = VISION-BASED ONLY
  if (startupStage === 'idea' || startupStage === 'mvp') {
    // No product screenshots exist - use text-based vision
    return "TextListTransformation";
  }

  // HR-4.3.2: After Emotional Problem = RELATABLE TRANSFORMATION
  if (
    previousSection?.type === 'problem' &&
    previousSection?.tone === 'emotional'
  ) {
    // Problem agitated emotionally → BeforeAfter soothes
    // Maintain emotional accessibility
    if (assetAvailability?.productImages) {
      return "VisualStoryline";  // Relatable visual transformation
    }
    return "TextListTransformation";  // Text-based relief
  }

  // HR-4.3.3: After Analytical Problem = STRUCTURED COMPARISON
  if (
    previousSection?.type === 'problem' &&
    previousSection?.tone === 'analytical'
  ) {
    // Analytical problem → Structured transformation
    if (assetAvailability?.productImages) {
      return "StatComparison";  // Data-driven before/after
    }
    return "SideBySideBlocks";  // Structured text comparison
  }

  // ===== EXISTING: High-Priority Rules (Return immediately if matched) =====
  
  // 1. Visual/Interactive layouts for product-aware technical audiences
  if (
    awarenessLevel === "product-aware" &&
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools")
  ) {
    // Technical users appreciate interactive demonstrations
    return "BeforeAfterSlider";
  }

  // 2. Stats-driven layouts for data-focused contexts
  if (
    (problemType === "lost-revenue-or-inefficiency" || problemType === "compliance-or-risk") &&
    (targetAudience === "enterprise" || targetAudience === "businesses") &&
    marketSophisticationLevel >= "level-3"
  ) {
    // Business audiences need quantifiable results
    return "StatComparison";
  }

  // 3. Journey-based layouts for complex enterprise sales
  if (
    targetAudience === "enterprise" &&
    (landingPageGoals === "demo" || landingPageGoals === "contact-sales") &&
    marketSophisticationLevel >= "level-4"
  ) {
    // Enterprise needs to see the complete transformation journey
    return "PersonaJourney";
  }

  // 4. Text-heavy layouts for early awareness stages
  if (
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") &&
    copyIntent === "pain-led" &&
    marketSophisticationLevel <= "level-2"
  ) {
    // Early awareness needs clear, text-focused transformation
    return "TextListTransformation";
  }

  // Medium-Priority Rules (Scoring system)

  const scores: Record<BeforeAfterLayout, number> = {
    SideBySideBlocks: 0,
    StackedTextVisual: 0,
    BeforeAfterSlider: 0,
    SplitCard: 0,
    TextListTransformation: 0,
    VisualStoryline: 0,
    StatComparison: 0,
    PersonaJourney: 0,
  };

  // ===== PHASE 2.1: FLOW-AWARE SCORING =====

  // Previous Section Context Scoring (5 points - HIGHEST)
  if (previousSection?.type === 'problem') {
    // Problem → BeforeAfter pairing rule
    if (previousSection.tone === 'emotional') {
      scores.TextListTransformation += 5;
      scores.VisualStoryline += 5;
      scores.StackedTextVisual += 4;
      scores.StatComparison -= 3;  // Too cold after emotional pain
    } else if (previousSection.tone === 'analytical') {
      scores.StatComparison += 5;
      scores.SideBySideBlocks += 4;
      scores.SplitCard += 4;
    }
  }

  // Flow Tone Adjustments (4 points)
  if (flowTone === 'emotional') {
    scores.TextListTransformation += 4;
    scores.StackedTextVisual += 3;
    scores.VisualStoryline += 3;
    scores.StatComparison -= 2;
  } else if (flowTone === 'analytical') {
    scores.StatComparison += 4;
    scores.PersonaJourney += 3;
    scores.SplitCard += 3;
  }

  // Position in Flow Context (3 points)
  if (positionInFlow !== undefined && positionInFlow <= 4) {
    // Early in flow - sets expectation for proof level
    scores.TextListTransformation += 3;
    scores.SideBySideBlocks += 2;
  }

  // ===== EXISTING SCORING (PRESERVED) =====

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.TextListTransformation += 4;
    scores.StackedTextVisual += 3;
    scores.SplitCard += 3;
    scores.SideBySideBlocks += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.VisualStoryline += 4;
    scores.BeforeAfterSlider += 3;
    scores.PersonaJourney += 3;
    scores.StatComparison += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.BeforeAfterSlider += 4;
    scores.StatComparison += 4;
    scores.PersonaJourney += 3;
    scores.VisualStoryline += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.TextListTransformation += 4;
    scores.SplitCard += 3;
    scores.StackedTextVisual += 3;
    scores.SideBySideBlocks += 2;
  } else if (copyIntent === "desire-led") {
    scores.VisualStoryline += 4;
    scores.StatComparison += 3;
    scores.BeforeAfterSlider += 3;
    scores.PersonaJourney += 2;
  }

  // Target Audience Scoring (Medium Weight: 2-3 points)
  if (targetAudience === "enterprise") {
    scores.PersonaJourney += 3;
    scores.StatComparison += 3;
    scores.SplitCard += 2;
  } else if (targetAudience === "builders") {
    scores.BeforeAfterSlider += 3;
    scores.VisualStoryline += 2;
    scores.StatComparison += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.StackedTextVisual += 3;
    scores.TextListTransformation += 2;
    scores.SideBySideBlocks += 2;
  } else if (targetAudience === "businesses") {
    scores.StatComparison += 3;
    scores.SplitCard += 2;
    scores.PersonaJourney += 2;
  }

  // Market Sophistication Scoring (Medium Weight: 2-3 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.SideBySideBlocks += 3;
    scores.TextListTransformation += 3;
    scores.StackedTextVisual += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.SplitCard += 3;
    scores.VisualStoryline += 2;
    scores.BeforeAfterSlider += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.StatComparison += 3;
    scores.PersonaJourney += 3;
    scores.BeforeAfterSlider += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "confident-playful") {
    scores.BeforeAfterSlider += 3;
    scores.VisualStoryline += 2;
    scores.StackedTextVisual += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.StatComparison += 3;
    scores.SplitCard += 2;
    scores.SideBySideBlocks += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.TextListTransformation += 3;
    scores.StatComparison += 2;
    scores.PersonaJourney += 2;
  } else if (toneProfile === "friendly-helpful") {
    scores.StackedTextVisual += 3;
    scores.SideBySideBlocks += 2;
    scores.TextListTransformation += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.SplitCard += 3;
    scores.PersonaJourney += 2;
    scores.StatComparison += 2;
  }

  // Problem Type Scoring (Medium Weight: 2 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.StatComparison += 2;
    scores.PersonaJourney += 2;
  } else if (problemType === "manual-repetition") {
    scores.TextListTransformation += 2;
    scores.VisualStoryline += 2;
  } else if (problemType === "burnout-or-overload") {
    scores.StackedTextVisual += 2;
    scores.SplitCard += 2;
  } else if (problemType === "creative-empowerment") {
    scores.BeforeAfterSlider += 2;
    scores.VisualStoryline += 2;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools") {
    scores.BeforeAfterSlider += 2;
    scores.VisualStoryline += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.BeforeAfterSlider += 2;
    scores.VisualStoryline += 2;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.StatComparison += 2;
    scores.PersonaJourney += 1;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.TextListTransformation += 1;
    scores.StackedTextVisual += 1;
  }

  // Startup Stage Scoring (Low Weight: 1-2 points)
  // NOTE: MVP stage handled by hard rule above (early return)
  // Scoring now only applies to traction/growth/scale
  if (startupStage === "traction" || startupStage === "growth") {
    scores.StatComparison += 2;
    scores.PersonaJourney += 1;
  } else if (startupStage === "scale") {
    scores.PersonaJourney += 2;
    scores.StatComparison += 1;
  }

  // Landing Goal Scoring (Low Weight: 1 point)
  if (landingPageGoals === "demo" || landingPageGoals === "free-trial") {
    scores.BeforeAfterSlider += 1;
    scores.VisualStoryline += 1;
  } else if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.StatComparison += 1;
    scores.PersonaJourney += 1;
  }

  // Sprint 7: Asset-Aware Scoring Adjustments
  if (assetAvailability && !assetAvailability.productImages) {
    // Penalize visual layouts without product images
    scores.BeforeAfterSlider -= 100;
    scores.VisualStoryline -= 100;
    // Boost text-based fallbacks
    scores.TextListTransformation += 50;
    scores.StatComparison += 30;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as BeforeAfterLayout, score } : max,
    { layout: "SideBySideBlocks" as BeforeAfterLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "SideBySideBlocks";
}