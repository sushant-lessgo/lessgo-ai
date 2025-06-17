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

export interface LayoutPickerInput {
  awarenessLevel: AwarenessLevel;
  toneProfile: ToneProfile;
  startupStageGroup: StartupStageGroup;
  marketCategory: MarketCategory;
  landingGoalType: LandingGoalType;
  targetAudienceGroup: TargetAudienceGroup;
  pricingModel: PricingModel;
  pricingModifier: PricingModifier;
  pricingCommitmentOption: PricingCommitmentOption;
  marketSophisticationLevel: MarketSophisticationLevel;
  copyIntent: CopyIntent;
  problemType: ProblemType;
}
