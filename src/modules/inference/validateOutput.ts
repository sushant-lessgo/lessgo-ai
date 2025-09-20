// modules/inference/validateOutput.ts - ✅ PHASE 4: API Layer Migration Complete
import { getBestSemanticMatch, findSemanticMatches, SemanticMatch } from '@/lib/embeddings';
import { taxonomy, marketSubcategories, MarketCategory } from './taxonomy';

// ✅ FIXED: Import canonical types
import type { InputVariables } from '@/types/core/index';

import { logger } from '@/lib/logger';
export interface ValidationResult {
  field: string;
  value: string | null;
  confidence: number;
  alternatives?: string[];
}

interface ValidatedFields {
  [key: string]: ValidationResult;
}

// Field-specific confidence thresholds for better accuracy
const FIELD_CONFIDENCE_THRESHOLDS: Record<string, { HIGH: number; MEDIUM: number }> = {
  marketCategory: { HIGH: 0.90, MEDIUM: 0.75 },     // Broad categories, should be confident
  marketSubcategory: { HIGH: 0.85, MEDIUM: 0.70 },  // More specific, moderate confidence
  targetAudience: { HIGH: 0.80, MEDIUM: 0.65 },     // Complex field, lower thresholds
  startupStage: { HIGH: 0.85, MEDIUM: 0.70 },       // Contextual, moderate confidence
  pricingModel: { HIGH: 0.75, MEDIUM: 0.60 },       // Highly contextual, lower thresholds
  landingGoal: { HIGH: 0.80, MEDIUM: 0.65 },        // Depends on context
  keyProblem: { HIGH: 1.0, MEDIUM: 1.0 },           // Free text, always high confidence
};

// Default thresholds for backwards compatibility
const DEFAULT_CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,    // Auto-confirm
  MEDIUM: 0.7,   // Show as suggestion
  LOW: 0.0       // Manual selection with alternatives
};

function isValidMarketCategory(category: string): category is MarketCategory {
  return (taxonomy.marketCategories as readonly string[]).includes(category);
}

async function validateField(
  fieldType: string,
  value: string,
  displayName: string,
  parentCategory?: string
): Promise<ValidationResult> {
  try {
    // Special handling for free text fields
    if (fieldType === 'keyProblem') {
      return {
        field: displayName,
        value: value.trim(),
        confidence: 1.0, // Always high confidence for free text
        alternatives: []
      };
    }

    // Special handling for subcategories - filter by parent category
    if (fieldType === 'marketSubcategory' && parentCategory) {
      // Get allowed subcategories for the parent category
      const allowedSubcategories = isValidMarketCategory(parentCategory) 
        ? marketSubcategories[parentCategory] 
        : [];
      
      if (allowedSubcategories.length === 0) {
        return {
          field: displayName,
          value: null,
          confidence: 0,
          alternatives: []
        };
      }
      
      // Find semantic matches within allowed subcategories
      const allMatches = await findSemanticMatches(value, fieldType, 10);
      const filteredMatches = allMatches.filter(match => 
        allowedSubcategories.includes(match.value)
      );
      
      const bestMatch = filteredMatches[0];
      const alternatives = filteredMatches.slice(1, 4).map(m => m.value);

      // Apply confidence boost for exact matches
      let confidence = bestMatch?.confidence || 0;
      if (bestMatch && value.toLowerCase() === bestMatch.value.toLowerCase()) {
        confidence = Math.min(1.0, confidence + 0.1); // Boost by 10% for exact matches
      }

      return {
        field: displayName,
        value: bestMatch?.value || null,
        confidence,
        alternatives: alternatives.length > 0 ? alternatives : allowedSubcategories.slice(0, 3)
      };
    }
    
    // Standard semantic matching for other fields
    const bestMatch = await getBestSemanticMatch(value, fieldType, 0.0); // Get best match regardless of threshold
    const alternatives = await findSemanticMatches(value, fieldType, 4);

    // Apply confidence boost for exact matches
    let confidence = bestMatch?.confidence || 0;
    if (bestMatch && value.toLowerCase() === bestMatch.value.toLowerCase()) {
      confidence = Math.min(1.0, confidence + 0.1); // Boost by 10% for exact matches
    }

    return {
      field: displayName,
      value: bestMatch?.value || null,
      confidence,
      alternatives: alternatives.slice(1, 4).map(m => m.value) // Skip the best match
    };
    
  } catch (error) {
    logger.error(`Error validating field ${fieldType}:`, error);
    return {
      field: displayName,
      value: null,
      confidence: 0,
      alternatives: []
    };
  }
}

// ✅ FIXED: Accept InputVariables instead of InferredFields and use canonical field names
export async function validateInferredFields(raw: InputVariables): Promise<Record<string, ValidationResult>> {
  const {
    marketCategory,
    marketSubcategory,
    keyProblem,
    targetAudience,
    startupStage,
    pricingModel,
    landingPageGoals, // ✅ FIXED: Use canonical field name
  } = raw;

  logger.debug('🔍 Starting semantic validation...');

  // Validate market category first (needed for subcategory filtering)
  const categoryResult = await validateField('marketCategory', marketCategory, 'Market Category');
  
  // Validate other fields in parallel
  const [
    subcategoryResult,
    audienceResult,
    stageResult,
    pricingResult,
    goalResult
  ] = await Promise.all([
    validateField('marketSubcategory', marketSubcategory, 'Market Subcategory', categoryResult.value || undefined),
    validateField('targetAudience', targetAudience, 'Target Audience'),
    validateField('startupStage', startupStage, 'Startup Stage'),
    validateField('pricingModel', pricingModel, 'Pricing Category and Model'),
    validateField('landingGoal', landingPageGoals, 'Landing Page Goals'), // Fixed: Use 'landingGoal' to match database field type
  ]);

  // Key problem doesn't need semantic matching - it's free text
  const problemResult: ValidationResult = {
    field: 'Key Problem Getting Solved',
    value: keyProblem.trim(),
    confidence: 1.0, // Always high confidence for free text
  };

  const results = {
    'Market Category': categoryResult,
    'Market Subcategory': subcategoryResult,
    'Target Audience': audienceResult,
    'Key Problem Getting Solved': problemResult,
    'Startup Stage': stageResult,
    'Landing Page Goals': goalResult, // ✅ FIXED: Use correct display name
    'Pricing Category and Model': pricingResult,
  };

  // Log results for debugging with field-specific confidence levels
  const fieldTypeMap: Record<string, string> = {
    'Market Category': 'marketCategory',
    'Market Subcategory': 'marketSubcategory',
    'Target Audience': 'targetAudience',
    'Key Problem Getting Solved': 'keyProblem',
    'Startup Stage': 'startupStage',
    'Landing Page Goals': 'landingGoal',
    'Pricing Category and Model': 'pricingModel',
  };

  Object.entries(results).forEach(([field, result]) => {
    const fieldType = fieldTypeMap[field];
    const confidenceLevel = getConfidenceLevel(result.confidence, fieldType);

    logger.debug(`🔍 ${field}: "${result.value}" (${confidenceLevel} - ${(result.confidence * 100).toFixed(1)}%)`);
  });

  return results;
}

// Helper function to convert ValidationResult to the old format for backward compatibility
export function extractValidatedValues(results: Record<string, ValidationResult>): Record<string, string> {
  const extracted: Record<string, string> = {};
  
  Object.entries(results).forEach(([field, result]) => {
    extracted[field] = result.value || '';
  });
  
  return extracted;
}

// Helper function to get confidence level with field-specific thresholds
export function getConfidenceLevel(confidence: number, fieldType?: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const thresholds = fieldType && FIELD_CONFIDENCE_THRESHOLDS[fieldType]
    ? FIELD_CONFIDENCE_THRESHOLDS[fieldType]
    : DEFAULT_CONFIDENCE_THRESHOLDS;

  if (confidence >= thresholds.HIGH) return 'HIGH';
  if (confidence >= thresholds.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

// Export default thresholds for backward compatibility
export { DEFAULT_CONFIDENCE_THRESHOLDS as CONFIDENCE_THRESHOLDS, FIELD_CONFIDENCE_THRESHOLDS };