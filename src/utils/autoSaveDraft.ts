// utils/autoSaveDraft.ts - Minimal type-safe fix for existing functionality

import type { FeatureItem, InputVariables, HiddenInferredFields } from '@/types/core/index';
import { usePageStore } from '@/hooks/usePageStore';

// Interface to match what's being passed from onboarding
interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

interface AutoSaveDraftParams {
  tokenId: string;
  inputText?: string;
  stepIndex?: number;
  confirmedFields?: Record<string, ConfirmedFieldData>;
  validatedFields?: Record<string, string>;
  featuresFromAI?: FeatureItem[]; // Use proper type instead of generic array
  hiddenInferredFields?: HiddenInferredFields; // Use proper type
  title?: string;
  includePageData?: boolean;
}

export async function autoSaveDraft(params: AutoSaveDraftParams) {
  const {
    tokenId,
    inputText,
    stepIndex,
    confirmedFields = {},
    validatedFields = {},
    featuresFromAI = [],
    hiddenInferredFields = {},
    title,
    includePageData = false
  } = params;

  try {
    // Prepare the base payload - keep exact same structure as before
    const payload: any = {
      tokenId,
      inputText,
      stepIndex,
      confirmedFields,
      validatedFields,
      featuresFromAI,
      hiddenInferredFields,
      title,
    };

    // Include page data if requested - exact same logic as before
    if (includePageData) {
      let pageData: any;
      try {
        const { useEditStore } = await import('@/hooks/useEditStore');
        const editStore = useEditStore.getState();
        pageData = editStore.export();
        console.log('💾 Using edit store data for auto-save');
      } catch (error) {
        console.log('💾 Edit store not available, using page store');
        const pageStore = usePageStore.getState();
        pageData = pageStore.export();
      }
          
      payload.finalContent = {
        layout: pageData?.layout || {},
        content: pageData?.content || {},
        meta: pageData?.meta || {},
        generatedAt: Date.now(),
      };
      
      console.log('💾 Auto-saving with complete page data:', {
        sections: pageData?.layout?.sections?.length || 0,
        content: Object.keys(pageData?.content || {}).length,
        hasTheme: !!(pageData?.layout?.theme),
      });
    }

    // Add theme values - exact same logic as before
    try {
      const { getColorTokens } = usePageStore.getState();
      const colorTokens = getColorTokens();
      payload.themeValues = {
        primary: colorTokens.accent,
        background: colorTokens.bgNeutral,
        muted: colorTokens.textMuted,
      };
    } catch (error) {
      console.warn('Could not get color tokens for theme values:', error);
    }

    console.log('💾 Auto-saving draft:', { 
      tokenId, 
      stepIndex, 
      hasInputText: !!inputText,
      hasConfirmedFields: Object.keys(confirmedFields).length > 0,
      confirmedFieldsCount: Object.keys(confirmedFields).length,
      includePageData,
      payloadKeys: Object.keys(payload)
    });

    const response = await fetch('/api/saveDraft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Auto-save successful:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Auto-save failed:', error);
    throw error;
  }
}