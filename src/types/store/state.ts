// types/store/state.ts - All state slice interfaces

import type {
  InputVariables,
  HiddenInferredFields,
  FeatureItem,
  SectionData,
  Theme,
  BackgroundType,
  ElementType,
  ElementEditMode,
  CanonicalFieldName,
  TypographyState,
  ContentEditingState
} from '@/types/core/index';

/**
 * ===== CORE INTERFACE DEFINITIONS =====
 */

export interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

export interface ElementSelection {
  sectionId: string;
  elementKey: string;
  type: ElementType;
  editMode: ElementEditMode;
}

export interface ToolbarState {
  visible: boolean;
  position: { x: number; y: number };
  targetId?: string;
  contextActions: ToolbarAction[];
  activeDropdown?: string;
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: string;
  type: 'button' | 'dropdown' | 'separator';
  disabled?: boolean;
  handler?: () => void;
  children?: ToolbarAction[];
}

export interface ChangeEvent {
  id: string;
  type: 'content' | 'layout' | 'theme';
  sectionId?: string;
  elementKey?: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export interface EditHistoryEntry {
  type: 'content' | 'layout' | 'theme' | 'section';
  description: string;
  timestamp: number;
  beforeState: any;
  afterState: any;
  sectionId?: string;
}

export interface APIRequest {
  id: string;
  type: 'regenerate-section' | 'regenerate-element' | 'save-draft';
  payload: any;
  priority: number;
  timestamp: number;
  retries: number;
}

/**
 * ===== LAYOUT SLICE INTERFACE =====
 */
export interface LayoutSlice {
  // Section Structure
  sections: string[];
  sectionLayouts: Record<string, string>;
  
  // Theme System
  theme: Theme;
  typography: TypographyState;
  // Global Settings
  globalSettings: {
    maxWidth: string;
    containerPadding: string;
    sectionSpacing: string;
    deviceMode: 'desktop' | 'mobile';
    zoomLevel: number;
  };
}

/**
 * ===== CONTENT SLICE INTERFACE =====
 */
export interface ContentSlice {
  // Section Content Data
  content: Record<string, SectionData>;
}

/**
 * ===== UI SLICE INTERFACE =====
 */
export interface UISlice {
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
  targetElement?: { sectionId: string; elementKey: string }; // Add this
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
 * ===== META SLICE INTERFACE =====
 */

export interface ChangeTrackingState {
  originalInputs: InputVariables & HiddenInferredFields;
  currentInputs: InputVariables & HiddenInferredFields;
  hasChanges: boolean;
  changedFields: CanonicalFieldName[];
  lastChangeTimestamp: number;
}
export interface MetaSlice {
  // Project Metadata
  id: string;
  title: string;
  slug: string;
  description?: string;
  lastUpdated: number;
  version: number;
  tokenId: string;
  
  // Onboarding Data
  onboardingData: {
    oneLiner: string;
    validatedFields: Partial<InputVariables>;
    featuresFromAI: FeatureItem[];
    hiddenInferredFields: HiddenInferredFields;
    confirmedFields: Record<CanonicalFieldName, ConfirmedFieldData>;
  };
  
  // Publishing State
  publishing: {
    isPublishReady: boolean;
    publishedUrl?: string;
    publishError?: string;
    lastPublished?: number;
  };

   // Change tracking for field modifications
  changeTracking: ChangeTrackingState;
}

/**
 * ===== PERSISTENCE SLICE INTERFACE =====
 */
export interface PersistenceSlice {
  // Persistence Manager
  persistenceManager?: any; // StatePersistenceManager type - avoiding import cycle
  
  // Persistence State
  persistence: {
    isDirty: boolean;
    isSaving: boolean;
    isLoading: boolean;
    lastSaved?: number;
    lastLoaded?: number;
    saveError?: string;
    loadError?: string;
    hasActiveConflicts: boolean;
    backgroundSaveEnabled: boolean;
    autoSaveEnabled: boolean;
    retryCount: number;
    
    // Metrics
    metrics: {
      totalSaves: number;
      successfulSaves: number;
      failedSaves: number;
      averageSaveTime: number;
      lastSaveTime: number;
      totalLoads: number;
      cacheHits: number;
      cacheMisses: number;
      conflictsDetected: number;
      conflictsResolved: number;
    };
    
    // Sync Status
    syncStatus: {
      localVersion: number;
      serverVersion: number;
      lastSyncAt?: number;
      status: 'synced' | 'pending' | 'conflict' | 'offline' | 'error';
      pendingChanges: number;
    };
  };
}

/**
 * ===== FORMS SLICE INTERFACE =====
 */
export interface FormsSlice {
  // Form Data
  forms: Record<string, FormData>;
  
  // Active Form State
  activeForm?: string;
  
  // Form Builder State
  formBuilder: {
    visible: boolean;
    editingField?: string;
    fieldLibrary: FormFieldType[];
  };
  
  // Integrations
  integrations: Record<string, IntegrationConfig>;
  
  // Analytics
  analytics: Record<string, FormAnalytics>;
}

export interface FormData {
  id: string;
  name: string;
  fields: FormField[];
  settings: FormSettings;
  styling: FormStyling;
  connectedIntegrations: string[];
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  validation?: any;
  options?: string[];
}

export type FormFieldType = 
  | 'text' | 'email' | 'tel' | 'number' | 'textarea' 
  | 'select' | 'radio' | 'checkbox' | 'file' | 'date';

export interface FormSettings {
  name: string;
  description?: string;
  submitText: string;
  redirectUrl?: string;
  emailNotifications: boolean;
  thankYouMessage: string;
}

export interface FormStyling {
  layout: 'stacked' | 'inline' | 'grid';
  colorScheme: 'light' | 'dark' | 'auto';
  borderRadius: number;
  spacing: 'compact' | 'comfortable' | 'spacious';
}

export interface IntegrationConfig {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  isActive: boolean;
}

export interface FormAnalytics {
  submissions: number;
  conversionRate: number;
  averageCompletionTime: number;
  dropoffPoints: Array<{ fieldId: string; dropoffRate: number }>;
}

/**
 * ===== IMAGES SLICE INTERFACE =====
 */
export interface ImagesSlice {
  // Image Library
  library: ImageAsset[];
  
  // Active Image State
  activeImage?: string;
  
  // Stock Photos
  stockPhotos: {
    searchResults: StockPhotoResult[];
    searchQuery: string;
    filters: SearchFilters;
  };
  
  // Upload Management
  uploads: {
    inProgress: UploadProgress[];
    recent: ImageAsset[];
  };
  
  // Optimization Settings
  optimization: {
    autoOptimize: boolean;
    compressionLevel: number;
  };
}

export interface ImageAsset {
  id: string;
  url: string;
  thumbnail?: string;
  alt: string;
  metadata: {
    width: number;
    height: number;
    size: number;
    format: string;
    uploadedAt: number;
  };
}

export interface StockPhotoResult {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  source: string;
  photographer: string;
  downloadUrl: string;
}

export interface SearchFilters {
  orientation: 'all' | 'landscape' | 'portrait' | 'square';
  color: 'all' | 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'pink' | 'brown' | 'black' | 'white' | 'gray';
  category: 'all' | 'business' | 'technology' | 'people' | 'nature' | 'food' | 'travel';
}

export interface UploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

/**
 * ===== VALIDATION SLICE INTERFACE =====
 */
export interface ValidationSlice {
  // Validation Results Cache
  validationCache: Record<string, ValidationResult>;
  
  // Last Validation Timestamp
  lastValidated?: number;
  
  // Validation Settings
  settings: {
    autoValidate: boolean;
    strictMode: boolean;
    enableAccessibilityChecks: boolean;
    enablePerformanceChecks: boolean;
    enableSEOChecks: boolean;
  };
}

export interface ValidationResult {
  sectionId: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  completionPercentage: number;
  lastValidated: number;
}

export interface ValidationError {
  elementKey: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  elementKey: string;
  code: string;
  message: string;
  autoFixable: boolean;
}

/**
 * ===== COMBINED STORE STATE TYPE =====
 */
export interface StoreState extends 
  LayoutSlice,
  ContentSlice,
  UISlice,
  MetaSlice,
  PersistenceSlice {
  // Additional computed or derived state can be added here
}

// MainContent specific UI state
export interface MainContentUIState {
  contentEditing: ContentEditingState;
  elementHover: {
    sectionId: string | null;
    elementKey: string | null;
  };
  sectionHover: string | null;
  editIndicators: {
    showEditHints: boolean;
    showAIBadges: boolean;
  };
}