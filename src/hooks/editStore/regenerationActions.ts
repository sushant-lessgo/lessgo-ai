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
  const state = getState();
  
  try {
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = true;
      state.aiGeneration.currentOperation = 'page';
      state.aiGeneration.status = 'Regenerating content (preserving design)...';
      state.isLoading = true;
    });

    const updatedInputs = state.changeTracking.currentInputs;
    const tempOnboardingStore = {
      ...useOnboardingStore.getState(),
      validatedFields: updatedInputs,
      hiddenInferredFields: extractHiddenFields(updatedInputs),
    };

    const pageStoreView = createPageStoreView(state);
    const designContext = {
      sections: state.sections,
      sectionLayouts: state.sectionLayouts,
      theme: state.theme,
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
      throw new Error(`Content regeneration failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    get().updateFromAIResponse(aiResponse);

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
    await completeSaveDraft(state.tokenId, {
      description: 'Content-only regeneration',
      source: 'edit',
    });

  } catch (error) {
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
      state.aiGeneration.errors.push(
        error instanceof Error ? error.message : 'Content regeneration failed'
      );
      state.isLoading = false;
    });
    throw error;
  }
};

const handleDesignAndCopyRegeneration = async (
  getState: () => EditStore, 
  setState: any
) => {
  const state = getState();
  
  try {
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = true;
      state.aiGeneration.currentOperation = 'page';
      state.aiGeneration.status = 'Regenerating design + content...';
      state.isLoading = true;
    });

    const updatedInputs = state.changeTracking.currentInputs;
    const currentSections = [...state.sections];

    // Step 1: Regenerate background system
    setState((state: EditStore) => {
      state.aiGeneration.status = 'Updating backgrounds and theme...';
    });

    const { generateCompleteBackgroundSystem } = await import('@/modules/Design/background/backgroundIntegration');
    const newBackgroundSystem = generateCompleteBackgroundSystem(updatedInputs);

    // Step 2: Regenerate section layouts (keeping same sections)
    setState((state: EditStore) => {
      state.aiGeneration.status = 'Updating section layouts...';
    });

    const { generateSectionLayouts } = await import('@/modules/sections/generateSectionLayouts');
    // This updates the store's sectionLayouts internally
    generateSectionLayouts(currentSections);
    const updatedState = getState();
    const newLayouts = updatedState.sectionLayouts;

    // Step 3: Update theme with new background system
    setState((state: EditStore) => {
      state.theme.colors.baseColor = newBackgroundSystem.baseColor;
      state.theme.colors.accentColor = newBackgroundSystem.accentColor;
      state.theme.colors.sectionBackgrounds = {
        primary: newBackgroundSystem.primary,
        secondary: newBackgroundSystem.secondary,
        neutral: newBackgroundSystem.neutral,
        divider: newBackgroundSystem.divider,
      };
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
      throw new Error(`Design + copy regeneration failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    get().updateFromAIResponse(aiResponse);

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
    await completeSaveDraft(state.tokenId, {
      description: 'Design + copy regeneration',
      source: 'edit',
    });

  } catch (error) {
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
      state.aiGeneration.errors.push(
        error instanceof Error ? error.message : 'Design + copy regeneration failed'
      );
      state.isLoading = false;
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
        state.changeTracking.currentInputs[field as keyof typeof state.changeTracking.currentInputs] = newValue as any;
        
        // Track changed fields
        if (state.changeTracking.originalInputs[field as keyof typeof state.changeTracking.originalInputs] !== newValue) {
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