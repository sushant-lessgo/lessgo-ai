// utils/typeGuards.ts - Runtime type validation for taxonomy values
import {
  isValidMarketCategory,
  isValidMarketSubcategory,
  isValidStartupStage,
  isValidTargetAudience,
  isValidLandingGoalType,
  isValidPricingModel,
  isValidAwarenessLevel,
  isValidMarketSophisticationLevel,
  isValidToneProfile,
  isValidCopyIntent,
  isValidProblemType,
  isValidCategorySubcategoryPair,
  isValidStageGroupStagePair,
  isValidAudienceGroupAudiencePair,
} from '@/modules/inference/taxonomy';

import type {
  InputVariables,
  HiddenInferredFields,
  FeatureItem,
  MarketCategory,
  MarketSubcategory,
  TargetAudience,
  StartupStage,
  LandingGoalType,
  PricingModel,
  AwarenessLevel,
  MarketSophisticationLevel,
  ToneProfile,
  CopyIntent,
  ProblemType,
} from '@/types/core/index';

/**
 * ===== CORE TYPE GUARDS =====
 */

export function isInputVariables(value: any): value is InputVariables {
  return (
    typeof value === 'object' &&
    value !== null &&
    isValidMarketCategory(value.marketCategory) &&
    isValidMarketSubcategory(value.marketSubcategory) &&
    isValidTargetAudience(value.targetAudience) &&
    typeof value.keyProblem === 'string' &&
    value.keyProblem.trim().length > 0 &&
    isValidStartupStage(value.startupStage) &&
    isValidLandingGoalType(value.landingPageGoals) &&
    isValidPricingModel(value.pricingModel)
  );
}

export function isHiddenInferredFields(value: any): value is HiddenInferredFields {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    (value.awarenessLevel === undefined || isValidAwarenessLevel(value.awarenessLevel)) &&
    (value.copyIntent === undefined || isValidCopyIntent(value.copyIntent)) &&
    (value.toneProfile === undefined || isValidToneProfile(value.toneProfile)) &&
    (value.marketSophisticationLevel === undefined || isValidMarketSophisticationLevel(value.marketSophisticationLevel)) &&
    (value.problemType === undefined || isValidProblemType(value.problemType))
  );
}

export function isFeatureItem(value: any): value is FeatureItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.feature === 'string' &&
    value.feature.trim().length > 0 &&
    typeof value.benefit === 'string' &&
    value.benefit.trim().length > 0
  );
}

export function isFeatureItemArray(value: any): value is FeatureItem[] {
  return Array.isArray(value) && value.every(isFeatureItem);
}

/**
 * ===== INDIVIDUAL TAXONOMY TYPE GUARDS =====
 */

export const isMarketCategory = isValidMarketCategory;
export const isMarketSubcategory = isValidMarketSubcategory;
export const isTargetAudience = isValidTargetAudience;
export const isStartupStage = isValidStartupStage;
export const isLandingGoalType = isValidLandingGoalType;
export const isPricingModel = isValidPricingModel;
export const isAwarenessLevel = isValidAwarenessLevel;
export const isMarketSophisticationLevel = isValidMarketSophisticationLevel;
export const isToneProfile = isValidToneProfile;
export const isCopyIntent = isValidCopyIntent;
export const isProblemType = isValidProblemType;

/**
 * ===== RELATIONSHIP VALIDATORS =====
 */

export function isValidInputVariablesPair(inputVariables: InputVariables): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!isValidCategorySubcategoryPair(inputVariables.marketCategory, inputVariables.marketSubcategory)) {
    errors.push(`Subcategory "${inputVariables.marketSubcategory}" does not belong to category "${inputVariables.marketCategory}"`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function isValidHiddenFieldsConsistency(
  inputVariables: InputVariables,
  hiddenFields: HiddenInferredFields
): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check tone profile consistency with target audience
  if (hiddenFields.toneProfile && inputVariables.targetAudience) {
    const audienceBasedTones: Record<string, ToneProfile[]> = {
      'developers': ['minimal-technical', 'confident-playful'],
      'startup-ctos': ['minimal-technical', 'confident-playful'],
      'enterprise-tech-teams': ['minimal-technical', 'luxury-expert'],
      'content-creators': ['confident-playful', 'friendly-helpful'],
      'coaches-consultants': ['friendly-helpful', 'luxury-expert'],
    };

    const recommendedTones = audienceBasedTones[inputVariables.targetAudience];
    if (recommendedTones && !recommendedTones.includes(hiddenFields.toneProfile)) {
      warnings.push(`Tone profile "${hiddenFields.toneProfile}" may not be optimal for audience "${inputVariables.targetAudience}"`);
    }
  }

  // Check copy intent consistency with problem type
  if (hiddenFields.copyIntent && hiddenFields.problemType) {
    const problemBasedIntents: Record<string, CopyIntent[]> = {
      'manual-repetition': ['pain-led'],
      'burnout-or-overload': ['pain-led'],
      'compliance-or-risk': ['pain-led'],
      'lost-revenue-or-inefficiency': ['pain-led'],
      'creative-empowerment': ['desire-led'],
      'personal-growth-or-productivity': ['desire-led'],
      'professional-image-or-branding': ['desire-led'],
      'time-freedom-or-automation': ['desire-led'],
    };

    const recommendedIntents = problemBasedIntents[hiddenFields.problemType];
    if (recommendedIntents && !recommendedIntents.includes(hiddenFields.copyIntent)) {
      warnings.push(`Copy intent "${hiddenFields.copyIntent}" may not align with problem type "${hiddenFields.problemType}"`);
    }
  }

  return {
    isValid: true, // Warnings don't make it invalid
    warnings
  };
}

/**
 * ===== COMPREHENSIVE VALIDATION =====
 */

export function validateCompleteInputData(data: {
  inputVariables?: any;
  hiddenInferredFields?: any;
  features?: any;
}): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedData?: {
    inputVariables: InputVariables;
    hiddenInferredFields: HiddenInferredFields;
    features: FeatureItem[];
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate InputVariables
  if (!data.inputVariables) {
    errors.push('InputVariables is required');
  } else if (!isInputVariables(data.inputVariables)) {
    errors.push('Invalid InputVariables structure or values');
  }

  // Validate HiddenInferredFields
  if (data.hiddenInferredFields && !isHiddenInferredFields(data.hiddenInferredFields)) {
    errors.push('Invalid HiddenInferredFields structure or values');
  }

  // Validate Features
  if (data.features && !isFeatureItemArray(data.features)) {
    errors.push('Invalid Features structure or values');
  }

  // Early return if basic validation fails
  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Relationship validations
  if (data.inputVariables) {
    const pairValidation = isValidInputVariablesPair(data.inputVariables);
    if (!pairValidation.isValid) {
      errors.push(...pairValidation.errors);
    }

    if (data.hiddenInferredFields) {
      const consistencyCheck = isValidHiddenFieldsConsistency(
        data.inputVariables,
        data.hiddenInferredFields
      );
      warnings.push(...consistencyCheck.warnings);
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    validatedData: isValid ? {
      inputVariables: data.inputVariables,
      hiddenInferredFields: data.hiddenInferredFields || {},
      features: data.features || []
    } : undefined
  };
}

/**
 * ===== SAFE PARSING UTILITIES =====
 */

export function safeParseInputVariables(data: any): {
  success: boolean;
  data?: InputVariables;
  error?: string;
} {
  try {
    if (isInputVariables(data)) {
      const pairValidation = isValidInputVariablesPair(data);
      if (pairValidation.isValid) {
        return { success: true, data };
      } else {
        return { success: false, error: pairValidation.errors.join(', ') };
      }
    } else {
      return { success: false, error: 'Invalid InputVariables structure' };
    }
  } catch (error) {
    return { success: false, error: `Parsing error: ${error}` };
  }
}

export function safeParseHiddenInferredFields(data: any): {
  success: boolean;
  data?: HiddenInferredFields;
  error?: string;
} {
  try {
    if (isHiddenInferredFields(data)) {
      return { success: true, data };
    } else {
      return { success: false, error: 'Invalid HiddenInferredFields structure' };
    }
  } catch (error) {
    return { success: false, error: `Parsing error: ${error}` };
  }
}

/**
 * ===== FIELD NORMALIZATION =====
 */

export function normalizeInputVariables(data: Record<string, any>): Partial<InputVariables> {
  const normalized: Partial<InputVariables> = {};

  if (isValidMarketCategory(data.marketCategory)) {
    normalized.marketCategory = data.marketCategory;
  }

  if (isValidMarketSubcategory(data.marketSubcategory)) {
    normalized.marketSubcategory = data.marketSubcategory;
  }

  if (isValidTargetAudience(data.targetAudience)) {
    normalized.targetAudience = data.targetAudience;
  }

  if (typeof data.keyProblem === 'string' && data.keyProblem.trim()) {
    normalized.keyProblem = data.keyProblem.trim();
  }

  if (isValidStartupStage(data.startupStage)) {
    normalized.startupStage = data.startupStage;
  }

  if (isValidLandingGoalType(data.landingPageGoals)) {
    normalized.landingPageGoals = data.landingPageGoals;
  }

  if (isValidPricingModel(data.pricingModel)) {
    normalized.pricingModel = data.pricingModel;
  }

  return normalized;
}

export function normalizeHiddenInferredFields(data: Record<string, any>): Partial<HiddenInferredFields> {
  const normalized: Partial<HiddenInferredFields> = {};

  if (isValidAwarenessLevel(data.awarenessLevel)) {
    normalized.awarenessLevel = data.awarenessLevel;
  }

  if (isValidCopyIntent(data.copyIntent)) {
    normalized.copyIntent = data.copyIntent;
  }

  if (isValidToneProfile(data.toneProfile)) {
    normalized.toneProfile = data.toneProfile;
  }

  if (isValidMarketSophisticationLevel(data.marketSophisticationLevel)) {
    normalized.marketSophisticationLevel = data.marketSophisticationLevel;
  }

  if (isValidProblemType(data.problemType)) {
    normalized.problemType = data.problemType;
  }

  return normalized;
}

/**
 * ===== ASSERTION UTILITIES =====
 */

export function assertInputVariables(value: any, context?: string): asserts value is InputVariables {
  if (!isInputVariables(value)) {
    throw new Error(`Invalid InputVariables${context ? ` in ${context}` : ''}`);
  }

  const pairValidation = isValidInputVariablesPair(value);
  if (!pairValidation.isValid) {
    throw new Error(`InputVariables relationship validation failed${context ? ` in ${context}` : ''}: ${pairValidation.errors.join(', ')}`);
  }
}

export function assertHiddenInferredFields(value: any, context?: string): asserts value is HiddenInferredFields {
  if (!isHiddenInferredFields(value)) {
    throw new Error(`Invalid HiddenInferredFields${context ? ` in ${context}` : ''}`);
  }
}

export function assertFeatureItemArray(value: any, context?: string): asserts value is FeatureItem[] {
  if (!isFeatureItemArray(value)) {
    throw new Error(`Invalid FeatureItem array${context ? ` in ${context}` : ''}`);
  }
}

/**
 * ===== TYPE GUARD UTILITIES =====
 */

export const TypeGuards = {
  // Core types
  isInputVariables,
  isHiddenInferredFields,
  isFeatureItem,
  isFeatureItemArray,

  // Individual taxonomy types
  isMarketCategory,
  isMarketSubcategory,
  isTargetAudience,
  isStartupStage,
  isLandingGoalType,
  isPricingModel,
  isAwarenessLevel,
  isMarketSophisticationLevel,
  isToneProfile,
  isCopyIntent,
  isProblemType,

  // Validation functions
  validateCompleteInputData,
  isValidInputVariablesPair,
  isValidHiddenFieldsConsistency,

  // Safe parsing
  safeParseInputVariables,
  safeParseHiddenInferredFields,

  // Normalization
  normalizeInputVariables,
  normalizeHiddenInferredFields,

  // Assertions
  assertInputVariables,
  assertHiddenInferredFields,
  assertFeatureItemArray,
} as const;