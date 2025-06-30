// hooks/useEditStore.ts - Part 1: Imports and Type Definitions
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import { subscribeWithSelector } from "zustand/middleware";
import { debounce } from "lodash";
import { autoSaveDraft } from "@/utils/autoSaveDraft";
import { useOnboardingStore } from "./useOnboardingStore";
import { generateColorTokens, generateColorTokensFromBackgroundSystem } from "@/modules/Design/ColorSystem/colorTokens";
import { buildFullPrompt, buildSectionPrompt, buildElementPrompt } from "@/modules/prompt/buildPrompt";
import { parseAiResponse } from "@/modules/prompt/parseAiResponse";
import { autoSaveMiddleware, createChangeTracker, type AutoSaveMiddlewareState } from '@/middleware/autoSaveMiddleware';

import type {
  InputVariables,
  HiddenInferredFields,
  FeatureItem,
  SectionData,
  Theme,
  BackgroundType,
  ElementType,
  ElementEditMode,
  SectionType,
  CanonicalFieldName
} from "@/types/core/index";

import type { BackgroundSystem } from "@/modules/Design/ColorSystem/colorTokens";

/**
 * ===== CORE STORE INTERFACES =====
 */

interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

interface ElementSelection {
  sectionId: string;
  elementKey: string;
  type: ElementType;
  editMode: ElementEditMode;
}

interface ToolbarState {
  visible: boolean;
  position: { x: number; y: number };
  targetId?: string;
  contextActions: ToolbarAction[];
  activeDropdown?: string;
}

interface ToolbarAction {
  id: string;
  label: string;
  icon?: string;
  type: 'button' | 'dropdown' | 'separator';
  disabled?: boolean;
  handler?: () => void;
  children?: ToolbarAction[];
}

interface ChangeEvent {
  type: 'content' | 'layout' | 'theme';
  sectionId?: string;
  elementKey?: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

interface EditHistoryEntry {
  type: 'content' | 'layout' | 'theme' | 'section';
  description: string;
  timestamp: number;
  beforeState: any;
  afterState: any;
  sectionId?: string;
}

interface APIRequest {
  id: string;
  type: 'regenerate-section' | 'regenerate-element' | 'save-draft';
  payload: any;
  priority: number;
  timestamp: number;
  retries: number;
}

/**
 * ===== UI SLICE INTERFACE =====
 */
interface UISlice {
  // Edit Modes
  mode: 'preview' | 'edit';
  editMode: 'section' | 'element' | 'global';
  
  // Selection State
  selectedSection?: string;
  selectedElement?: ElementSelection;
  multiSelection: string[];
  
  // Panel State
  leftPanel: {
    width: number;
    collapsed: boolean;
    activeTab: 'addSections' | 'pageStructure' | 'inputVariables' | 'aiControls' | 'guidance' | 'insights';
  };
  
  // Floating Toolbars
  floatingToolbars: {
    section: ToolbarState;
    element: ToolbarState;
    form: ToolbarState;
    image: ToolbarState;
  };
  
  // Auto-Save State
  autoSave: {
    isDirty: boolean;
    isSaving: boolean;
    lastSaved?: number;
    queuedChanges: ChangeEvent[];
    error?: string;
  };
  
  // AI Generation State
  aiGeneration: {
    isGenerating: boolean;
    currentOperation: 'section' | 'element' | 'page' | null;
    targetId?: string;
    progress: number;
    status: string;
    lastGenerated?: number;
    errors: string[];
    warnings: string[];
  };
  
  // Element Variations
  elementVariations: {
    visible: boolean;
    elementId?: string;
    variations: string[];
    selectedVariation?: number;
  };
  
  // Forms State
  forms: {
    activeForm?: string;
    formBuilder: {
      visible: boolean;
      editingField?: string;
    };
  };
  
  // Images State
  images: {
    activeImage?: string;
    stockPhotos: {
      searchResults: any[];
      searchQuery: string;
      searchVisible: boolean;
    };
    uploadProgress: Record<string, number>;
  };
  
  // Error Handling
  errors: Record<string, string>;
  loadingStates: Record<string, boolean>;
  isLoading: boolean;
  
  // History State
  history: {
    undoStack: EditHistoryEntry[];
    redoStack: EditHistoryEntry[];
    maxHistorySize: number;
  };
  
  // Performance
  apiQueue: {
    queue: APIRequest[];
    processing: boolean;
    rateLimitRemaining: number;
    rateLimitReset: number;
  };
}

/**
 * ===== MAIN EDIT STORE INTERFACE =====
 */
interface EditStore extends AutoSaveMiddlewareState {
  // Layout Slice Properties
  sections: string[];
  sectionLayouts: Record<string, string>;
  theme: Theme;
  globalSettings: {
    maxWidth: string;
    containerPadding: string;
    sectionSpacing: string;
    deviceMode: 'desktop' | 'mobile';
    zoomLevel: number;
  };
  
  // Content Slice Properties  
  content: Record<string, SectionData>;
  
  // UI Slice Properties (spread from UISlice)
  mode: 'preview' | 'edit';
  editMode: 'section' | 'element' | 'global';
  selectedSection?: string;
  selectedElement?: ElementSelection;
  multiSelection: string[];
  leftPanel: UISlice['leftPanel'];
  floatingToolbars: UISlice['floatingToolbars'];
  autoSave: UISlice['autoSave'];
  aiGeneration: UISlice['aiGeneration'];
  elementVariations: UISlice['elementVariations'];
  forms: UISlice['forms'];
  images: UISlice['images'];
  errors: Record<string, string>;
  loadingStates: Record<string, boolean>;
  isLoading: boolean;
  history: UISlice['history'];
  apiQueue: UISlice['apiQueue'];
  
  // Meta Slice Properties
  id: string;
  title: string;
  slug: string;
  description?: string;
  lastUpdated: number;
  version: number;
  tokenId: string;
  onboardingData: {
    oneLiner: string;
    validatedFields: Partial<InputVariables>;
    featuresFromAI: FeatureItem[];
    hiddenInferredFields: HiddenInferredFields;
    confirmedFields: Record<CanonicalFieldName, ConfirmedFieldData>;
  };
  publishing: {
    isPublishReady: boolean;
    publishedUrl?: string;
    publishError?: string;
    lastPublished?: number;
  };

  // All Actions (to be defined in other parts)
  // Layout Actions
  addSection: (sectionType: string, position?: number) => string;
  removeSection: (sectionId: string) => void;
  reorderSections: (newOrder: string[]) => void;
  duplicateSection: (sectionId: string) => string;
  setLayout: (sectionId: string, layout: string) => void;
  setSectionLayouts: (layouts: Record<string, string>) => void;
  updateTheme: (theme: Partial<Theme>) => void;
  updateBaseColor: (baseColor: string) => void;
  updateAccentColor: (accentColor: string) => void;
  updateSectionBackground: (type: keyof Theme['colors']['sectionBackgrounds'], value: string) => void;
  updateFromBackgroundSystem: (backgroundSystem: BackgroundSystem) => void;
  updateTypography: (typography: Partial<Theme['typography']>) => void;
  setDeviceMode: (mode: 'desktop' | 'mobile') => void;
  setZoomLevel: (level: number) => void;
  getColorTokens: () => ReturnType<typeof generateColorTokens>;
  
  // Content Actions
  updateElementContent: (sectionId: string, elementKey: string, content: string | string[]) => void;
  bulkUpdateSection: (sectionId: string, elements: Record<string, string | string[]>) => void;
  setBackgroundType: (sectionId: string, backgroundType: BackgroundType) => void;
  markAsCustomized: (sectionId: string) => void;
  setSection: (sectionId: string, data: Partial<SectionData>) => void;
  
  // UI Actions
  setMode: (mode: 'preview' | 'edit') => void;
  setEditMode: (mode: 'section' | 'element' | 'global') => void;
  setActiveSection: (sectionId?: string) => void;
  selectElement: (selection: ElementSelection | null) => void;
  setMultiSelection: (sectionIds: string[]) => void;
  setLeftPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  setLeftPanelTab: (tab: UISlice['leftPanel']['activeTab']) => void;
  showSectionToolbar: (sectionId: string, position: { x: number; y: number }) => void;
  hideSectionToolbar: () => void;
  showElementToolbar: (elementId: string, position: { x: number; y: number }) => void;
  hideElementToolbar: () => void;
  showFormToolbar: (formId: string, position: { x: number; y: number }) => void;
  hideFormToolbar: () => void;
  showImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
  hideImageToolbar: () => void;
  triggerAutoSave: () => void;
  clearAutoSaveError: () => void;
  showElementVariations: (elementId: string, variations: string[]) => void;
  hideElementVariations: () => void;
  selectVariation: (index: number) => void;
  applySelectedVariation: () => void;
  setActiveForm: (formId?: string) => void;
  showFormBuilder: () => void;
  hideFormBuilder: () => void;
  convertCTAToForm: (sectionId: string, elementKey: string) => void;
  setActiveImage: (imageId?: string) => void;
  showStockPhotoSearch: (query: string) => void;
  hideStockPhotoSearch: () => void;
  setImageUploadProgress: (imageId: string, progress: number) => void;
  setError: (error: string, sectionId?: string) => void;
  clearError: (sectionId?: string) => void;
  setLoading: (isLoading: boolean, sectionId?: string) => void;
  pushHistory: (entry: EditHistoryEntry) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Meta Actions
  updateMeta: (meta: Partial<Omit<EditStore, 'onboardingData' | 'publishing'>>) => void;
  loadFromOnboarding: () => void;
  updateOnboardingData: (data: Partial<EditStore['onboardingData']>) => void;
  updatePublishingState: (state: Partial<EditStore['publishing']>) => void;
  
  // Global Actions
  reset: () => void;
  export: () => object;
  loadFromDraft: (apiResponse: any) => Promise<void>;
  save: () => Promise<void>;
  
  // AI Generation Actions
  regenerateSection: (sectionId: string, userGuidance?: string) => Promise<void>;
  regenerateElement: (sectionId: string, elementKey: string, variationCount?: number) => Promise<void>;
  regenerateAllContent: () => Promise<void>;
  updateFromAIResponse: (aiResponse: any) => void;
  setAIGenerationStatus: (status: Partial<UISlice['aiGeneration']>) => void;
  clearAIErrors: () => void;
  
  // Forms System Actions
  createForm: (sectionId: string, elementKey: string) => string;
  addFormField: (formId: string, fieldType: string) => void;
  updateFormField: (formId: string, fieldId: string, properties: any) => void;
  deleteFormField: (formId: string, fieldId: string) => void;
  updateFormSettings: (formId: string, settings: any) => void;
  connectFormIntegration: (formId: string, integration: any) => void;
  
  // Image System Actions
  uploadImage: (file: File, targetElement?: { sectionId: string; elementKey: string }) => Promise<string>;
  replaceImage: (sectionId: string, elementKey: string, imageUrl: string) => void;
  searchStockPhotos: (query: string, targetElement?: { sectionId: string; elementKey: string }) => Promise<void>;
  generateImageAltText: (imageUrl: string) => Promise<string>;
  optimizeImage: (imageUrl: string, options: any) => Promise<string>;
  
  // Validation & Business Logic
  validateSection: (sectionId: string) => boolean;
  getIncompleteElements: (sectionId: string) => string[];
  canPublish: () => boolean;
  getOptimizationSuggestions: () => string[];
}

// hooks/useEditStore.ts - Part 2: Default Values and Utility Functions

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
 * ===== UTILITY FUNCTIONS =====
 */

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Infer element type from element key
const inferElementType = (elementKey: string): ElementType => {
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

// Create debounced auto-save function
const createDebouncedAutoSave = (getState: () => EditStore) => {
  return debounce(async () => {
    const state = getState();
    if (!state.autoSave.isDirty || state.autoSave.isSaving) return;
    
    try {
      state.autoSave.isSaving = true;
      
      // Save to API with current state
      await autoSaveDraft({
        tokenId: state.tokenId,
        inputText: state.onboardingData.oneLiner,
        validatedFields: state.onboardingData.validatedFields,
        featuresFromAI: state.onboardingData.featuresFromAI,
        hiddenInferredFields: state.onboardingData.hiddenInferredFields,
        title: state.title,
        includePageData: true,
      });
      
      // Update auto-save state
      const currentTime = Date.now();
      state.autoSave.isSaving = false;
      state.autoSave.isDirty = false;
      state.autoSave.lastSaved = currentTime;
      state.lastUpdated = currentTime;
      state.version += 1;
      state.autoSave.error = undefined;
      
      console.log('✅ Auto-save successful');
      
    } catch (error) {
      state.autoSave.isSaving = false;
      state.autoSave.error = error instanceof Error ? error.message : 'Auto-save failed';
      console.error('❌ Auto-save failed:', error);
    }
  }, 500);
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
const handleSectionRegeneration = async (payload: { sectionId: string; userGuidance?: string }, getState: () => EditStore, setState: any) => {
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
const handleElementRegeneration = async (payload: { sectionId: string; elementKey: string; variationCount: number }, getState: () => EditStore, setState: any) => {
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

// hooks/useEditStore.ts - Part 3: Layout Actions

/**
 * ===== LAYOUT ACTIONS =====
 */

const layoutActions = (set: any, get: any) => ({
  addSection: (sectionType: string, position?: number) => {
    const sectionId = `${sectionType}-${Date.now()}`;
    set((state: EditStore) => {
      const insertPos = position ?? state.sections.length;
      state.sections.splice(insertPos, 0, sectionId);
      state.sectionLayouts[sectionId] = 'default';
      
      // Create section data
      state.content[sectionId] = {
        id: sectionId,
        layout: 'default',
        elements: {},
        aiMetadata: {
          aiGenerated: false,
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
          completionPercentage: 0,
        },
      };
      
      state.autoSave.isDirty = true;
      
      // Add to history
      state.history.undoStack.push({
        type: 'section',
        description: `Added ${sectionType} section`,
        timestamp: Date.now(),
        beforeState: null,
        afterState: { sectionId, sectionType },
        sectionId,
      });
      
      // Clear redo stack
      state.history.redoStack = [];
    });
    return sectionId;
  },
  
  removeSection: (sectionId: string) =>
    set((state: EditStore) => {
      const sectionIndex = state.sections.indexOf(sectionId);
      if (sectionIndex === -1) return;
      
      // Store section data for undo
      const sectionData = state.content[sectionId];
      
      // Remove section
      state.sections.splice(sectionIndex, 1);
      delete state.sectionLayouts[sectionId];
      delete state.content[sectionId];
      
      // Clean up UI state
      if (state.selectedSection === sectionId) {
        state.selectedSection = undefined;
      }
      delete state.loadingStates[sectionId];
      delete state.errors[sectionId];
      
      state.autoSave.isDirty = true;
      
      // Add to history
      state.history.undoStack.push({
        type: 'section',
        description: `Removed section`,
        timestamp: Date.now(),
        beforeState: { sectionId, sectionData, sectionIndex },
        afterState: null,
        sectionId,
      });
      
      state.history.redoStack = [];
    }),
  
  reorderSections: (newOrder: string[]) =>
    set((state: EditStore) => {
      const oldOrder = [...state.sections];
      state.sections = newOrder;
      state.autoSave.isDirty = true;
      
      state.history.undoStack.push({
        type: 'layout',
        description: 'Reordered sections',
        timestamp: Date.now(),
        beforeState: { sections: oldOrder },
        afterState: { sections: newOrder },
      });
      
      state.history.redoStack = [];
    }),
  
  duplicateSection: (sectionId: string) => {
    const newId = `${sectionId}-copy-${Date.now()}`;
    set((state: EditStore) => {
      const originalSection = state.content[sectionId];
      if (!originalSection) return;
      
      const index = state.sections.findIndex(id => id === sectionId);
      state.sections.splice(index + 1, 0, newId);
      state.sectionLayouts[newId] = state.sectionLayouts[sectionId];
      
      // Deep clone section data
      state.content[newId] = {
        ...originalSection,
        id: newId,
        aiMetadata: {
          ...originalSection.aiMetadata,
          lastGenerated: Date.now(),
        },
        editMetadata: {
          ...originalSection.editMetadata,
          isSelected: false,
          isEditing: false,
        },
      };
      
      state.autoSave.isDirty = true;
      
      state.history.undoStack.push({
        type: 'section',
        description: 'Duplicated section',
        timestamp: Date.now(),
        beforeState: null,
        afterState: { sectionId: newId },
        sectionId: newId,
      });
      
      state.history.redoStack = [];
    });
    return newId;
  },
  
  setLayout: (sectionId: string, layout: string) =>
    set((state: EditStore) => {
      const oldLayout = state.sectionLayouts[sectionId];
      state.sectionLayouts[sectionId] = layout;
      
      if (state.content[sectionId]) {
        state.content[sectionId].layout = layout;
      }
      
      state.autoSave.isDirty = true;
      
      state.history.undoStack.push({
        type: 'layout',
        description: `Changed section layout to ${layout}`,
        timestamp: Date.now(),
        beforeState: { sectionId, layout: oldLayout },
        afterState: { sectionId, layout },
        sectionId,
      });
      
      state.history.redoStack = [];
    }),
  
  setSectionLayouts: (layouts: Record<string, string>) =>
    set((state: EditStore) => {
      const oldLayouts = { ...state.sectionLayouts };
      Object.assign(state.sectionLayouts, layouts);
      
      // Update section layout properties
      Object.entries(layouts).forEach(([sectionId, layout]) => {
        if (state.content[sectionId]) {
          state.content[sectionId].layout = layout;
        }
      });
      
      state.autoSave.isDirty = true;
      
      state.history.undoStack.push({
        type: 'layout',
        description: 'Updated multiple section layouts',
        timestamp: Date.now(),
        beforeState: { layouts: oldLayouts },
        afterState: { layouts },
      });
      
      state.history.redoStack = [];
    }),
  
  updateTheme: (theme: Partial<Theme>) =>
    set((state: EditStore) => {
      const oldTheme = { ...state.theme };
      Object.assign(state.theme, theme);
      state.autoSave.isDirty = true;
      
      state.history.undoStack.push({
        type: 'theme',
        description: 'Updated theme',
        timestamp: Date.now(),
        beforeState: { theme: oldTheme },
        afterState: { theme: state.theme },
      });
      
      state.history.redoStack = [];
    }),
  
  updateBaseColor: (baseColor: string) =>
    set((state: EditStore) => {
      const oldBaseColor = state.theme.colors.baseColor;
      state.theme.colors.baseColor = baseColor;
      state.autoSave.isDirty = true;
      
      state.history.undoStack.push({
        type: 'theme',
        description: `Changed base color to ${baseColor}`,
        timestamp: Date.now(),
        beforeState: { baseColor: oldBaseColor },
        afterState: { baseColor },
      });
      
      state.history.redoStack = [];
      
      // Track change for auto-save
      const changeTracker = createChangeTracker(get);
      changeTracker.trackThemeChange('baseColor', oldBaseColor, baseColor);
    }),

  updateAccentColor: (accentColor: string) =>
    set((state: EditStore) => {
      const oldAccentColor = state.theme.colors.accentColor;
      state.theme.colors.accentColor = accentColor;
      state.autoSave.isDirty = true;
      
      state.history.undoStack.push({
        type: 'theme',
        description: `Changed accent color to ${accentColor}`,
        timestamp: Date.now(),
        beforeState: { accentColor: oldAccentColor },
        afterState: { accentColor },
      });
      
      state.history.redoStack = [];
    }),
  
  updateSectionBackground: (type: keyof Theme['colors']['sectionBackgrounds'], value: string) =>
    set((state: EditStore) => {
      const oldValue = state.theme.colors.sectionBackgrounds[type];
      state.theme.colors.sectionBackgrounds[type] = value;
      state.autoSave.isDirty = true;
      
      state.history.undoStack.push({
        type: 'theme',
        description: `Updated ${type} background`,
        timestamp: Date.now(),
        beforeState: { type, value: oldValue },
        afterState: { type, value },
      });
      
      state.history.redoStack = [];
    }),
  
  updateFromBackgroundSystem: (backgroundSystem: BackgroundSystem) =>
    set((state: EditStore) => {
      const oldTheme = { ...state.theme };
      
      // Update all color-related theme properties
      state.theme.colors.baseColor = backgroundSystem.baseColor;
      state.theme.colors.accentColor = backgroundSystem.accentColor;
      state.theme.colors.accentCSS = backgroundSystem.accentCSS;
      
      // Update section backgrounds
      state.theme.colors.sectionBackgrounds.primary = backgroundSystem.primary;
      state.theme.colors.sectionBackgrounds.secondary = backgroundSystem.secondary;
      state.theme.colors.sectionBackgrounds.neutral = backgroundSystem.neutral;
      state.theme.colors.sectionBackgrounds.divider = backgroundSystem.divider;
      
      state.autoSave.isDirty = true;
      
      state.history.undoStack.push({
        type: 'theme',
        description: 'Updated from background system',
        timestamp: Date.now(),
        beforeState: { theme: oldTheme },
        afterState: { theme: state.theme },
      });
      
      state.history.redoStack = [];
    }),
  
  updateTypography: (typography: Partial<Theme['typography']>) =>
    set((state: EditStore) => {
      const oldTypography = { ...state.theme.typography };
      Object.assign(state.theme.typography, typography);
      state.autoSave.isDirty = true;
      
      state.history.undoStack.push({
        type: 'theme',
        description: 'Updated typography',
        timestamp: Date.now(),
        beforeState: { typography: oldTypography },
        afterState: { typography: state.theme.typography },
      });
      
      state.history.redoStack = [];
    }),
  
  setDeviceMode: (mode: 'desktop' | 'mobile') =>
    set((state: EditStore) => {
      state.globalSettings.deviceMode = mode;
    }),
  
  setZoomLevel: (level: number) =>
    set((state: EditStore) => {
      state.globalSettings.zoomLevel = Math.max(25, Math.min(200, level));
    }),
  
  getColorTokens: () => {
    const { theme } = get();
    
    // Check if we have a complete background system
    const hasCompleteBackgroundSystem = 
      theme.colors.sectionBackgrounds.primary && 
      theme.colors.sectionBackgrounds.secondary;

    if (hasCompleteBackgroundSystem && theme.colors.accentCSS) {
      // Properly construct the BackgroundSystem object
      const backgroundSystemData: BackgroundSystem = {
        primary: theme.colors.sectionBackgrounds.primary!,
        secondary: theme.colors.sectionBackgrounds.secondary!,
        neutral: theme.colors.sectionBackgrounds.neutral || 'bg-white',
        divider: theme.colors.sectionBackgrounds.divider || 'bg-gray-100/50',
        baseColor: theme.colors.baseColor,
        accentColor: theme.colors.accentColor,
        accentCSS: theme.colors.accentCSS
      };

      console.log('🎨 Using integrated background system for color tokens:', backgroundSystemData);
      return generateColorTokensFromBackgroundSystem(backgroundSystemData);
    } else {
      // Fallback to basic generation
      console.warn('Using fallback color token generation - background system not fully integrated');
      return generateColorTokens({
        baseColor: theme.colors.baseColor,
        accentColor: theme.colors.accentColor,
        accentCSS: theme.colors.accentCSS,
        sectionBackgrounds: theme.colors.sectionBackgrounds
      });
    }
  },
});

// hooks/useEditStore.ts - Part 4: Content and UI Actions

/**
 * ===== CONTENT ACTIONS =====
 */

const contentActions = (set: any, get: any) => ({
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
      
      state.content[sectionId].aiMetadata.isCustomized = true;
      state.autoSave.isDirty = true;
      
      // Track change for auto-save
      const changeTracker = createChangeTracker(get);
      changeTracker.trackContentChange(sectionId, elementKey, oldValue, content);
    }),

  bulkUpdateSection: (sectionId: string, elements: Record<string, string | string[]>) =>
    set((state: EditStore) => {
      if (!state.content[sectionId]) return;
      
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
    }),

  setBackgroundType: (sectionId: string, backgroundType: BackgroundType) =>
    set((state: EditStore) => {
      if (state.content[sectionId]) {
        state.content[sectionId].backgroundType = backgroundType;
        state.autoSave.isDirty = true;
      }
    }),

  markAsCustomized: (sectionId: string) =>
    set((state: EditStore) => {
      if (state.content[sectionId]) {
        state.content[sectionId].aiMetadata.isCustomized = true;
        state.autoSave.isDirty = true;
      }
    }),

  setSection: (sectionId: string, data: Partial<SectionData>) =>
    set((state: EditStore) => {
      if (state.content[sectionId]) {
        Object.assign(state.content[sectionId], data);
        state.autoSave.isDirty = true;
      }
    }),
});

/**
 * ===== UI ACTIONS =====
 */

const uiActions = (set: any, get: any) => ({
  // Basic UI Actions
  setMode: (mode: 'preview' | 'edit') =>
    set((state: EditStore) => {
      state.mode = mode;
    }),
  
  setEditMode: (mode: 'section' | 'element' | 'global') =>
    set((state: EditStore) => {
      state.editMode = mode;
    }),
  
  setActiveSection: (sectionId?: string) =>
    set((state: EditStore) => {
      state.selectedSection = sectionId;
      
      // Clear element selection when changing sections
      if (state.selectedElement && state.selectedElement.sectionId !== sectionId) {
        state.selectedElement = undefined;
      }
    }),
  
  selectElement: (selection: ElementSelection | null) =>
    set((state: EditStore) => {
      state.selectedElement = selection || undefined;
      
      // Update active section to match selected element
      if (selection) {
        state.selectedSection = selection.sectionId;
      }
    }),
  
  setMultiSelection: (sectionIds: string[]) =>
    set((state: EditStore) => {
      state.multiSelection = sectionIds;
    }),
  
  // Panel Actions
  setLeftPanelWidth: (width: number) =>
    set((state: EditStore) => {
      state.leftPanel.width = Math.max(250, Math.min(500, width));
    }),
  
  toggleLeftPanel: () =>
    set((state: EditStore) => {
      state.leftPanel.collapsed = !state.leftPanel.collapsed;
    }),
  
  setLeftPanelTab: (tab: UISlice['leftPanel']['activeTab']) =>
    set((state: EditStore) => {
      state.leftPanel.activeTab = tab;
    }),
  
  // Floating Toolbar Actions
  showSectionToolbar: (sectionId: string, position: { x: number; y: number }) =>
    set((state: EditStore) => {
      state.floatingToolbars.section = {
        visible: true,
        position,
        targetId: sectionId,
        contextActions: [
          { id: 'regenerate', label: 'Regenerate', type: 'button', handler: () => get().regenerateSection(sectionId) },
          { id: 'duplicate', label: 'Duplicate', type: 'button', handler: () => get().duplicateSection(sectionId) },
          { id: 'separator1', label: '', type: 'separator' },
          { id: 'move-up', label: 'Move Up', type: 'button', handler: () => {/* move up logic */} },
          { id: 'move-down', label: 'Move Down', type: 'button', handler: () => {/* move down logic */} },
          { id: 'separator2', label: '', type: 'separator' },
          { id: 'delete', label: 'Delete', type: 'button', handler: () => get().removeSection(sectionId) },
        ],
      };
    }),
  
  hideSectionToolbar: () =>
    set((state: EditStore) => {
      state.floatingToolbars.section.visible = false;
    }),
  
  showElementToolbar: (elementId: string, position: { x: number; y: number }) =>
    set((state: EditStore) => {
      const [sectionId, elementKey] = elementId.split('.');
      state.floatingToolbars.element = {
        visible: true,
        position,
        targetId: elementId,
        contextActions: [
          { id: 'regenerate', label: 'Regenerate', type: 'button', handler: () => get().regenerateElement(sectionId, elementKey) },
          { id: 'variations', label: 'Get Variations', type: 'button', handler: () => get().regenerateElement(sectionId, elementKey, 5) },
          { id: 'separator1', label: '', type: 'separator' },
          { id: 'format', label: 'Format', type: 'dropdown', children: [
            { id: 'bold', label: 'Bold', type: 'button' },
            { id: 'italic', label: 'Italic', type: 'button' },
            { id: 'underline', label: 'Underline', type: 'button' },
          ]},
        ],
      };
    }),
  
  hideElementToolbar: () =>
    set((state: EditStore) => {
      state.floatingToolbars.element.visible = false;
    }),
  
  showFormToolbar: (formId: string, position: { x: number; y: number }) =>
    set((state: EditStore) => {
      state.floatingToolbars.form = {
        visible: true,
        position,
        targetId: formId,
        contextActions: [
          { id: 'edit-fields', label: 'Edit Fields', type: 'button' },
          { id: 'settings', label: 'Form Settings', type: 'button' },
          { id: 'integrations', label: 'Connect Integration', type: 'button' },
        ],
      };
    }),
  
  hideFormToolbar: () =>
    set((state: EditStore) => {
      state.floatingToolbars.form.visible = false;
    }),
  
  showImageToolbar: (imageId: string, position: { x: number; y: number }) =>
    set((state: EditStore) => {
      state.floatingToolbars.image = {
        visible: true,
        position,
        targetId: imageId,
        contextActions: [
          { id: 'replace', label: 'Replace Image', type: 'button' },
          { id: 'edit', label: 'Edit Image', type: 'button' },
          { id: 'alt-text', label: 'Edit Alt Text', type: 'button' },
          { id: 'optimize', label: 'Optimize', type: 'button' },
        ],
      };
    }),
  
  hideImageToolbar: () =>
    set((state: EditStore) => {
      state.floatingToolbars.image.visible = false;
    }),
  
  // Auto-Save Actions
  triggerAutoSave: () => {
    const state = get();
    if (!state.autoSave.isDirty || state.autoSave.isSaving) return;
    // This will be connected to the debounced auto-save function
  },
  
  clearAutoSaveError: () =>
    set((state: EditStore) => {
      state.autoSave.error = undefined;
    }),
  
  // Element Variations
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
      
      if (selectedContent) {
        get().updateElementContent(sectionId, elementKey, selectedContent);
        state.elementVariations.visible = false;
      }
    }),
  
  // Forms Actions
  setActiveForm: (formId?: string) =>
    set((state: EditStore) => {
      state.forms.activeForm = formId;
    }),
  
  showFormBuilder: () =>
    set((state: EditStore) => {
      state.forms.formBuilder.visible = true;
    }),
  
  hideFormBuilder: () =>
    set((state: EditStore) => {
      state.forms.formBuilder.visible = false;
      state.forms.formBuilder.editingField = undefined;
    }),
  
  convertCTAToForm: (sectionId: string, elementKey: string) =>
    set((state: EditStore) => {
      const formId = generateId();
      
      // Replace CTA element with form element
      if (state.content[sectionId] && state.content[sectionId].elements[elementKey]) {
        state.content[sectionId].elements[elementKey] = {
          content: formId,
          type: 'form',
          isEditable: true,
          editMode: 'modal',
        };
      }
      
      state.forms.activeForm = formId;
      state.forms.formBuilder.visible = true;
      state.autoSave.isDirty = true;
    }),
  
  // Images Actions
  setActiveImage: (imageId?: string) =>
    set((state: EditStore) => {
      state.images.activeImage = imageId;
    }),
  
  showStockPhotoSearch: (query: string) =>
    set((state: EditStore) => {
      state.images.stockPhotos.searchQuery = query;
      state.images.stockPhotos.searchVisible = true;
    }),
  
  hideStockPhotoSearch: () =>
    set((state: EditStore) => {
      state.images.stockPhotos.searchVisible = false;
      state.images.stockPhotos.searchResults = [];
    }),
  
  setImageUploadProgress: (imageId: string, progress: number) =>
    set((state: EditStore) => {
      state.images.uploadProgress[imageId] = progress;
    }),
  
  // Error Actions
  setError: (error: string, sectionId?: string) =>
    set((state: EditStore) => {
      if (sectionId) {
        state.errors[sectionId] = error;
      } else {
        state.errors['global'] = error;
      }
    }),
  
  clearError: (sectionId?: string) =>
    set((state: EditStore) => {
      if (sectionId) {
        delete state.errors[sectionId];
      } else {
        state.errors = {};
      }
    }),
  
  setLoading: (isLoading: boolean, sectionId?: string) =>
    set((state: EditStore) => {
      if (sectionId) {
        state.loadingStates[sectionId] = isLoading;
      } else {
        state.isLoading = isLoading;
      }
    }),
  
  // History Actions
  pushHistory: (entry: EditHistoryEntry) =>
    set((state: EditStore) => {
      state.history.undoStack.push(entry);
      
      // Limit history size
      if (state.history.undoStack.length > state.history.maxHistorySize) {
        state.history.undoStack.shift();
      }
      
      // Clear redo stack when new action is performed
      state.history.redoStack = [];
    }),
  
  undo: () =>
    set((state: EditStore) => {
      const entry = state.history.undoStack.pop();
      if (!entry) return;
      
      // Apply undo logic based on entry type
      console.log('Undo:', entry.description);
      
      state.history.redoStack.push(entry);
    }),
  
  redo: () =>
    set((state: EditStore) => {
      const entry = state.history.redoStack.pop();
      if (!entry) return;
      
      // Apply redo logic based on entry type
      console.log('Redo:', entry.description);
      
      state.history.undoStack.push(entry);
    }),
  
  clearHistory: () =>
    set((state: EditStore) => {
      state.history.undoStack = [];
      state.history.redoStack = [];
    }),
});

// hooks/useEditStore.ts - Part 5: Meta, Global, and AI Actions

/**
 * ===== META ACTIONS =====
 */

const metaActions = (set: any, get: any) => ({
  updateMeta: (meta: Partial<Omit<EditStore, 'onboardingData' | 'publishing'>>) =>
    set((state: EditStore) => {
      Object.assign(state, meta);
      state.lastUpdated = Date.now();
      state.autoSave.isDirty = true;
    }),
  
  loadFromOnboarding: () =>
    set((state: EditStore) => {
      const onboardingState = useOnboardingStore.getState();
      
      state.onboardingData = {
        oneLiner: onboardingState.oneLiner,
        validatedFields: onboardingState.validatedFields,
        featuresFromAI: onboardingState.featuresFromAI,
        hiddenInferredFields: onboardingState.hiddenInferredFields,
        confirmedFields: {
          marketCategory: onboardingState.confirmedFields?.marketCategory || { value: '', confidence: 0 },
          marketSubcategory: onboardingState.confirmedFields?.marketSubcategory || { value: '', confidence: 0 },
          targetAudience: onboardingState.confirmedFields?.targetAudience || { value: '', confidence: 0 },
          keyProblem: onboardingState.confirmedFields?.keyProblem || { value: '', confidence: 0 },
          startupStage: onboardingState.confirmedFields?.startupStage || { value: '', confidence: 0 },
          landingPageGoals: onboardingState.confirmedFields?.landingPageGoals || { value: '', confidence: 0 },
          pricingModel: onboardingState.confirmedFields?.pricingModel || { value: '', confidence: 0 },
        },
      };
      
      console.log('✅ Loaded onboarding data into edit store');
    }),
  
  updateOnboardingData: (data: Partial<EditStore['onboardingData']>) =>
    set((state: EditStore) => {
      Object.assign(state.onboardingData, data);
      state.autoSave.isDirty = true;
    }),
  
  updatePublishingState: (publishingState: Partial<EditStore['publishing']>) =>
    set((state: EditStore) => {
      Object.assign(state.publishing, publishingState);
    }),
});

/**
 * ===== GLOBAL ACTIONS =====
 */

const globalActions = (set: any, get: any) => ({
  reset: () =>
    set(() => ({
      // Layout Slice Reset
      sections: [],
      sectionLayouts: {},
      theme: defaultTheme,
      globalSettings: {
        maxWidth: '1200px',
        containerPadding: '32px',
        sectionSpacing: '64px',
        deviceMode: 'desktop',
        zoomLevel: 100,
      },
      
      // Clear content sections
      content: {},
      
      // UI Slice Reset
      mode: 'edit',
      editMode: 'section',
      selectedSection: undefined,
      selectedElement: undefined,
      multiSelection: [],
      leftPanel: {
        width: 300,
        collapsed: false,
        activeTab: 'pageStructure',
      },
      floatingToolbars: {
        section: { visible: false, position: { x: 0, y: 0 }, contextActions: [] },
        element: { visible: false, position: { x: 0, y: 0 }, contextActions: [] },
        form: { visible: false, position: { x: 0, y: 0 }, contextActions: [] },
        image: { visible: false, position: { x: 0, y: 0 }, contextActions: [] },
      },
      autoSave: {
        isDirty: false,
        isSaving: false,
        queuedChanges: [],
      },
      aiGeneration: {
        isGenerating: false,
        currentOperation: null,
        progress: 0,
        status: '',
        errors: [],
        warnings: [],
      },
      elementVariations: {
        visible: false,
        variations: [],
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
      errors: {},
      loadingStates: {},
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
      
      // Meta Slice Reset
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
    })),
  
  export: () => {
    const state = get();
    
    // Create clean export object with only serializable data
    const exportData = {
      layout: {
        sections: state.sections,
        sectionLayouts: state.sectionLayouts,
        theme: state.theme,
        globalSettings: state.globalSettings,
      },
      content: {} as Record<string, any>,
      meta: {
        id: state.id,
        title: state.title,
        slug: state.slug,
        description: state.description,
        lastUpdated: state.lastUpdated,
        version: state.version,
        tokenId: state.tokenId,
        onboardingData: state.onboardingData,
      },
      exportedAt: Date.now(),
    };
    
    // Export content sections (excluding function properties)
    state.sections.forEach((sectionId: string) => {
      const section = state.content[sectionId];
      if (section) {
        exportData.content[sectionId] = {
          id: section.id,
          layout: section.layout,
          elements: section.elements,
          backgroundType: section.backgroundType,
          media: section.media,
          cta: section.cta,
          aiMetadata: section.aiMetadata,
          editMetadata: section.editMetadata,
        };
      }
    });
    
    return exportData;
  },
  
  loadFromDraft: async (apiResponse: any) => {
    try {
      console.log('🔄 Loading edit store from draft API response:', apiResponse);
      
      set((state: EditStore) => {
        state.isLoading = true;
        state.errors = {};
      });
      
      // 1. Populate meta data
      set((state: EditStore) => {
        state.tokenId = apiResponse.tokenId || '';
        state.title = apiResponse.title || 'Untitled Project';
        state.lastUpdated = apiResponse.lastUpdated ? new Date(apiResponse.lastUpdated).getTime() : Date.now();
        
        // Update onboarding data
        state.onboardingData = {
          oneLiner: apiResponse.inputText || '',
          validatedFields: apiResponse.validatedFields || {},
          featuresFromAI: apiResponse.featuresFromAI || [],
          hiddenInferredFields: apiResponse.hiddenInferredFields || {},
          confirmedFields: apiResponse.confirmedFields || {},
        };
      });
      
      // 2. Check if we have complete page data (finalContent)
      if (apiResponse.finalContent && apiResponse.finalContent.layout && apiResponse.finalContent.content) {
        console.log('📦 Found complete finalContent, restoring edit state...');
        
        const { finalContent } = apiResponse;
        
        set((state: EditStore) => {
          // Restore layout data
          if (finalContent.layout) {
            state.sections = finalContent.layout.sections || [];
            state.sectionLayouts = finalContent.layout.sectionLayouts || {};
            
            // Restore theme if available
            if (finalContent.layout.theme) {
              Object.assign(state.theme, finalContent.layout.theme);
            }
            
            // Restore global settings if available
            if (finalContent.layout.globalSettings) {
              Object.assign(state.globalSettings, finalContent.layout.globalSettings);
            }
          }
          
          // Restore content data with proper section properties
          if (finalContent.content) {
            Object.entries(finalContent.content).forEach(([sectionId, sectionData]: [string, any]) => {
              if (sectionData && typeof sectionData === 'object') {
                state.content[sectionId] = {
                  id: sectionData.id || sectionId,
                  layout: sectionData.layout || 'default',
                  elements: sectionData.elements || {},
                  backgroundType: sectionData.backgroundType,
                  media: sectionData.media,
                  cta: sectionData.cta,
                  aiMetadata: {
                    aiGenerated: sectionData.aiMetadata?.aiGenerated ?? false,
                    lastGenerated: sectionData.aiMetadata?.lastGenerated,
                    isCustomized: sectionData.aiMetadata?.isCustomized ?? false,
                    aiGeneratedElements: sectionData.aiMetadata?.aiGeneratedElements || [],
                    originalPrompt: sectionData.aiMetadata?.originalPrompt,
                    generationContext: sectionData.aiMetadata?.generationContext,
                    qualityScore: sectionData.aiMetadata?.qualityScore,
                    alternatives: sectionData.aiMetadata?.alternatives || [],
                  },
                  editMetadata: {
                    isSelected: false,
                    isEditing: false,
                    lastModified: sectionData.editMetadata?.lastModified,
                    lastModifiedBy: sectionData.editMetadata?.lastModifiedBy,
                    isDeletable: sectionData.editMetadata?.isDeletable ?? true,
                    isMovable: sectionData.editMetadata?.isMovable ?? true,
                    isDuplicable: sectionData.editMetadata?.isDuplicable ?? true,
                    validationStatus: {
                      isValid: true,
                      errors: [],
                      warnings: [],
                      missingRequired: [],
                      lastValidated: Date.now(),
                      ...sectionData.editMetadata?.validationStatus,
                    },
                    completionPercentage: sectionData.editMetadata?.completionPercentage ?? 100,
                  },
                };
              }
            });
          }
          
          // Update meta from finalContent if available
          if (finalContent.meta) {
            Object.assign(state, {
              id: finalContent.meta.id || state.id,
              title: finalContent.meta.title || state.title,
              slug: finalContent.meta.slug || state.slug,
              description: finalContent.meta.description || state.description,
            });
          }
          
          state.isLoading = false;
          state.autoSave.isDirty = false;
          state.autoSave.lastSaved = Date.now();
        });
        
        console.log('✅ Complete edit state restored from finalContent');
        
      } else {
        console.log('⚠️ No complete finalContent found, edit store ready for generation');
        
        set((state: EditStore) => {
          // Clear any partial data
          state.sections = [];
          state.sectionLayouts = {};
          
          // Clear content sections
          state.content = {};
          
          state.isLoading = false;
          state.autoSave.isDirty = false;
        });
      }
      
      // 3. Apply theme values if provided separately
      if (apiResponse.themeValues) {
        set((state: EditStore) => {
          console.log('🎨 Applying separate theme values:', apiResponse.themeValues);
          
          // Update theme colors if provided
          if (apiResponse.themeValues.primary) {
            state.theme.colors.accentColor = apiResponse.themeValues.primary;
          }
          if (apiResponse.themeValues.background) {
            state.theme.colors.baseColor = apiResponse.themeValues.background;
          }
        });
      }
      
      console.log('🎉 Edit store loaded successfully:', {
        hasSections: get().sections.length > 0,
        hasContent: Object.keys(get().content).length > 0,
        hasOnboardingData: Object.keys(get().onboardingData.validatedFields).length > 0,
      });
      
    } catch (error) {
      console.error('❌ Failed to load edit store from draft:', error);
      
      set((state: EditStore) => {
        state.isLoading = false;
        state.errors['global'] = error instanceof Error ? error.message : 'Failed to load draft data';
      });
      
      throw error;
    }
  },
  
  save: async () => {
    const state = get();
    
    set((state: EditStore) => {
      state.isLoading = true;
      state.autoSave.isSaving = true;
    });
    
    try {
      await autoSaveDraft({
        tokenId: state.tokenId,
        inputText: state.onboardingData.oneLiner,
        validatedFields: state.onboardingData.validatedFields,
        featuresFromAI: state.onboardingData.featuresFromAI,
        hiddenInferredFields: state.onboardingData.hiddenInferredFields,
        confirmedFields: state.onboardingData.confirmedFields,
        title: state.title,
        includePageData: true,
      });
      
      const currentTime = Date.now();
      set((state: EditStore) => {
        state.autoSave.lastSaved = currentTime;
        state.autoSave.isDirty = false;
        state.autoSave.isSaving = false;
        state.lastUpdated = currentTime;
        state.version += 1;
        state.isLoading = false;
        state.autoSave.error = undefined;
      });
      
      console.log('✅ Manual save successful');
      
    } catch (error) {
      set((state: EditStore) => {
        state.autoSave.isSaving = false;
        state.isLoading = false;
        state.errors['global'] = error instanceof Error ? error.message : 'Failed to save';
      });
      
      console.error('❌ Manual save failed:', error);
      throw error;
    }
  },
});

/**
 * ===== AI GENERATION ACTIONS =====
 */

const aiActions = (set: any, get: any) => ({
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
          const generatedElements: string[] = [];
          Object.entries(sectionData).forEach(([elementKey, elementValue]: [string, any]) => {
            if (elementValue !== undefined && elementValue !== null) {
              state.content[sectionId].elements[elementKey] = {
                content: elementValue as string | string[],
                type: inferElementType(elementKey),
                isEditable: true,
                editMode: 'inline',
              };
              generatedElements.push(elementKey);
            }
          });
          
          // Update AI metadata
          state.content[sectionId].aiMetadata = {
            ...state.content[sectionId].aiMetadata,
            lastGenerated: Date.now(),
            isCustomized: false,
            aiGeneratedElements: generatedElements,
          };
        });
      }
      
      state.autoSave.isDirty = true;
      state.isLoading = false;
    }),
  
  setAIGenerationStatus: (status: Partial<UISlice['aiGeneration']>) =>
    set((state: EditStore) => {
      Object.assign(state.aiGeneration, status);
    }),
  
  clearAIErrors: () =>
    set((state: EditStore) => {
      state.aiGeneration.errors = [];
      state.aiGeneration.warnings = [];
    }),
});

// hooks/useEditStore.ts - Part 6: Final Store Creation and Debug

/**
 * ===== FORMS AND IMAGES ACTIONS (Simplified) =====
 */

const formsActions = (set: any, get: any) => ({
  createForm: (sectionId: string, elementKey: string) => {
    const formId = generateId();
    
    set((state: EditStore) => {
      // Convert element to form type
      if (state.content[sectionId] && state.content[sectionId].elements[elementKey]) {
        state.content[sectionId].elements[elementKey] = {
          content: formId,
          type: 'form',
          isEditable: true,
          editMode: 'modal',
        };
      }
      
      state.forms.activeForm = formId;
      state.autoSave.isDirty = true;
    });
    
    return formId;
  },
  
  addFormField: (formId: string, fieldType: string) =>
    set((state: EditStore) => {
      console.log('Adding form field:', { formId, fieldType });
      state.autoSave.isDirty = true;
    }),
  
  updateFormField: (formId: string, fieldId: string, properties: any) =>
    set((state: EditStore) => {
      console.log('Updating form field:', { formId, fieldId, properties });
      state.autoSave.isDirty = true;
    }),
  
  deleteFormField: (formId: string, fieldId: string) =>
    set((state: EditStore) => {
      console.log('Deleting form field:', { formId, fieldId });
      state.autoSave.isDirty = true;
    }),
  
  updateFormSettings: (formId: string, settings: any) =>
    set((state: EditStore) => {
      console.log('Updating form settings:', { formId, settings });
      state.autoSave.isDirty = true;
    }),
  
  connectFormIntegration: (formId: string, integration: any) =>
    set((state: EditStore) => {
      console.log('Connecting form integration:', { formId, integration });
      state.autoSave.isDirty = true;
    }),
});

const imageActions = (set: any, get: any) => ({
  uploadImage: async (file: File, targetElement?: { sectionId: string; elementKey: string }) => {
    const imageId = generateId();
    
    set((state: EditStore) => {
      state.images.uploadProgress[imageId] = 0;
    });
    
    try {
      // Simplified upload implementation
      const imageUrl = URL.createObjectURL(file);
      
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        set((state: EditStore) => {
          state.images.uploadProgress[imageId] = progress;
        });
      }
      
      // Update target element if specified
      if (targetElement) {
        get().updateElementContent(targetElement.sectionId, targetElement.elementKey, imageUrl);
      }
      
      set((state: EditStore) => {
        delete state.images.uploadProgress[imageId];
      });
      
      return imageUrl;
      
    } catch (error) {
      set((state: EditStore) => {
        delete state.images.uploadProgress[imageId];
        state.errors['image-upload'] = error instanceof Error ? error.message : 'Upload failed';
      });
      throw error;
    }
  },
  
  replaceImage: (sectionId: string, elementKey: string, imageUrl: string) => {
    get().updateElementContent(sectionId, elementKey, imageUrl);
  },
  
  searchStockPhotos: async (query: string, targetElement?: { sectionId: string; elementKey: string }) => {
    set((state: EditStore) => {
      state.images.stockPhotos.searchQuery = query;
      state.images.stockPhotos.searchVisible = true;
      state.loadingStates['stock-search'] = true;
    });
    
    try {
      // Simplified stock photo search
      const mockResults = [
        { id: '1', url: 'https://via.placeholder.com/400x300', alt: 'Stock photo 1' },
        { id: '2', url: 'https://via.placeholder.com/400x301', alt: 'Stock photo 2' },
        { id: '3', url: 'https://via.placeholder.com/400x302', alt: 'Stock photo 3' },
      ];
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set((state: EditStore) => {
        state.images.stockPhotos.searchResults = mockResults;
        state.loadingStates['stock-search'] = false;
      });
      
    } catch (error) {
      set((state: EditStore) => {
        state.loadingStates['stock-search'] = false;
        state.errors['stock-search'] = error instanceof Error ? error.message : 'Search failed';
      });
    }
  },
  
  generateImageAltText: async (imageUrl: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Auto-generated alt text for image`;
  },
  
  optimizeImage: async (imageUrl: string, options: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return imageUrl; // Return optimized URL
  },
});

/**
 * ===== VALIDATION ACTIONS =====
 */

const validationActions = (set: any, get: any) => ({
  validateSection: (sectionId: string) => {
    const state = get();
    const section = state.content[sectionId];
    if (!section) return false;
    
    // Basic validation - check for required elements
    const requiredElements = ['headline']; // This should come from layout schema
    return requiredElements.every(elementKey => {
      const element = section.elements[elementKey];
      return element && element.content && 
        (typeof element.content === 'string' ? element.content.trim().length > 0 : 
         Array.isArray(element.content) && element.content.length > 0);
    });
  },
  
  getIncompleteElements: (sectionId: string) => {
    const state = get();
    const section = state.content[sectionId];
    if (!section) return [];
    
    const requiredElements = ['headline']; // This should come from layout schema
    return requiredElements.filter(elementKey => {
      const element = section.elements[elementKey];
      return !element || !element.content || 
        (typeof element.content === 'string' ? element.content.trim().length === 0 : 
         Array.isArray(element.content) && element.content.length === 0);
    });
  },
  
  canPublish: () => {
    const state = get();
    return state.sections.every((sectionId: string) => get().validateSection(sectionId));
  },
  
  getOptimizationSuggestions: () => {
    const state = get();
    const suggestions: string[] = [];
    
    if (!state.title) suggestions.push("Add a page title");
    if (!state.description) suggestions.push("Add a meta description");
    if (state.sections.length < 3) suggestions.push("Consider adding more sections");
    
    // Check for CTA presence
    const hasCTA = state.sections.some((sectionId: string) => {
      const section = state.content[sectionId];
      return section && Object.keys(section.elements).some(key => 
        key.includes('cta') && section.elements[key].content
      );
    });
    
    if (!hasCTA) suggestions.push("Add a call-to-action button");
    
    return suggestions;
  },
});

/**
 * ===== MAIN STORE CREATION =====
 */

export const useEditStore = create<EditStore>()(
  devtools(
    subscribeWithSelector(
      immer(
        (set, get) => {
          const debouncedAutoSave = createDebouncedAutoSave(get);
          
          // Define all action groups
          const layoutActionsGroup = layoutActions(set, get);
          const contentActionsGroup = contentActions(set, get);
          const uiActionsGroup = uiActions(set, get);
          const metaActionsGroup = metaActions(set, get);
          const globalActionsGroup = globalActions(set, get);
          const aiActionsGroup = aiActions(set, get);
          const formsActionsGroup = formsActions(set, get);
          const imageActionsGroup = imageActions(set, get);
          const validationActionsGroup = validationActions(set, get);
          
          // Override triggerAutoSave to connect to debounced function
          uiActionsGroup.triggerAutoSave = () => {
            const state = get();
            if (!state.autoSave.isDirty || state.autoSave.isSaving) return;
            debouncedAutoSave();
          };
          
          // Auto-save middleware state (integrate manually since we can't use the middleware wrapper)
          const autoSaveState = {
            isDirty: false,
            isSaving: false,
            lastSaved: undefined,
            saveError: undefined,
            queuedChanges: [],
            conflictResolution: {
              hasConflict: false,
              conflictData: undefined,
              resolveStrategy: 'manual' as const,
            },
            performance: {
              saveCount: 0,
              averageSaveTime: 0,
              lastSaveTime: 0,
              failedSaves: 0,
            },
            
            // Auto-save middleware actions
            triggerAutoSave: () => {
              const state = get();
              if (state.isDirty && !state.isSaving) {
                debouncedAutoSave();
              }
            },
            
            forceSave: async () => {
              debouncedAutoSave.cancel();
              const state = get();
              if (state.isDirty && !state.isSaving) {
                await debouncedAutoSave();
              }
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
                  id: generateId(),
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
            
            resolveConflict: (strategy: 'manual' | 'auto-merge' | 'latest-wins', data?: any) => {
              set((state) => {
                state.conflictResolution.resolveStrategy = strategy;
                state.conflictResolution.hasConflict = false;
                state.conflictResolution.conflictData = undefined;
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
          };
          
          return {
            // ===== INITIAL STATE =====
            // Layout Slice
            sections: [],
            sectionLayouts: {},
            theme: defaultTheme,
            globalSettings: {
              maxWidth: '1200px',
              containerPadding: '32px',
              sectionSpacing: '64px',
              deviceMode: 'desktop' as const,
              zoomLevel: 100,
            },
            
            // Content Slice
            content: {},
            
            // UI Slice
            mode: 'edit' as const,
            editMode: 'section' as const,
            selectedSection: undefined,
            selectedElement: undefined,
            multiSelection: [],
            leftPanel: {
              width: 300,
              collapsed: false,
              activeTab: 'pageStructure' as const,
            },
            floatingToolbars: {
              section: { visible: false, position: { x: 0, y: 0 }, contextActions: [] },
              element: { visible: false, position: { x: 0, y: 0 }, contextActions: [] },
              form: { visible: false, position: { x: 0, y: 0 }, contextActions: [] },
              image: { visible: false, position: { x: 0, y: 0 }, contextActions: [] },
            },
            autoSave: {
              isDirty: false,
              isSaving: false,
              queuedChanges: [],
            },
            aiGeneration: {
              isGenerating: false,
              currentOperation: null,
              progress: 0,
              status: '',
              errors: [],
              warnings: [],
            },
            elementVariations: {
              visible: false,
              variations: [],
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
            errors: {},
            loadingStates: {},
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
            
            // Auto-save middleware state
            ...autoSaveState,
            
            // ===== ALL ACTIONS =====
            // Layout Actions
            ...layoutActionsGroup,
            
            // Content Actions
            ...contentActionsGroup,
            
            // UI Actions
            ...uiActionsGroup,
            
            // Meta Actions
            ...metaActionsGroup,
            
            // Global Actions
            ...globalActionsGroup,
            
            // AI Actions
            ...aiActionsGroup,
            
            // Forms Actions
            ...formsActionsGroup,
            
            // Image Actions
            ...imageActionsGroup,
            
            // Validation Actions
            ...validationActionsGroup,
          };
        }
      )
    ),
    { name: "EditStore" }
  )
);

/**
 * ===== DEBUG UTILITIES (Development Only) =====
 */
if (process.env.NODE_ENV === 'development') {
  // Global store access for debugging
  (window as any).__editStoreDebug = {
    getState: () => useEditStore.getState(),
    setState: (newState: Partial<EditStore>) => useEditStore.setState(newState),
    subscribe: (callback: (state: EditStore) => void) => useEditStore.subscribe(callback),
    
    // Action tracking
    actionHistory: [] as any[],
    trackAction: (actionName: string, payload: any) => {
      (window as any).__editStoreDebug.actionHistory.push({
        action: actionName,
        payload,
        timestamp: Date.now(),
        stateBefore: useEditStore.getState(),
      });
    },
    
    // Performance monitoring
    renderCount: 0,
    slowRenders: [] as any[],
    trackRender: (componentName: string, duration: number) => {
      if (duration > 16) { // > 1 frame
        (window as any).__editStoreDebug.slowRenders.push({
          component: componentName,
          duration,
          timestamp: Date.now(),
        });
      }
    },
    
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
  };
  
  console.log('🔧 Edit Store Debug utilities available at window.__editStoreDebug');
}