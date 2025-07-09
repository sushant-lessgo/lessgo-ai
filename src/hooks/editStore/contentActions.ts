// hooks/editStore/contentActions.ts - Content and AI generation actions
import { useOnboardingStore } from '../useOnboardingStore';
import { buildFullPrompt, buildSectionPrompt, buildElementPrompt } from '@/modules/prompt/buildPrompt';
import { parseAiResponse } from '@/modules/prompt/parseAiResponse';
import type { BackgroundType } from '@/types/core/index';
import type { EditStore, APIRequest, ValidationError } from '@/types/store';
import type { ContentActions } from '@/types/store';
import type { ElementSelection } from '@/types/core/ui';
import type { ImageAsset } from '@/types/core/images';

/**
 * ===== UTILITY FUNCTIONS =====
 */

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Infer element type from element key
const inferElementType = (elementKey: string) => {
  if (elementKey.includes('headline')) return 'headline';
  if (elementKey.includes('subheadline')) return 'subheadline';
  if (elementKey.includes('cta')) return 'button';
  if (elementKey.includes('image')) return 'image';
  if (elementKey.includes('video')) return 'video';
  if (elementKey.includes('form')) return 'form';
  if (elementKey.includes('list') || elementKey.includes('items')) return 'list';
  if (elementKey.includes('rich') || elementKey.includes('html')) return 'richtext';
  return 'text';
};

// Create a PageStore-compatible interface for prompt building
const createPageStoreView = (editState: EditStore) => ({
  layout: {
    sections: editState.sections,
    sectionLayouts: editState.sectionLayouts,
    theme: editState.theme,
    globalSettings: editState.globalSettings,
  },
  content: editState.content,
  ui: {
    mode: editState.mode,
  },
  meta: {
    onboardingData: editState.onboardingData,
  },
});

/**
 * ===== API REQUEST PROCESSING =====
 */

// Process API queue to prevent overwhelming the server
const processAPIQueue = async (getState: () => EditStore, setState: any) => {
  const state = getState();
  if (state.apiQueue.processing || state.apiQueue.queue.length === 0) return;
  
  setState((state: EditStore) => {
    state.apiQueue.processing = true;
  });
  
  while (state.apiQueue.queue.length > 0) {
    if (state.apiQueue.rateLimitRemaining <= 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setState((state: EditStore) => {
        state.apiQueue.rateLimitRemaining = 100;
        state.apiQueue.rateLimitReset = Date.now() + 60000;
      });
    }
    
    const request = state.apiQueue.queue.shift();
    if (!request) break;
    
    try {
      await processAPIRequest(request, getState, setState);
      setState((state: EditStore) => {
        state.apiQueue.rateLimitRemaining -= 1;
      });
    } catch (error) {
      console.error('API request failed:', error);
      if (request.retries < 3) {
        request.retries += 1;
        setState((state: EditStore) => {
          state.apiQueue.queue.unshift(request);
        });
      }
    }
  }
  
  setState((state: EditStore) => {
    state.apiQueue.processing = false;
  });
};

// Process individual API request
const processAPIRequest = async (request: APIRequest, getState: () => EditStore, setState: any) => {
  switch (request.type) {
    case 'regenerate-section':
      await handleSectionRegeneration(request.payload, getState, setState);
      break;
    case 'regenerate-element':
      await handleElementRegeneration(request.payload, getState, setState);
      break;
    case 'save-draft':
      await handleDraftSave(request.payload, getState, setState);
      break;
    default:
      console.warn('Unknown API request type:', request.type);
  }
};

// Handle section regeneration
const handleSectionRegeneration = async (
  payload: { sectionId: string; userGuidance?: string }, 
  getState: () => EditStore, 
  setState: any
) => {
  const state = getState();
  const { sectionId, userGuidance } = payload;
  
  try {
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = true;
      state.aiGeneration.currentOperation = 'section';
      state.aiGeneration.targetId = sectionId;
      state.aiGeneration.status = 'Regenerating section...';
      state.loadingStates[sectionId] = true;
    });
    
    const onboardingStore = useOnboardingStore.getState();
    const pageStoreView = createPageStoreView(state);
    const prompt = buildSectionPrompt(onboardingStore, pageStoreView as any, sectionId, userGuidance);
    
    const response = await fetch('/api/generate-landing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to regenerate section');
    }
    
    const aiResponse = await response.json();
    const parsed = parseAiResponse(aiResponse.content || aiResponse);
    
    setState((state: EditStore) => {
      if (parsed.content && parsed.content[sectionId]) {
        const sectionContent = parsed.content[sectionId];
        
        if (!state.content[sectionId]) {
          state.content[sectionId] = {
            id: sectionId,
            layout: state.sectionLayouts[sectionId] || 'default',
            elements: {},
            aiMetadata: {
              aiGenerated: true,
              lastGenerated: Date.now(),
              isCustomized: false,
              aiGeneratedElements: [],
            },
            editMetadata: {
              isSelected: false,
              isEditing: false,
              isDeletable: true,
              isMovable: true,
              isDuplicable: true,
              validationStatus: {
                isValid: true,
                errors: [],
                warnings: [],
                missingRequired: [],
                lastValidated: Date.now(),
              },
              completionPercentage: 100,
            },
          };
        }
        
        Object.entries(sectionContent).forEach(([elementKey, elementValue]) => {
          if (elementValue !== undefined && elementValue !== null) {
           state.content[sectionId].elements[elementKey] = {
              content: elementValue as string | string[],
              type: inferElementType(elementKey),
              isEditable: true,
              editMode: 'inline',
            };
          }
        });
        
        state.content[sectionId].aiMetadata.lastGenerated = Date.now();
        state.content[sectionId].aiMetadata.isCustomized = false;
        state.content[sectionId].aiMetadata.aiGeneratedElements = Object.keys(sectionContent);
      }
      
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
      state.aiGeneration.targetId = undefined;
      state.loadingStates[sectionId] = false;
      state.autoSave.isDirty = true;
    });

  } catch (error) {
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
      state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Section regeneration failed');
      state.loadingStates[sectionId] = false;
    });
    throw error;
  }
};

// Handle element regeneration
const handleElementRegeneration = async (
  payload: { sectionId: string; elementKey: string; variationCount: number }, 
  getState: () => EditStore, 
  setState: any
) => {
  const state = getState();
  const { sectionId, elementKey, variationCount } = payload;
  
  try {
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = true;
      state.aiGeneration.currentOperation = 'element';
      state.aiGeneration.targetId = `${sectionId}.${elementKey}`;
      state.aiGeneration.status = 'Generating variations...';
    });
    
    const onboardingStore = useOnboardingStore.getState();
    const pageStoreView = createPageStoreView(state);
    const prompt = buildElementPrompt(onboardingStore, pageStoreView as any, sectionId, elementKey, variationCount);
    
    const response = await fetch('/api/generate-landing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate element variations');
    }
    
    const aiResponse = await response.json();
    const variations = Array.isArray(aiResponse) ? aiResponse : [aiResponse];
    
    setState((state: EditStore) => {
      state.elementVariations.visible = true;
      state.elementVariations.elementId = `${sectionId}.${elementKey}`;
      state.elementVariations.variations = variations;
      state.elementVariations.selectedVariation = 0;
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
    });
    
  } catch (error) {
    setState((state: EditStore) => {
      state.aiGeneration.isGenerating = false;
      state.aiGeneration.currentOperation = null;
      state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Element regeneration failed');
    });
    throw error;
  }
};

// Handle draft save
const handleDraftSave = async (payload: any, getState: () => EditStore, setState: any) => {
  const state = getState();
  
  try {
    const { autoSaveDraft } = await import('@/utils/autoSaveDraft');
    
    await autoSaveDraft({
      tokenId: state.tokenId,
      inputText: state.onboardingData.oneLiner,
      validatedFields: state.onboardingData.validatedFields,
      featuresFromAI: state.onboardingData.featuresFromAI,
      hiddenInferredFields: state.onboardingData.hiddenInferredFields,
      title: state.title,
      includePageData: true,
    });
    
    setState((state: EditStore) => {
      state.autoSave.lastSaved = Date.now();
      state.autoSave.isDirty = false;
    });
    
  } catch (error) {
    setState((state: EditStore) => {
      state.autoSave.error = error instanceof Error ? error.message : 'Save failed';
    });
    throw error;
  }
};

/**
 * ===== CONTENT ACTIONS CREATOR =====
 */
export function createContentActions(set: any, get: any): ContentActions {
  return {
    /**
     * ===== BASIC CONTENT OPERATIONS =====
     */
    
    updateElementContent: (sectionId: string, elementKey: string, content: string | string[]) =>
  set((state: EditStore) => {
    if (!state.content[sectionId]) return;
    
    const oldValue = state.content[sectionId].elements[elementKey]?.content;
    
    if (!state.content[sectionId].elements[elementKey]) {
      state.content[sectionId].elements[elementKey] = {
        content,
        type: inferElementType(elementKey),
        isEditable: true,
        editMode: 'inline',
      };
    } else {
      state.content[sectionId].elements[elementKey].content = content;
    }
    
    // Mark as customized
    state.content[sectionId].aiMetadata.isCustomized = true;
    state.autoSave.isDirty = true;
    
    // Track change for auto-save
    state.queuedChanges.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'content',
      sectionId,
      elementKey,
      oldValue,
      newValue: content,
      timestamp: Date.now(),
    });
    
    // Add to history
    state.history.undoStack.push({
      type: 'content',
      description: `Updated ${elementKey} in ${sectionId}`,
      timestamp: Date.now(),
      beforeState: { sectionId, elementKey, content: oldValue },
      afterState: { sectionId, elementKey, content },
      sectionId,
    });
    
    state.history.redoStack = [];
  }),


    bulkUpdateSection: (sectionId: string, elements: Record<string, string | string[]>) =>
      set((state: EditStore) => {
        if (!state.content[sectionId]) return;
        
        const oldElements = { ...state.content[sectionId].elements };
        
        Object.entries(elements).forEach(([elementKey, content]) => {
          if (!state.content[sectionId].elements[elementKey]) {
            state.content[sectionId].elements[elementKey] = {
              content,
              type: inferElementType(elementKey),
              isEditable: true,
              editMode: 'inline',
            };
          } else {
            state.content[sectionId].elements[elementKey].content = content;
          }
        });
        
        state.content[sectionId].aiMetadata.isCustomized = true;
        state.autoSave.isDirty = true;
        
        // Track bulk change
        state.history.undoStack.push({
          type: 'content',
          description: `Bulk updated ${Object.keys(elements).length} elements in ${sectionId}`,
          timestamp: Date.now(),
          beforeState: { sectionId, elements: oldElements },
          afterState: { sectionId, elements: state.content[sectionId].elements },
          sectionId,
        });
        
        state.history.redoStack = [];
      }),

    setBackgroundType: (sectionId: string, backgroundType: BackgroundType) =>
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          const oldBackgroundType = state.content[sectionId].backgroundType;
          state.content[sectionId].backgroundType = backgroundType;
          state.autoSave.isDirty = true;
          
          // Track change
          state.history.undoStack.push({
            type: 'content',
            description: `Changed background type to ${backgroundType}`,
            timestamp: Date.now(),
            beforeState: { sectionId, backgroundType: oldBackgroundType },
            afterState: { sectionId, backgroundType },
            sectionId,
          });
          
          state.history.redoStack = [];
        }
      }),

    markAsCustomized: (sectionId: string) =>
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          state.content[sectionId].aiMetadata.isCustomized = true;
          state.autoSave.isDirty = true;
        }
      }),

    setSection: (sectionId: string, sectionData: Partial<any>) =>
  set((state: EditStore) => {
    if (state.content[sectionId]) {
      const oldSection = { ...state.content[sectionId] };
      
      // Merge new data
      Object.assign(state.content[sectionId], sectionData);
      
      // Track change
      state.queuedChanges.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'content',
        sectionId,
        oldValue: oldSection,
        newValue: state.content[sectionId],
        timestamp: Date.now(),
      });
      
      state.autoSave.isDirty = true;
      state.lastUpdated = Date.now();
      
      // Add to history
      state.history.undoStack.push({
        type: 'content',
        description: `Updated section data`,
        timestamp: Date.now(),
        beforeState: { sectionId, data: oldSection },
        afterState: { sectionId, data: state.content[sectionId] },
        sectionId,
      });
      
      state.history.redoStack = [];
    }
  }),

    /**
     * ===== AI GENERATION ACTIONS =====
     */
    
    regenerateSection: async (sectionId: string, userGuidance?: string) => {
      const request: APIRequest = {
        id: generateId(),
        type: 'regenerate-section',
        payload: { sectionId, userGuidance },
        priority: 1,
        timestamp: Date.now(),
        retries: 0,
      };
      
      set((state: EditStore) => {
        state.apiQueue.queue.push(request);
      });
      
      // Process queue
      processAPIQueue(get, set);
    },
    
    regenerateElement: async (sectionId: string, elementKey: string, variationCount: number = 5) => {
      const request: APIRequest = {
        id: generateId(),
        type: 'regenerate-element',
        payload: { sectionId, elementKey, variationCount },
        priority: 2,
        timestamp: Date.now(),
        retries: 0,
      };
      
      set((state: EditStore) => {
        state.apiQueue.queue.push(request);
      });
      
      // Process queue
      processAPIQueue(get, set);
    },
    
    regenerateAllContent: async () => {
      const state = get();
      
      set((state: EditStore) => {
        state.isLoading = true;
        state.aiGeneration.isGenerating = true;
        state.aiGeneration.currentOperation = 'page';
        state.aiGeneration.status = 'Regenerating all content...';
      });
      
      try {
        // Build full page prompt
        const onboardingStore = useOnboardingStore.getState();
        const pageStoreView = createPageStoreView(state);
        const prompt = buildFullPrompt(onboardingStore, pageStoreView as any);
        
        // Call AI generation API
        const response = await fetch('/api/generate-landing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to regenerate content');
        }
        
        const aiResponse = await response.json();
        get().updateFromAIResponse(aiResponse);
        
      } catch (error) {
        set((state: EditStore) => {
          state.aiGeneration.isGenerating = false;
          state.aiGeneration.currentOperation = null;
          state.aiGeneration.errors.push(error instanceof Error ? error.message : 'Content regeneration failed');
          state.isLoading = false;
        });
        throw error;
      }
    },
    
    updateFromAIResponse: (aiResponse: any) =>
      set((state: EditStore) => {
        // Update AI generation status
        state.aiGeneration.isGenerating = false;
        state.aiGeneration.currentOperation = null;
        state.aiGeneration.lastGenerated = Date.now();
        state.aiGeneration.errors = aiResponse.errors || [];
        state.aiGeneration.warnings = aiResponse.warnings || [];
        
        // Process content from AI response
        if (aiResponse.content && typeof aiResponse.content === 'object') {
          Object.entries(aiResponse.content).forEach(([sectionId, sectionData]: [string, any]) => {
            if (!sectionData || typeof sectionData !== 'object') return;
            
            // Ensure section exists in layout
            if (!state.sections.includes(sectionId)) {
              state.sections.push(sectionId);
            }
            
            // Create or update section
            if (!state.content[sectionId]) {
              state.content[sectionId] = {
                id: sectionId,
                layout: state.sectionLayouts[sectionId] || 'default',
                elements: {},
                aiMetadata: {
                  aiGenerated: true,
                  lastGenerated: Date.now(),
                  isCustomized: false,
                  aiGeneratedElements: [],
                },
                editMetadata: {
                  isSelected: false,
                  isEditing: false,
                  isDeletable: true,
                  isMovable: true,
                  isDuplicable: true,
                  validationStatus: {
                    isValid: true,
                    errors: [],
                    warnings: [],
                    missingRequired: [],
                    lastValidated: Date.now(),
                  },
                  completionPercentage: 100,
                },
              };
            }
            
            // Update elements
            const section = state.content[sectionId]!;
            const generatedElements: string[] = [];

            Object.entries(sectionData).forEach(([elementKey, elementValue]: [string, any]) => {
              if (elementValue !== undefined && elementValue !== null) {
                section.elements[elementKey] = {
                  content: elementValue as string | string[],
                  type: inferElementType(elementKey),
                  isEditable: true,
                  editMode: 'inline',
                };
                generatedElements.push(elementKey);
              }
            });
            
            // Update AI metadata
            section.aiMetadata = {
              ...section.aiMetadata,
              lastGenerated: Date.now(),
              isCustomized: false,
              aiGeneratedElements: generatedElements,
            };
          });
        }
        
        state.autoSave.isDirty = true;
        state.isLoading = false;
        
        // Add to history
        state.history.undoStack.push({
          type: 'content',
          description: 'Updated content from AI response',
          timestamp: Date.now(),
          beforeState: null,
          afterState: { aiResponse: true },
        });
        
        state.history.redoStack = [];
      }),
    
    setAIGenerationStatus: (status: Partial<EditStore['aiGeneration']>) =>
      set((state: EditStore) => {
        Object.assign(state.aiGeneration, status);
      }),
    
    clearAIErrors: () =>
      set((state: EditStore) => {
        state.aiGeneration.errors = [];
        state.aiGeneration.warnings = [];
      }),

    /**
     * ===== ELEMENT VARIATIONS =====
     */
    
   showElementVariations: (elementId: string, variations: string[]) =>
  set((state: EditStore) => {
    state.elementVariations = {
      visible: true,
      elementId,
      variations,
      selectedVariation: 0,
    };
  }),

    
    hideElementVariations: () =>
      set((state: EditStore) => {
        state.elementVariations.visible = false;
        state.elementVariations.elementId = undefined;
        state.elementVariations.variations = [];
        state.elementVariations.selectedVariation = undefined;
      }),
    
    selectVariation: (index: number) =>
      set((state: EditStore) => {
        state.elementVariations.selectedVariation = index;
      }),
    
    applySelectedVariation: () =>
  set((state: EditStore) => {
    const { elementId, variations, selectedVariation } = state.elementVariations;
    if (!elementId || selectedVariation === undefined) return;
    
    const [sectionId, elementKey] = elementId.split('.');
    const selectedContent = variations[selectedVariation];
    
    if (selectedContent && state.content[sectionId]) {
      const oldContent = state.content[sectionId].elements[elementKey]?.content;
      
      // Update content
      if (!state.content[sectionId].elements[elementKey]) {
        state.content[sectionId].elements[elementKey] = {
          content: selectedContent,
          type: inferElementType(elementKey),
          isEditable: true,
          editMode: 'inline',
        };
      } else {
        state.content[sectionId].elements[elementKey].content = selectedContent;
      }
      
      // Mark as customized
      state.content[sectionId].aiMetadata.isCustomized = true;
      state.autoSave.isDirty = true;
      
      // Track change
      state.queuedChanges.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'content',
        sectionId,
        elementKey,
        oldValue: oldContent,
        newValue: selectedContent,
        timestamp: Date.now(),
      });
      
      // Add to history
      state.history.undoStack.push({
        type: 'content',
        description: `Applied variation ${selectedVariation + 1} to ${elementKey}`,
        timestamp: Date.now(),
        beforeState: { sectionId, elementKey, content: oldContent },
        afterState: { sectionId, elementKey, content: selectedContent },
        sectionId,
      });
      
      state.history.redoStack = [];
      
      // Hide variations modal
      state.elementVariations.visible = false;
    }
  }),


/**
 * ===== IMAGE MANAGEMENT =====
 */

updateImageAsset: (imageId: string, asset: ImageAsset) =>
  set((state: EditStore) => {
    const oldAsset = state.images.assets?.[imageId];
    
    if (!state.images.assets) {
      state.images.assets = {};
    }
    
    state.images.assets[imageId] = asset;
    
    // Track change
    state.queuedChanges.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'content',
      oldValue: { action: 'update-image-asset', imageId, asset: oldAsset },
      newValue: { action: 'update-image-asset', imageId, asset },
      timestamp: Date.now(),
    });
    
    state.autoSave.isDirty = true;
    state.lastUpdated = Date.now();
  }),


    /**
     * ===== CONTENT VALIDATION =====
     */
    
    validateContent: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) return false;
      
      // Basic validation - check for required elements
      const requiredElements = ['headline']; // This should come from layout schema
      const isValid = requiredElements.every(elementKey => {
        const element = section.elements[elementKey];
        return element && element.content && 
          (typeof element.content === 'string' ? element.content.trim().length > 0 : 
           Array.isArray(element.content) && element.content.length > 0);
      });
      
      // Update validation status
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          state.content[sectionId].editMetadata.validationStatus = {
            isValid,
           errors: isValid ? [] : [{
            elementKey: 'general',
            code: 'validation',
            message: 'Missing required content',
            severity: 'error' as const,
          }],
            warnings: [],
            missingRequired: isValid ? [] : requiredElements.filter(key => !section.elements[key]?.content),
            lastValidated: Date.now(),
          };
        }
      });
      
      return isValid;
    },

    /**
     * ===== CONTENT UTILITIES =====
     */
    
    getContentSummary: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) return null;
      
      return {
        elementCount: Object.keys(section.elements).length,
        hasContent: Object.values(section.elements).some((el: any) => 
            el.content && (
              typeof el.content === 'string' ? el.content.trim().length > 0 :
              Array.isArray(el.content) && el.content.length > 0
            )
          ),
        
        isAIGenerated: section.aiMetadata.aiGenerated,
        isCustomized: section.aiMetadata.isCustomized,
        lastModified: section.aiMetadata.lastGenerated,
        completionPercentage: section.editMetadata.completionPercentage,
      };
    },
    
    exportSectionContent: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) return null;
      
      return {
        id: sectionId,
        layout: section.layout,
        elements: Object.fromEntries(
         Object.entries(section.elements).map(([key, element]) => [
          key, 
          (element as any).content
        ])
        ),
        metadata: {
          aiGenerated: section.aiMetadata.aiGenerated,
          isCustomized: section.aiMetadata.isCustomized,
          lastGenerated: section.aiMetadata.lastGenerated,
          backgroundType: section.backgroundType,
        },
        exportedAt: Date.now(),
      };
    },
    
    importSectionContent: (sectionId: string, importData: any) =>
      set((state: EditStore) => {
        if (!importData || typeof importData !== 'object') return;
        
        const section = state.content[sectionId];
        if (!section) return;
        
        const oldElements = { ...section.elements };
        
        // Import elements
        if (importData.elements) {
          Object.entries(importData.elements).forEach(([elementKey, content]: [string, any]) => {
            if (content !== undefined && content !== null) {
              section.elements[elementKey] = {
                content: content as string | string[],
                type: inferElementType(elementKey),
                isEditable: true,
                editMode: 'inline',
              };
            }
          });
        }
        
        // Update metadata
        section.aiMetadata.isCustomized = true;
        section.backgroundType = importData.metadata?.backgroundType || section.backgroundType;
        
        state.autoSave.isDirty = true;
        
        // Track change
        state.history.undoStack.push({
          type: 'content',
          description: `Imported content into ${sectionId}`,
          timestamp: Date.now(),
          beforeState: { sectionId, elements: oldElements },
          afterState: { sectionId, elements: section.elements },
          sectionId,
        });
        
        state.history.redoStack = [];
      }),
  };
}