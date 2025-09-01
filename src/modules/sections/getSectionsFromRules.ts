// getSectionsFromRules.ts - ✅ FIXED: Uses centralized type structure and objection flow engine
import { getSectionsFromObjectionFlows } from './objectionFlowEngine';
import type { 
  InputVariables, 
  HiddenInferredFields, 
  FeatureItem,
  AwarenessLevel,
  MarketSophisticationLevel,
  LandingGoalType,
  StartupStage,
  MarketCategory
} from '@/types/core/index';

// ✅ FIXED: Use centralized type interfaces instead of generic Record types
type RuleInput = {
  validatedFields: Partial<InputVariables>;
  hiddenInferredFields: Partial<HiddenInferredFields>;
  featuresFromAI: FeatureItem[];
};

export function getSectionsFromRules({
  validatedFields,
  hiddenInferredFields,
  featuresFromAI,
}: RuleInput): string[] {
  console.log('🔍 Section Rules Debug - Input:', {
    validatedFields,
    hiddenInferredFields,
    featuresCount: featuresFromAI.length
  });

  // ✅ FIXED: Extract fields using canonical field names with proper undefined handling
  const {
    landingPageGoals = "",              // ✅ CANONICAL: landingPageGoals (not landingGoal)
    targetAudience = "",                // ✅ CANONICAL: targetAudience
    pricingModel = "",                  // ✅ CANONICAL: pricingModel
    startupStage = "",                  // ✅ CANONICAL: startupStage
    marketCategory = "",                // ✅ CANONICAL: marketCategory
  } = validatedFields;

  const {
    awarenessLevel = "",                    // ✅ CANONICAL: awarenessLevel
    copyIntent = "",                        // ✅ CANONICAL: copyIntent
    marketSophisticationLevel = "",         // ✅ CANONICAL: marketSophisticationLevel
  } = hiddenInferredFields;

  // ✅ FIXED: Validate required fields for objection flow engine with proper fallbacks
  const validAwarenessLevel = awarenessLevel || "solution-aware";
  const validMarketSophistication = marketSophisticationLevel || "level-3";
  const validLandingGoal = landingPageGoals || "signup";
  const validStartupStage = startupStage || "early-feedback";
  const validMarketCategory = marketCategory || "Software";

  if (!awarenessLevel) {
  }
  
  if (!marketSophisticationLevel) {
  }

  // ✅ FIXED: Prepare input for objection flow engine using proper taxonomy types
  const flowInput = {
    awarenessLevel: validAwarenessLevel as AwarenessLevel,
    marketSophisticationLevel: validMarketSophistication as MarketSophisticationLevel,
    landingGoal: validLandingGoal as LandingGoalType,
    targetAudience: targetAudience || "businesses",
    startupStage: mapToStartupStage(validStartupStage),
    marketCategory: validMarketCategory as MarketCategory
  };


  // ✅ Use objection flow engine
  const selectedSections = getSectionsFromObjectionFlows(flowInput);

  
  return selectedSections;
}

// ✅ FIXED: Helper function with proper return type
function mapToStartupStage(stage: string): StartupStage {
  const stageMapping: Record<string, StartupStage> = {
    'problem-exploration': 'problem-exploration',
    'pre-mvp': 'pre-mvp',
    'mvp-development': 'mvp-development',
    'mvp-launched': 'mvp-launched',
    'early-feedback': 'early-feedback',
    'problem-solution-fit': 'problem-solution-fit',
    'validated-early': 'validated-early',
    'early-monetization': 'early-monetization',
    'building-v2': 'building-v2',
    'targeting-pmf': 'targeting-pmf',
    'users-250-500': 'users-250-500',
    'users-500-1k': 'users-500-1k',
    'users-1k-5k': 'users-1k-5k',
    'mrr-growth': 'mrr-growth',
    'seed-funded': 'seed-funded',
    'series-b': 'series-b',
    'scaling-infra': 'scaling-infra',
    'global-suite': 'global-suite'
  };

  const mappedStage = stageMapping[stage];
  if (!mappedStage) {
    console.warn(`⚠️ Unknown startup stage: ${stage}, using fallback: early-feedback`);
    return 'early-feedback';
  }

  return mappedStage;
}