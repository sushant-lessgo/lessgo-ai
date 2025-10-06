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
    console.log('🎨 [ASSET-DEBUG] Asset-Aware Section Selection - Starting', {
      assetAvailability,
      sectionsBeforeExclusion: selectedSections,
      hasTestimonials: assetAvailability.testimonials,
      hasCustomerLogos: assetAvailability.customerLogos,
      hasIntegrationLogos: assetAvailability.integrationLogos,
      hasProductImages: assetAvailability.productImages,
      hasFounderPhoto: assetAvailability.founderPhoto,
      hasDemoVideo: assetAvailability.demoVideo
    });

    logger.dev('🎨 Asset-Aware Section Selection - Applying hard exclusions', () => ({
      assetAvailability,
      sectionsBeforeExclusion: selectedSections
    }));

    const beforeLength = selectedSections.length;

    // Testimonial section is meaningless without testimonials
    if (!assetAvailability.testimonials) {
      const beforeFilter = [...selectedSections];
      selectedSections = selectedSections.filter(s => s !== 'testimonials');
      const wasFiltered = beforeFilter.length !== selectedSections.length;

      console.log('❌ [ASSET-DEBUG] Testimonial exclusion check:', {
        hasTestimonials: assetAvailability.testimonials,
        beforeFilter,
        afterFilter: selectedSections,
        wasFiltered,
        shouldHaveFiltered: beforeFilter.includes('testimonials')
      });

      logger.dev('❌ Excluded testimonials section (no testimonials available)');
    } else {
      console.log('✅ [ASSET-DEBUG] Testimonials available, keeping section if present');
    }

    // Social proof needs either logos OR testimonials to be effective
    if (!assetAvailability.customerLogos && !assetAvailability.testimonials) {
      const beforeFilter = [...selectedSections];
      selectedSections = selectedSections.filter(s => s !== 'socialProof');
      const wasFiltered = beforeFilter.length !== selectedSections.length;

      console.log('❌ [ASSET-DEBUG] Social proof exclusion check:', {
        hasCustomerLogos: assetAvailability.customerLogos,
        hasTestimonials: assetAvailability.testimonials,
        beforeFilter,
        afterFilter: selectedSections,
        wasFiltered,
        shouldHaveFiltered: beforeFilter.includes('socialProof')
      });

      logger.dev('❌ Excluded socialProof section (no logos AND no testimonials)');
    } else {
      console.log('✅ [ASSET-DEBUG] Social proof has assets (logos or testimonials), keeping section if present');
    }

    // Integration section only makes sense with partner logos
    if (!assetAvailability.integrationLogos) {
      const beforeFilter = [...selectedSections];
      selectedSections = selectedSections.filter(s => s !== 'integrations');
      const wasFiltered = beforeFilter.length !== selectedSections.length;

      console.log('❌ [ASSET-DEBUG] Integration exclusion check:', {
        hasIntegrationLogos: assetAvailability.integrationLogos,
        beforeFilter,
        afterFilter: selectedSections,
        wasFiltered,
        shouldHaveFiltered: beforeFilter.includes('integrations')
      });

      logger.dev('❌ Excluded integrations section (no integration logos)');
    } else {
      console.log('✅ [ASSET-DEBUG] Integration logos available, keeping section if present');
    }

    const afterLength = selectedSections.length;
    const excludedCount = beforeLength - afterLength;

    console.log('✅ [ASSET-DEBUG] Asset-Aware Section Selection Complete', {
      sectionsAfterExclusion: selectedSections,
      excluded: getSectionsFromObjectionFlows(flowInput).filter(s => !selectedSections.includes(s)),
      excludedCount,
      beforeLength,
      afterLength
    });

    logger.dev('✅ Asset-Aware Section Selection Complete', () => ({
      sectionsAfterExclusion: selectedSections,
      excluded: getSectionsFromObjectionFlows(flowInput).filter(s => !selectedSections.includes(s))
    }));
  } else {
    console.log('⚠️ [ASSET-DEBUG] No assetAvailability provided, skipping asset-based exclusions');
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