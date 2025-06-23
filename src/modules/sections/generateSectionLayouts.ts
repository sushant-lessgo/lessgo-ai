import { layoutPickers } from "./layoutPickers";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { usePageStore } from "@/hooks/usePageStore";
import type { LayoutPickerInput } from "./layoutPickerInput";

export function generateSectionLayouts(sectionIds: string[]) {
  const onboarding = useOnboardingStore.getState();
  const setSectionLayouts = usePageStore.getState().setSectionLayouts;

  // Map all required fields from onboarding data to LayoutPickerInput
  const input: LayoutPickerInput = {
    // Existing fields (already mapped)
    awarenessLevel: onboarding.hiddenInferredFields.awarenessLevel as LayoutPickerInput["awarenessLevel"],
    toneProfile: onboarding.hiddenInferredFields.toneProfile as LayoutPickerInput["toneProfile"],
    startupStageGroup: onboarding.validatedFields.startupStageGroup as LayoutPickerInput["startupStageGroup"],
    marketCategory: onboarding.validatedFields.marketCategory as LayoutPickerInput["marketCategory"],
    
    // Additional fields that need to be mapped from onboarding store
    // Note: You'll need to update these paths based on your actual onboarding store structure
    landingGoalType: onboarding.validatedFields.landingGoalType as LayoutPickerInput["landingGoalType"],
    targetAudienceGroup: onboarding.validatedFields.targetAudienceGroup as LayoutPickerInput["targetAudienceGroup"],
    pricingModel: onboarding.validatedFields.pricingModel as LayoutPickerInput["pricingModel"],
    pricingModifier: onboarding.validatedFields.pricingModifier as LayoutPickerInput["pricingModifier"],
    pricingCommitmentOption: onboarding.validatedFields.pricingCommitmentOption as LayoutPickerInput["pricingCommitmentOption"],
    marketSophisticationLevel: onboarding.hiddenInferredFields.marketSophisticationLevel as LayoutPickerInput["marketSophisticationLevel"],
    copyIntent: onboarding.hiddenInferredFields.copyIntent as LayoutPickerInput["copyIntent"],
    problemType: onboarding.hiddenInferredFields.problemType as LayoutPickerInput["problemType"],
  };

  const layouts: Record<string, string> = {};

  sectionIds.forEach((sectionId) => {
    // const picker = layoutPickers[sectionId];
    // if (picker) {
    //   layouts[sectionId] = picker(input);
    // } else {
      
    //Uncomment above after creating all the sections
    
    // Section-specific fallback defaults (copy-friendly layouts)
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
      
      layouts[sectionId] = fallbackLayouts[sectionId];
    // }
  });

  setSectionLayouts(layouts);
}