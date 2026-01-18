// src/modules/inference/generateFeatures.ts
// STUB: Placeholder for archived feature generation
// Actual implementation archived - see archive/onboarding-v1/

import type { InputVariables } from '@/types/core/content';

export interface FeatureItem {
  feature: string;
  benefit: string;
}

// Stub function - returns empty array
// Will be replaced by new generation system
export async function generateFeatures(
  _inputVariables: Partial<InputVariables>,
  _oneLiner?: string
): Promise<FeatureItem[]> {
  console.warn('generateFeatures: Stub function called - use new generation system');
  return [];
}

export default generateFeatures;
