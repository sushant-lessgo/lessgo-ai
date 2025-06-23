// /utils/autoSaveDraft.ts

// Types matching the store and API structure
interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

interface FeatureItem {
  feature: string;
  benefit: string;
}

interface HiddenInferredFields {
  awarenessLevel?: string;
  copyIntent?: string;
  brandTone?: string;
  layoutPersona?: string;
  [key: string]: string | undefined;
}

interface AutoSaveDraftParams {
  tokenId: string;
  inputText?: string;
  stepIndex?: number;
  confirmedFields?: Record<string, ConfirmedFieldData>;
  validatedFields?: Record<string, string>;
  featuresFromAI?: FeatureItem[];
  hiddenInferredFields?: HiddenInferredFields;
  title?: string;
  themeValues?: any;
}

/**
 * Auto-saves onboarding progress to the database
 * Uses progressive saving - only updates provided fields, preserves existing data
 */
export async function autoSaveDraft(params: AutoSaveDraftParams): Promise<boolean> {
  const {
    tokenId,
    inputText,
    stepIndex,
    confirmedFields,
    validatedFields,
    featuresFromAI,
    hiddenInferredFields,
    title,
    themeValues,
  } = params;

  // Validation
  if (!tokenId) {
    console.error('autoSaveDraft: tokenId is required');
    return false;
  }

  try {
    console.log('🔄 Auto-saving draft...', {
      tokenId: tokenId.substring(0, 8) + '...',
      stepIndex,
      hasInputText: !!inputText,
      confirmedFieldsCount: confirmedFields ? Object.keys(confirmedFields).length : 0,
      validatedFieldsCount: validatedFields ? Object.keys(validatedFields).length : 0,
      featuresCount: featuresFromAI?.length || 0,
      hiddenFieldsCount: hiddenInferredFields ? Object.keys(hiddenInferredFields).length : 0,
    });

    const response = await fetch("/api/saveDraft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tokenId,
        inputText,
        stepIndex,
        confirmedFields: confirmedFields || {},
        validatedFields: validatedFields || {},
        featuresFromAI: featuresFromAI || [],
        hiddenInferredFields: hiddenInferredFields || {},
        title,
        themeValues,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Auto-save failed: ${response.status} ${response.statusText}. ${errorData.error || ''}`);
    }

    const result = await response.json();
    console.log('✅ Auto-save successful', {
      stepIndex: result.stepIndex,
      timestamp: result.timestamp,
    });

    return true;

  } catch (err) {
    console.error("❌ Auto-save failed:", err);
    
    // Don't throw - auto-save failures should not block user flow
    // The app should continue working even if saves fail
    return false;
  }
}

/**
 * Convenience function for saving just the input text (Step 1)
 */
export async function autoSaveInput(tokenId: string, inputText: string): Promise<boolean> {
  return autoSaveDraft({
    tokenId,
    inputText,
    stepIndex: 0,
  });
}

/**
 * Convenience function for saving confirmed fields from AI inference
 */
export async function autoSaveConfirmedFields(
  tokenId: string, 
  confirmedFields: Record<string, ConfirmedFieldData>,
  stepIndex: number = 0
): Promise<boolean> {
  return autoSaveDraft({
    tokenId,
    confirmedFields,
    stepIndex,
  });
}

/**
 * Convenience function for saving user-validated fields
 */
export async function autoSaveValidatedFields(
  tokenId: string,
  validatedFields: Record<string, string>,
  stepIndex: number
): Promise<boolean> {
  return autoSaveDraft({
    tokenId,
    validatedFields,
    stepIndex,
  });
}

/**
 * Convenience function for saving features from AI
 */
export async function autoSaveFeatures(
  tokenId: string,
  featuresFromAI: FeatureItem[]
): Promise<boolean> {
  return autoSaveDraft({
    tokenId,
    featuresFromAI,
  });
}

/**
 * Convenience function for saving hidden inferred fields
 */
export async function autoSaveHiddenFields(
  tokenId: string,
  hiddenInferredFields: HiddenInferredFields
): Promise<boolean> {
  return autoSaveDraft({
    tokenId,
    hiddenInferredFields,
  });
}