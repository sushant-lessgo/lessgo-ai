// hooks/useEditStore.ts - Main store orchestrator using centralized types
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { subscribeWithSelector } from "zustand/middleware";
// At top of useEditStore.ts

// Import action creators
import { createLayoutActions } from './editStore/layoutActions';
import { createContentActions } from './editStore/contentActions';
import { createUIActions } from './editStore/uiActions';
import { createPersistenceActions } from './editStore/persistenceActions';
import { createFormsImageActions } from './editStore/formsImageActions';
import { createValidationActions } from './editStore/validationActions';
import { createGenerationActions } from './editStore/generationActions';

// Import centralized types
import type { EditStore, SectionData } from '@/types/store';
import type { Theme } from '@/types/core/index';

import { createRegenerationActions } from './editStore/regenerationActions';
import { createChangeTrackingActions } from './editStore/changeTrackingActions';
import { persist } from "zustand/middleware";

/**
 * ===== DEFAULT VALUES =====
 */
const defaultTheme: Theme = {
  typography: {
    headingFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    scale: 'comfortable',
    lineHeight: 1.5,
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  colors: {
    baseColor: 'gray',
    accentColor: 'purple',
    accentCSS: undefined,
    sectionBackgrounds: {
      primary: undefined,
      secondary: undefined,
      neutral: undefined,
      divider: undefined,
    },
    semantic: {
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      neutral: 'bg-gray-500',
    },
    states: {
      hover: {},
      focus: {},
      active: {},
      disabled: {},
    },
  },
  spacing: {
    unit: 8,
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128],
    presets: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      xxl: '3rem',
    },
  },
  corners: {
    radius: 8,
    scale: {
      small: 4,
      medium: 8,
      large: 16,
      full: 9999,
    },
  },
  animations: {
    enabled: true,
    duration: {
      fast: 150,
      medium: 300,
      slow: 500,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    reducedMotion: false,
  },
};

/**
 * ===== INITIAL STATE CREATOR =====
 */
function createInitialState() {
  return {
    // Layout Slice
    sections: [] as string[],
    sectionLayouts: {} as Record<string, string>,
    theme: defaultTheme,
    globalSettings: {
      maxWidth: '1200px',
      containerPadding: '32px',
      sectionSpacing: '64px',
      deviceMode: 'desktop' as const,
      zoomLevel: 100,
    },
    
    // Content Slice
    content: {} as Record<string, SectionData>,
    
    // UI Slice
    mode: 'edit' as const,
    editMode: 'section' as const,
    generationMode: false, // Optimization flag for generation flow
    selectedSection: undefined as string | undefined,
    selectedElement: undefined as any,
    multiSelection: [] as string[],
    leftPanel: {
      width: 300,
      collapsed: false,
      manuallyToggled: false,
      activeTab: 'pageStructure' as const,
    },
    floatingToolbars: {
      section: { visible: false, position: { x: 0, y: 0 }, contextActions: [], advancedActions: [] },
      element: { visible: false, position: { x: 0, y: 0 }, contextActions: [], advancedActions: [] },
      form: { visible: false, position: { x: 0, y: 0 }, contextActions: [], advancedActions: [] },
      image: { visible: false, position: { x: 0, y: 0 }, contextActions: [], advancedActions: [] },
    },
    autoSave: {
      isDirty: false,
      isSaving: false,
      queuedChanges: [],
    },
    aiGeneration: {
      isGenerating: false,
      currentOperation: null as 'section' | 'element' | 'page' | null,
      progress: 0,
      status: '',
      errors: [] as string[],
      warnings: [] as string[],
    },
    elementVariations: {
      visible: false,
      variations: [] as string[],
    },
    forms: {
      formBuilder: {
        visible: false,
      },
    },
    images: {
      stockPhotos: {
        searchResults: [],
        searchQuery: '',
        searchVisible: false,
      },
      uploadProgress: {},
    },
    errors: {} as Record<string, string>,
    loadingStates: {} as Record<string, boolean>,
    isLoading: false,
    history: {
      undoStack: [],
      redoStack: [],
      maxHistorySize: 50,
    },
    apiQueue: {
      queue: [],
      processing: false,
      rateLimitRemaining: 100,
      rateLimitReset: Date.now() + 60000,
    },
    
    // Meta Slice
    id: '',
    title: 'Untitled Project',
    slug: '',
    description: '',
    lastUpdated: Date.now(),
    version: 1,
    tokenId: '',
    onboardingData: {
      oneLiner: '',
      validatedFields: {},
      featuresFromAI: [],
      hiddenInferredFields: {},
      confirmedFields: {
        marketCategory: { value: '', confidence: 0 },
        marketSubcategory: { value: '', confidence: 0 },
        targetAudience: { value: '', confidence: 0 },
        keyProblem: { value: '', confidence: 0 },
        startupStage: { value: '', confidence: 0 },
        landingPageGoals: { value: '', confidence: 0 },
        pricingModel: { value: '', confidence: 0 },
      },
    },
    publishing: {
      isPublishReady: false,
    },
    changeTracking: {
      originalInputs: {},
      currentInputs: {},
      hasChanges: false,
      changedFields: [],
      lastChangeTimestamp: Date.now(),
    },

    // Persistence Slice
    persistence: {
      isDirty: false,
      isSaving: false,
      isLoading: false,
      hasActiveConflicts: false,
      backgroundSaveEnabled: true,
      autoSaveEnabled: true,
      retryCount: 0,
      metrics: {
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
      },
      syncStatus: {
        localVersion: 1,
        serverVersion: 1,
        status: 'synced' as const,
        pendingChanges: 0,
      },
    },

    // Auto-save middleware state
    isDirty: false,
    isSaving: false,
    lastSaved: undefined as number | undefined,
    saveError: undefined as string | undefined,
    queuedChanges: [] as any[],
    conflictResolution: {
      hasConflict: false,
      conflictData: undefined as any,
      resolveStrategy: 'manual' as const,
    },
    performance: {
      saveCount: 0,
      averageSaveTime: 0,
      lastSaveTime: 0,
      failedSaves: 0,
    },
} as unknown as EditStore; // Type assertion to satisfy TypeScript
}

/**
 * ===== MAIN STORE CREATION =====
 */
export const useEditStore = create<EditStore>()(
  devtools(
    subscribeWithSelector(
      persist(
      immer((set, get) => ({
        // Initial state
        ...createInitialState(),
        
        // Action creators from separate files
        ...createLayoutActions(set, get),
        ...createContentActions(set, get),
        ...createUIActions(set, get),
        ...createPersistenceActions(set, get),
        ...createFormsImageActions(set, get),
        ...createValidationActions(set, get),
        ...createRegenerationActions(set, get),
        ...createChangeTrackingActions(set, get),
        ...createGenerationActions(set, get),
        // Meta Actions (inline - simple enough to keep here)
        updateMeta: (meta: Partial<any>) => {
          set((state) => {
            Object.assign(state, meta);
            state.lastUpdated = Date.now();
            state.version += 1;
          });
        },

        // Performance Optimization Actions
        setGenerationMode: (enabled: boolean) => {
          set((state) => {
            state.generationMode = enabled;
            
            if (enabled) {
              // Disable heavy features during generation
              state.leftPanel.collapsed = true;
              state.floatingToolbars.section.visible = false;
              state.floatingToolbars.element.visible = false;
              state.floatingToolbars.form.visible = false;
              state.floatingToolbars.image.visible = false;
            }
          });
        },

        loadFromOnboarding: () => {
          // This should load data from useOnboardingStore
          // Implementation will be added when we integrate with onboarding
          console.warn('loadFromOnboarding: Not yet implemented - needs onboarding store integration');
        },

        updateOnboardingData: (data: Partial<any>) => {
          set((state) => {
            Object.assign(state.onboardingData, data);
            state.lastUpdated = Date.now();
          });
        },

        updatePublishingState: (publishingState: Partial<any>) => {
          set((state) => {
            Object.assign(state.publishing, publishingState);
            state.lastUpdated = Date.now();
          });
        },

        reset: () => {
          set(() => ({
            ...createInitialState(),
          }));
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
          
          // 🔍 DEBUG: Log export data structure
          console.log('📤 EditStore export data:', {
            sectionsCount: exportData.sections.length,
            sectionsArray: exportData.sections,
            contentKeys: Object.keys(exportData.content),
            hasTheme: !!exportData.theme,
            hasGlobalSettings: !!exportData.globalSettings,
          });
          
          return exportData;
        },

  loadFromDraft: async (apiResponse: any) => {
  try {
    console.log('🔄 EditStore: Loading from draft...', apiResponse);
    
    set((state) => {
      state.persistence.isLoading = true;
      state.persistence.loadError = undefined;
    });

    // Check if we have finalContent (complete page data)
    if (apiResponse.finalContent) {
      console.log('📦 EditStore: Loading complete finalContent');
      
      set((state) => {
        const { finalContent } = apiResponse;
        
        // ✅ SURGICAL RESTORATION: Only restore specific properties
        
        // 🔧 FIXED: Handle both nested and flat finalContent structures
        
        // First, check if we have the flat structure (new serialization format)
        if (finalContent.sections && Array.isArray(finalContent.sections)) {
          console.log('📦 Using flat finalContent structure');
          
          // 1. Restore layout data from flat structure
          state.sections = finalContent.sections || [];
          state.sectionLayouts = finalContent.sectionLayouts || {};
          
          // 2. Restore content data from flat structure  
          if (finalContent.content) {
            state.content = { ...finalContent.content };
          }
          
          // 3. Restore theme from flat structure
          if (finalContent.theme) {
            state.theme = {
              ...defaultTheme,
              ...finalContent.theme,
              colors: {
                ...defaultTheme.colors,
                ...finalContent.theme.colors,
                sectionBackgrounds: {
                  ...defaultTheme.colors.sectionBackgrounds,
                  ...finalContent.theme.colors?.sectionBackgrounds
                }
              }
            };
          }
          
          // 4. Restore global settings from flat structure
          if (finalContent.globalSettings) {
            Object.assign(state.globalSettings, finalContent.globalSettings);
          }
        } 
        // Fallback to nested structure (legacy format)
        else if (finalContent.layout) {
          console.log('📦 Using nested finalContent structure (legacy)');
          
          // 1. Restore layout data from nested structure
          state.sections = finalContent.layout.sections || [];
          state.sectionLayouts = finalContent.layout.sectionLayouts || {};
          
          // 2. Restore content data from nested structure
          if (finalContent.content) {
            state.content = { ...finalContent.content };
          }
          
          // 3. Restore theme from nested structure
          if (finalContent.layout.theme) {
            state.theme = {
              ...defaultTheme,
              ...finalContent.layout.theme,
              colors: {
                ...defaultTheme.colors,
                ...finalContent.layout.theme.colors,
                sectionBackgrounds: {
                  ...defaultTheme.colors.sectionBackgrounds,
                  ...finalContent.layout.theme.colors?.sectionBackgrounds
                }
              }
            };
          }
          
          // 4. Restore global settings from nested structure
          if (finalContent.layout.globalSettings) {
            Object.assign(state.globalSettings, finalContent.layout.globalSettings);
          }
        }
        else {
          console.warn('⚠️ Unknown finalContent structure, attempting direct property access');
          
          // Direct property access fallback
          if (finalContent.sections) state.sections = finalContent.sections;
          if (finalContent.sectionLayouts) state.sectionLayouts = finalContent.sectionLayouts;
          if (finalContent.content) state.content = finalContent.content;
          if (finalContent.theme) state.theme = { ...defaultTheme, ...finalContent.theme };
          if (finalContent.globalSettings) Object.assign(state.globalSettings, finalContent.globalSettings);
        }
        
        // 3. Update meta information
        state.id = apiResponse.tokenId || '';
        state.title = apiResponse.title || finalContent.meta?.title || 'Untitled Project';
        state.tokenId = apiResponse.tokenId || '';
        
        // 4. Restore onboarding data
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 loadFromDraft - API Response onboarding data:', {
            inputText: apiResponse.inputText,
            validatedFields: apiResponse.validatedFields,
            hiddenInferredFields: apiResponse.hiddenInferredFields,
            confirmedFields: apiResponse.confirmedFields,
            featuresFromAI: apiResponse.featuresFromAI,
            hiddenInferredFieldsKeys: Object.keys(apiResponse.hiddenInferredFields || {}),
          });
        }
        
        state.onboardingData = {
          oneLiner: apiResponse.inputText || '',
          validatedFields: apiResponse.validatedFields || {},
          featuresFromAI: apiResponse.featuresFromAI || [],
          hiddenInferredFields: apiResponse.hiddenInferredFields || {},
          confirmedFields: apiResponse.confirmedFields || {}
        };
        
        // 5. Update timestamps and flags
        state.lastUpdated = Date.now();
        state.persistence.isLoading = false;
        state.persistence.isDirty = false;
        state.isDirty = false;
        
        console.log('✅ EditStore: Complete finalContent restored', {
          sections: state.sections.length,
          sectionsArray: state.sections,
          content: Object.keys(state.content).length,
          contentKeys: Object.keys(state.content),
          hasTheme: !!state.theme,
          themeColors: !!state.theme.colors,
          backgrounds: !!state.theme.colors.sectionBackgrounds,
          finalContentStructure: {
            hasSections: !!finalContent.sections,
            hasLayout: !!finalContent.layout,
            hasContent: !!finalContent.content,
            keys: Object.keys(finalContent)
          }
        });
      });
      
    } else if (apiResponse.content) {
      console.log('📦 EditStore: Loading legacy content format');
      
      set((state) => {
        // ✅ SURGICAL ASSIGNMENT: Only assign specific known properties
        
        // Map known content properties individually
        if (apiResponse.content.sections) {
          state.sections = apiResponse.content.sections;
        }
        if (apiResponse.content.sectionLayouts) {
          state.sectionLayouts = apiResponse.content.sectionLayouts;
        }
        if (apiResponse.content.content) {
          state.content = apiResponse.content.content;
        }
        if (apiResponse.content.theme) {
          // ✅ CRITICAL: Restore theme carefully
          state.theme = {
            ...defaultTheme,
            ...apiResponse.content.theme,
            colors: {
              ...defaultTheme.colors,
              ...apiResponse.content.theme.colors,
              sectionBackgrounds: {
                ...defaultTheme.colors.sectionBackgrounds,
                ...apiResponse.content.theme.colors?.sectionBackgrounds
              }
            }
          };
        }
        
        // Update meta
        state.id = apiResponse.tokenId || state.id;
        state.title = apiResponse.title || state.title;
        state.tokenId = apiResponse.tokenId || state.tokenId;
        state.lastUpdated = Date.now();
        state.persistence.isLoading = false;
        state.persistence.isDirty = false;
        state.isDirty = false;
        
        console.log('✅ EditStore: Legacy content restored');
      });
      
    } else {
      console.log('📦 EditStore: Loading direct data or onboarding-only data');
      console.log('🔍 API Response structure:', {
        hasSections: !!apiResponse.sections,
        hasSectionLayouts: !!apiResponse.sectionLayouts,
        hasContent: !!apiResponse.content,
        hasLayout: !!apiResponse.layout,
        keys: Object.keys(apiResponse)
      });
      
      set((state) => {
        // Check if sections are directly on the response (EditStore format)
        if (apiResponse.sections && Array.isArray(apiResponse.sections)) {
          console.log('✅ Found sections directly on response:', apiResponse.sections);
          state.sections = apiResponse.sections;
          state.sectionLayouts = apiResponse.sectionLayouts || {};
          state.content = apiResponse.content || {};
          
          if (apiResponse.theme) {
            state.theme = {
              ...defaultTheme,
              ...apiResponse.theme,
              colors: {
                ...defaultTheme.colors,
                ...apiResponse.theme.colors,
                sectionBackgrounds: {
                  ...defaultTheme.colors.sectionBackgrounds,
                  ...apiResponse.theme.colors?.sectionBackgrounds
                }
              }
            };
          }
          
          console.log('✅ EditStore: Direct data format loaded', {
            sections: state.sections.length,
            content: Object.keys(state.content).length
          });
        } else {
          console.log('⚠️ No sections found, clearing page data');
          // Only restore onboarding data, clear page data
          state.sections = [];
          state.sectionLayouts = {};
          state.content = {};
          state.theme = defaultTheme;
        }
        
        state.onboardingData = {
          oneLiner: apiResponse.inputText || '',
          validatedFields: apiResponse.validatedFields || {},
          featuresFromAI: apiResponse.featuresFromAI || [],
          hiddenInferredFields: apiResponse.hiddenInferredFields || {},
          confirmedFields: apiResponse.confirmedFields || {}
        };
        
        state.id = apiResponse.tokenId || '';
        state.title = apiResponse.title || 'Untitled Project';
        state.tokenId = apiResponse.tokenId || '';
        state.lastUpdated = Date.now();
        state.persistence.isLoading = false;
        state.persistence.isDirty = false;
        state.isDirty = false;
        
        console.log('✅ EditStore: Onboarding-only data restored');
      });
    }

    console.log('🎉 EditStore: loadFromDraft completed successfully');

  } catch (error) {
    console.error('❌ EditStore: loadFromDraft failed:', error);
    
    set((state) => {
      state.persistence.isLoading = false;
      state.persistence.loadError = error instanceof Error ? error.message : 'Failed to load draft';
    });
    
    throw error;
  }
},

        save: async () => {
          try {
            set((state) => {
              state.persistence.isSaving = true;
              state.persistence.saveError = undefined;
            });

            const exportedData = get().export();
            
            // This will be replaced with actual API call
            await new Promise(resolve => setTimeout(resolve, 500)); // Mock save
            
            set((state) => {
              state.persistence.isSaving = false;
              state.persistence.lastSaved = Date.now();
              state.persistence.isDirty = false;
              state.persistence.metrics.totalSaves += 1;
              state.persistence.metrics.successfulSaves += 1;
            });
          } catch (error) {
            set((state) => {
              state.persistence.isSaving = false;
              state.persistence.saveError = error instanceof Error ? error.message : 'Save failed';
              state.persistence.metrics.failedSaves += 1;
            });
            throw error;
          }
        },
        
        // Auto-save middleware actions (inline since they're simple)
        triggerAutoSave: () => {
          const state = get();
          if (state.isDirty && !state.isSaving) {
            // Will be implemented by auto-save middleware
          }
        },
        
        forceSave: async () => {
          // Will be implemented by auto-save middleware
        },
        
        clearAutoSaveError: () => {
          set((state) => {
            state.saveError = undefined;
          });
        },
        
        trackChange: (change: any) => {
          set((state) => {
            state.queuedChanges.push({
              ...change,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
            });
            state.isDirty = true;
          });
        },
        
        clearQueuedChanges: () => {
          set((state) => {
            state.queuedChanges = [];
            state.isDirty = false;
          });
        },
        
        getPerformanceStats: () => {
          return get().performance;
        },
        
        resetPerformanceStats: () => {
          set((state) => {
            state.performance = {
              saveCount: 0,
              averageSaveTime: 0,
              lastSaveTime: 0,
              failedSaves: 0,
            };
          });
        },
      })),
      {                         // ← Persistence config as second argument to persist()
          name: "edit-store-storage",
          partialize: (state) => ({
            sections: state.sections,
            sectionLayouts: state.sectionLayouts,
            content: state.content,
            theme: state.theme,
            globalSettings: state.globalSettings,
            tokenId: state.tokenId,
            onboardingData: state.onboardingData,
            id: state.id,
            title: state.title,
            lastUpdated: state.lastUpdated,
            version: state.version,
          }),
          onRehydrateStorage: () => (state) => {
            if (state) {
              console.log('🔄 EditStore rehydrated from localStorage:', {
                sections: state.sections?.length || 0,
                content: Object.keys(state.content || {}).length,
                tokenId: state.tokenId,
                hasTheme: !!state.theme
              });
            }
          }
        }                         // ← Close persist() config
                                // ← Close persist()
    ),                           // ← Close subscribeWithSelector()
  
    ),
    { name: "EditStore" }
  )
);

/**
 * ===== DEBUG UTILITIES (Development Only) =====
 */
if (process.env.NODE_ENV === 'development') {
  // Enhanced global store access for debugging
  (window as any).__editStoreDebug = {
    getState: () => useEditStore.getState(),
    setState: (newState: Partial<EditStore>) => useEditStore.setState(newState),
    subscribe: (callback: (state: EditStore) => void) => useEditStore.subscribe(callback),
    
    // Utility functions
    exportState: () => useEditStore.getState().export(),
    clearHistory: () => useEditStore.getState().clearHistory(),
    triggerAutoSave: () => useEditStore.getState().triggerAutoSave(),
    validateAllSections: () => {
      const state = useEditStore.getState();
      return state.sections.map(sectionId => ({
        sectionId,
        isValid: state.validateSection(sectionId),
        incompleteElements: state.getIncompleteElements(sectionId),
      }));
    },
    
    analyzeStore: () => {
      const state = useEditStore.getState();
      
      return {
        timestamp: Date.now(),
        sections: {
          total: state.sections.length,
          withContent: Object.keys(state.content).length,
          missing: state.sections.filter(id => !state.content[id]),
        },
        content: {
          totalSections: Object.keys(state.content).length,
          withElements: Object.values(state.content).filter(
            section => Object.keys(section.elements || {}).length > 0
          ).length,
          aiGenerated: Object.values(state.content).filter(
            section => section.aiMetadata?.aiGenerated
          ).length,
          customized: Object.values(state.content).filter(
            section => section.aiMetadata?.isCustomized
          ).length,
        },
        ui: {
          mode: state.mode,
          editMode: state.editMode,
          selectedSection: state.selectedSection,
          selectedElement: state.selectedElement,
          hasErrors: Object.keys(state.errors).length > 0,
          isLoading: state.isLoading,
        },
        autoSave: {
          isDirty: state.isDirty,
          isSaving: state.isSaving,
          lastSaved: state.lastSaved,
          hasError: !!state.saveError,
          queuedChanges: state.queuedChanges?.length || 0,
        },
      };
    },
  };
  
  console.log('🔧 Edit Store Debug utilities available at window.__editStoreDebug');
}

// Export types for use in components
export type { EditStore } from '@/types/store';