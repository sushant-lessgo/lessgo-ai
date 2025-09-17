import type { LayoutPickerInput } from "./layoutPickerInput";

export type UseCaseLayout =
  | "CustomerJourneyFlow"
  | "IndustryUseCaseGrid"
  | "InteractiveUseCaseMap"
  | "PersonaGrid"
  | "RoleBasedScenarios"
  | "UseCaseCarousel"
  | "WorkflowDiagrams";

/**
 * Selects the optimal UseCase section layout based on audience diversity and application complexity
 * UseCase sections demonstrate versatility and relevance - prioritizes audience identification and application clarity
 */
export function pickUseCaseLayout(input: LayoutPickerInput): UseCaseLayout {
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
  
  // 1. Enterprise with complex role-based applications
  if (
    targetAudience === "enterprise" &&
    marketSophisticationLevel >= "level-4" &&
    (marketCategory === "Work & Productivity Tools" || marketCategory === "Data & Analytics Tools" || marketCategory === "HR & People Operations Tools")
  ) {
    return "RoleBasedScenarios";
  }

  // 2. Industry-specific products with vertical applications
  if (
    (marketCategory === "HR & People Operations Tools" || marketCategory === "Finance & Accounting Tools" || marketCategory === "Customer Support & Service Tools") &&
    (targetAudience === "enterprise" || targetAudience === "businesses") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "IndustryUseCaseGrid";
  }

  // 3. Technical products with specific job functions - disabled for now
  // if (
  //   (targetAudience === "builders" || targetAudience === "enterprise") &&
  //   (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools" || marketCategory === "Data & Analytics Tools") &&
  //   (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  // ) {
  //   return "JobToBeDoneList";
  // }

  // 4. Multiple distinct audience segments
  if (
    marketSophisticationLevel >= "level-3" &&
    (targetAudience === "businesses" || targetAudience === "marketers") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  ) {
    return "PersonaGrid";
  }

  // 5. Simple, visual approach for creators and founders
  if (
    (targetAudience === "founders" || targetAudience === "creators") &&
    marketSophisticationLevel <= "level-2" &&
    (toneProfile === "friendly-helpful" || toneProfile === "confident-playful")
  ) {
    return "UseCaseCarousel";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<UseCaseLayout, number> = {
    CustomerJourneyFlow: 0,
    IndustryUseCaseGrid: 0,
    InteractiveUseCaseMap: 0,
    PersonaGrid: 0,
    RoleBasedScenarios: 0,
    UseCaseCarousel: 0,
    WorkflowDiagrams: 0,
  };

  // Target Audience Scoring (Highest Weight: 4-5 points)
  if (targetAudience === "enterprise") {
    scores.RoleBasedScenarios += 5;
    scores.IndustryUseCaseGrid += 4;
    scores.PersonaGrid += 4;
  } else if (targetAudience === "builders") {
    scores.RoleBasedScenarios += 4;
    scores.UseCaseCarousel += 3;
    scores.PersonaGrid += 2;
  } else if (targetAudience === "businesses") {
    scores.IndustryUseCaseGrid += 4;
    scores.PersonaGrid += 4;
    scores.CustomerJourneyFlow += 3;
    scores.RoleBasedScenarios += 2;
  } else if (targetAudience === "founders" || targetAudience === "creators") {
    scores.UseCaseCarousel += 4;
    scores.PersonaGrid += 4;
    scores.WorkflowDiagrams += 3;
    scores.RoleBasedScenarios += 2;
  } else if (targetAudience === "marketers") {
    scores.PersonaGrid += 4;
    scores.RoleBasedScenarios += 4;
    scores.CustomerJourneyFlow += 3;
    scores.IndustryUseCaseGrid += 2;
  }

  // Market Sophistication Scoring (High Weight: 3-4 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.UseCaseCarousel += 4;
    scores.WorkflowDiagrams += 4;
    scores.PersonaGrid += 3;
    scores.RoleBasedScenarios += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.PersonaGrid += 4;
    scores.CustomerJourneyFlow += 3;
    scores.IndustryUseCaseGrid += 3;
    scores.RoleBasedScenarios += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.RoleBasedScenarios += 4;
    scores.IndustryUseCaseGrid += 3;
    scores.PersonaGrid += 2;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.UseCaseCarousel += 4;
    scores.PersonaGrid += 4;
    scores.WorkflowDiagrams += 3;
    scores.RoleBasedScenarios += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.PersonaGrid += 4;
    scores.IndustryUseCaseGrid += 4;
    scores.RoleBasedScenarios += 3;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.RoleBasedScenarios += 4;
    scores.InteractiveUseCaseMap += 3;
    scores.PersonaGrid += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.UseCaseCarousel += 4;
    scores.PersonaGrid += 3;
    scores.WorkflowDiagrams += 3;
    scores.RoleBasedScenarios += 2;
  } else if (copyIntent === "desire-led") {
    scores.PersonaGrid += 4;
    scores.RoleBasedScenarios += 3;
    scores.IndustryUseCaseGrid += 3;
  }

  // Market Category Scoring (Medium Weight: 2-3 points)
  if (marketCategory === "Work & Productivity Tools") {
    scores.RoleBasedScenarios += 3;
    scores.PersonaGrid += 2;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.PersonaGrid += 3;
    scores.CustomerJourneyFlow += 3;
    scores.RoleBasedScenarios += 2;
  } else if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.RoleBasedScenarios += 3;
    scores.WorkflowDiagrams += 2;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.UseCaseCarousel += 3;
    scores.PersonaGrid += 2;
    scores.WorkflowDiagrams += 2;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.RoleBasedScenarios += 3;
    scores.IndustryUseCaseGrid += 3;
  } else if (marketCategory === "HR & People Operations Tools" || marketCategory === "Finance & Accounting Tools") {
    scores.IndustryUseCaseGrid += 3;
    scores.RoleBasedScenarios += 3;
    scores.PersonaGrid += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStage === "idea" || startupStage === "mvp") {
    scores.UseCaseCarousel += 3;
    scores.WorkflowDiagrams += 2;
    scores.PersonaGrid += 2;
  } else if (startupStage === "traction") {
    scores.PersonaGrid += 3;
    scores.RoleBasedScenarios += 2;
    scores.CustomerJourneyFlow += 2;
  } else if (startupStage === "growth") {
    scores.PersonaGrid += 3;
    scores.IndustryUseCaseGrid += 2;
    scores.RoleBasedScenarios += 2;
  } else if (startupStage === "scale") {
    scores.RoleBasedScenarios += 3;
    scores.IndustryUseCaseGrid += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.UseCaseCarousel += 3;
    scores.PersonaGrid += 2;
    scores.WorkflowDiagrams += 2;
  } else if (toneProfile === "confident-playful") {
    scores.UseCaseCarousel += 3;
    scores.RoleBasedScenarios += 2;
    scores.PersonaGrid += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.PersonaGrid += 3;
    scores.IndustryUseCaseGrid += 2;
    scores.RoleBasedScenarios += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.RoleBasedScenarios += 2;
    scores.WorkflowDiagrams += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.RoleBasedScenarios += 3;
    scores.IndustryUseCaseGrid += 3;
    scores.PersonaGrid += 2;
  }

  // Problem Type Scoring (Low Weight: 1-2 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.RoleBasedScenarios += 2;
    scores.PersonaGrid += 2;
    scores.IndustryUseCaseGrid += 1;
  } else if (problemType === "manual-repetition") {
    scores.RoleBasedScenarios += 1;
  } else if (problemType === "compliance-or-risk") {
    scores.IndustryUseCaseGrid += 2;
    scores.RoleBasedScenarios += 1;
  } else if (problemType === "creative-empowerment") {
    scores.UseCaseCarousel += 2;
    scores.PersonaGrid += 1;
  } else if (problemType === "time-freedom-or-automation") {
    scores.WorkflowDiagrams += 1;
  } else if (problemType === "professional-image-or-branding") {
    scores.PersonaGrid += 2;
    scores.CustomerJourneyFlow += 1;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingPageGoals === "contact-sales" || landingPageGoals === "demo") {
    scores.RoleBasedScenarios += 2;
    scores.IndustryUseCaseGrid += 2;
  } else if (landingPageGoals === "buy-now" || landingPageGoals === "subscribe") {
    scores.PersonaGrid += 2;
    scores.CustomerJourneyFlow += 1;
  } else if (landingPageGoals === "free-trial") {
    scores.RoleBasedScenarios += 2;
  } else if (landingPageGoals === "signup") {
    scores.UseCaseCarousel += 2;
    scores.PersonaGrid += 1;
  } else if (landingPageGoals === "join-community" || landingPageGoals === "waitlist") {
    scores.UseCaseCarousel += 2;
    scores.PersonaGrid += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "custom-quote") {
    scores.RoleBasedScenarios += 2;
    scores.IndustryUseCaseGrid += 1;
  } else if (pricingModel === "free" || pricingModel === "freemium") {
    scores.UseCaseCarousel += 2;
    scores.WorkflowDiagrams += 1;
  } else if (pricingModel === "tiered") {
    scores.PersonaGrid += 2;
    scores.CustomerJourneyFlow += 1;
  } else if (pricingModel === "per-seat") {
    scores.RoleBasedScenarios += 2;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as UseCaseLayout, score } : max,
    { layout: "PersonaGrid" as UseCaseLayout, score: 0 }
  );

  // Return top scoring layout, fallback to most universal available layout
  return topLayout.score > 0 ? topLayout.layout : "PersonaGrid";
}