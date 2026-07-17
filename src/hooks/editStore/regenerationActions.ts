// hooks/editStore/regenerationActions.ts
// ============================================================================
// The page-regen callers. Until regen-modernization phase 5 this file was the
// app's ONE remaining CLIENT-SIDE prompt builder: it ran `buildFullPrompt` in
// the browser and POSTed the resulting prose to an ungated `/api/regenerate-
// content`, which forwarded it to OpenAI (the H3 hole). Both callers now send
// STRUCTURE ONLY — tokenId + sections + sectionLayouts + the unsaved field edits
// — and the server builds the prompt from persisted project state (D4).
//
// Unchanged on purpose:
//  • Design randomization stays HERE (D4) — layouts/background are randomized
//    client-side, then sent as validated structure.
//  • The WHOLE response JSON still goes to `updateFromAIResponse(aiResponse,
//    elementsMap)` (D8) — the route preserves that wire shape, so
//    `generationActions.ts` needed no change.
// ============================================================================

import { getCompleteElementsMap } from '@/modules/sections/elementDetermination';
import type { EditStore } from '@/types/store';
import type { RegenerationActions } from '@/types/store/actions';
import type { CanonicalFieldName } from '@/types/core/index';
import { logger } from '@/lib/logger';

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

/**
 * The route answers gate failures with an honest, user-renderable `message`
 * (402 credits, 422 unsupported_project / invalid_scope, 500 generation_failed).
 * Surface it — phase 4's lesson: discarding the body leaves the user staring at
 * `API error: 422` while the reason sits unread on the wire.
 */
const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const data = await response.json();
    return data?.message || data?.error || `${fallback}: ${response.status}`;
  } catch {
    return `${fallback}: ${response.status} - ${response.statusText}`;
  }
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

    // Structure only — the server builds the prompt from persisted project state
    // + these fields. `preserveDesign: true` keeps sections/layouts/theme as-is.
    const response = await fetch('/api/regenerate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenId: initialState.tokenId,
        preserveDesign: true,
        sections: initialState.sections,
        sectionLayouts: initialState.sectionLayouts,
        updatedInputs,
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Content regeneration failed'));
    }

    const aiResponse = await response.json();

    // Compute elements map for regenerated content
    const state = getState();
    const elementsMap = getCompleteElementsMap(
      state.onboardingData as any,
      createPageStoreView(state) as any
    );

    logger.debug('🔄 [REGENERATION] Computed elementsMap for regeneration:', {
      sections: Object.keys(elementsMap),
      totalExclusions: Object.values(elementsMap).reduce((sum: number, s: any) =>
        sum + (s.excludedElements?.length || 0), 0)
    });

    // Apply the AI response to update the store content
    if (state.updateFromAIResponse) {
      state.updateFromAIResponse(aiResponse, elementsMap);
    } else {
      logger.error('updateFromAIResponse method not available - regeneration may not complete properly');
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
    logger.error('Content-only regeneration failed:', error);
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
    

    // Step 2: Regenerate section layouts (keeping same sections)
    setState((state: EditStore) => {
      state.aiGeneration.status = 'Updating section layouts...';
    });

    const { layoutRegistry } = await import('@/modules/sections/layoutRegistry');

    // Simple random layout selection from active layouts
    const sectionToRegistryKey: Record<string, keyof typeof layoutRegistry> = {
      hero: 'Hero',
      features: 'Features',
      pricing: 'Pricing',
      testimonials: 'Testimonial',
      faq: 'FAQ',
      cta: 'CTA',
      problem: 'Problem',
      results: 'Results',
      socialProof: 'SocialProof',
      howItWorks: 'HowItWorks',
      beforeAfter: 'BeforeAfter',
      founderNote: 'FounderNote',
      uniqueMechanism: 'UniqueMechanism',
      useCases: 'UseCase',
      objectionHandling: 'Objection',
      header: 'Header',
      footer: 'Footer',
    };

    const newLayouts: Record<string, string> = {};
    currentSections.forEach((sectionId: string) => {
      const registryKey = sectionToRegistryKey[sectionId];
      if (registryKey && layoutRegistry[registryKey]) {
        const layouts = layoutRegistry[registryKey];
        // Random selection from available layouts
        newLayouts[sectionId] = layouts[Math.floor(Math.random() * layouts.length)];
      }
    });

    // Update store with new layouts
    setState((state: EditStore) => {
      state.sectionLayouts = { ...state.sectionLayouts, ...newLayouts };
    });
    

    // Step 3: Update theme with new background system
    setState((state: EditStore) => {
      logger.dev('🎨 Design Regeneration - Updating theme colors. Before:', () => ({
        baseColor: state.theme.colors.baseColor,
        accentColor: state.theme.colors.accentColor,
        accentCSS: state.theme.colors.accentCSS,
        sectionBackgrounds: state.theme.colors.sectionBackgrounds,
      }));
      
      state.theme.colors.baseColor = newBackgroundSystem.baseColor;
      state.theme.colors.accentColor = newBackgroundSystem.accentColor;
      state.theme.colors.accentCSS = newBackgroundSystem.accentCSS; // ✅ CRITICAL: This makes buttons/CTAs change color
      state.theme.colors.sectionBackgrounds = {
        primary: newBackgroundSystem.primary,
        secondary: newBackgroundSystem.secondary,
        neutral: newBackgroundSystem.neutral,
      };
      
      
      state.aiGeneration.status = 'Generating copy with new design...';
    });

    // Step 4: Generate copy against the design we just randomized. The FRESH
    // layouts go out as structure (D4) — read back off the store so every
    // section carries the layout the page will actually render.
    const response = await fetch('/api/regenerate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenId: initialState.tokenId,
        preserveDesign: false,
        sections: currentSections,
        sectionLayouts: getState().sectionLayouts,
        updatedInputs,
        backgroundSystem: newBackgroundSystem,
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Design + copy regeneration failed'));
    }

    const aiResponse = await response.json();

    // Compute elements map for regenerated content
    const state = getState();
    const elementsMap = getCompleteElementsMap(
      state.onboardingData as any,
      createPageStoreView(state) as any
    );

    logger.debug('🔄 [REGENERATION] Computed elementsMap for regeneration:', {
      sections: Object.keys(elementsMap),
      totalExclusions: Object.values(elementsMap).reduce((sum: number, s: any) =>
        sum + (s.excludedElements?.length || 0), 0)
    });

    // Apply the AI response to update the store content
    if (state.updateFromAIResponse) {
      state.updateFromAIResponse(aiResponse, elementsMap);
    } else {
      logger.error('updateFromAIResponse method not available - regeneration may not complete properly');
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
    logger.error('Design + copy regeneration failed:', error);
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