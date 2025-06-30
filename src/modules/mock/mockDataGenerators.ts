// modules/mock/mockDataGenerators.ts - ✅ PHASE 4: API Layer Migration Complete
import { taxonomy } from '@/modules/inference/taxonomy';
import type { 
  AwarenessLevel, 
  CopyIntent, 
  ToneProfile, 
  MarketSophisticationLevel, 
  ProblemType 
} from '@/modules/inference/taxonomy';

import type {
  InputVariables,
  HiddenInferredFields,
  CanonicalFieldName
} from '@/types/core/index';

import { FIELD_DISPLAY_NAMES } from '@/types/core/index';

// ✅ FIXED: Use canonical field names from InputVariables interface
export interface MockInferredFields extends InputVariables {
  // Uses all canonical field names: marketCategory, marketSubcategory, 
  // targetAudience, keyProblem, startupStage, landingPageGoals, pricingModel
}

// Mock ValidationResult to match validateOutput.ts structure
export interface MockValidationResult {
  field: string;
  value: string | null;
  confidence: number;
  alternatives?: string[];
}

// ✅ FIXED: Use HiddenInferredFields interface directly (already has toneProfile)
export type MockHiddenInferredFields = HiddenInferredFields;

// Utility function to get random item from array
function getRandomItem<T>(array: readonly T[] | T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Utility function to get random item from nested array
function getRandomSubcategory(category: string): string {
  const subcategories = taxonomy.marketSubcategories[category as keyof typeof taxonomy.marketSubcategories];
  return subcategories ? getRandomItem(subcategories) : 'General';
}

function getRandomStage(): string {
  const randomGroup = getRandomItem(taxonomy.startupStageGroups);
  const stages = randomGroup.stages;
  const randomStage = stages[Math.floor(Math.random() * stages.length)];
  return randomStage.id;
}

function getRandomAudience(): string {
  const randomGroup = getRandomItem(taxonomy.targetAudienceGroups);
  const audiences = randomGroup.audiences;
  const randomAudience = audiences[Math.floor(Math.random() * audiences.length)];
  return randomAudience.id;
}

// ✅ FIXED: Mock field inference generator uses canonical field names
export function generateMockInferredFields(input: string): MockInferredFields {
  // Add some logic based on input keywords for more realistic mocking
  const inputLower = input.toLowerCase();
  
  let category = getRandomItem(taxonomy.marketCategories);
  
  // Smart category selection based on input keywords
  if (inputLower.includes('ai') || inputLower.includes('artificial intelligence')) {
    category = 'AI Tools';
  } else if (inputLower.includes('design') || inputLower.includes('creative')) {
    category = 'Design & Creative Tools';
  } else if (inputLower.includes('marketing') || inputLower.includes('sales')) {
    category = 'Marketing & Sales Tools';
  } else if (inputLower.includes('productivity') || inputLower.includes('task') || inputLower.includes('project')) {
    category = 'Work & Productivity Tools';
  } else if (inputLower.includes('developer') || inputLower.includes('code')) {
    category = 'Engineering & Development Tools';
  }

  // Generate problem based on input
  let keyProblem = "Manual processes are time-consuming and error-prone";
  if (inputLower.includes('slow') || inputLower.includes('time')) {
    keyProblem = "Current solutions are too slow and inefficient";
  } else if (inputLower.includes('expensive') || inputLower.includes('cost')) {
    keyProblem = "Existing tools are too expensive for small teams";
  } else if (inputLower.includes('complex') || inputLower.includes('difficult')) {
    keyProblem = "Available solutions are too complex and hard to use";
  }

  return {
    marketCategory: category,
    marketSubcategory: getRandomSubcategory(category),
    keyProblem,
    targetAudience: getRandomAudience() as any,
    startupStage: getRandomStage() as any,
    pricingModel: getRandomItem(taxonomy.pricingModels).id,
    landingPageGoals: getRandomItem(taxonomy.landingGoalTypes).id, // ✅ FIXED: Canonical name
  };
}

// ✅ FIXED: Mock validation results generator uses canonical field mappings
export function generateMockValidationResults(fields: MockInferredFields): Record<string, MockValidationResult> {
  const fieldValidations: Record<string, MockValidationResult> = {};
  
  // ✅ FIXED: Use canonical field names as keys, display names as values
  const canonicalFields: (keyof MockInferredFields)[] = [
    'marketCategory',
    'marketSubcategory', 
    'targetAudience',
    'keyProblem',
    'startupStage',
    'landingPageGoals', // ✅ FIXED: Canonical name
    'pricingModel'
  ];

  canonicalFields.forEach((canonicalFieldName) => {
    const value = fields[canonicalFieldName];
    if (value === undefined) return;

    // ✅ FIXED: Get display name from canonical mapping
    const displayName = FIELD_DISPLAY_NAMES[canonicalFieldName as CanonicalFieldName];
    if (!displayName) {
      console.warn(`No display name found for canonical field: ${canonicalFieldName}`);
      return;
    }
    
    // Generate realistic confidence scores
    let confidence = 0.7 + Math.random() * 0.25; // 0.7 to 0.95
    
    // Special confidence adjustments
    if (canonicalFieldName === 'keyProblem') {
      confidence = 1.0; // Always high confidence for free text
    } else if (canonicalFieldName === 'pricingModel' && value === 'custom-quote') {
      confidence = 0.6 + Math.random() * 0.2; // Lower confidence for complex pricing
    } else if (['marketCategory', 'targetAudience'].includes(canonicalFieldName)) {
      confidence = 0.85 + Math.random() * 0.1; // Higher confidence for common fields
    }

    // Generate alternatives based on field type
    const alternatives = generateAlternatives(canonicalFieldName, value);
    
    fieldValidations[displayName] = {
      field: displayName,
      value: value,
      confidence: Number(confidence.toFixed(2)),
      alternatives: alternatives.length > 0 ? alternatives : undefined
    };
  });

  return fieldValidations;
}

// ✅ FIXED: Generate realistic alternatives using canonical field names
function generateAlternatives(canonicalFieldName: keyof MockInferredFields, currentValue: string): string[] {
  switch (canonicalFieldName) {
    case 'marketCategory':
      // Return 2-3 different categories
      return taxonomy.marketCategories
        .filter(cat => cat !== currentValue)
        .slice(0, 3);
        
    case 'marketSubcategory':
      // Find parent category and return alternatives from same category
      const parentCategory = Object.entries(taxonomy.marketSubcategories)
        .find(([, subcats]) => subcats.includes(currentValue as any))?.[0];
      
      if (parentCategory) {
        const subcategories = taxonomy.marketSubcategories[parentCategory as keyof typeof taxonomy.marketSubcategories];
        return subcategories
          .filter(sub => sub !== currentValue)
          .slice(0, 3);
      }
      return [];
      
    case 'targetAudience':
      // Return alternatives from same or different groups
      const allAudiences: string[] = [];
      taxonomy.targetAudienceGroups.forEach(group => {
        group.audiences.forEach(audience => {
          if (audience.id !== currentValue) {
            allAudiences.push(audience.id);
          }
        });
      });
      return allAudiences.slice(0, 3);
      
    case 'startupStage':
      // Return alternatives from same or adjacent stages
      const allStages: string[] = [];
      taxonomy.startupStageGroups.forEach(group => {
        group.stages.forEach(stage => {
          if (stage.id !== currentValue) {
            allStages.push(stage.id);
          }
        });
      });
      return allStages.slice(0, 3);
      
    case 'pricingModel':
      return taxonomy.pricingModels
        .filter(model => model.id !== currentValue)
        .slice(0, 3)
        .map(model => model.id);
        
    case 'landingPageGoals': // ✅ FIXED: Canonical name
      return taxonomy.landingGoalTypes
        .filter(goal => goal.id !== currentValue)
        .slice(0, 3)
        .map(goal => goal.id);
        
    case 'keyProblem':
      // No alternatives for free text
      return [];
      
    default:
      return [];
  }
}

// ✅ FIXED: Mock hidden inferred fields generator uses canonical field names
export function generateMockHiddenInferredFields(validatedFields: Partial<InputVariables>): MockHiddenInferredFields {
  // Use validated fields to make smart selections
  const category = validatedFields.marketCategory || '';
  const audience = validatedFields.targetAudience || '';
  const stage = validatedFields.startupStage || '';
  const problem = validatedFields.keyProblem || '';
  
  // Smart selection based on context
  let awarenessLevel = getRandomItem(taxonomy.awarenessLevels).id as AwarenessLevel;
  let copyIntent = getRandomItem(taxonomy.copyIntents) as CopyIntent;
  let toneProfile = getRandomItem(taxonomy.toneProfiles).id as ToneProfile; // ✅ FIXED: Use toneProfile
  let marketSophisticationLevel = getRandomItem(taxonomy.marketSophisticationLevels).id as MarketSophisticationLevel;
  let problemType = getRandomItem(taxonomy.problemTypes).id as ProblemType;
  
  // Contextual adjustments based on audience
  if (audience.includes('founder') || audience.includes('startup')) {
    toneProfile = 'confident-playful';
    awarenessLevel = 'problem-aware';
  }
  
  // Contextual adjustments based on category
  if (category === 'Engineering & Development Tools') {
    toneProfile = 'minimal-technical';
    copyIntent = 'pain-led';
    problemType = 'manual-repetition';
  }
  
  if (category === 'AI Tools') {
    awarenessLevel = 'solution-aware';
    copyIntent = 'desire-led';
    problemType = 'creative-empowerment';
  }
  
  if (category === 'Marketing & Sales Tools') {
    copyIntent = 'pain-led';
    problemType = 'lost-revenue-or-inefficiency';
    marketSophisticationLevel = 'level-3';
  }
  
  // Contextual adjustments based on startup stage
  if (stage.includes('idea') || stage.includes('mvp')) {
    awarenessLevel = 'unaware';
    marketSophisticationLevel = 'level-1';
  }
  
  // Contextual adjustments based on problem description
  if (problem.toLowerCase().includes('manual') || problem.toLowerCase().includes('repetitive')) {
    problemType = 'manual-repetition';
    copyIntent = 'pain-led';
  }
  
  if (problem.toLowerCase().includes('creative') || problem.toLowerCase().includes('design')) {
    problemType = 'creative-empowerment';
    copyIntent = 'desire-led';
  }
  
  if (problem.toLowerCase().includes('revenue') || problem.toLowerCase().includes('sales')) {
    problemType = 'lost-revenue-or-inefficiency';
    copyIntent = 'pain-led';
  }

  return {
    awarenessLevel,
    copyIntent,
    toneProfile, // ✅ FIXED: Returns toneProfile instead of brandTone
    marketSophisticationLevel,
    problemType,
  };
}