import type { LayoutPickerInput } from "./layoutPickerInput";

export type UseCaseLayout =
  | "PersonaGrid"
  | "TabbedUseCases"
  | "IndustryTiles"
  | "ScenarioCards"
  | "JobToBeDoneList"
  | "SegmentSplitBlocks"
  | "CarouselAvatars"
  | "RoleBenefitMatrix";

/**
 * Selects the optimal UseCase section layout based on audience diversity and application complexity
 * UseCase sections demonstrate versatility and relevance - prioritizes audience identification and application clarity
 */
export function pickUseCaseLayout(input: LayoutPickerInput): UseCaseLayout {
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
  
  // 1. Enterprise with complex role-based applications
  if (
    targetAudienceGroup === "enterprise" &&
    marketSophisticationLevel >= "level-4" &&
    (marketCategory === "Work & Productivity Tools" || marketCategory === "Data & Analytics Tools" || marketCategory === "HR & People Operations Tools")
  ) {
    return "RoleBenefitMatrix";
  }

  // 2. Industry-specific products with vertical applications
  if (
    (marketCategory === "HR & People Operations Tools" || marketCategory === "Finance & Accounting Tools" || marketCategory === "Customer Support & Service Tools") &&
    (targetAudienceGroup === "enterprise" || targetAudienceGroup === "businesses") &&
    marketSophisticationLevel >= "level-3"
  ) {
    return "IndustryTiles";
  }

  // 3. Technical products with specific job functions
  if (
    (targetAudienceGroup === "builders" || targetAudienceGroup === "enterprise") &&
    (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools" || marketCategory === "Data & Analytics Tools") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  ) {
    return "JobToBeDoneList";
  }

  // 4. Multiple distinct audience segments
  if (
    marketSophisticationLevel >= "level-3" &&
    (targetAudienceGroup === "businesses" || targetAudienceGroup === "marketers") &&
    (awarenessLevel === "solution-aware" || awarenessLevel === "product-aware")
  ) {
    return "SegmentSplitBlocks";
  }

  // 5. Simple, visual approach for creators and founders
  if (
    (targetAudienceGroup === "founders" || targetAudienceGroup === "creators") &&
    marketSophisticationLevel <= "level-2" &&
    (toneProfile === "friendly-helpful" || toneProfile === "confident-playful")
  ) {
    return "CarouselAvatars";
  }

  // Medium-Priority Rules (Scoring system)
  
  const scores: Record<UseCaseLayout, number> = {
    PersonaGrid: 0,
    TabbedUseCases: 0,
    IndustryTiles: 0,
    ScenarioCards: 0,
    JobToBeDoneList: 0,
    SegmentSplitBlocks: 0,
    CarouselAvatars: 0,
    RoleBenefitMatrix: 0,
  };

  // Target Audience Scoring (Highest Weight: 4-5 points)
  if (targetAudienceGroup === "enterprise") {
    scores.RoleBenefitMatrix += 5;
    scores.IndustryTiles += 4;
    scores.SegmentSplitBlocks += 4;
    scores.JobToBeDoneList += 3;
  } else if (targetAudienceGroup === "builders") {
    scores.JobToBeDoneList += 4;
    scores.ScenarioCards += 4;
    scores.TabbedUseCases += 3;
    scores.PersonaGrid += 2;
  } else if (targetAudienceGroup === "businesses") {
    scores.IndustryTiles += 4;
    scores.SegmentSplitBlocks += 4;
    scores.PersonaGrid += 3;
    scores.RoleBenefitMatrix += 2;
  } else if (targetAudienceGroup === "founders" || targetAudienceGroup === "creators") {
    scores.CarouselAvatars += 4;
    scores.PersonaGrid += 4;
    scores.TabbedUseCases += 3;
    scores.ScenarioCards += 2;
  } else if (targetAudienceGroup === "marketers") {
    scores.SegmentSplitBlocks += 4;
    scores.ScenarioCards += 4;
    scores.PersonaGrid += 3;
    scores.IndustryTiles += 2;
  }

  // Market Sophistication Scoring (High Weight: 3-4 points)
  if (marketSophisticationLevel === "level-1" || marketSophisticationLevel === "level-2") {
    scores.CarouselAvatars += 4;
    scores.TabbedUseCases += 4;
    scores.PersonaGrid += 3;
    scores.ScenarioCards += 2;
  } else if (marketSophisticationLevel === "level-3") {
    scores.PersonaGrid += 4;
    scores.SegmentSplitBlocks += 3;
    scores.IndustryTiles += 3;
    scores.ScenarioCards += 2;
  } else if (marketSophisticationLevel === "level-4" || marketSophisticationLevel === "level-5") {
    scores.RoleBenefitMatrix += 4;
    scores.JobToBeDoneList += 4;
    scores.IndustryTiles += 3;
    scores.SegmentSplitBlocks += 2;
  }

  // Awareness Level Scoring (High Weight: 3-4 points)
  if (awarenessLevel === "unaware" || awarenessLevel === "problem-aware") {
    scores.TabbedUseCases += 4;
    scores.PersonaGrid += 4;
    scores.CarouselAvatars += 3;
    scores.ScenarioCards += 2;
  } else if (awarenessLevel === "solution-aware") {
    scores.SegmentSplitBlocks += 4;
    scores.IndustryTiles += 4;
    scores.ScenarioCards += 3;
    scores.JobToBeDoneList += 2;
  } else if (awarenessLevel === "product-aware" || awarenessLevel === "most-aware") {
    scores.JobToBeDoneList += 4;
    scores.RoleBenefitMatrix += 4;
    scores.ScenarioCards += 3;
    scores.SegmentSplitBlocks += 2;
  }

  // Copy Intent Scoring (High Weight: 3-4 points)
  if (copyIntent === "pain-led") {
    scores.TabbedUseCases += 4;
    scores.PersonaGrid += 3;
    scores.CarouselAvatars += 3;
    scores.ScenarioCards += 2;
  } else if (copyIntent === "desire-led") {
    scores.SegmentSplitBlocks += 4;
    scores.JobToBeDoneList += 4;
    scores.RoleBenefitMatrix += 3;
    scores.IndustryTiles += 3;
  }

  // Market Category Scoring (Medium Weight: 2-3 points)
  if (marketCategory === "Work & Productivity Tools") {
    scores.RoleBenefitMatrix += 3;
    scores.JobToBeDoneList += 3;
    scores.SegmentSplitBlocks += 2;
  } else if (marketCategory === "Marketing & Sales Tools") {
    scores.SegmentSplitBlocks += 3;
    scores.PersonaGrid += 3;
    scores.ScenarioCards += 2;
  } else if (marketCategory === "Engineering & Development Tools" || marketCategory === "AI Tools") {
    scores.JobToBeDoneList += 3;
    scores.ScenarioCards += 3;
    scores.TabbedUseCases += 2;
  } else if (marketCategory === "Design & Creative Tools") {
    scores.CarouselAvatars += 3;
    scores.PersonaGrid += 2;
    scores.ScenarioCards += 2;
  } else if (marketCategory === "Data & Analytics Tools") {
    scores.RoleBenefitMatrix += 3;
    scores.IndustryTiles += 3;
    scores.JobToBeDoneList += 2;
  } else if (marketCategory === "HR & People Operations Tools" || marketCategory === "Finance & Accounting Tools") {
    scores.IndustryTiles += 3;
    scores.RoleBenefitMatrix += 3;
    scores.SegmentSplitBlocks += 2;
  }

  // Startup Stage Scoring (Medium Weight: 2-3 points)
  if (startupStageGroup === "idea" || startupStageGroup === "mvp") {
    scores.TabbedUseCases += 3;
    scores.CarouselAvatars += 2;
    scores.PersonaGrid += 2;
  } else if (startupStageGroup === "traction") {
    scores.PersonaGrid += 3;
    scores.ScenarioCards += 2;
    scores.SegmentSplitBlocks += 2;
  } else if (startupStageGroup === "growth") {
    scores.SegmentSplitBlocks += 3;
    scores.IndustryTiles += 2;
    scores.RoleBenefitMatrix += 2;
  } else if (startupStageGroup === "scale") {
    scores.RoleBenefitMatrix += 3;
    scores.IndustryTiles += 2;
    scores.JobToBeDoneList += 2;
  }

  // Tone Profile Scoring (Medium Weight: 2-3 points)
  if (toneProfile === "friendly-helpful") {
    scores.CarouselAvatars += 3;
    scores.PersonaGrid += 2;
    scores.TabbedUseCases += 2;
  } else if (toneProfile === "confident-playful") {
    scores.CarouselAvatars += 3;
    scores.ScenarioCards += 2;
    scores.PersonaGrid += 2;
  } else if (toneProfile === "bold-persuasive") {
    scores.SegmentSplitBlocks += 3;
    scores.IndustryTiles += 2;
    scores.ScenarioCards += 2;
  } else if (toneProfile === "minimal-technical") {
    scores.JobToBeDoneList += 3;
    scores.RoleBenefitMatrix += 2;
    scores.TabbedUseCases += 2;
  } else if (toneProfile === "luxury-expert") {
    scores.RoleBenefitMatrix += 3;
    scores.IndustryTiles += 3;
    scores.SegmentSplitBlocks += 2;
  }

  // Problem Type Scoring (Low Weight: 1-2 points)
  if (problemType === "lost-revenue-or-inefficiency") {
    scores.RoleBenefitMatrix += 2;
    scores.SegmentSplitBlocks += 2;
    scores.IndustryTiles += 1;
  } else if (problemType === "manual-repetition") {
    scores.JobToBeDoneList += 2;
    scores.ScenarioCards += 1;
  } else if (problemType === "compliance-or-risk") {
    scores.IndustryTiles += 2;
    scores.RoleBenefitMatrix += 1;
  } else if (problemType === "creative-empowerment") {
    scores.CarouselAvatars += 2;
    scores.PersonaGrid += 1;
  } else if (problemType === "time-freedom-or-automation") {
    scores.JobToBeDoneList += 2;
    scores.SegmentSplitBlocks += 1;
  } else if (problemType === "professional-image-or-branding") {
    scores.PersonaGrid += 2;
    scores.SegmentSplitBlocks += 1;
  }

  // Landing Goal Scoring (Low Weight: 1-2 points)
  if (landingGoalType === "contact-sales" || landingGoalType === "demo") {
    scores.RoleBenefitMatrix += 2;
    scores.IndustryTiles += 2;
    scores.JobToBeDoneList += 1;
  } else if (landingGoalType === "buy-now" || landingGoalType === "subscribe") {
    scores.SegmentSplitBlocks += 2;
    scores.PersonaGrid += 1;
  } else if (landingGoalType === "free-trial") {
    scores.ScenarioCards += 2;
    scores.JobToBeDoneList += 1;
  } else if (landingGoalType === "signup") {
    scores.TabbedUseCases += 2;
    scores.PersonaGrid += 1;
  } else if (landingGoalType === "join-community" || landingGoalType === "waitlist") {
    scores.CarouselAvatars += 2;
    scores.PersonaGrid += 1;
  }

  // Pricing Model Scoring (Low Weight: 1-2 points)
  if (pricingModel === "custom-quote") {
    scores.RoleBenefitMatrix += 2;
    scores.IndustryTiles += 1;
  } else if (pricingModel === "free" || pricingModel === "freemium") {
    scores.CarouselAvatars += 2;
    scores.TabbedUseCases += 1;
  } else if (pricingModel === "tiered") {
    scores.SegmentSplitBlocks += 2;
    scores.PersonaGrid += 1;
  } else if (pricingModel === "per-seat") {
    scores.RoleBenefitMatrix += 2;
    scores.JobToBeDoneList += 1;
  }

  // Find the highest scoring layout
  const topLayout = Object.entries(scores).reduce((max, [layout, score]) => 
    score > max.score ? { layout: layout as UseCaseLayout, score } : max,
    { layout: "PersonaGrid" as UseCaseLayout, score: 0 }
  );

  // Return top scoring layout, fallback to universal default
  return topLayout.score > 0 ? topLayout.layout : "PersonaGrid";
}