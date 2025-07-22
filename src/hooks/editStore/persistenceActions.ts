// hooks/editStore/persistenceActions.ts - Simplified persistence and forms/images actions
import type { EditStore, FormField, ImageAsset } from '@/types/store';

/**
 * Consolidated persistence actions for save/load operations plus forms and images
 */
export function createPersistenceActions(set: any, get: any) {
  return {
    /**
     * ===== CORE PERSISTENCE =====
     */
    save: async () => {
      try {
        set((state: EditStore) => {
          state.persistence.isSaving = true;
          state.persistence.saveError = undefined;
        });

        const state = get();
        const exportedData = state.export();
        
        console.log('💾 Calling /api/saveDraft with data:', { 
          tokenId: state.tokenId, 
          hasContent: !!exportedData,
          sectionsCount: exportedData.sections?.length || 0,
          contentKeys: Object.keys(exportedData.content || {}),
          hasAnyElements: Object.values(exportedData.content || {}).some((section: any) => 
            section.elements && Object.keys(section.elements).length > 0
          )
        });
        
        if (!state.tokenId) {
          throw new Error('No tokenId available in EditStore');
        }
        
        // Real API call to save draft
        const response = await fetch('/api/saveDraft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenId: state.tokenId,
            finalContent: exportedData,  // Changed from 'content' to 'finalContent' to match API
            title: state.title,
          }),
        });

        if (!response.ok) {
          throw new Error(`Save failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Save API response:', result);
        
        set((state: EditStore) => {
          state.persistence.isSaving = false;
          state.persistence.lastSaved = Date.now();
          state.persistence.isDirty = false;
          state.persistence.metrics.totalSaves += 1;
          state.persistence.metrics.successfulSaves += 1;
          state.persistence.metrics.lastSaveTime = Date.now();
        });
      } catch (error) {
        console.error('❌ Save failed:', error);
        set((state: EditStore) => {
          state.persistence.isSaving = false;
          state.persistence.saveError = error instanceof Error ? error.message : 'Save failed';
          state.persistence.metrics.failedSaves += 1;
        });
        throw error;
      }
    },

    loadFromDraft: async (apiResponse: any, urlTokenId?: string) => {
      try {
        set((state: EditStore) => {
          state.persistence.isLoading = true;
          state.persistence.loadError = undefined;
        });

        console.log('🔄 Loading draft data:', {
          hasContent: !!apiResponse.content,
          hasFinalContent: !!apiResponse.finalContent,
          tokenId: apiResponse.tokenId || urlTokenId,
          apiResponseKeys: Object.keys(apiResponse)
        });

        // Handle different response formats - check both finalContent and content
        // The API stores the data under content.finalContent path
        const contentToLoad = apiResponse.finalContent || apiResponse.content?.finalContent || apiResponse.content;
        
        set((state: EditStore) => {
          // Restore core content if available
          if (contentToLoad && contentToLoad.sections && Array.isArray(contentToLoad.sections)) {
            console.log('📥 Restoring sections and content:', {
              sectionsCount: contentToLoad.sections.length,
              contentKeys: Object.keys(contentToLoad.content || {}).length,
              sectionLayoutsCount: Object.keys(contentToLoad.sectionLayouts || {}).length
            });
            
            state.sections = contentToLoad.sections;
            state.sectionLayouts = contentToLoad.sectionLayouts || {};
            state.content = contentToLoad.content || {};
            
            // Log section/content match for debugging
            const sectionsInContent = Object.keys(state.content).length;
            const sectionsInLayout = state.sections.length;
            
            if (sectionsInContent !== sectionsInLayout) {
              console.warn('⚠️ Section/Content mismatch detected:', {
                sectionsInLayout,
                sectionsInContent,
                sections: state.sections,
                contentKeys: Object.keys(state.content)
              });
            } else {
              console.log('✅ Section/Content match confirmed:', {
                count: sectionsInContent
              });
            }
          } else {
            console.log('📝 No section data found in response, keeping empty state');
          }
          
          // Restore theme and settings if available
          if (contentToLoad && contentToLoad.theme) {
            console.log('🎨 Restoring theme data');
            state.theme = { ...state.theme, ...contentToLoad.theme };
          }
          if (contentToLoad && contentToLoad.globalSettings) {
            Object.assign(state.globalSettings, contentToLoad.globalSettings);
          }
          
          // Restore meta data
          state.id = apiResponse.tokenId || urlTokenId || '';
          state.title = apiResponse.title || 'Untitled Project';
          state.tokenId = apiResponse.tokenId || urlTokenId || '';
          
          // Restore onboarding data
          state.onboardingData = {
            oneLiner: apiResponse.inputText || '',
            validatedFields: apiResponse.validatedFields || {},
            featuresFromAI: apiResponse.featuresFromAI || [],
            hiddenInferredFields: apiResponse.hiddenInferredFields || {},
            confirmedFields: apiResponse.confirmedFields || {}
          };
          
          state.lastUpdated = Date.now();
          state.persistence.isLoading = false;
          state.persistence.isDirty = false;
          
          // Ensure performance object is initialized
          if (!state.performance) {
            state.performance = {
              saveCount: 0,
              averageSaveTime: 0,
              lastSaveTime: 0,
              failedSaves: 0,
            };
          }

          console.log('✅ Draft loading complete:', {
            tokenId: state.tokenId,
            title: state.title,
            sectionsCount: state.sections.length,
            contentKeysCount: Object.keys(state.content).length,
            hasTheme: !!state.theme
          });
        });
        
      } catch (error) {
        console.error('❌ Error in loadFromDraft:', error);
        set((state: EditStore) => {
          state.persistence.isLoading = false;
          state.persistence.loadError = error instanceof Error ? error.message : 'Failed to load draft';
        });
        throw error;
      }
    },

    export: () => {
      const state = get();
      const exportData = {
        id: state.id,
        title: state.title,
        slug: state.slug,
        sections: state.sections,
        sectionLayouts: state.sectionLayouts,
        content: state.content,
        theme: state.theme,
        globalSettings: state.globalSettings,
        onboardingData: state.onboardingData,
        lastUpdated: state.lastUpdated,
        version: state.version,
      };
      
      // Debug logging
      console.log('📤 Exporting store data:', {
        sections: exportData.sections.length,
        contentKeys: Object.keys(exportData.content),
        hasElements: Object.values(exportData.content).some((section: any) => 
          section.elements && Object.keys(section.elements).length > 0
        )
      });
      
      return exportData;
    },

    /**
     * ===== FORMS MANAGEMENT =====
     */
    addFormField: (formId: string, field: FormField) =>
      set((state: EditStore) => {
        if (!state.formData[formId]) {
          state.formData[formId] = { fields: [], settings: {} };
        }
        state.formData[formId].fields.push(field);
        state.persistence.isDirty = true;
      }),

    removeFormField: (formId: string, fieldId: string) =>
      set((state: EditStore) => {
        if (state.formData[formId]) {
          state.formData[formId].fields = state.formData[formId].fields.filter(
            field => field.id !== fieldId
          );
          state.persistence.isDirty = true;
        }
      }),

    updateFormField: (formId: string, fieldId: string, updates: Partial<FormField>) =>
      set((state: EditStore) => {
        if (state.formData[formId]) {
          const fieldIndex = state.formData[formId].fields.findIndex(
            field => field.id === fieldId
          );
          if (fieldIndex !== -1) {
            Object.assign(state.formData[formId].fields[fieldIndex], updates);
            state.persistence.isDirty = true;
          }
        }
      }),

    toggleFormFieldRequired: (formId: string, fieldId: string) =>
      set((state: EditStore) => {
        if (state.formData[formId]) {
          const field = state.formData[formId].fields.find(f => f.id === fieldId);
          if (field) {
            field.required = !field.required;
            state.persistence.isDirty = true;
          }
        }
      }),

    showFormBuilder: () =>
      set((state: EditStore) => {
        (state.forms as any).formBuilder.visible = true;
      }),

    hideFormBuilder: () =>
      set((state: EditStore) => {
        (state.forms as any).formBuilder.visible = false;
      }),

    /**
     * ===== IMAGES MANAGEMENT =====
     */
    updateImageAsset: (imageId: string, asset: ImageAsset) =>
      set((state: EditStore) => {
        if (!state.images.assets) {
          state.images.assets = {};
        }
        state.images.assets[imageId] = asset;
        state.persistence.isDirty = true;
      }),

    removeImageAsset: (imageId: string) =>
      set((state: EditStore) => {
        if (state.images.assets) {
          delete state.images.assets[imageId];
          state.persistence.isDirty = true;
        }
      }),

    showStockPhotoSearch: (query: string) =>
      set((state: EditStore) => {
        state.images.stockPhotos = {
          searchVisible: true,
          searchQuery: query,
          searchResults: [], // Will be populated by search API
        };
      }),

    hideStockPhotoSearch: () =>
      set((state: EditStore) => {
        state.images.stockPhotos.searchVisible = false;
        state.images.stockPhotos.searchQuery = '';
        state.images.stockPhotos.searchResults = [];
      }),

    updateUploadProgress: (imageId: string, progress: number) =>
      set((state: EditStore) => {
        state.images.uploadProgress[imageId] = progress;
      }),

    /**
     * ===== ERROR AND LOADING STATES =====
     */
    setError: (key: string, error: string) =>
      set((state: EditStore) => {
        state.errors[key] = error;
      }),

    clearError: (key: string) =>
      set((state: EditStore) => {
        delete state.errors[key];
      }),

    setLoading: (key: string, loading: boolean) =>
      set((state: EditStore) => {
        state.loadingStates[key] = loading;
        state.isLoading = Object.values(state.loadingStates).some(Boolean);
      }),

    /**
     * ===== UTILITY ACTIONS =====
     */
    reset: () => {
      const initialState = createInitialState();
      set(() => initialState);
    },

    updateMeta: (meta: Partial<any>) => {
      set((state: EditStore) => {
        Object.assign(state, meta);
        state.lastUpdated = Date.now();
        state.version += 1;
        state.persistence.isDirty = true;
      });
    },

    reorderSections: (newOrder: string[]) =>
      set((state: EditStore) => {
        state.sections = newOrder;
        state.persistence.isDirty = true;
      }),

    // Auto-save middleware actions
    triggerAutoSave: async () => {
      const state = get();
      if (state.persistence.isDirty && !state.persistence.isSaving) {
        console.log('🔄 TriggerAutoSave: Saving dirty state...');
        try {
          await state.save();
          console.log('✅ TriggerAutoSave: Save completed');
        } catch (error) {
          console.error('❌ TriggerAutoSave: Save failed:', error);
          throw error;
        }
      } else {
        console.log('⏭️ TriggerAutoSave: No save needed', { 
          isDirty: state.persistence.isDirty, 
          isSaving: state.persistence.isSaving 
        });
      }
    },

    forceSave: async () => {
      return get().save();
    },

    clearAutoSaveError: () => {
      set((state: EditStore) => {
        state.persistence.saveError = undefined;
      });
    },

    getPerformanceStats: () => {
      return get().persistence.metrics;
    },

    resetPerformanceStats: () => {
      set((state: EditStore) => {
        state.persistence.metrics = {
          totalSaves: 0,
          successfulSaves: 0,
          failedSaves: 0,
          averageSaveTime: 0,
          lastSaveTime: 0,
          totalLoads: 0,
          cacheHits: 0,
          cacheMisses: 0,
          conflictsDetected: 0,
          conflictsResolved: 0,
        };
      });
    },
  };
}

// Helper function to create initial state
function createInitialState() {
  // Return minimal initial state - this would be imported from main store
  return {
    sections: [],
    content: {},
    persistence: { isDirty: false, isSaving: false },
    // ... other initial state
  };
}