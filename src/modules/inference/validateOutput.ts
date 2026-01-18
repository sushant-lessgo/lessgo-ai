// src/modules/inference/validateOutput.ts
// STUB: Placeholder for archived field validation
// Actual implementation archived - see archive/onboarding-v1/

import type { InputVariables } from '@/types/core/content';

export interface ValidatedField {
  value: string;
  confidence: number;
  alternatives?: string[];
}

export interface ValidationResult {
  validated: Partial<InputVariables>;
  confidence: Record<string, ValidatedField>;
}

// Stub function - returns input as-is
// Will be replaced by new generation system
export async function validateOutput(
  rawFields: Partial<InputVariables>
): Promise<ValidationResult> {
  console.warn('validateOutput: Stub function called - use new generation system');
  return {
    validated: rawFields,
    confidence: {},
  };
}

// Alias for API compatibility (used by validate-fields route)
export const validateInferredFields = validateOutput;

export default validateOutput;
