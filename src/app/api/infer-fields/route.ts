// app/api/infer-fields/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { inferFields } from '@/modules/inference/inferFields';
import { validateInferredFields, ValidationResult } from '@/modules/inference/validateOutput';
import { generateMockInferredFields, generateMockValidationResults } from '@/modules/mock/mockDataGenerators';
import { logger } from '@/lib/logger';
import { withAIRateLimit } from '@/lib/rateLimit';

const RequestSchema = z.object({
  input: z.string().min(1),
  includeValidation: z.boolean().optional().default(true),
});

async function inferFieldsHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, includeValidation } = RequestSchema.parse(body);

    logger.debug('🚀 Starting inference for:', () => input.substring(0, 100) + '...');
    
    // Check for mock data usage
    const DEMO_TOKEN = "lessgodemomockdata";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" || token === DEMO_TOKEN) {
      logger.debug("Using mock data for field inference and validation");
      
      // Generate mock inferred fields
      const mockInferredFields = generateMockInferredFields(input);
      logger.dev('✅ Mock AI inference completed');
      
      // Generate mock validation results if requested (THIS IS THE KEY CHANGE)
      let mockValidationResults: Record<string, ValidationResult> | undefined;
      if (includeValidation) {
        logger.debug('🔍 Using mock semantic validation (avoiding embeddings API)...');
        const rawMockValidationResults = generateMockValidationResults(mockInferredFields);
        
        // Clean validation results to remove 'field' property (prevent React rendering errors)
        mockValidationResults = {};
        for (const [key, result] of Object.entries(rawMockValidationResults)) {
          const { field, ...cleanResult } = result;
          mockValidationResults[key] = cleanResult as ValidationResult;
        }
        logger.debug('✅ Mock semantic validation completed');
      }

      return Response.json({ 
        success: true, 
        data: {
          raw: mockInferredFields,
          validated: mockValidationResults,
        }
      });
    }

    // Production: Real AI inference
    const inferredFields = await inferFields(input);
    logger.debug('✅ AI inference completed');

    // Step 2: Semantic Validation (if requested) - REAL EMBEDDINGS API
    let validationResults: Record<string, ValidationResult> | undefined;
    
    if (includeValidation) {
      logger.debug('🔍 Starting semantic validation...');
      // Cast to InputVariables type - the validation function will handle type safety
      const rawValidationResults = await validateInferredFields(inferredFields as any);
      
      // Clean validation results to remove 'field' property (prevent React rendering errors)
      validationResults = {};
      for (const [key, result] of Object.entries(rawValidationResults)) {
        const { field, ...cleanResult } = result;
        validationResults[key] = cleanResult as ValidationResult;
      }
      logger.debug('✅ Semantic validation completed');
    }

    return Response.json({ 
      success: true, 
      data: {
        raw: inferredFields,
        validated: validationResults,
      }
    });
    
  } catch (err: any) {
    logger.error('[API] infer-fields error:', err);
    
    // Fallback to mock data on error
    try {
      const body = await req.json();
      const { input, includeValidation } = body;
      
      logger.warn("AI inference failed, using mock fallback");
      const mockInferredFields = generateMockInferredFields(input || "");
      
      let mockValidationResults: Record<string, ValidationResult> | undefined;
      if (includeValidation) {
        const rawMockValidationResults = generateMockValidationResults(mockInferredFields);
        
        // Clean validation results to remove 'field' property (prevent React rendering errors)
        mockValidationResults = {};
        for (const [key, result] of Object.entries(rawMockValidationResults)) {
          const { field, ...cleanResult } = result;
          mockValidationResults[key] = cleanResult as ValidationResult;
        }
      }
      
      return Response.json({ 
        success: true, 
        data: {
          raw: mockInferredFields,
          validated: mockValidationResults,
        },
        isPartial: true,
        warnings: ["AI inference failed, using mock data"]
      });
    } catch {
      return Response.json(
        { success: false, error: "Complete system failure" },
        { status: 500 }
      );
    }
  }
}

// Apply rate limiting to the POST handler
export const POST = withAIRateLimit(inferFieldsHandler);