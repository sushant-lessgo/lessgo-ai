// app/api/validate-fields/route.ts - ✅ PHASE 4: API Layer Migration Complete
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateInferredFields, ValidationResult } from '@/modules/inference/validateOutput';
import { generateMockValidationResults } from '@/modules/mock/mockDataGenerators';

// ✅ FIXED: Import taxonomy validation and type guards
import { 
  isValidMarketCategory,
  isValidMarketSubcategory, 
  isValidTargetAudience,
  isValidStartupStage,
  isValidLandingGoalType,
  isValidPricingModel
} from '@/modules/inference/taxonomy';

import type { InputVariables } from '@/types/core/index';

// ✅ FIXED: Use loose string schema for API input, validate later
const RequestSchema = z.object({
  fields: z.object({
    marketCategory: z.string(),
    marketSubcategory: z.string(),
    keyProblem: z.string(),
    targetAudience: z.string(),
    startupStage: z.string(),
    pricingModel: z.string(),
    landingPageGoals: z.string(), // ✅ FIXED: Canonical field name
  }),
});

// ✅ NEW: Validate and cast string fields to taxonomy types
function validateAndCastFields(fields: Record<string, string>): {
  success: boolean;
  data?: InputVariables;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate each field against taxonomy
  if (!isValidMarketCategory(fields.marketCategory)) {
    errors.push(`Invalid market category: "${fields.marketCategory}"`);
  }
  
  if (!isValidMarketSubcategory(fields.marketSubcategory)) {
    errors.push(`Invalid market subcategory: "${fields.marketSubcategory}"`);
  }
  
  if (!isValidTargetAudience(fields.targetAudience)) {
    errors.push(`Invalid target audience: "${fields.targetAudience}"`);
  }
  
  if (!isValidStartupStage(fields.startupStage)) {
    errors.push(`Invalid startup stage: "${fields.startupStage}"`);
  }
  
  if (!isValidLandingGoalType(fields.landingPageGoals)) {
    errors.push(`Invalid landing page goals: "${fields.landingPageGoals}"`);
  }
  
  if (!isValidPricingModel(fields.pricingModel)) {
    errors.push(`Invalid pricing model: "${fields.pricingModel}"`);
  }
  
  if (!fields.keyProblem || fields.keyProblem.trim().length === 0) {
    errors.push('Key problem is required');
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  // ✅ Cast to InputVariables if all validations pass
  const validatedFields: InputVariables = {
    marketCategory: fields.marketCategory as any, // Safe because we validated above
    marketSubcategory: fields.marketSubcategory as any,
    targetAudience: fields.targetAudience as any,
    keyProblem: fields.keyProblem.trim(),
    startupStage: fields.startupStage as any,
    landingPageGoals: fields.landingPageGoals as any, // ✅ FIXED: Canonical name
    pricingModel: fields.pricingModel as any,
  };
  
  return { success: true, data: validatedFields, errors: [] };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fields } = RequestSchema.parse(body);

   // console.log('🔍 Starting validation for fields:', Object.keys(fields));
    
    // ✅ NEW: Validate and cast fields to proper types
    const validationResult = validateAndCastFields(fields);
    if (!validationResult.success) {
      return Response.json({ 
        success: false, 
        error: 'Invalid field values',
        details: validationResult.errors
      }, { status: 400 });
    }
    
    const validatedFields = validationResult.data!;
    
    // Check for mock data usage
    const DEMO_TOKEN = "lessgodemomockdata";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" || token === DEMO_TOKEN) {
     // console.log("Using mock data for field validation (avoiding embeddings API)");
      
      // ✅ FIXED: Pass the validated InputVariables to mock generator
      const mockValidationResults = generateMockValidationResults(validatedFields);
      // console.log('✅ Mock validation completed');

      return Response.json({ 
        success: true, 
        data: mockValidationResults
      });
    }

    // Production: Real semantic validation - REAL EMBEDDINGS API
    // ✅ FIXED: Pass properly typed InputVariables
    const validationResults = await validateInferredFields(validatedFields);
    // console.log('✅ Validation completed');

    return Response.json({ 
      success: true, 
      data: validationResults
    });
    
  } catch (err: any) {
    console.error('[API] validate-fields error:', err);
    
    // Fallback to mock data on error
    try {
      const body = await req.json();
      const { fields } = body;
      
      // console.log("Validation failed, using mock fallback");
      
      // ✅ Try to validate fields for mock fallback
      const validationResult = validateAndCastFields(fields);
      if (validationResult.success) {
        const mockValidationResults = generateMockValidationResults(validationResult.data!);
        
        return Response.json({ 
          success: true, 
          data: mockValidationResults,
          isPartial: true,
          warnings: ["Semantic validation failed, using mock data"]
        });
      } else {
        // If validation fails completely, return error
        return Response.json(
          { 
            success: false, 
            error: 'Field validation failed',
            details: validationResult.errors
          },
          { status: 400 }
        );
      }
    } catch {
      return Response.json(
        { success: false, error: 'Complete validation failure' },
        { status: 500 }
      );
    }
  }
}