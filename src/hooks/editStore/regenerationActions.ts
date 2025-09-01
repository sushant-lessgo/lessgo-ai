// hooks/editStore/regenerationActions.ts - NEW FILE

import { useOnboardingStore } from '../useOnboardingStore';
import { buildFullPrompt } from '@/modules/prompt/buildPrompt';
import type { EditStore, APIRequest } from '@/types/store';
import type { RegenerationActions } from '@/types/store/actions';
import type { CanonicalFieldName, InputVariables, HiddenInferredFields } from '@/types/core/index';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createPageStoreView = (editState: EditStore) => ({
  layout: {
    sections: editState.sections,
    sectionLayouts: editState.sectionLayouts,
    theme: editState.theme,
    globalSettings: editState.globalSettings,
  },
  content: editState.content,
  ui: { mode: editState.mode },
  meta: { onboardingData: editState.onboardingData },
});

const extractHiddenFields = (inputs: InputVariables & HiddenInferredFields): HiddenInferredFields => {
  const hiddenFieldKeys = [
    'awarenessLevel', 'copyIntent', 'toneProfile', 
    'marketSophisticationLevel', 'problemType'
  ];
  
  const hiddenFields: HiddenInferredFields = {};
  hiddenFieldKeys.forEach(key => {
    if (inputs[key as keyof typeof inputs]) {
      hiddenFields[key as keyof HiddenInferredFields] = inputs[key as keyof typeof inputs] as any;
    }
  });
  
  return hiddenFields;
};

const handleContentOnlyRegeneration = async (
  getState: () => EditStore, 
  setState: any
) => {
  const initialState = getState();
  
  try {
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = true;
      state.aiGeneration.currentOperation = 'page';
      state.aiGeneration.status = 'Regenerating content (preserving design)...';
      state.isLoading = true;
    });

    const updatedInputs = initialState.changeTracking.currentInputs;
    const tempOnboardingStore = {
      ...useOnboardingStore.getState(),
      validatedFields: updatedInputs,
      hiddenInferredFields: extractHiddenFields(updatedInputs),
    };

    const pageStoreView = createPageStoreView(initialState);
    const designContext = {
      sections: initialState.sections,
      sectionLayouts: initialState.sectionLayouts,
      theme: initialState.theme,
    };
    
    const prompt = `${buildFullPrompt(tempOnboardingStore, pageStoreView as any)}

CONTENT-ONLY REGENERATION:
- PRESERVE existing sections: ${designContext.sections.join(', ')}
- PRESERVE existing layouts: ${Object.entries(designContext.sectionLayouts).map(([id, layout]) => `${id}: ${layout}`).join(', ')}
- PRESERVE existing theme and colors
- ONLY update text content to reflect new business inputs`;

    const response = await fetch('/api/regenerate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt,
        preserveDesign: true,
        currentDesign: designContext,
        updatedInputs,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Content regeneration API error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: errorText,
      });
      throw new Error(`Content regeneration failed: ${response.status} - ${response.statusText}`);
    }

    const aiResponse = await response.json();
    
    // Apply the AI response to update the store content
    // Call updateFromAIResponse directly via set/get pattern
    const state = getState();
    if (state.updateFromAIResponse) {
      state.updateFromAIResponse(aiResponse);
    } else {
      console.error('updateFromAIResponse method not available - regeneration may not complete properly');
    }

    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
      state.aiGeneration.lastGenerated = Date.now();
      state.isLoading = false;
      state.persistence.isDirty = true;

      state.history.undoStack.push({
        type: 'content',
        description: 'Content-only regeneration from input changes',
        timestamp: Date.now(),
        beforeState: null,
        afterState: { regenerationType: 'content-only' },
      });
      state.history.redoStack = [];
    });

    // Auto-save
    const { completeSaveDraft } = await import('@/utils/autoSaveDraft');
    await completeSaveDraft(initialState.tokenId, {
      description: 'Content-only regeneration',
    });

  } catch (error) {
    console.error('Content-only regeneration failed:', error);
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
      const errorMessage = error instanceof Error ? error.message : 'Content regeneration failed';
      state.aiGeneration.errors.push(errorMessage);
      state.isLoading = false;
      
      // Add user-friendly error status
      state.aiGeneration.status = `Error: ${errorMessage}`;
    });
    throw error;
  }
};

const handleDesignAndCopyRegeneration = async (
  getState: () => EditStore, 
  setState: any
) => {
  const initialState = getState();
  
  try {
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = true;
      state.aiGeneration.currentOperation = 'page';
      state.aiGeneration.status = 'Regenerating design + content...';
      state.isLoading = true;
    });

    const updatedInputs = initialState.changeTracking.currentInputs;
    const currentSections = [...initialState.sections];

    // Step 1: Regenerate background system
    setState((state: EditStore) => {
      state.aiGeneration.status = 'Updating backgrounds and theme...';
    });

    const { generateCompleteBackgroundSystem } = await import('@/modules/Design/background/backgroundIntegration');
    const newBackgroundSystem = generateCompleteBackgroundSystem(updatedInputs);
    
    console.log('🎨 Design Regeneration - Generated new background system:', {
      primary: newBackgroundSystem.primary,
      secondary: newBackgroundSystem.secondary,
      neutral: newBackgroundSystem.neutral,
      divider: newBackgroundSystem.divider,
      baseColor: newBackgroundSystem.baseColor,
      accentColor: newBackgroundSystem.accentColor,
      accentCSS: newBackgroundSystem.accentCSS,
    });

    // Step 2: Regenerate section layouts (keeping same sections)
    setState((state: EditStore) => {
      state.aiGeneration.status = 'Updating section layouts...';
    });

    const { generateSectionLayouts } = await import('@/modules/sections/generateSectionLayouts');
    // Create a mock EditStore instance that provides the needed methods
    const mockEditStore = {
      getState: () => ({
        setSectionLayouts: (layouts: Record<string, string>) => {
          setState((state: EditStore) => {
            state.sectionLayouts = { ...state.sectionLayouts, ...layouts };
          });
        }
      })
    } as any;
    
    // This updates the store's sectionLayouts internally
    generateSectionLayouts(currentSections, mockEditStore);
    const updatedState = getState();
    const newLayouts = updatedState.sectionLayouts;
    

    // Step 3: Update theme with new background system
    setState((state: EditStore) => {
      console.log('🎨 Design Regeneration - Updating theme colors. Before:', {
        baseColor: state.theme.colors.baseColor,
        accentColor: state.theme.colors.accentColor,
        accentCSS: state.theme.colors.accentCSS,
        sectionBackgrounds: state.theme.colors.sectionBackgrounds,
      });
      
      state.theme.colors.baseColor = newBackgroundSystem.baseColor;
      state.theme.colors.accentColor = newBackgroundSystem.accentColor;
      state.theme.colors.accentCSS = newBackgroundSystem.accentCSS; // ✅ CRITICAL: This makes buttons/CTAs change color
      state.theme.colors.sectionBackgrounds = {
        primary: newBackgroundSystem.primary,
        secondary: newBackgroundSystem.secondary,
        neutral: newBackgroundSystem.neutral,
        divider: newBackgroundSystem.divider,
      };
      
      console.log('🎨 Design Regeneration - Updated theme colors. After:', {
        baseColor: state.theme.colors.baseColor,
        accentColor: state.theme.colors.accentColor,
        accentCSS: state.theme.colors.accentCSS,
        sectionBackgrounds: state.theme.colors.sectionBackgrounds,
      });
      
      state.aiGeneration.status = 'Generating copy with new design...';
    });

    // Step 4: Generate copy with updated design context
    const tempOnboardingStore = {
      ...useOnboardingStore.getState(),
      validatedFields: updatedInputs,
      hiddenInferredFields: extractHiddenFields(updatedInputs),
    };

    const updatedPageStoreView = createPageStoreView(getState());
    const prompt = buildFullPrompt(tempOnboardingStore, updatedPageStoreView as any);

    const response = await fetch('/api/regenerate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt,
        preserveDesign: false,
        updatedInputs,
        newDesign: {
          sections: currentSections,
          sectionLayouts: newLayouts,
          backgroundSystem: newBackgroundSystem,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Design + copy regeneration API error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: errorText,
      });
      throw new Error(`Design + copy regeneration failed: ${response.status} - ${response.statusText}`);
    }

    const aiResponse = await response.json();
    
    // Apply the AI response to update the store content
    // Call updateFromAIResponse directly via set/get pattern
    const state = getState();
    if (state.updateFromAIResponse) {
      state.updateFromAIResponse(aiResponse);
    } else {
      console.error('updateFromAIResponse method not available - regeneration may not complete properly');
    }

    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
      state.aiGeneration.lastGenerated = Date.now();
      state.isLoading = false;
      state.persistence.isDirty = true;

      state.history.undoStack.push({
        type: 'content',
        description: 'Design + copy regeneration from input changes',
        timestamp: Date.now(),
        beforeState: null,
        afterState: { 
          regenerationType: 'design-and-copy',
          changedFields: [...state.changeTracking.changedFields],
        },
      });
      state.history.redoStack = [];
    });

    // Auto-save
    const { completeSaveDraft } = await import('@/utils/autoSaveDraft');
    await completeSaveDraft(initialState.tokenId, {
      description: 'Design + copy regeneration',
    });

  } catch (error) {
    console.error('Design + copy regeneration failed:', error);
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
      const errorMessage = error instanceof Error ? error.message : 'Design + copy regeneration failed';
      state.aiGeneration.errors.push(errorMessage);
      state.isLoading = false;
      
      // Add user-friendly error status
      state.aiGeneration.status = `Error: ${errorMessage}`;
    });
    throw error;
  }
};

export function createRegenerationActions(set: any, get: () => EditStore): RegenerationActions {
  return {
    regenerateContentOnly: async () => {
      await handleContentOnlyRegeneration(get, set);
    },

    regenerateDesignAndCopy: async () => {
      await handleDesignAndCopyRegeneration(get, set);
    },

    regenerateWithInputs: async (preserveDesign: boolean = false) => {
      if (preserveDesign) {
        await handleContentOnlyRegeneration(get, set);
      } else {
        await handleDesignAndCopyRegeneration(get, set);
      }
    },

    trackInputChange: (field: CanonicalFieldName, newValue: string) => {
      set((state: EditStore) => {
        // Update current inputs
        (state.changeTracking.currentInputs as any)[field] = newValue;
        
        // Track changed fields
        if ((state.changeTracking.originalInputs as any)[field] !== newValue) {
          if (!state.changeTracking.changedFields.includes(field)) {
            state.changeTracking.changedFields.push(field);
          }
        } else {
          // Remove from changed fields if value matches original
          state.changeTracking.changedFields = state.changeTracking.changedFields.filter(f => f !== field);
        }
        
        // Update tracking state
        state.changeTracking.hasChanges = state.changeTracking.changedFields.length > 0;
        state.changeTracking.lastChangeTimestamp = Date.now();
      });
    },

    getHasFieldChanges: () => {
      const state = get();
      return state.changeTracking.hasChanges;
    },

    resetChangeTracking: () => {
      set((state: EditStore) => {
        // Reset original to current
        state.changeTracking.originalInputs = { ...state.changeTracking.currentInputs };
        state.changeTracking.changedFields = [];
        state.changeTracking.hasChanges = false;
        state.changeTracking.lastChangeTimestamp = Date.now();
      });
    },
  };
}