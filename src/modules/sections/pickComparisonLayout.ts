import type { LayoutPickerInput } from "./layoutPickerInput";

export type ComparisonLayout =
  | "BasicFeatureGrid"
  | "CheckmarkComparison"
  | "YouVsThemHighlight"
  | "ToggleableComparison"
  | "CompetitorCallouts"
  | "AnimatedUpgradePath"
  | "PersonaUseCaseCompare"
  | "LiteVsProVsEnterprise";

/**
 * Selects the optimal Comparison section layout based on market context and competitive positioning
 * Comparison sections help users understand differentiation - prioritizes clarity and persuasion
 */
export function pickComparisonLayout(input: LayoutPickerInput): ComparisonLayout {
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

  // PHASE 2.4: Flow-aware context fields
  positionInFlow,
  previousSection,
  nextSection,
  flowTone,
} = input;

  // ===== PHASE 2.4: FLOW-AWARE HARD RULES (HIGHEST PRIORITY) =====

  // HR-4.10.1, HR-4.10.2, HR-4.10.3: FORBIDDEN rules moved to scoring
  // These rules discourage comparison in certain contexts but don't prevent it entirely
  // Scoring system provides more nuanced handling than hard blocking

  // ===== EXISTING: High-Priority Rules (Return immediately if matched)
  
  // 1. Internal tiered product comparison (not vs competitors)
  if (
    pricingModel === "tiered" &&
    (targetAudience === "enterprise" || targetAudience === "businesses") &&
    (landingPageGoals === "contact-sales" || landingPageGoals === "demo" || landingPageGoals === "buy-now")
  ) {
    return "LiteVsProVsEnterprise";
  }

  // 2. Complex technical products need interactive comparison
  if (
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    marketSophisticationLevel >= "level-4" &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools")
  ) {
    return "ToggleableComparison";
  }

  // 3. Highly competitive markets need aggressive positioning
  if (
    marketSophisticationLevel >= "level-4" &&
    (marketCategory === "Marketing & Sales Tools" || marketCategory === "Business Productivity Tools") &&
    toneProfile === "bold-persuasive"
  ) {
    return "CompetitorCallouts";
  }

  // 4. Enterprise audiences with complex use cases
  if (
    targetAudience === "enterprise" &&
    marketSophisticationLevel >= "level-4" &&
    (problemType === "compliance-or-risk" || problemType === "lost-revenue-or-inefficiency")
  ) {
    return "PersonaUseCaseCompare";
  }

  // 5. Early stage companies showing evolution/growth path
  if (
    (startupStage === "idea" || startupStage === "mvp") &&
    copyIntent === "desire-led" &&
    (landingPageGoals === "waitlist" || landingPageGoals === "early-access")
  ) {
    return "AnimatedUpgradePath";
  }

  // Medium-Priority Rules (Scoring system)

  const scores: Record<ComparisonLayout, number> = {
    BasicFeatureGrid: 0,
    CheckmarkComparison: 0,
    YouVsThemHighlight: 0,
    ToggleableComparison: 0,
    CompetitorCallouts: 0,
    AnimatedUpgradePath: 0,
    PersonaUseCaseCompare: 0,
    LiteVsProVsEnterprise: 0,
  };

  // ===== PHASE 2.4: FLOW-AWARE SCORING =====

  // FORBIDDEN Context Penalties (applied first)
  // HR-4.10.2: Discourage comparison at MVP/idea stage (no strong positioning yet)
  if (startupStage === 'mvp' || startupStage === 'idea') {
    scores.CompetitorCallouts -= 50;
    scores.YouVsThemHighlight -= 50;
    scores.BasicFeatureGrid += 30;  // Prefer feature showcase
  }

  // HR-4.10.3: Discourage comparison for low-friction goals
  if (landingPageGoals === 'free-trial' || landingPageGoals === 'signup') {
    scores.CompetitorCallouts -= 40;
    scores.YouVsThemHighlight -= 40;
    scores.BasicFeatureGrid += 20;  // Keep it simple
  }

  // Previous Section Context (4 points)
  if (previousSection?.type === 'features' || previousSection?.type === 'uniqueMechanism') {
    // After features: Highlight competitive advantages of those features
    scores.CompetitorCallouts += 4;  // "Unlike competitors, we..."
    scores.YouVsThemHighlight += 4;
    scores.ToggleableComparison += 3;
  } else if (previousSection?.type === 'results') {
    // After results: Compare outcomes, not features
    scores.PersonaUseCaseCompare += 3;
    scores.CheckmarkComparison += 3;
  }

  // Next Section Context (3 points)
  if (nextSection?.type === 'pricing') {
    // Before pricing: Justify value vs alternatives
    scores.LiteVsProVsEnterprise += 3;  // Internal comparison leads to pricing
    scores.YouVsThemHighlight += 3;
    scores.CompetitorCallouts += 2;
  } else if (nextSection?.type === 'testimonial') {
    // Before testimonial: Set up "Here's why people switched"
    scores.YouVsThemHighlight += 3;
    scores.CompetitorCallouts += 2;
  }

  // Flow Tone Adjustments (3 points)
  if (flowTone === 'analytical') {
    scores.ToggleableComparison += 3;  // Data-driven feature comparison
    scores.LiteVsProVsEnterprise += 3;
    scores.PersonaUseCaseCompare += 2;
    scores.AnimatedUpgradePath -= 2;  // Too playful
  } else if (flowTone === 'emotional') {
    scores.YouVsThemHighlight += 3;  // "Finally, a better way"
    scores.AnimatedUpgradePath += 3;
    scores.CompetitorCallouts += 2;
    scores.ToggleableComparison -= 2;  // Too dry
  }

  // Position in Flow (3 points)
  if (positionInFlow !== undefined) {
    if (positionInFlow >= 4 && positionInFlow <= 6) {
      // Middle flow: Optimal comparison placement
      scores.YouVsThemHighlight += 3;
      scores.CompetitorCallouts += 3;
      scores.ToggleableComparison += 2;
    } else if (positionInFlow <= 3) {
      // Early flow: Too early to introduce competitor doubt
      scores.BasicFeatureGrid += 3;  // Focus on your features first
      scores.AnimatedUpgradePath += 2;
      scores.CompetitorCallouts -= 3;  // Don't mention competitors too early
      scores.YouVsThemHighlight -= 2;
    } else if (positionInFlow >= 7) {
      // Late flow: Quick comparison if needed
      scores.CheckmarkComparison += 2;
      scores.BasicFeatureGrid += 2;
    }
  }

  // ===== EXISTING SCORING (PRESERVED) =====

  // Market Sophistication Scoring (Highest Weight: 4-5 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.BasicFeatureGrid += 5;
    scores.CheckmarkComparison += 4;
    scores.AnimatedUpgradePath += 3;
  } else if (marketSophisticationLevel === "level-3") {
    scores.YouVsThemHighlight += 4;
    scores.CheckmarkComparison += 4;
    scores.LiteVsProVsEnterprise += 3;
  } else if (marketSophisticationLevel === "level-4") {
    scores.ToggleableComparison += 5;
    scores.PersonaUseCaseCompare += 4;
    scores.CompetitorCallouts += 3;
  } else if (marketSophisticationLevel === "level-5") {
    scores.CompetitorCallouts += 5;
    scores.PersonaUseCaseCompare += 4;
    scores.ToggleableComparison += 3;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.BasicFeatureGrid += 4;
    scores.AnimatedUpgradePath += 3;
    scores.YouVsThemHighlight += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.CheckmarkComparison += 4;
    scores.YouVsThemHighlight += 4;
    scores.PersonaUseCaseCompare += 3;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.ToggleableComparison += 4;
    scores.CompetitorCallouts += 4;
    scores.LiteVsProVsEnterprise += 3;
  }

  // Target Audience Scoring (High Weight: 3-4 points)
  if (targetAudience === "enterprise") {
    scores.PersonaUseCaseCompare += 4;
    scores.LiteVsProVsEnterprise += 4;
    scores.ToggleableComparison += 3;
  } else if (targetAudience === "builders") {
    scores.ToggleableComparison += 4;
    scores.CompetitorCallouts += 3;
    scores.CheckmarkComparison += 2;
  } else if (targetAudience === "businesses") {
    scores.LiteVsProVsEnterprise += 4;
    scores.YouVsThemHighlight += 3;
    scores.PersonaUseCaseCompare += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.AnimatedUpgradePath += 4;
    scores.BasicFeatureGrid += 3;
    scores.CheckmarkComparison += 2;
  } else if (targetAudience === "marketers") {
    scores.YouVsThemHighlight += 4;
    scores.CompetitorCallouts += 3;
    scores.CheckmarkComparison += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.BasicFeatureGrid += 4;
    scores.YouVsThemHighlight += 3;
    scores.CheckmarkComparison += 2;
  } else if (copyIntent === "desire-led") {
    scores.CompetitorCallouts += 4;
    scores.AnimatedUpgradePath += 4;
    scores.PersonaUseCaseCompare += 3;
  }

  // Pricing Model Scoring (Medium Weight: 2-3 points)
  if (pricingModel === "tiered" || pricingModel === "per-seat") {
    scores.LiteVsProVsEnterprise += 3;
    scores.ToggleableComparison += 2;
  } else if (pricingModel === "freemium") {
    scores.AnimatedUpgradePath += 3;
    scores.CheckmarkComparison += 2;
  } else if (pricingModel === "custom-quote") {
    scores.PersonaUseCaseCompare += 3;
    scores.LiteVsProVsEnterprise += 2;
  } else if (pricingModel === "free") {
    scores.BasicFeatureGrid += 3;
    scores.YouVsThemHighlight += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "bold-persuasive") {
    scores.CompetitorCallouts += 3;
    scores.YouVsThemHighlight += 3;
    scores.AnimatedUpgradePath += 2;
  } else if (toneProfile === "confident-playful") {
    scores.AnimatedUpgradePath += 3;
    scores.ToggleableComparison += 2;
    scores.YouVsThemHighlight += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.ToggleableComparison += 3;
    scores.BasicFeatureGrid += 2;
    scores.CheckmarkComparison += 2;
  } else if (toneProfile === "friendly-helpful") {
    scores.BasicFeatureGrid += 3;
    scores.CheckmarkComparison += 2;
    scores.AnimatedUpgradePath += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.PersonaUseCaseCompare += 3;
    scores.LiteVsProVsEnterprise += 2;
    scores.CompetitorCallouts += 2;
  }

  // Landing Goal Scoring (Medium Weight: 2-3 points)
  if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.LiteVsProVsEnterprise += 3;
    scores.CompetitorCallouts += 2;
  } else if (landingPageGoals === "free-trial" || landingPageGoals === "demo") {
    scores.ToggleableComparison += 3;
    scores.YouVsThemHighlight += 2;
  } else if (landingPageGoals === "contact-sales") {
    scores.PersonaUseCaseCompare += 3;
    scores.LiteVsProVsEnterprise += 2;
  } else if (landingPageGoals === "signup") {
    scores.CheckmarkComparison += 3;
    scores.BasicFeatureGrid += 2;
  } else if (landingPageGoals === "waitlist" || landingPageGoals === "early-access") {
    scores.AnimatedUpgradePath += 3;
    scores.YouVsThemHighlight += 2;
  }

  // Startup Stage Scoring (Low Weight: 1-2 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.AnimatedUpgradePath += 2;
    scores.BasicFeatureGrid += 2;
    scores.YouVsThemHighlight += 1;
  } else if (startupStage === "traction") {
    scores.CheckmarkComparison += 2;
    scores.YouVsThemHighlight += 2;
    scores.ToggleableComparison += 1;
  } else if (startupStage === "growth") {
    scores.CompetitorCallouts += 2;
    scores.LiteVsProVsEnterprise += 2;
    scores.PersonaUseCaseCompare += 1;
  } else if (startupStage === "scale") {
    scores.PersonaUseCaseCompare += 2;
    scores.LiteVsProVsEnterprise += 2;
    scores.CompetitorCallouts += 1;
  }

  // Problem Type Scoring (Low Weight: 1-2 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.CompetitorCallouts += 2;
    scores.PersonaUseCaseCompare += 2;
    scores.YouVsThemHighlight += 1;
  } else if (problemType === "compliance-or-risk") {
    scores.PersonaUseCaseCompare += 2;
    scores.LiteVsProVsEnterprise += 1;
  } else if (problemType === "manual-repetition") {
    scores.AnimatedUpgradePath += 2;
    scores.YouVsThemHighlight += 1;
  } else if (problemType === "creative-empowerment") {
    scores.ToggleableComparison += 2;
    scores.AnimatedUpgradePath += 1;
  }

  // Market Category Scoring (Low Weight: 1-2 points)
  if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.ToggleableComparison += 2;
    scores.CompetitorCallouts += 1;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.CompetitorCallouts += 2;
    scores.YouVsThemHighlight += 2;
    scores.PersonaUseCaseCompare += 1;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.CheckmarkComparison += 2;
    scores.LiteVsProVsEnterprise += 1;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.AnimatedUpgradePath += 2;
    scores.ToggleableComparison += 1;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.PersonaUseCaseCompare += 2;
    scores.ToggleableComparison += 1;
  }

  // Pricing Modifier Scoring (Low Weight: 1-2 points)
  if (pricingModifier === "discount") {
    scores.YouVsThemHighlight += 2;
    scores.CompetitorCallouts += 1;
  } else if (pricingModifier === "money-back") {
    scores.CheckmarkComparison += 2;
    scores.BasicFeatureGrid += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as ComparisonLayout, score } : max,
    { layout: "BasicFeatureGrid" as ComparisonLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "BasicFeatureGrid";
}