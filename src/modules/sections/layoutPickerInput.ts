import type {
  AwarenessLevel,
  ToneProfile,
  StartupStageGroup,
  MarketCategory,
  LandingGoalType,
  TargetAudienceGroup,
  PricingModel,
  PricingModifier,
  PricingCommitmentOption,
  MarketSophisticationLevel,
  CopyIntent,
  ProblemType,
} from "@/modules/inference/taxonomy";

/**
 * ✅ FIXED: Layout picker input interface using canonical field names
 * All field names now match the canonical InputVariables and HiddenInferredFields interfaces
 */
export interface LayoutPickerInput {
  // ===== CORE FIELDS FROM HIDDEN INFERRED FIELDS =====
  awarenessLevel: AwarenessLevel;
  toneProfile: ToneProfile;
  marketSophisticationLevel: MarketSophisticationLevel;
  copyIntent: CopyIntent;
  problemType: ProblemType;
  
  // ===== CORE FIELDS FROM INPUT VARIABLES =====
  marketCategory: MarketCategory;
  startupStage: StartupStageGroup;                    // ✅ FIXED: was 'startupStageGroup'
  landingPageGoals: LandingGoalType;             // ✅ FIXED: was 'landingGoalType'  
  targetAudience: TargetAudienceGroup;               // ✅ FIXED: was 'targetAudienceGroup'
  pricingModel: PricingModel;
  
  // ===== OPTIONAL PRICING FIELDS =====
  pricingModifier?: PricingModifier;
  pricingCommitmentOption?: PricingCommitmentOption;
}