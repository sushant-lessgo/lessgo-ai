import type { LayoutPickerInput } from "./layoutPickerInput";

export type ResultsLayout =
  | "StatBlocks"
  | "BeforeAfterStats"
  | "QuoteWithMetric"
  | "EmojiOutcomeGrid"
  | "TimelineResults"
  | "OutcomeIcons"
  | "StackedWinsList"
  | "PersonaResultPanels";

/**
 * Selects the optimal Results section layout based on proof credibility and outcome visualization needs
 * Results sections demonstrate value and build confidence - prioritizes credibility and outcome clarity
 */
export function pickResultsLayout(input: LayoutPickerInput): ResultsLayout {
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
  
  // 1. Enterprise needs credible customer proof with metrics
  if (
    targetAudience === "enterprise" &&
    (startupStage === "growth" || startupStage === "scale") &&
    marketSophisticationLevel >= "level-4"
  ) {
    return "QuoteWithMetric";
  }

  // 2. Quantifiable business problems need measurable outcomes
  if (
    (problemType === "lost-revenue-or-inefficiency" || problemType === "time-freedom-or-automation") &&
    (targetAudience === "businesses" || targetAudience === "enterprise") &&
    copyIntent === "desire-led"
  ) {
    return "BeforeAfterStats";
  }

  // 3. Process improvement or transformation results
  if (
    (problemType === "manual-repetition" || problemType === "time-freedom-or-automation") &&
    marketSophisticationLevel >= "level-3" &&
    (marketCategory === "Business Productivity Tools" || marketCategory === "Marketing & Sales Tools")
  ) {
    return "TimelineResults";
  }

  // 4. Multiple audience segments with different outcomes
  if (
    marketSophisticationLevel >= "level-3" &&
    (targetAudience === "businesses" || targetAudience === "marketers") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  ) {
    return "PersonaResultPanels";
  }

  // 5. Creative/casual audiences with visual outcomes
  if (
    (targetAudience === "creators" || targetAudience === "founders") &&
    (toneProfile === "friendly-helpful" || toneProfile === "confident-playful") &&
    marketSophisticationLevel <= "level-2"
  ) {
    return "EmojiOutcomeGrid";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<ResultsLayout, number> = {
    StatBlocks: 0,
    BeforeAfterStats: 0,
    QuoteWithMetric: 0,
    EmojiOutcomeGrid: 0,
    TimelineResults: 0,
    OutcomeIcons: 0,
    StackedWinsList: 0,
    PersonaResultPanels: 0,
  };

  // Startup Stage Scoring (Highest Weight: 4-5 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.OutcomeIcons += 4;
    scores.EmojiOutcomeGrid += 4;
    scores.StackedWinsList += 3;
    scores.StatBlocks += 2;
  } else if (startupStage === "traction") {
    scores.StatBlocks += 4;
    scores.BeforeAfterStats += 3;
    scores.StackedWinsList += 3;
    scores.OutcomeIcons += 2;
  } else if (startupStage === "growth") {
    scores.QuoteWithMetric += 5;
    scores.BeforeAfterStats += 4;
    scores.PersonaResultPanels += 4;
    scores.TimelineResults += 3;
  } else if (startupStage === "scale") {
    scores.QuoteWithMetric += 5;
    scores.PersonaResultPanels += 4;
    scores.TimelineResults += 3;
    scores.BeforeAfterStats += 2;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudience === "enterprise") {
    scores.QuoteWithMetric += 4;
    scores.PersonaResultPanels += 4;
    scores.BeforeAfterStats += 3;
    scores.TimelineResults += 2;
  } else if (targetAudience === "builders") {
    scores.StatBlocks += 4;
    scores.BeforeAfterStats += 3;
    scores.TimelineResults += 2;
  } else if (targetAudience === "businesses") {
    scores.BeforeAfterStats += 4;
    scores.PersonaResultPanels += 4;
    scores.QuoteWithMetric += 3;
    scores.StatBlocks += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.EmojiOutcomeGrid += 4;
    scores.StackedWinsList += 4;
    scores.OutcomeIcons += 3;
    scores.StatBlocks += 2;
  } else if (targetAudience === "marketers") {
    scores.PersonaResultPanels += 4;
    scores.BeforeAfterStats += 3;
    scores.TimelineResults += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.StackedWinsList += 4;
    scores.OutcomeIcons += 4;
    scores.EmojiOutcomeGrid += 3;
    scores.StatBlocks += 2;
  } else if (copyIntent === "desire-led") {
    scores.BeforeAfterStats += 4;
    scores.QuoteWithMetric += 4;
    scores.TimelineResults += 4;
    scores.PersonaResultPanels += 3;
  }

  // Problem Type Scoring (High Weight: 3-4 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.BeforeAfterStats += 4;
    scores.QuoteWithMetric += 4;
    scores.StatBlocks += 3;
    scores.PersonaResultPanels += 2;
  } else if (problemType === "time-freedom-or-automation") {
    scores.TimelineResults += 4;
    scores.BeforeAfterStats += 3;
    scores.StackedWinsList += 2;
  } else if (problemType === "manual-repetition") {
    scores.TimelineResults += 4;
    scores.StackedWinsList += 3;
    scores.OutcomeIcons += 2;
  } else if (problemType === "creative-empowerment") {
    scores.EmojiOutcomeGrid += 4;
    scores.OutcomeIcons += 3;
    scores.StackedWinsList += 2;
  } else if (problemType === "burnout-or-overload") {
    scores.StackedWinsList += 4;
    scores.EmojiOutcomeGrid += 3;
    scores.OutcomeIcons += 2;
  } else if (problemType === "compliance-or-risk") {
    scores.QuoteWithMetric += 4;
    scores.PersonaResultPanels += 3;
    scores.StatBlocks += 2;
  } else if (problemType === "professional-image-or-branding") {
    scores.PersonaResultPanels += 4;
    scores.BeforeAfterStats += 3;
    scores.QuoteWithMetric += 2;
  }

  // Market Sophistication Scoring (Medium Weight: 2-3 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.OutcomeIcons += 3;
    scores.EmojiOutcomeGrid += 3;
    scores.StackedWinsList += 3;
    scores.StatBlocks += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.StatBlocks += 3;
    scores.BeforeAfterStats += 3;
    scores.PersonaResultPanels += 2;
    scores.TimelineResults += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.QuoteWithMetric += 3;
    scores.PersonaResultPanels += 3;
    scores.TimelineResults += 3;
    scores.BeforeAfterStats += 2;
  }

  // Awareness Level Scoring (Medium Weight: 2-3 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.OutcomeIcons += 3;
    scores.StackedWinsList += 3;
    scores.EmojiOutcomeGrid += 2;
    scores.StatBlocks += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.PersonaResultPanels += 3;
    scores.BeforeAfterStats += 3;
    scores.TimelineResults += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.QuoteWithMetric += 3;
    scores.TimelineResults += 3;
    scores.BeforeAfterStats += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.EmojiOutcomeGrid += 3;
    scores.OutcomeIcons += 3;
    scores.StackedWinsList += 2;
  } else if (toneProfile === "confident-playful") {
    scores.EmojiOutcomeGrid += 3;
    scores.TimelineResults += 2;
    scores.StackedWinsList += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.BeforeAfterStats += 3;
    scores.StatBlocks += 3;
    scores.QuoteWithMetric += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.StatBlocks += 3;
    scores.BeforeAfterStats += 2;
    scores.TimelineResults += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.QuoteWithMetric += 3;
    scores.PersonaResultPanels += 3;
    scores.TimelineResults += 2;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.BeforeAfterStats += 2;
    scores.QuoteWithMetric += 2;
    scores.StatBlocks += 1;
  } else if (landingPageGoals === "contact-sales" || landingPageGoals === "demo") {
    scores.QuoteWithMetric += 2;
    scores.PersonaResultPanels += 2;
    scores.TimelineResults += 1;
  } else if (landingPageGoals === "free-trial") {
    scores.TimelineResults += 2;
    scores.BeforeAfterStats += 1;
  } else if (landingPageGoals === "signup") {
    scores.StackedWinsList += 2;
    scores.OutcomeIcons += 1;
  } else if (landingPageGoals === "join-community" || landingPageGoals === "waitlist") {
    scores.EmojiOutcomeGrid += 2;
    scores.StackedWinsList += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Marketing & Sales Tools") {
    scores.BeforeAfterStats += 2;
    scores.PersonaResultPanels += 1;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.TimelineResults += 2;
    scores.StackedWinsList += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.EmojiOutcomeGrid += 2;
    scores.OutcomeIcons += 1;
  } else if (marketCategory === "AI Tools" || marketCategory === "Engineering & Development Tools") {
    scores.StatBlocks += 2;
    scores.BeforeAfterStats += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.QuoteWithMetric += 2;
    scores.StatBlocks += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.OutcomeIcons += 2;
    scores.EmojiOutcomeGrid += 1;
  } else if (pricingModel === "custom-quote") {
    scores.QuoteWithMetric += 2;
    scores.PersonaResultPanels += 1;
  } else if (pricingModel === "tiered") {
    scores.PersonaResultPanels += 2;
    scores.BeforeAfterStats += 1;
  } else if (pricingModel === "usage-based") {
    scores.StatBlocks += 2;
    scores.BeforeAfterStats += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as ResultsLayout, score } : max,
    { layout: "StatBlocks" as ResultsLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "StatBlocks";
}