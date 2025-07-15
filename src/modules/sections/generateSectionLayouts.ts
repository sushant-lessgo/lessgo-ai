import { layoutPickers } from "./layoutPickers";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { useEditStore } from "@/hooks/useEditStore";
import type { LayoutPickerInput } from "./layoutPickerInput";
import { getAudienceGroupForAudience, getStageGroupForStage } from '@/modules/inference/taxonomy';


export function generateSectionLayouts(sectionIds: string[]) {
  const onboarding = useOnboardingStore.getState();
  const setSectionLayouts = useEditStore.getState().setSectionLayouts;

  console.log('🎨 Generating layouts for sections:', sectionIds);
  console.log('📊 Onboarding data available:', {
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

  console.log('🎯 Layout picker input prepared:', input);

  const layouts: Record<string, string> = {};

  sectionIds.forEach((sectionId) => {
    console.log(`🔍 Processing section: "${sectionId}" (type: ${typeof sectionId})`);
    
    // ✅ READY: Uncomment this once all layoutPickers use the fixed LayoutPickerInput interface
    // const picker = layoutPickers[sectionId];
    // if (picker) {
    //   layouts[sectionId] = picker(input);
    //   console.log(`✅ Layout selected for ${sectionId}:`, layouts[sectionId]);
    // } else {
      
    // ✅ TEMPORARY: Fallback layouts while layoutPickers are being updated to use canonical field names
    const fallbackLayouts: Record<string, string> = {
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
    };
    
    console.log(`🔎 Checking fallback for "${sectionId}":`, {
      sectionId,
      sectionIdLength: sectionId.length,
      sectionIdCharCodes: Array.from(sectionId).map(c => c.charCodeAt(0)),
      hasInFallback: sectionId in fallbackLayouts,
      fallbackValue: fallbackLayouts[sectionId],
      directLookup: fallbackLayouts[sectionId] !== undefined,
      relevantKeys: Object.keys(fallbackLayouts).filter(key => 
        key.includes('before') || key.includes('unique') || key.includes('how') || key.includes('social')
      )
    });
    
    // ✅ FIXED: Ensure every section gets a valid layout
    if (fallbackLayouts[sectionId]) {
      layouts[sectionId] = fallbackLayouts[sectionId];
      console.log(`📐 Fallback layout assigned for ${sectionId}:`, layouts[sectionId], `(from fallback: ${fallbackLayouts[sectionId]})`);
    } else {
      // If section is not in fallback list, log warning and assign a contextual layout
      console.warn(`⚠️ No layout mapping found for section: ${sectionId}`);
      
      // Assign contextual fallback based on section name patterns
      if (sectionId.includes('hero')) {
        layouts[sectionId] = "leftCopyRightImage";
      } else if (sectionId.includes('cta') || sectionId.includes('call')) {
        layouts[sectionId] = "CenteredHeadlineCTA";
      } else if (sectionId.includes('feature')) {
        layouts[sectionId] = "IconGrid";
      } else if (sectionId.includes('testimonial') || sectionId.includes('review')) {
        layouts[sectionId] = "QuoteGrid";
      } else if (sectionId.includes('pricing') || sectionId.includes('plan')) {
        layouts[sectionId] = "TierCards";
      } else if (sectionId.includes('faq') || sectionId.includes('question')) {
        layouts[sectionId] = "AccordionFAQ";
      } else if (sectionId.includes('beforeAfter') || sectionId.includes('before')) {
        layouts[sectionId] = "SideBySideBlocks";
      } else if (sectionId.includes('uniqueMechanism') || sectionId.includes('unique')) {
        layouts[sectionId] = "StackedHighlights";
      } else if (sectionId.includes('howItWorks') || sectionId.includes('how')) {
        layouts[sectionId] = "ThreeStepHorizontal";
      } else if (sectionId.includes('socialProof') || sectionId.includes('social')) {
        layouts[sectionId] = "LogoWall";
      } else {
        // Last resort: use a versatile layout that always works
        layouts[sectionId] = "StackedHighlights";
      }
      
      console.log(`🔧 Contextual fallback layout assigned for ${sectionId}:`, layouts[sectionId]);
    }
    // }
  });

  console.log('🎨 Final layout assignments:', layouts);
  console.log('🎨 About to call setSectionLayouts with:', {
    layoutCount: Object.keys(layouts).length,
    heroLayout: layouts.hero,
    allLayouts: Object.entries(layouts).map(([section, layout]) => `${section}: ${layout}`)
  });
  setSectionLayouts(layouts);
  console.log('🎨 setSectionLayouts called successfully');
}