// types/store/actions.ts - Single source of truth for ALL action interfaces

import type { Theme, BackgroundType, SectionData } from '@/types/core/index';
import type { BackgroundSystem } from '@/modules/Design/ColorSystem/colorTokens';
import type { 
  UISlice, 
  ElementSelection, 
  ToolbarAction, 
  EditHistoryEntry 
} from './state';

/**
 * ===== LAYOUT ACTIONS INTERFACE =====
 */
export interface LayoutActions {
  // Section Management
  addSection: (sectionType: string, position?: number) => string;
  removeSection: (sectionId: string) => void;
  reorderSections: (newOrder: string[]) => void;
  duplicateSection: (sectionId: string) => string;
  setLayout: (sectionId: string, layout: string) => void;
  setSectionLayouts: (layouts: Record<string, string>) => void;
  
  // Theme Management  
  updateTheme: (theme: Partial<Theme>) => void;
  updateBaseColor: (baseColor: string) => void;
  updateAccentColor: (accentColor: string) => void;
  updateSectionBackground: (type: keyof Theme['colors']['sectionBackgrounds'], value: string) => void;
  updateFromBackgroundSystem: (backgroundSystem: BackgroundSystem) => void;
  updateTypography: (typography: Partial<Theme['typography']>) => void;
  
  // Global Settings
  setDeviceMode: (mode: 'desktop' | 'mobile') => void;
  setZoomLevel: (level: number) => void;
  
  // Color System Integration
  getColorTokens: () => ReturnType<typeof import('@/modules/Design/ColorSystem/colorTokens').generateColorTokens>;
}

/**
 * ===== CONTENT ACTIONS INTERFACE =====
 */
export interface ContentActions {
  // Basic Content Operations
  updateElementContent: (sectionId: string, elementKey: string, content: string | string[]) => void;
  bulkUpdateSection: (sectionId: string, elements: Record<string, string | string[]>) => void;
  setBackgroundType: (sectionId: string, backgroundType: BackgroundType) => void;
  markAsCustomized: (sectionId: string) => void;
  setSection: (sectionId: string, data: Partial<SectionData>) => void;
  
  // AI Generation
  regenerateSection: (sectionId: string, userGuidance?: string) => Promise<void>;
  regenerateElement: (sectionId: string, elementKey: string, variationCount?: number) => Promise<void>;
  regenerateAllContent: () => Promise<void>;
  updateFromAIResponse: (aiResponse: any) => void;
  setAIGenerationStatus: (status: Partial<UISlice['aiGeneration']>) => void;
  clearAIErrors: () => void;
  
  // Element Variations
  showElementVariations: (elementId: string, variations: string[]) => void;
  hideElementVariations: () => void;
  selectVariation: (index: number) => void;
  applySelectedVariation: () => void;
  
  // Content Validation & Utilities
  validateContent: (sectionId: string) => boolean;
  getContentSummary: (sectionId: string) => any;
  exportSectionContent: (sectionId: string) => any;
  importSectionContent: (sectionId: string, importData: any) => void;
}

/**
 * ===== UI ACTIONS INTERFACE =====
 */
export interface UIActions {
  // Basic UI State
  setMode: (mode: 'preview' | 'edit') => void;
  setEditMode: (mode: 'section' | 'element' | 'global') => void;
  
  // Selection Management
  setActiveSection: (sectionId?: string) => void;
  selectElement: (selection: ElementSelection | null) => void;
  setMultiSelection: (sectionIds: string[]) => void;
  
  // Panel Management
  setLeftPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  setLeftPanelTab: (tab: UISlice['leftPanel']['activeTab']) => void;
  
  // Floating Toolbar Management
  showSectionToolbar: (sectionId: string, position: { x: number; y: number }) => void;
  hideSectionToolbar: () => void;
  showElementToolbar: (elementId: string, position: { x: number; y: number }) => void;
  hideElementToolbar: () => void;
  showFormToolbar: (formId: string, position: { x: number; y: number }) => void;
  hideFormToolbar: () => void;
  showImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
  hideImageToolbar: () => void;
  
  // Auto-Save UI
  triggerAutoSave: () => void;
  clearAutoSaveError: () => void;
  
  // Forms UI
  setActiveForm: (formId?: string) => void;
  showFormBuilder: () => void;
  hideFormBuilder: () => void;
  convertCTAToForm: (sectionId: string, elementKey: string) => void;
  
  // Images UI  
  setActiveImage: (imageId?: string) => void;
  showStockPhotoSearch: (query: string) => void;
  hideStockPhotoSearch: () => void;
  setImageUploadProgress: (imageId: string, progress: number) => void;
  
  // Error Handling
  setError: (error: string, sectionId?: string) => void;
  clearError: (sectionId?: string) => void;
  setLoading: (isLoading: boolean, sectionId?: string) => void;
  
  // History Management
  pushHistory: (entry: EditHistoryEntry) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Interaction Helpers
  handleKeyboardShortcut: (event: KeyboardEvent) => void;
  handleDragStart: (sectionId: string, event: DragEvent) => void;
  handleDragOver: (event: DragEvent) => void;
  handleDrop: (targetSectionId: string, position: 'before' | 'after', event: DragEvent) => void;
  updateViewportInfo: () => void;
  announceLiveRegion: (message: string, priority?: 'polite' | 'assertive') => void;
  focusElement: (elementId: string) => void;
  trackPerformance: (operation: string, startTime: number) => void;
}

/**
 * ===== PERSISTENCE ACTIONS INTERFACE =====
 */
export interface PersistenceActions {
  // Persistence Initialization
  initializePersistence: (tokenId: string, config?: any) => void;
  
  // Manual Save Operations
  saveManual: (description?: string) => Promise<void>;
  saveDraft: () => Promise<void>;
  forceSave: (description?: string) => Promise<void>;
  
  // Load Operations
  loadFromServer: (useCache?: boolean) => Promise<void>;
  
  // Version Control
  createSnapshot: (description: string) => string;
  undoToSnapshot: () => void;
  redoToSnapshot: () => void;
  getVersionHistory: () => any;
  
  // Conflict Resolution
  getActiveConflicts: () => any[];
  resolveConflict: (
    conflictId: string, 
    strategy: 'local' | 'server' | 'merge' | 'manual', 
    resolutions?: Record<string, any>
  ) => Promise<void>;
  
  // Configuration
  enableAutoSave: (enabled: boolean) => void;
  enableBackgroundSync: (enabled: boolean) => void;
  setPersistenceConfig: (config: any) => void;
  
  // Utilities
  clearPersistenceErrors: () => void;
  exportPersistenceData: () => any;
  getPersistenceMetrics: () => any;
  validateDataIntegrity: () => Promise<boolean>;
  
  // Background Operations
  startBackgroundSync: () => void;
  stopBackgroundSync: () => void;
  retryFailedSave: () => Promise<void>;
  cleanup: () => void;
  
  // Migration & Batch Operations
  migrateFromLegacyFormat: (legacyData: any) => void;
  batchSave: (operations: Array<{ type: string; data: any }>) => Promise<any[]>;
}

/**
 * ===== FORMS & IMAGE ACTIONS INTERFACE =====
 */
export interface FormsImageActions {
  // Form Management
  createForm: (sectionId: string, elementKey: string) => string;
  addFormField: (formId: string, fieldType: string) => void;
  updateFormField: (formId: string, fieldId: string, properties: any) => void;
  deleteFormField: (formId: string, fieldId: string) => void;
  updateFormSettings: (formId: string, settings: any) => void;
  connectFormIntegration: (formId: string, integration: any) => void;
  
  // Image Management
  uploadImage: (file: File, targetElement?: { sectionId: string; elementKey: string }) => Promise<string>;
  replaceImage: (sectionId: string, elementKey: string, imageUrl: string) => void;
  searchStockPhotos: (query: string, targetElement?: { sectionId: string; elementKey: string }) => Promise<void>;
  generateImageAltText: (imageUrl: string) => Promise<string>;
  optimizeImage: (imageUrl: string, options: any) => Promise<string>;
  
  // Bulk Operations
  bulkUploadImages: (files: FileList) => Promise<{ results: any[]; errors: any[] }>;
  optimizeAllImages: () => Promise<{ results: any[]; errors: any[] }>;
  
  // Form Validation & Export
  validateForm: (formId: string) => { isValid: boolean; errors: string[]; warnings: string[] };
  exportForm: (formId: string) => any;
  importForm: (formData: any, targetSection?: { sectionId: string; elementKey: string }) => string;
  
  // Image Utilities
  getImageMetadata: (imageUrl: string) => Promise<any>;
  generateImageVariations: (imageUrl: string, variations: Array<'crop' | 'filter' | 'resize'>) => Promise<any[]>;
  cleanupUnusedImages: () => string[];
  
  // Accessibility
  auditFormAccessibility: (formId: string) => { score: number; issues: string[]; recommendations: string[] };
  auditImageAccessibility: () => { score: number; issues: string[]; recommendations: string[] };
  
  // Additional Form Methods (from implementation)
  selectStockPhoto: (photoId: string) => string | void;
}

/**
 * ===== VALIDATION ACTIONS INTERFACE =====
 */
export interface ValidationActions {
  // Section Validation
  validateSection: (sectionId: string) => boolean;
  getIncompleteElements: (sectionId: string) => string[];
  
  // Page-Level Validation
  validateAllSections: () => { isValid: boolean; sectionResults: Record<string, boolean>; summary: any };
  canPublish: () => boolean;
  
  // Optimization & Analysis
  getOptimizationSuggestions: () => Array<{
    type: 'seo' | 'content' | 'structure' | 'performance' | 'accessibility';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action?: string;
    sectionId?: string;
  }>;
  
  // Auditing
  auditAccessibility: () => {
    score: number;
    grade: string;
    issues: string[];
    recommendations: string[];
    totalChecks: number;
  };
  analyzeContentQuality: () => {
    readability: number;
    engagement: number;
    clarity: number;
    actionability: number;
    overall: number;
    details: any;
  };
  validatePerformance: () => {
    estimatedLoadTime: number;
    imageCount: number;
    totalElements: number;
    complexityScore: number;
    recommendations: string[];
  };
  validateBusinessLogic: () => {
    conversionPath: boolean;
    valueProposition: boolean;
    socialProof: boolean;
    trustSignals: boolean;
    mobileOptimized: boolean;
    score: number;
    recommendations: string[];
  };
  
  // Comprehensive Analysis
  runFullAudit: () => {
    timestamp: number;
    sections: any;
    accessibility: any;
    contentQuality: any;
    performance: any;
    businessLogic: any;
    publishReady: boolean;
    optimizations: any[];
    overallScore: number;
    grade: string;
    summary: any;
  };
}

/**
 * ===== META ACTIONS INTERFACE =====
 */
export interface MetaActions {
  // Meta Data Management
  updateMeta: (meta: Partial<any>) => void;
  loadFromOnboarding: () => void;
  updateOnboardingData: (data: any) => void;
  updatePublishingState: (state: any) => void;
  
  // Global Operations
  reset: () => void;
  export: () => object;
  loadFromDraft: (apiResponse: any) => Promise<void>;
  save: () => Promise<void>;
}

/**
 * ===== AUTO-SAVE ACTIONS INTERFACE =====
 */
export interface AutoSaveActions {
  // Core Auto-Save
  triggerAutoSave: () => void;
  forceSave: () => Promise<void>; // Main store version
  clearAutoSaveError: () => void;
  
  // Change Tracking
  trackChange: (change: any) => void;
  clearQueuedChanges: () => void;
  
  // Performance Monitoring
  getPerformanceStats: () => any; // Main store version
  resetPerformanceStats: () => void; // Main store version
}