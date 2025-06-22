// app/api/validate-fields/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateInferredFields, ValidationResult } from '@/modules/inference/validateOutput';

const RequestSchema = z.object({
  fields: z.object({
    marketCategory: z.string(),
    marketSubcategory: z.string(),
    keyProblem: z.string(),
    targetAudience: z.string(),
    startupStage: z.string(),
    pricingModel: z.string(),
    landingGoal: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fields } = RequestSchema.parse(body);

    console.log('🔍 Starting validation for fields:', Object.keys(fields));
    
    const validationResults = await validateInferredFields(fields);
    
    console.log('✅ Validation completed');

    return Response.json({ 
      success: true, 
      data: validationResults
    });
    
  } catch (err: any) {
    console.error('[API] validate-fields error:', err);
    
    return Response.json(
      { success: false, error: err.message ?? 'Validation failed' },
      { status: 500 }
    );
  }
}