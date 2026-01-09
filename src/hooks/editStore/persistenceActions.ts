// hooks/editStore/persistenceActions.ts - Simplified persistence and forms/images actions
import type { EditStore, FormField, ImageAsset } from '@/types/store';

import { logger } from '@/lib/logger';
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
        
        set((state: EditStore) => {
          state.persistence.isSaving = false;
          state.persistence.lastSaved = Date.now();
          state.persistence.isDirty = false;
          state.persistence.metrics.totalSaves += 1;
          state.persistence.metrics.successfulSaves += 1;
          state.persistence.metrics.lastSaveTime = Date.now();
        });
      } catch (error) {
        logger.error('❌ Save failed:', error);
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


        // Handle different response formats - check both finalContent and content
        // The API stores the data under content.finalContent path
        const contentToLoad = apiResponse.finalContent || apiResponse.content?.finalContent || apiResponse.content;
        
        set((state: EditStore) => {
          // Extract sections from either new format (top-level) or legacy format (nested in layout)
          const sections = contentToLoad?.sections ?? contentToLoad?.layout?.sections ?? [];
          const sectionLayouts = contentToLoad?.sectionLayouts ?? contentToLoad?.layout?.sectionLayouts ?? {};
          const sectionSpacing = contentToLoad?.sectionSpacing ?? contentToLoad?.layout?.sectionSpacing ?? {};

          // Restore core content if available
          if (contentToLoad && sections && Array.isArray(sections)) {

            state.sections = sections;
            state.sectionLayouts = sectionLayouts;
            state.sectionSpacing = sectionSpacing;
            state.content = contentToLoad.content || {};

            // Migrate blob URLs to placeholders
            let blobUrlsFound = 0;
            for (const sectionId in state.content) {
              const section = state.content[sectionId];
              if (section?.elements) {
                for (const elementKey in section.elements) {
                  const element = section.elements[elementKey];
                  if (element?.type === 'image' && typeof element.content === 'string') {
                    if (element.content.startsWith('blob:')) {
                      element.content = '/hero-placeholder.jpg';
                      blobUrlsFound++;
                      logger.warn(`⚠️ Migrated blob URL in ${sectionId}.${elementKey} to placeholder`);
                    }
                  }
                }
              }
            }

            if (blobUrlsFound > 0) {
              logger.warn(`⚠️ Found and migrated ${blobUrlsFound} blob URL(s) to placeholders. Please re-upload affected images.`);
            }

            // Log section/content match for debugging
            const sectionsInContent = Object.keys(state.content).length;
            const sectionsInLayout = state.sections.length;

            if (sectionsInContent !== sectionsInLayout) {
              logger.warn('⚠️ Section/Content mismatch detected:', {
                sectionsInLayout,
                sectionsInContent,
                sections: state.sections,
                contentKeys: Object.keys(state.content)
              });
            } else {
            }
          } else {
          }
          
          // Restore theme and settings if available (check both new and legacy paths)
          const theme = contentToLoad?.theme ?? contentToLoad?.layout?.theme;
          if (contentToLoad && theme) {

            const mergedTheme = { ...state.theme, ...theme };
            state.theme = mergedTheme;

          } else {
          }

          const globalSettings = contentToLoad?.globalSettings ?? contentToLoad?.layout?.globalSettings;
          if (contentToLoad && globalSettings) {
            Object.assign(state.globalSettings, globalSettings);
          }
          
          // Restore navigation configuration if available
          if (contentToLoad && contentToLoad.navigationConfig) {
            state.navigationConfig = contentToLoad.navigationConfig;
            logger.debug('🧭 [NAV-DEBUG] Restored navigation config:', state.navigationConfig);
          }
          
          if (contentToLoad && contentToLoad.socialMediaConfig) {
            state.socialMediaConfig = contentToLoad.socialMediaConfig;
            logger.debug('🔗 [SOCIAL-DEBUG] Restored social media config:', state.socialMediaConfig);
          }

          // Restore forms data if available
          if (contentToLoad && contentToLoad.forms) {
            const restoredForms: Record<string, any> = {};

            try {
              const formsData = contentToLoad.forms;

              if (typeof formsData === 'object' && formsData !== null) {
                Object.entries(formsData).forEach(([formId, form]: [string, any]) => {
                  if (form && typeof form === 'object' && form.id && Array.isArray(form.fields)) {
                    restoredForms[formId] = {
                      ...form,
                      createdAt: form.createdAt ? new Date(form.createdAt) : new Date(),
                      updatedAt: form.updatedAt ? new Date(form.updatedAt) : new Date(),
                    };
                  }
                });

                state.forms = restoredForms;
                logger.debug('✅ Restored forms:', Object.keys(restoredForms).length);
              }
            } catch (error) {
              logger.error('❌ Error restoring forms:', error);
              state.forms = {};
            }
          } else {
            state.forms = {};
          }

          // Validate button-form connections
          if (state.forms && state.content) {
            const formIds = Object.keys(state.forms);
            let orphanedConnections = 0;

            Object.keys(state.content).forEach(sectionId => {
              const section = state.content[sectionId];
              if (section?.elements) {
                Object.entries(section.elements).forEach(([elementKey, element]: [string, any]) => {
                  const buttonConfig = element?.metadata?.buttonConfig;
                  if (buttonConfig?.type === 'form' && buttonConfig.formId) {
                    if (!formIds.includes(buttonConfig.formId)) {
                      orphanedConnections++;
                      logger.warn(`⚠️ Orphaned button: ${sectionId}.${elementKey} → ${buttonConfig.formId}`);
                    }
                  }
                });
              }
            });

            if (orphanedConnections > 0) {
              logger.warn(`⚠️ Found ${orphanedConnections} orphaned connection(s)`);
            }
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

        });
        
      } catch (error) {
        logger.error('❌ Error in loadFromDraft:', error);
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
        sectionSpacing: state.sectionSpacing,
        content: state.content,
        theme: state.theme,
        globalSettings: state.globalSettings,
        navigationConfig: state.navigationConfig,
        socialMediaConfig: state.socialMediaConfig,
        onboardingData: state.onboardingData,
        forms: state.forms || {}, // Include forms in export
        lastUpdated: state.lastUpdated,
        version: state.version,
      };


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
        try {
          await state.save();
        } catch (error) {
          logger.error('❌ TriggerAutoSave: Save failed:', error);
          throw error;
        }
      } else {
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