import { layoutElementSchema, getLayoutElements } from './layoutElementSchema';
import { selectOptionalElements, getAllLayoutElements } from './selectOptionalElements';
import { sectionList } from './sectionList';
import type { InputVariables, HiddenInferredFields } from '@/types/core/index';
import { logger } from '@/lib/logger';

// Debug mode environment variable
const DEBUG_ELEMENT_SELECTION = process.env.DEBUG_ELEMENT_SELECTION === 'true';

// ✅ FIXED: Store type definitions using proper store types
type OnboardingStore = {
  oneLiner: string;
  validatedFields: Partial<InputVariables>;  // ✅ FIXED: Use proper typed interface
  hiddenInferredFields: Partial<HiddenInferredFields>;  // ✅ FIXED: Use proper typed interface
  featuresFromAI: Array<{
    feature: string;
    benefit: string;
  }>;
};

type PageStore = {
  layout: {
    sections: string[];
    sectionLayouts: Record<string, string>;
  };
  meta: {
    onboardingData: {
      oneLiner: string;
      validatedFields: Partial<InputVariables>;  // ✅ FIXED: Use proper typed interface
      featuresFromAI: Array<{
        feature: string;
        benefit: string;
      }>;
      targetAudience?: string;
      businessType?: string;
    };
  };
};

// ✅ FIXED: Use centralized types instead of custom Variables interface
type Variables = Partial<InputVariables> & Partial<HiddenInferredFields>;

// Section element requirements
export type SectionElementRequirements = {
  sectionId: string;
  sectionType: string;
  layout: string;
  mandatoryElements: string[];
  optionalElements: string[];
  allElements: string[];
  excludedElements: string[];
};

// Complete elements map for all sections
export type ElementsMap = {
  [sectionId: string]: SectionElementRequirements;
};

/**
 * Maps section ID to section type using sectionList
 * @param sectionId - The section identifier (e.g., "hero", "beforeAfter")
 * @returns Capitalized section type (e.g., "Hero", "BeforeAfter")
 */
export function getSectionType(sectionId: string): string {
  // Find section in sectionList
  const section = sectionList.find(s => s.id === sectionId);
  if (!section) {
    console.warn(`Section "${sectionId}" not found in sectionList`);
    return sectionId; // Fallback to original ID
  }

  // Convert camelCase ID to PascalCase section type
  // hero → Hero, beforeAfter → BeforeAfter, founderNote → FounderNote
  return sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
}

/**
 * ✅ FIXED: Maps store data to Variables type using centralized interfaces
 * @param onboardingStore - The onboarding store data
 * @param pageStore - The page store data
 * @returns Variables object for element selection logic
 */
export function mapStoreToVariables(
  onboardingStore: OnboardingStore,
  pageStore: PageStore
): Variables {
  // Get validated fields and hidden inferred fields
  const validated = onboardingStore.validatedFields || {};
  const hidden = onboardingStore.hiddenInferredFields || {};

  // ✅ FIXED: Return object that matches centralized interfaces
  return {
    // From InputVariables
    marketCategory: validated.marketCategory,
    marketSubcategory: validated.marketSubcategory,
    landingPageGoals: validated.landingPageGoals,
    startupStage: validated.startupStage,
    targetAudience: validated.targetAudience,
    keyProblem: validated.keyProblem,
    pricingModel: validated.pricingModel,
    
    // From HiddenInferredFields
    awarenessLevel: hidden.awarenessLevel,
    copyIntent: hidden.copyIntent,
    toneProfile: hidden.toneProfile,
    marketSophisticationLevel: hidden.marketSophisticationLevel,
    problemType: hidden.problemType,
  };
}

/**
 * Gets required elements for a specific section and layout
 * @param sectionType - The section type (e.g., "Hero", "Features")
 * @param layout - The layout name (e.g., "leftCopyRightImage")
 * @param variables - Variables object for element selection
 * @returns Object with mandatory, optional, and all elements
 */
export function getRequiredElements(
  sectionType: string,
  layout: string,
  variables: Variables
): {
  mandatory: string[];
  optional: string[];
  all: string[];
  excluded: string[];
} {
  return getAllLayoutElements(sectionType, layout, variables);
}

/**
 * Gets section element requirements for a single section
 * @param sectionId - The section ID
 * @param layout - The layout name
 * @param variables - Variables object for element selection
 * @returns Complete section element requirements
 */
export function getSectionElementRequirements(
  sectionId: string,
  layout: string,
  variables: Variables
): SectionElementRequirements {
  const sectionType = getSectionType(sectionId);
  const elements = getRequiredElements(sectionType, layout, variables);

  return {
    sectionId,
    sectionType,
    layout,
    mandatoryElements: elements.mandatory,
    optionalElements: elements.optional,
    allElements: elements.all,
    excludedElements: elements.excluded,
  };
}

/**
 * Creates complete elements map for all sections in the page
 * @param pageStore - The page store containing sections and layouts
 * @param variables - Variables object for element selection
 * @returns Complete elements map for all sections
 */
export function createElementsMap(
  pageStore: PageStore,
  variables: Variables
): ElementsMap {
  const elementsMap: ElementsMap = {};

  // Process each section in the page
  for (const sectionId of pageStore.layout.sections) {
    const layout = pageStore.layout.sectionLayouts[sectionId];
    
    if (!layout) {
      console.warn(`No layout found for section "${sectionId}"`);
      continue;
    }

    // Get element requirements for this section
    elementsMap[sectionId] = getSectionElementRequirements(
      sectionId,
      layout,
      variables
    );
  }

  return elementsMap;
}

/**
 * Master function to get complete elements map from stores
 * @param onboardingStore - The onboarding store
 * @param pageStore - The page store
 * @returns Complete elements map ready for buildPrompt.ts
 */
export function getCompleteElementsMap(
  onboardingStore: OnboardingStore,
  pageStore: PageStore
): ElementsMap {
  if (DEBUG_ELEMENT_SELECTION) {
    logger.group(`🌟 [ELEMENT_MAP] Starting Complete Elements Map Generation`, () => {
      logger.dev(`📋 Page Layout:`, {
        sections: pageStore.layout.sections,
        sectionLayouts: pageStore.layout.sectionLayouts
      });
    });
  }

  // Map store data to variables
  const variables = mapStoreToVariables(onboardingStore, pageStore);

  if (DEBUG_ELEMENT_SELECTION) {
    logger.dev(`🎯 Mapped Variables:`, {
      variableCount: Object.keys(variables).length,
      variables: variables
    });
  }

  // Create complete elements map
  const elementsMap = createElementsMap(pageStore, variables);

  if (DEBUG_ELEMENT_SELECTION) {
    logger.group(`📊 Final Elements Map Summary`, () => {
      const sectionSummary = Object.entries(elementsMap).map(([sectionId, data]) => ({
        sectionId,
        sectionType: data.sectionType,
        layout: data.layout,
        mandatoryCount: data.mandatoryElements.length,
        optionalCount: data.optionalElements.length,
        totalElements: data.allElements.length,
        mandatory: data.mandatoryElements,
        optional: data.optionalElements,
        excluded: data.excludedElements
      }));

      logger.dev(`🎯 Sections Processed: ${sectionSummary.length}`);
      sectionSummary.forEach(section => {
        logger.dev(`  📋 ${section.sectionId} (${section.sectionType}_${section.layout}):`, {
          total: section.totalElements,
          mandatory: section.mandatoryCount,
          optional: section.optionalCount,
          excludedCount: section.excluded.length,
          optionalElements: section.optional,
          excludedElements: section.excluded
        });
      });
    });
  }

  return elementsMap;
}

/**
 * Debug function to inspect element selection for a specific section
 * @param sectionId - The section ID to debug
 * @param layout - The layout name
 * @param variables - Variables object
 * @returns Detailed debugging information
 */
export function debugSectionElements(
  sectionId: string,
  layout: string,
  variables: Variables
): {
  sectionType: string;
  layoutExists: boolean;
  mandatoryElements: string[];
  optionalElements: string[];
  elementSelectionDebug: Array<{
    element: string;
    score: number;
    minScore: number;
    included: boolean;
    matchedConditions: string[];
  }>;
} {
  const sectionType = getSectionType(sectionId);
  const layoutExists = !!layoutElementSchema[layout];
  
  if (!layoutExists) {
    return {
      sectionType,
      layoutExists: false,
      mandatoryElements: [],
      optionalElements: [],
      elementSelectionDebug: [],
    };
  }

  const elements = getRequiredElements(sectionType, layout, variables);
  
  // Import debug function if needed for detailed scoring
  // const elementSelectionDebug = debugElementSelection(sectionType, layout, variables);

  return {
    sectionType,
    layoutExists: true,
    mandatoryElements: elements.mandatory,
    optionalElements: elements.optional,
    elementSelectionDebug: [], // Can be populated with debugElementSelection if needed
  };
}

/**
 * Utility to get all possible elements for a layout (for UI purposes)
 * @param layout - The layout name
 * @returns All possible elements (mandatory + all optional) for the layout
 */
export function getAllPossibleElements(layout: string): {
  mandatory: string[];
  optional: string[];
  all: string[];
} {
  const layoutElements = getLayoutElements(layout);

  if (layoutElements.length === 0) {
    return { mandatory: [], optional: [], all: [] };
  }

  const mandatory = layoutElements
    .filter(element => element.mandatory)
    .map(element => element.element);

  const optional = layoutElements
    .filter(element => !element.mandatory)
    .map(element => element.element);

  return {
    mandatory,
    optional,
    all: [...mandatory, ...optional],
  };
}

/**
 * Validates that all required elements are present in section content
 * @param sectionElementRequirements - The required elements for a section
 * @param sectionContent - The actual content elements
 * @returns Validation result with missing elements
 */
export function validateSectionContent(
  sectionElementRequirements: SectionElementRequirements,
  sectionContent: Record<string, string>
): {
  isValid: boolean;
  missingMandatory: string[];
  missingOptional: string[];
  extraElements: string[];
} {
  const contentKeys = Object.keys(sectionContent);
  const { mandatoryElements, optionalElements, allElements } = sectionElementRequirements;

  const missingMandatory = mandatoryElements.filter(
    element => !contentKeys.includes(element) || !sectionContent[element]?.trim()
  );

  const missingOptional = optionalElements.filter(
    element => !contentKeys.includes(element) || !sectionContent[element]?.trim()
  );

  const extraElements = contentKeys.filter(
    key => !allElements.includes(key)
  );

  return {
    isValid: missingMandatory.length === 0,
    missingMandatory,
    missingOptional,
    extraElements,
  };
}