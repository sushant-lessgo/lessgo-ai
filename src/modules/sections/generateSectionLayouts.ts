import { layoutPickers } from "./layoutPickers";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import type { LayoutPickerInput } from "./layoutPickerInput";
import { getAudienceGroupForAudience, getStageGroupForStage } from '@/modules/inference/taxonomy';
import type { EditStoreInstance } from '@/stores/editStore';

import { logger } from '@/lib/logger';
// Helper function to get fallback layouts for sections
function getSectionFallback(sectionId: string): string {
  const sectionFallbacks: Record<string, string> = {
    header: "NavWithCTAHeader",
    beforeAfter: "SideBySideBlocks",
    closeSection: "MockupWithCTA", 
    comparisonTable: "BasicFeatureGrid",
    faq: "AccordionFAQ",
    features: "IconGrid",
    founderNote: "FounderCardWithQuote",
    hero: "leftCopyRightImage",
    howItWorks: "ThreeStepHorizontal",
    integrations: "LogoGrid",
    objectionHandling: "ObjectionAccordion",
    pricing: "TierCards",
    cta: "CenteredHeadlineCTA",
    problem: "StackedPainBullets",
    results: "StatBlocks",
    security: "SecurityChecklist",
    socialProof: "LogoWall",
    testimonials: "QuoteGrid",
    uniqueMechanism: "StackedHighlights",
    useCases: "PersonaGrid",
    footer: "MultiColumnFooter",
  };
  
  return sectionFallbacks[sectionId] || "IconGrid"; // Ultimate fallback
}


export function generateSectionLayouts(sectionIds: string[], editStore?: EditStoreInstance) {
  const onboarding = useOnboardingStore.getState();
  
  // Get setSectionLayouts function
  const setSectionLayouts = editStore 
    ? editStore.getState().setSectionLayouts
    : (() => {
        logger.warn('⚠️ No editStore provided to generateSectionLayouts, layouts will not be saved');
        return () => {};
      })();

  logger.debug('🎨 Generating layouts for sections:', sectionIds);
  logger.debug('📊 Onboarding data available:', {
    validatedFields: Object.keys(onboarding.validatedFields),
    hiddenInferredFields: Object.keys(onboarding.hiddenInferredFields),
    validatedFieldsValues: onboarding.validatedFields,
    hiddenInferredFieldsValues: onboarding.hiddenInferredFields
  });

  // ✅ FIXED: Map all required fields using canonical field names from onboarding store
  const input: LayoutPickerInput = {
    // ===== CORE FIELDS FROM HIDDEN INFERRED FIELDS =====
    awarenessLevel: onboarding.hiddenInferredFields.awarenessLevel as LayoutPickerInput["awarenessLevel"],
    toneProfile: onboarding.hiddenInferredFields.toneProfile as LayoutPickerInput["toneProfile"],
    marketSophisticationLevel: onboarding.hiddenInferredFields.marketSophisticationLevel as LayoutPickerInput["marketSophisticationLevel"],
    copyIntent: onboarding.hiddenInferredFields.copyIntent as LayoutPickerInput["copyIntent"],
    problemType: onboarding.hiddenInferredFields.problemType as LayoutPickerInput["problemType"],
    
    // ===== CORE FIELDS FROM VALIDATED FIELDS (✅ FIXED: Use canonical field names) =====
    marketCategory: onboarding.validatedFields.marketCategory as LayoutPickerInput["marketCategory"],
    startupStage: getStageGroupForStage(onboarding.validatedFields.startupStage ?? '') ?? 'idea',
    landingPageGoals: onboarding.validatedFields.landingPageGoals as LayoutPickerInput["landingPageGoals"], // ✅ FIXED: was 'landingGoal'
   targetAudience: getAudienceGroupForAudience(onboarding.validatedFields.targetAudience ?? '') ?? 'founders',
    pricingModel: onboarding.validatedFields.pricingModel as LayoutPickerInput["pricingModel"],
    
    // ===== OPTIONAL PRICING FIELDS =====
    // These might not be in the current onboarding store, but interface supports them
    pricingModifier: undefined, // Can be added when this data becomes available
    pricingCommitmentOption: undefined, // Can be added when this data becomes available
  };

  logger.debug('🎯 Layout picker input prepared:', input);

  const layouts: Record<string, string> = {};

  sectionIds.forEach((sectionId) => {
    logger.debug(`🔍 Processing section: "${sectionId}" (type: ${typeof sectionId})`);
    
    // Use intelligent layout picker functions that select from all 148+ available layouts
    const picker = layoutPickers[sectionId];
    if (picker) {
      try {
        const selectedLayout = picker(input);
        if (selectedLayout && selectedLayout !== 'default') {
          layouts[sectionId] = selectedLayout;
          logger.debug(`✅ Smart layout selected for ${sectionId}:`, layouts[sectionId]);
        } else {
          logger.warn(`⚠️ Layout picker returned invalid layout for ${sectionId}:`, selectedLayout);
          layouts[sectionId] = getSectionFallback(sectionId);
          logger.debug(`🔧 Using fallback layout for ${sectionId}:`, layouts[sectionId]);
        }
      } catch (error) {
        logger.error(`❌ Layout picker error for ${sectionId}:`, error);
        layouts[sectionId] = getSectionFallback(sectionId);
        logger.debug(`🔧 Using fallback layout for ${sectionId}:`, layouts[sectionId]);
      }
    } else {
      // If section is not in layoutPickers, use the most universal layout for that section type
      logger.warn(`⚠️ No layout picker found for section: ${sectionId}`);
      
      // Use section-specific fallback 
      layouts[sectionId] = getSectionFallback(sectionId);
      logger.debug(`🔧 Section-specific fallback layout assigned for ${sectionId}:`, layouts[sectionId]);
    }
  });

  logger.debug('🎨 Final layout assignments:', layouts);
  logger.debug('🎨 About to call setSectionLayouts with:', {
    layoutCount: Object.keys(layouts).length,
    heroLayout: layouts.hero,
    allLayouts: Object.entries(layouts).map(([section, layout]) => `${section}: ${layout}`)
  });
  setSectionLayouts(layouts);
  logger.debug('🎨 setSectionLayouts called successfully');
}