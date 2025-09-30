import type { LayoutPickerInput } from "./layoutPickerInput";

export type IntegrationLayout =
  | "LogoGrid"
  | "CategoryAccordion"
  | "InteractiveStackDiagram"
  | "UseCaseTiles"
  | "BadgeCarousel"
  | "TabbyIntegrationCards"
  | "ZapierLikeBuilderPreview"
  | "LogoWithQuoteUse";

/**
 * Selects the optimal Integration section layout based on technical complexity and integration needs
 * Integration sections demonstrate ecosystem connectivity - prioritizes trust and technical capability
 */
export function pickIntegrationLayout(input: LayoutPickerInput): IntegrationLayout {
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
  
  // 1. Complex technical products for developers/enterprise
  if (
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    marketSophisticationLevel >= "level-4" &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools" || marketCategory === "Data & Analytics Tools")
  ) {
    return "InteractiveStackDiagram";
  }

  // 2. No-code/automation platforms showing builder interface
  if (
    (marketCategory === "No-Code & Development Platforms" || marketCategory === "Marketing & Sales Tools") &&
    (targetAudience === "builders" || targetAudience === "marketers") &&
    (landingPageGoals === "demo" || landingPageGoals === "free-trial")
  ) {
    return "ZapierLikeBuilderPreview";
  }

  // 3. Enterprise with social proof and use cases
  if (
    targetAudience === "enterprise" &&
    (startupStage === "growth" || startupStage === "scale") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "LogoWithQuoteUse";
  }

  // 4. Technical setup/implementation focused
  if (
    (targetAudience === "builders" || targetAudience === "enterprise") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware") &&
    (problemType === "manual-repetition" || problemType === "time-freedom-or-automation")
  ) {
    return "TabbyIntegrationCards";
  }

  // 5. Simple trust-building for early stage
  if (
    (startupStage === "idea" || startupStage === "mvp") &&
    marketSophisticationLevel <= "level-2" &&
    (awarenessLevel === "unaware" || awarenessLevel === "problem-aware")
  ) {
    return "LogoGrid";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<IntegrationLayout, number> = {
    LogoGrid: 0,
    CategoryAccordion: 0,
    InteractiveStackDiagram: 0,
    UseCaseTiles: 0,
    BadgeCarousel: 0,
    TabbyIntegrationCards: 0,
    ZapierLikeBuilderPreview: 0,
    LogoWithQuoteUse: 0,
  };

  // Target Audience Scoring (Highest Weight: 4-5 points)
  if (targetAudience === "builders") {
    scores.InteractiveStackDiagram += 5;
    scores.TabbyIntegrationCards += 4;
    scores.ZapierLikeBuilderPreview += 3;
    scores.UseCaseTiles += 2;
  } else if (targetAudience === "enterprise") {
    scores.LogoWithQuoteUse += 5;
    scores.InteractiveStackDiagram += 4;
    scores.UseCaseTiles += 4;
    scores.TabbyIntegrationCards += 3;
  } else if (targetAudience === "businesses") {
    scores.UseCaseTiles += 4;
    scores.CategoryAccordion += 4;
    scores.LogoWithQuoteUse += 3;
    scores.LogoGrid += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.LogoGrid += 4;
    scores.BadgeCarousel += 4;
    scores.CategoryAccordion += 3;
    scores.ZapierLikeBuilderPreview += 2;
  } else if (targetAudience === "marketers") {
    scores.ZapierLikeBuilderPreview += 4;
    scores.UseCaseTiles += 4;
    scores.CategoryAccordion += 3;
    scores.BadgeCarousel += 2;
  }

  // Market Sophistication Scoring (High Weight: 3-4 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.LogoGrid += 4;
    scores.BadgeCarousel += 4;
    scores.CategoryAccordion += 3;
    scores.UseCaseTiles += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.CategoryAccordion += 4;
    scores.UseCaseTiles += 3;
    scores.LogoWithQuoteUse += 3;
    scores.TabbyIntegrationCards += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.InteractiveStackDiagram += 4;
    scores.TabbyIntegrationCards += 4;
    scores.LogoWithQuoteUse += 3;
    scores.ZapierLikeBuilderPreview += 2;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.LogoGrid += 4;
    scores.CategoryAccordion += 4;
    scores.BadgeCarousel += 3;
    scores.UseCaseTiles += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.UseCaseTiles += 4;
    scores.CategoryAccordion += 3;
    scores.ZapierLikeBuilderPreview += 3;
    scores.TabbyIntegrationCards += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.TabbyIntegrationCards += 4;
    scores.InteractiveStackDiagram += 4;
    scores.ZapierLikeBuilderPreview += 3;
    scores.LogoWithQuoteUse += 2;
  }

  // Market Category Scoring (High Weight: 3-4 points)
  if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.InteractiveStackDiagram += 4;
    scores.TabbyIntegrationCards += 3;
    scores.LogoWithQuoteUse += 2;
  } else if (marketCategory === "No-Code & Development Platforms") {
    scores.ZapierLikeBuilderPreview += 4;
    scores.TabbyIntegrationCards += 3;
    scores.BadgeCarousel += 2;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.ZapierLikeBuilderPreview += 4;
    scores.UseCaseTiles += 3;
    scores.CategoryAccordion += 2;
  } else if (marketCategory === "Business Productivity Tools") {
    scores.CategoryAccordion += 4;
    scores.LogoGrid += 3;
    scores.UseCaseTiles += 2;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.InteractiveStackDiagram += 4;
    scores.UseCaseTiles += 3;
    scores.TabbyIntegrationCards += 2;
  }

  // Copy Intent Scoring (Medium Weight: 2-3 points)
  if (copyIntent === "pain-led") {
    scores.CategoryAccordion += 3;
    scores.LogoGrid += 3;
    scores.UseCaseTiles += 2;
  } else if (copyIntent === "desire-led") {
    scores.InteractiveStackDiagram += 3;
    scores.ZapierLikeBuilderPreview += 3;
    scores.LogoWithQuoteUse += 2;
  }

  // Problem Type Scoring (Medium Weight: 2-3 points)
  if (problemType === "manual-repetition") {
    scores.ZapierLikeBuilderPreview += 3;
    scores.TabbyIntegrationCards += 3;
    scores.InteractiveStackDiagram += 2;
  } else if (problemType === "time-freedom-or-automation") {
    scores.ZapierLikeBuilderPreview += 3;
    scores.UseCaseTiles += 2;
  } else if (problemType === "lost-revenue-or-inefficiency") {
    scores.LogoWithQuoteUse += 3;
    scores.UseCaseTiles += 2;
  } else if (problemType === "compliance-or-risk") {
    scores.LogoWithQuoteUse += 3;
    scores.InteractiveStackDiagram += 2;
  } else if (problemType === "creative-empowerment") {
    scores.BadgeCarousel += 3;
    scores.CategoryAccordion += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.LogoGrid += 3;
    scores.BadgeCarousel += 2;
    scores.CategoryAccordion += 2;
  } else if (startupStage === "traction") {
    scores.CategoryAccordion += 3;
    scores.UseCaseTiles += 2;
    scores.TabbyIntegrationCards += 1;
  } else if (startupStage === "growth") {
    scores.LogoWithQuoteUse += 3;
    scores.UseCaseTiles += 2;
    scores.InteractiveStackDiagram += 2;
  } else if (startupStage === "scale") {
    scores.InteractiveStackDiagram += 3;
    scores.LogoWithQuoteUse += 2;
    scores.TabbyIntegrationCards += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.CategoryAccordion += 3;
    scores.LogoGrid += 2;
    scores.BadgeCarousel += 2;
  } else if (toneProfile === "confident-playful") {
    scores.BadgeCarousel += 3;
    scores.ZapierLikeBuilderPreview += 2;
    scores.UseCaseTiles += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.TabbyIntegrationCards += 3;
    scores.InteractiveStackDiagram += 2;
    scores.LogoGrid += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.LogoWithQuoteUse += 3;
    scores.InteractiveStackDiagram += 2;
    scores.UseCaseTiles += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.LogoWithQuoteUse += 3;
    scores.InteractiveStackDiagram += 3;
    scores.TabbyIntegrationCards += 2;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingPageGoals === "demo" || landingPageGoals === "free-trial") {
    scores.ZapierLikeBuilderPreview += 2;
    scores.TabbyIntegrationCards += 2;
    scores.InteractiveStackDiagram += 1;
  } else if (landingPageGoals === "contact-sales") {
    scores.LogoWithQuoteUse += 2;
    scores.UseCaseTiles += 1;
  } else if (landingPageGoals === "signup") {
    scores.CategoryAccordion += 2;
    scores.LogoGrid += 1;
  } else if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.LogoWithQuoteUse += 2;
    scores.UseCaseTiles += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "free" || pricingModel === "freemium") {
    scores.LogoGrid += 2;
    scores.BadgeCarousel += 1;
  } else if (pricingModel === "trial-free" || pricingModel === "trial-paid") {
    scores.ZapierLikeBuilderPreview += 2;
    scores.TabbyIntegrationCards += 1;
  } else if (pricingModel === "custom-quote") {
    scores.LogoWithQuoteUse += 2;
    scores.InteractiveStackDiagram += 1;
  } else if (pricingModel === "tiered") {
    scores.UseCaseTiles += 2;
    scores.CategoryAccordion += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as IntegrationLayout, score } : max,
    { layout: "LogoGrid" as IntegrationLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "LogoGrid";
}