/**
 * Edit Store Factory - Creates token-scoped Zustand stores
 * Converts the previous global store into isolated per-project stores
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { subscribeWithSelector } from "zustand/middleware";
import { persist } from "zustand/middleware";
import type { FormField } from "@/types/core/index";
import type { EditStore, SectionData } from '@/types/store';
import type { Theme } from '@/types/core/index';
import { defaultCSSVariableState } from '@/types/store/cssVariables';

// Import existing action creators
import { createCoreActions } from '../hooks/editStore/coreActions';
import { createContentActions } from '../hooks/editStore/contentActions';
import { createAIActions } from '../hooks/editStore/aiActions';
import { createPersistenceActions } from '../hooks/editStore/persistenceActions';
import { createGenerationActions } from '../hooks/editStore/generationActions';
import { createUIActions } from '../hooks/editStore/uiActions';
import { createFormsImageActions } from '../hooks/editStore/formsImageActions';
import { createLayoutActions } from '../hooks/editStore/layoutActions';
import { createCSSVariableActions } from '../hooks/editStore/cssVariableActions';
import { createRegenerationActions } from '../hooks/editStore/regenerationActions';

// Import storage utilities
import { getStorageKey, trackProjectAccess, isStorageAvailable } from '@/utils/storage';

/**
 * Default theme configuration
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
    accentCSS: 'bg-purple-600',
    sectionBackgrounds: {
      primary: 'bg-gray-800',
      secondary: 'bg-gray-50',
      neutral: 'bg-white',
      divider: 'bg-gray-100/50',
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
 * Create initial state for a new store instance
 */
function createInitialState(tokenId: string): EditStore {
  return {
    // Layout Slice
    sections: [] as string[],
    sectionLayouts: {} as Record<string, string>,
    sectionSpacing: {} as Record<string, 'compact' | 'normal' | 'spacious' | 'extra'>,
    theme: defaultTheme,
    navigationConfig: undefined,
    socialMediaConfig: undefined,
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
    generationMode: false,
    selectedSection: undefined as string | undefined,
    selectedElement: undefined as any,
    multiSelection: [] as string[],
    isTextEditing: false,
    textEditingElement: undefined as { sectionId: string; elementKey: string } | undefined,
    formattingInProgress: false,
    leftPanel: {
      width: 300,
      collapsed: false,
      manuallyToggled: false,
      activeTab: 'pageStructure' as const,
    },
    toolbar: {
      type: null as 'section' | 'element' | 'text' | 'image' | 'form' | null,
      visible: false,
      position: { x: 0, y: 0 },
      targetId: null as string | null,
      actions: [] as string[],
    },
    aiGeneration: {
      isGenerating: false,
      currentOperation: null as 'section' | 'element' | 'page' | null,
      progress: 0,
      status: '',
      errors: [] as string[],
      warnings: [] as string[],
      context: null,
    },
    elementVariations: {
      visible: false,
      variations: [] as string[],
    },
    layoutChangeModal: {
      visible: false,
      sectionId: undefined as string | undefined,
      sectionType: undefined as string | undefined,
      currentLayout: undefined as string | undefined,
      currentData: undefined as Record<string, any> | undefined,
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
    queuedChanges: [] as any[],
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
    id: tokenId,
    title: 'Untitled Project',
    slug: '',
    description: '',
    lastUpdated: Date.now(),
    version: 1,
    tokenId: tokenId,
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

    // Forms Slice 
    forms: {} as Record<string, import('@/types/core/forms').MVPForm>,
    formBuilderOpen: false,
    editingFormId: null as string | null,
    simpleForms: [] as any[],
    activeForm: undefined as string | undefined,
    formBuilder: {
      visible: false,
      editingField: undefined as string | undefined,
      editingFormId: undefined as string | undefined,
      fieldLibrary: [],
    },
    integrations: {} as Record<string, any>,
    analytics: {} as Record<string, any>,

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

    // CSS Variable Slice
    cssVariables: {
      ...defaultCSSVariableState,
      _cssVariableSlice: {
        version: '1.0.0',
        initialized: false,
        lastMigration: Date.now(),
      },
    },
  } as unknown as EditStore;
}

/**
 * Create a new EditStore instance for a specific token
 */
export function createEditStore(tokenId: string) {
  if (!tokenId || typeof tokenId !== 'string') {
    throw new Error('Token ID is required to create EditStore');
  }

  // console.log(`🏭 Creating EditStore factory for token: ${tokenId}`);

  // Track project access
  if (isStorageAvailable()) {
    trackProjectAccess(tokenId);
  }

  const storageKey = getStorageKey(tokenId);
  
  const store = create<EditStore>()(
    devtools(
      subscribeWithSelector(
        persist(
          immer((set, get) => ({
            // Initial state with token
            ...createInitialState(tokenId),
            
            // All existing action creators
            ...createCoreActions(set, get),
            ...createContentActions(set, get),
            ...createAIActions(set, get),
            ...createPersistenceActions(set, get),
            ...createGenerationActions(set, get),
            ...createUIActions(set, get),
            ...createFormsImageActions(set, get),
            ...createLayoutActions(set, get),
            ...createCSSVariableActions(set, get),
            ...createRegenerationActions(set, get),

            // Token-specific actions
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

            // Token-aware reset function
            reset: () => {
              console.log(`🔄 Resetting store for token: ${tokenId}`);
              set(createInitialState(tokenId));
            },

            // Get token ID
            getTokenId: () => tokenId,
          })),
          {
            name: storageKey, // Token-specific storage key
            partialize: (state) => ({
              sections: state.sections,
              sectionLayouts: state.sectionLayouts,
              sectionSpacing: state.sectionSpacing,
              content: state.content,
              theme: state.theme,
              navigationConfig: state.navigationConfig,
              socialMediaConfig: state.socialMediaConfig,
              globalSettings: state.globalSettings,
              tokenId: state.tokenId,
              onboardingData: state.onboardingData,
              id: state.id,
              title: state.title,
              lastUpdated: state.lastUpdated,
              version: state.version,
              performance: state.performance,
              // CSS Variable State
              phase: state.phase,
              featureFlags: state.featureFlags,
              customColors: state.customColors,
              generatedVariables: state.generatedVariables,
              browserSupport: state.browserSupport,
              metrics: state.metrics,
              debugMode: state.debugMode,
            }),
            onRehydrateStorage: () => (state) => {
              if (state) {
                // console.log(`🔄 [STORE-DEBUG] EditStore rehydrated for token ${tokenId}:`, {
                //   sections: state.sections?.length || 0,
                //   content: Object.keys(state.content || {}).length,
                //   tokenId: state.tokenId,
                //   hasTheme: !!state.theme,
                //   themeDetails: {
                //     colors: state.theme?.colors,
                //     typography: {
                //       headingFont: state.theme?.typography?.headingFont,
                //       bodyFont: state.theme?.typography?.bodyFont
                //     },
                //     backgroundsFromStorage: {
                //       primary: state.theme?.colors?.sectionBackgrounds?.primary,
                //       secondary: state.theme?.colors?.sectionBackgrounds?.secondary,
                //       neutral: state.theme?.colors?.sectionBackgrounds?.neutral,
                //       divider: state.theme?.colors?.sectionBackgrounds?.divider
                //     }
                //   },
                //   onboardingData: {
                //     hasOneLiner: !!state.onboardingData?.oneLiner,
                //     validatedFieldsCount: Object.keys(state.onboardingData?.validatedFields || {}).length,
                //     hiddenFieldsCount: Object.keys(state.onboardingData?.hiddenInferredFields || {}).length
                //   }
                // });
                
                // Ensure tokenId matches (in case of storage corruption)
                if (state.tokenId !== tokenId) {
                  console.warn(`⚠️ [STORE-DEBUG] Token mismatch in storage: expected ${tokenId}, got ${state.tokenId}`);
                  state.tokenId = tokenId;
                  state.id = tokenId;
                }
                
                // Ensure performance object exists
                if (!state.performance) {
                  state.performance = {
                    saveCount: 0,
                    averageSaveTime: 0,
                    lastSaveTime: 0,
                    failedSaves: 0,
                  };
                }
              } else {
                // console.log(`🔄 [STORE-DEBUG] No stored data found for token ${tokenId}, using defaults`);
              }
            },
            // Add error handling for corrupted storage
            storage: {
              getItem: (name) => {
                try {
                  const item = localStorage.getItem(name);
                  return item ? JSON.parse(item) : null;
                } catch (error) {
                  console.error(`Failed to parse stored data for ${name}:`, error);
                  // Clear corrupted data
                  localStorage.removeItem(name);
                  return null;
                }
              },
              setItem: (name, value) => {
                try {
                  localStorage.setItem(name, JSON.stringify(value));
                } catch (error) {
                  console.error(`Failed to store data for ${name}:`, error);
                  // Could implement storage quota handling here
                }
              },
              removeItem: (name) => localStorage.removeItem(name),
            },
          }
        )
      ),
      { name: `EditStore-${tokenId}` }
    )
  );

  // Add store metadata to the store instance
  (store as any).__tokenId = tokenId;
  (store as any).__storageKey = storageKey;
  (store as any).__createdAt = Date.now();

  return store;
}

// Export the store instance type
export type EditStoreInstance = ReturnType<typeof createEditStore>;

// Development utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).__editStoreFactory = {
    createEditStore,
    getStorageKey,
    defaultTheme,
    createInitialState,
  };
  
  // console.log('🔧 Edit Store Factory debug utilities available at window.__editStoreFactory');
}