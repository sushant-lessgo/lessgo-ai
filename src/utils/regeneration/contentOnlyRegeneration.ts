import type { InputVariables, HiddenInferredFields } from '@/types/core/index';

export interface ContentOnlyRegenerationRequest {
  tokenId: string;
  updatedInputs: InputVariables & HiddenInferredFields;
  preserveDesign: true;
  currentDesign: {
    sections: string[];
    sectionLayouts: Record<string, string>;
    theme: any;
  };
}

export interface ContentOnlyRegenerationResponse {
  success: boolean;
  content: Record<string, any>;
  warnings: string[];
  preservedElements: string[];
  updatedElements: string[];
}

export async function regenerateContentOnly(
  request: ContentOnlyRegenerationRequest
): Promise<ContentOnlyRegenerationResponse> {
  try {
    const response = await fetch('/api/regenerate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Content regeneration failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Content-only regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}