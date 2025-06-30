// app/api/infer-fields/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { inferFields } from '@/modules/inference/inferFields';
import { validateInferredFields, ValidationResult } from '@/modules/inference/validateOutput';
import { generateMockInferredFields, generateMockValidationResults } from '@/modules/mock/mockDataGenerators';

const RequestSchema = z.object({
  input: z.string().min(1),
  includeValidation: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, includeValidation } = RequestSchema.parse(body);

    console.log('🚀 Starting inference for:', input);
    
    // Check for mock data usage
    const DEMO_TOKEN = "lessgodemomockdata";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" || token === DEMO_TOKEN) {
      console.log("Using mock data for field inference and validation");
      
      // Generate mock inferred fields
      const mockInferredFields = generateMockInferredFields(input);
      console.log('✅ Mock AI inference completed');
      
      // Generate mock validation results if requested (THIS IS THE KEY CHANGE)
      let mockValidationResults: Record<string, ValidationResult> | undefined;
      if (includeValidation) {
        console.log('🔍 Using mock semantic validation (avoiding embeddings API)...');
        mockValidationResults = generateMockValidationResults(mockInferredFields);
        console.log('✅ Mock semantic validation completed');
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
    console.log('✅ AI inference completed');

    // Step 2: Semantic Validation (if requested) - REAL EMBEDDINGS API
    let validationResults: Record<string, ValidationResult> | undefined;
    
    if (includeValidation) {
      console.log('🔍 Starting semantic validation...');
      validationResults = await validateInferredFields(inferredFields);
      console.log('✅ Semantic validation completed');
    }

    return Response.json({ 
      success: true, 
      data: {
        raw: inferredFields,
        validated: validationResults,
      }
    });
    
  } catch (err: any) {
    console.error('[API] infer-fields error:', err);
    
    // Fallback to mock data on error
    try {
      const body = await req.json();
      const { input, includeValidation } = body;
      
      console.log("AI inference failed, using mock fallback");
      const mockInferredFields = generateMockInferredFields(input || "");
      const mockValidationResults = includeValidation ? generateMockValidationResults(mockInferredFields) : undefined;
      
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