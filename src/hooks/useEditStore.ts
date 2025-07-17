// hooks/useEditStore.ts - Main store orchestrator using centralized types
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { subscribeWithSelector } from "zustand/middleware";
import type { FormField } from "@/types/core/index";
// At top of useEditStore.ts

// Import consolidated action creators
import { createCoreActions } from './editStore/coreActions';
import { createAIActions } from './editStore/aiActions';
import { createPersistenceActions } from './editStore/persistenceActions';
import { createGenerationActions } from './editStore/generationActions';
import { createUIActions } from './editStore/uiActions';

// Import centralized types
import type { EditStore, SectionData } from '@/types/store';
import type { Theme } from '@/types/core/index';
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
    isTextEditing: false,
    textEditingElement: undefined as { sectionId: string; elementKey: string } | undefined,
    leftPanel: {
      width: 300,
      collapsed: false,
      manuallyToggled: false,
      activeTab: 'pageStructure' as const,
    },
    // Simplified single toolbar state
    toolbar: {
      type: null as 'section' | 'element' | 'text' | 'image' | 'form' | null,
      visible: false,
      position: { x: 0, y: 0 },
      targetId: null as string | null,
      actions: [] as string[],
    },
    // Removed: autoSave object (keeping only persistence)
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
    formData: {} as Record<string, { fields: FormField[]; settings: any }>,
    images: {
      assets: {},
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

    // Removed: duplicate auto-save state (using persistence instead)
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
        
        // Consolidated action creators (5 files instead of 9+)
        ...createCoreActions(set, get),
        ...createAIActions(set, get),
        ...createPersistenceActions(set, get),
        ...createGenerationActions(set, get),
        ...createUIActions(set, get),
        // Simple inline actions that don't need separate files
        loadFromOnboarding: () => {
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

        // These functions are now in persistenceActions.ts - removing duplicates
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