// modules/inference/validateOutput.ts - ✅ PHASE 4: API Layer Migration Complete
import { getBestSemanticMatch, findSemanticMatches, SemanticMatch } from '@/lib/embeddings';
import { taxonomy, marketSubcategories, MarketCategory } from './taxonomy';

// ✅ FIXED: Import canonical types
import type { InputVariables } from '@/types/core/index';

export interface ValidationResult {
  field: string;
  value: string | null;
  confidence: number;
  alternatives?: string[];
}

interface ValidatedFields {
  [key: string]: ValidationResult;
}

// Confidence thresholds
const CONFIDENCE_THRESHOLDS = {
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
      
      return {
        field: displayName,
        value: bestMatch?.value || null,
        confidence: bestMatch?.confidence || 0,
        alternatives: alternatives.length > 0 ? alternatives : allowedSubcategories.slice(0, 3)
      };
    }
    
    // Standard semantic matching for other fields
    const bestMatch = await getBestSemanticMatch(value, fieldType, 0.0); // Get best match regardless of threshold
    const alternatives = await findSemanticMatches(value, fieldType, 4);
    
    return {
      field: displayName,
      value: bestMatch?.value || null,
      confidence: bestMatch?.confidence || 0,
      alternatives: alternatives.slice(1, 4).map(m => m.value) // Skip the best match
    };
    
  } catch (error) {
    console.error(`Error validating field ${fieldType}:`, error);
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

  console.log('🔍 Starting semantic validation...');

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
    validateField('landingPageGoals', landingPageGoals, 'Landing Page Goals'), // ✅ FIXED: Use canonical field name for semantic matching
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

  // Log results for debugging
  Object.entries(results).forEach(([field, result]) => {
    const confidenceLevel = 
      result.confidence >= CONFIDENCE_THRESHOLDS.HIGH ? 'HIGH' :
      result.confidence >= CONFIDENCE_THRESHOLDS.MEDIUM ? 'MEDIUM' : 'LOW';
    
    console.log(`🔍 ${field}: "${result.value}" (${confidenceLevel} - ${(result.confidence * 100).toFixed(1)}%)`);
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

// Helper function to get confidence level
export function getConfidenceLevel(confidence: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

export { CONFIDENCE_THRESHOLDS };