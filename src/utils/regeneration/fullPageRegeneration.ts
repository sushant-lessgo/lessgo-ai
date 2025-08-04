// ================================================================
// utils/regeneration/fullPageRegeneration.ts - NEW FILE
// ================================================================

import type { InputVariables, HiddenInferredFields } from '@/types/core';

export interface FullPageRegenerationRequest {
  tokenId: string;
  updatedInputs: InputVariables & HiddenInferredFields;
  preserveDesign: false;
}

export interface FullPageRegenerationResponse {
  success: boolean;
  sections: string[];
  sectionLayouts: Record<string, string>;
  content: Record<string, any>;
  theme: any;
  warnings: string[];
}

export async function regenerateFullPage(
  request: FullPageRegenerationRequest
): Promise<FullPageRegenerationResponse> {
  try {
    const response = await fetch('/api/regenerate-landing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Full regeneration failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Full page regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}