import { UniversalElementType } from '@/types/universalElements';
import { 
  SECTION_RESTRICTIONS, 
  LAYOUT_RESTRICTIONS, 
  DEFAULT_RESTRICTION,
  getAllUniversalElementTypes,
  ElementRestriction,
  ELEMENT_CATEGORIES
} from '@/config/elementRestrictions';

/**
 * Element Restriction Logic
 * 
 * Provides functions to determine which elements are restricted for specific
 * sections and layouts, with clear reasoning for UI feedback.
 */

export interface RestrictionResult {
  restrictedElements: UniversalElementType[];
  allowedElements: UniversalElementType[];
  restriction: ElementRestriction;
  hasRestrictions: boolean;
}

/**
 * Get restricted elements for a specific section and layout combination
 * Layout restrictions take precedence over section restrictions
 */
export const getElementRestrictions = (
  sectionType: string, 
  layoutType?: string
): RestrictionResult => {
  const allElements = getAllUniversalElementTypes();
  let activeRestriction: ElementRestriction;

  // Layout restrictions take precedence
  if (layoutType && LAYOUT_RESTRICTIONS[layoutType]) {
    activeRestriction = LAYOUT_RESTRICTIONS[layoutType];
  }
  // Fall back to section restrictions
  else if (SECTION_RESTRICTIONS[sectionType]) {
    activeRestriction = SECTION_RESTRICTIONS[sectionType];
  }
  // Use default restriction for unknown types
  else {
    activeRestriction = DEFAULT_RESTRICTION;
  }

  const allowedElements = activeRestriction.allowedElements;
  const restrictedElements = allElements.filter(
    element => !allowedElements.includes(element)
  );

  return {
    restrictedElements,
    allowedElements,
    restriction: activeRestriction,
    hasRestrictions: restrictedElements.length > 0
  };
};

/**
 * Check if a specific element type is allowed in a section/layout
 */
export const isElementAllowed = (
  elementType: UniversalElementType,
  sectionType: string,
  layoutType?: string
): boolean => {
  const { allowedElements } = getElementRestrictions(sectionType, layoutType);
  return allowedElements.includes(elementType);
};

/**
 * Get restriction reason for display to users
 */
export const getRestrictionReason = (
  sectionType: string, 
  layoutType?: string
): string => {
  const { restriction } = getElementRestrictions(sectionType, layoutType);
  return restriction.reason;
};

/**
 * Get restriction level (strict, moderate, flexible)
 */
export const getRestrictionLevel = (
  sectionType: string,
  layoutType?: string
): 'strict' | 'moderate' | 'flexible' => {
  const { restriction } = getElementRestrictions(sectionType, layoutType);
  return restriction.restrictionLevel;
};

/**
 * Filter element list based on restrictions
 * Used by ElementPicker to show only allowed elements
 */
export const filterElementsByRestrictions = <T extends { type: UniversalElementType }>(
  elements: T[],
  sectionType: string,
  layoutType?: string
): T[] => {
  const { allowedElements } = getElementRestrictions(sectionType, layoutType);
  
  // If no restrictions, return all elements
  if (allowedElements.length === getAllUniversalElementTypes().length) {
    return elements;
  }
  
  return elements.filter(element => allowedElements.includes(element.type));
};

/**
 * Get restriction summary for UI display
 */
export const getRestrictionSummary = (
  sectionType: string,
  layoutType?: string
): {
  level: string;
  restrictedCount: number;
  allowedCount: number;
  totalCount: number;
  reason: string;
  hasAnyRestrictions: boolean;
} => {
  const { restrictedElements, allowedElements, restriction } = getElementRestrictions(sectionType, layoutType);
  const totalCount = getAllUniversalElementTypes().length;
  
  return {
    level: restriction.restrictionLevel,
    restrictedCount: restrictedElements.length,
    allowedCount: allowedElements.length,
    totalCount,
    reason: restriction.reason,
    hasAnyRestrictions: restrictedElements.length > 0
  };
};

/**
 * Get elements grouped by category with restriction status
 */
export const getElementsByCategory = (
  sectionType: string,
  layoutType?: string
): Record<keyof typeof ELEMENT_CATEGORIES, {
  allowed: UniversalElementType[];
  restricted: UniversalElementType[];
}> => {
  const { allowedElements, restrictedElements } = getElementRestrictions(sectionType, layoutType);
  
  const result = {} as Record<keyof typeof ELEMENT_CATEGORIES, {
    allowed: UniversalElementType[];
    restricted: UniversalElementType[];
  }>;
  
  Object.entries(ELEMENT_CATEGORIES).forEach(([category, elements]) => {
    result[category as keyof typeof ELEMENT_CATEGORIES] = {
      allowed: elements.filter(el => allowedElements.includes(el)),
      restricted: elements.filter(el => restrictedElements.includes(el))
    };
  });
  
  return result;
};

/**
 * Validate if element addition is allowed and provide feedback
 */
export const validateElementAddition = (
  elementType: UniversalElementType,
  sectionType: string,
  layoutType?: string
): {
  allowed: boolean;
  reason?: string;
  suggestion?: string;
} => {
  const isAllowed = isElementAllowed(elementType, sectionType, layoutType);
  
  if (isAllowed) {
    return { allowed: true };
  }
  
  const restriction = getElementRestrictions(sectionType, layoutType);
  const suggestions = getSuggestionForRestrictedElement(elementType, sectionType, restriction);
  
  return {
    allowed: false,
    reason: `${elementType} elements are not compatible with ${layoutType || sectionType} layouts. ${restriction.restriction.reason}`,
    suggestion: suggestions
  };
};

/**
 * Get helpful suggestions when an element is restricted
 */
const getSuggestionForRestrictedElement = (
  elementType: UniversalElementType,
  sectionType: string,
  restriction: RestrictionResult
): string => {
  // If no elements are allowed, suggest using section's built-in editing
  if (restriction.allowedElements.length === 0) {
    return `Try editing the existing content fields in this ${sectionType} section, or switch to a flexible content section to add custom elements.`;
  }
  
  // Suggest alternative allowed elements
  const allowedAlternatives = restriction.allowedElements.slice(0, 3).join(', ');
  return `Try adding these compatible elements instead: ${allowedAlternatives}.`;
};

/**
 * Check if section supports any universal elements
 */
export const sectionSupportsUniversalElements = (
  sectionType: string,
  layoutType?: string
): boolean => {
  const { allowedElements } = getElementRestrictions(sectionType, layoutType);
  return allowedElements.length > 0;
};

/**
 * Get debug information about restrictions for development
 */
export const getRestrictionDebugInfo = (
  sectionType: string,
  layoutType?: string
) => {
  const layoutRestriction = layoutType ? LAYOUT_RESTRICTIONS[layoutType] : null;
  const sectionRestriction = SECTION_RESTRICTIONS[sectionType];
  const activeRestriction = getElementRestrictions(sectionType, layoutType);
  
  return {
    sectionType,
    layoutType,
    hasLayoutRestriction: !!layoutRestriction,
    hasSectionRestriction: !!sectionRestriction,
    activeRestriction: activeRestriction.restriction,
    restrictionSource: layoutRestriction ? 'layout' : 'section',
    restrictedElements: activeRestriction.restrictedElements,
    allowedElements: activeRestriction.allowedElements
  };
};