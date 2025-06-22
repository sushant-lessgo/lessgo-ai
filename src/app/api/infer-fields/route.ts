// app/api/infer-fields/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { inferFields } from '@/modules/inference/inferFields';
import { validateInferredFields, ValidationResult } from '@/modules/inference/validateOutput';

const RequestSchema = z.object({
  input: z.string().min(1),
  includeValidation: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, includeValidation } = RequestSchema.parse(body);

    console.log('🚀 Starting inference for:', input);
    
    // Step 1: AI Inference
    const inferredFields = await inferFields(input);
    console.log('✅ AI inference completed');

    // Step 2: Semantic Validation (if requested)
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
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error';
    if (err.message?.includes('embedding')) {
      errorMessage = 'Semantic validation failed. Please try again.';
    } else if (err.message?.includes('inference')) {
      errorMessage = 'AI inference failed. Please try again.';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}