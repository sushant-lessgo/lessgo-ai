// getSectionsFromRules.ts - ✅ FIXED: Uses centralized type structure and objection flow engine
import { getSectionsFromObjectionFlows } from './objectionFlowEngine';
import { logger } from '@/lib/logger';
import type {
  InputVariables,
  HiddenInferredFields,
  FeatureItem,
  AssetAvailability,
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
  assetAvailability?: AssetAvailability | null; // Sprint 7: Asset-aware section selection
};

export function getSectionsFromRules({
  validatedFields,
  hiddenInferredFields,
  featuresFromAI,
  assetAvailability,
}: RuleInput): string[] {
  logger.dev('🔍 Section Rules Debug - Input:', () => ({
    validatedFields,
    hiddenInferredFields,
    featuresCount: featuresFromAI.length
  }));

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
  let selectedSections = getSectionsFromObjectionFlows(flowInput);

  // Sprint 7: HARD EXCLUSIONS - Remove sections that are meaningless without required assets
  if (assetAvailability) {
    logger.dev('🎨 Asset-Aware Section Selection - Applying hard exclusions', () => ({
      assetAvailability,
      sectionsBeforeExclusion: selectedSections
    }));

    // Testimonial section is meaningless without testimonials
    if (!assetAvailability.testimonials) {
      selectedSections = selectedSections.filter(s => s !== 'testimonial');
      logger.dev('❌ Excluded testimonial section (no testimonials available)');
    }

    // Social proof needs either logos OR testimonials to be effective
    if (!assetAvailability.customerLogos && !assetAvailability.testimonials) {
      selectedSections = selectedSections.filter(s => s !== 'socialProof');
      logger.dev('❌ Excluded socialProof section (no logos AND no testimonials)');
    }

    // Integration section only makes sense with partner logos
    if (!assetAvailability.integrationLogos) {
      selectedSections = selectedSections.filter(s => s !== 'integration');
      logger.dev('❌ Excluded integration section (no integration logos)');
    }

    logger.dev('✅ Asset-Aware Section Selection Complete', () => ({
      sectionsAfterExclusion: selectedSections,
      excluded: getSectionsFromObjectionFlows(flowInput).filter(s => !selectedSections.includes(s))
    }));
  }

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
    logger.warn(`⚠️ Unknown startup stage: ${stage}, using fallback: early-feedback`);
    return 'early-feedback';
  }

  return mappedStage;
}