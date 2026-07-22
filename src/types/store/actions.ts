// types/store/actions.ts - Single source of truth for ALL action interfaces

import type { Theme, BackgroundType, SectionBackground, SectionData, ColorTokens, FontTheme,CanonicalFieldName } from '@/types/core/index';
import type { BackgroundSystem } from '@/modules/Design/ColorSystem/colorTokens';
import type { 
  UISlice, 
  ElementSelection, 
  ToolbarAction, 
  EditHistoryEntry 
} from './state';

import type { 
  UndoableAction, 
  ActionHistoryItem, 
  UndoRedoState,
  ResetScope 
} from '@/types/core';

import type { FormActions } from './formActions';

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
  updateSectionLayout: (sectionId: string, newLayout: string, opts?: { skipHistory?: boolean }) => void;
  moveSection: (sectionId: string, direction: 'up' | 'down') => void;
  
  // Theme Management  
  updateTheme: (theme: Partial<Theme>) => void;
  updateBaseColor: (baseColor: string) => void;
  updateAccentColor: (accentColor: string) => void;
  updateSectionBackground: (type: keyof Theme['colors']['sectionBackgrounds'], value: string) => void;
  updateFromBackgroundSystem: (backgroundSystem: BackgroundSystem) => void;
  updateTypography: (typography: Partial<Theme['typography']>) => void;

  // Typography Actions
updateTypographyTheme: (newTheme: FontTheme) => void;
resetTypographyToGenerated: () => void;
getTypographyForSection: (sectionId: string) => FontTheme;
  
/**
   * ===== RESET TO GENERATED =====
   */
  
  // Reset all customizations to original AI-generated design.
  // Async: lazily fetches the stored baseline via ensureBaseline() before
  // applying the reset (network I/O outside the Immer producer).
  resetToGenerated: () => Promise<void>;

  // Global Settings
  setDeviceMode: (mode: 'desktop' | 'mobile') => void;
  setZoomLevel: (level: number) => void;
  
  // Logo Management
  setLogoUrl: (url: string) => void;
  // editor phase-3 (phase 5): DARK-surface logo asset (footer). Mirrors setLogoUrl.
  setLogoUrlDark: (url: string) => void;
  clearLogo: () => void;
  
  // Color System Integration
  getColorTokens: () => ReturnType<typeof import('@/modules/Design/ColorSystem/colorTokens').generateColorTokens>;
  updateColorTokens: (newTokens: ColorTokens) => void;
  recalculateTextColors: () => void; // NEW: Recalculate text colors when backgrounds change
  initializeSections: (sectionIds: string[], sectionLayouts: Record<string, string>) => void;
  
  // Navigation Management
  initializeNavigation: () => void;
  updateNavItem: (itemId: string, updates: Partial<{ label: string; link: string; sectionId?: string }>) => void;
  addNavItem: (label: string, link: string, sectionId?: string) => void;
  removeNavItem: (itemId: string) => void;
  reorderNavItems: (newOrder: string[]) => void;
  updateNavigationOnSectionChange: () => void;
  setNavigationMaxItems: (maxItems: number) => void;
  
  // Social Media Management
  initializeSocialMedia: () => void;
  addSocialMediaItem: (platform: string, url: string, icon: string) => void;
  updateSocialMediaItem: (itemId: string, updates: Partial<{ platform: string; url: string; icon: string }>) => void;
  removeSocialMediaItem: (itemId: string) => void;
  reorderSocialMediaItems: (newOrder: string[]) => void;
}

/**
 * ===== CONTENT ACTIONS INTERFACE =====
 */
export interface ContentActions {
  // Basic Content Operations
  updateElementContent: (sectionId: string, elementKey: string, content: string | string[]) => void;
  // editor phase-3 (phase 6): canonical per-item alt writer for imageCollection
  // slots. Writes `content[sectionId].elementMetadata[collectionKey].alt[itemId]`
  // (the phase-4 alt-text law shape). Add/remove/reorder/bulk-add ride the existing
  // whole-array updateElementContent path; only alt lives in elementMetadata.
  setItemAlt: (sectionId: string, collectionKey: string, itemId: string, alt: string) => void;
  bulkUpdateSection: (sectionId: string, elements: Record<string, string | string[]>) => void;
  setBackgroundType: (sectionId: string, backgroundType: BackgroundType) => void;
  setSectionBackground: (sectionId: string, sectionBackground: SectionBackground) => void;
  markAsCustomized: (sectionId: string) => void;
  setSection: (sectionId: string, data: Partial<SectionData>) => void;

  // i18n-phase-1 (3a): switch the active authoring locale. Text writers branch on
  // `activeLocale`; structure/media stay locale-shared (base). History is PRESERVED
  // across a switch — undo/redo restore is locale-aware (each entry carries
  // `entry.locale`; uiActions routes to base vs the overlay).
  setActiveLocale: (locale: string) => void;
  // NOTE — the locale DECLARATION mutators (addLocale/removeLocale/
  // setSwitcherStyle) are declared on MetaActions, not here: `createContentActions`
  // is annotated `: ContentActions`, so members added here must be implemented in
  // that file. Same reason the CMS actions live on MetaActions.

  // AI Generation
  regenerateSection: (sectionId: string, userGuidance?: string, options?: { suppressHistory?: boolean }) => Promise<void>;
  regenerateElement: (sectionId: string, elementKey: string, variationCount?: number) => Promise<void>;
  regenerateAllContent: () => Promise<void>;
  updateFromAIResponse: (aiResponse: any, elementsMap?: any) => void;
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
  
  // Text Editing Management
  setTextEditingMode: (isEditing: boolean, element?: { sectionId: string; elementKey: string }) => void;
  
  // Formatting State Management
  setFormattingInProgress: (isInProgress: boolean) => void;
  
  // Panel Management
  setLeftPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  setLeftPanelTab: (tab: UISlice['leftPanel']['activeTab']) => void;
  
  // Floating Toolbar Management
  showToolbar: (type: 'section' | 'element' | 'text' | 'image' | 'form', targetId: string, position?: { x: number; y: number }) => void;
  hideToolbar: () => void;
  showSectionToolbar: (sectionId: string, position: { x: number; y: number }) => void;
  hideSectionToolbar: () => void;
  showElementToolbar: (elementId: string, position: { x: number; y: number }) => void;
  hideElementToolbar: () => void;
  showFormToolbar: (formId: string, position: { x: number; y: number }) => void;
  hideFormToolbar: () => void;
  showImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
  hideImageToolbar: () => void;
  showTextToolbar: (position: { x: number; y: number }) => void;
  hideTextToolbar: () => void;
  
  // Auto-Save UI
  triggerAutoSave: () => void;
  clearAutoSaveError: () => void;
  trackUIChange: (change: any) => void;
  
  // Forms UI
  setActiveForm: (formId?: string) => void;
  showFormBuilder: () => void;
  hideFormBuilder: () => void;

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
  
  // Undo/Redo System
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  executeUndoableAction: <T>(
    actionType: UndoableAction,
    actionName: string,
    action: () => T
  ) => T;
  
  // Interaction Helpers
  handleKeyboardShortcut: (event: KeyboardEvent) => void;
  handleDragStart: (sectionId: string, event: DragEvent) => void;
  handleDragOver: (event: DragEvent) => void;
  handleDrop: (targetSectionId: string, position: 'before' | 'after', event: DragEvent) => void;
  updateViewportInfo: () => void;
  announceLiveRegion: (message: string, priority?: 'polite' | 'assertive') => void;
  focusElement: (elementId: string) => void;
  trackPerformance: (operation: string, startTime: number) => void;
  getPerformanceStats: () => any;
  
  // Advanced Menu Management
  showAdvancedMenu: (
    toolbarType: 'section' | 'element' | 'text' | 'form' | 'image',
    triggerElement: HTMLElement,
    actions: any[]
  ) => void;
  hideAdvancedMenu: () => void;
  toggleAdvancedMenu: (
    toolbarType: 'section' | 'element' | 'text' | 'form' | 'image',
    triggerElement: HTMLElement,
    actions: any[]
  ) => void;
  
  // Layout Change Modal
  showLayoutChangeModal: (sectionId: string, sectionType: string, currentLayout: string, currentData: Record<string, any>) => void;
  hideLayoutChangeModal: () => void;
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
  // Form Management (Legacy - simplified for MVP)
  createForm: (sectionId: string, elementKey: string) => string;
  addForm: (form: any) => string;
  updateForm: (id: string, updates: any) => void;
  deleteForm: (id: string) => void;
  addFormField: (formId: string, fieldType: string) => void;
  updateFormField: (formId: string, fieldId: string, properties: any) => void;
  deleteFormField: (formId: string, fieldId: string) => void;
  removeFormField: (formId: string, fieldId: string) => void;
  reorderFormFields: (formId: string, fieldIds: string[]) => void;
  updateFormSettings: (formId: string, settings: any) => void;
  connectFormIntegration: (formId: string, integration: any) => void;
  
  // Form getters
  getFormById: (id: string) => any;
  getAllForms: () => any[];
  getFormsByPlacement: (placement: 'hero' | 'cta-section') => any[];
  
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
  // ===== LOCALE DECLARATION (language-settings phase 1) =====
  // Implemented in `src/hooks/editStore/i18nActions.ts` — extracted from
  // LocaleSettings' local `api.setState` closures so the LanguagesPanel (and any
  // future caller) shares ONE copy of the engaged/isDirty/autosave choreography.
  // Declared on MetaActions for the same reason as the CMS actions below:
  // `createContentActions` (which owns `setActiveLocale`) is annotated
  // `: ContentActions`, so a member added there must be implemented there.
  // Confirmation (confirmDialog) stays in the UI layer — these are silent.
  /** Declare a locale. First declaration seeds `[default, code]`. */
  addLocale: (code: string) => void;
  /**
   * Remove a declared locale + its overlay. Dropping back to ONE locale keeps
   * `{locales:[def],defaultLocale:def}` when `def !== 'en'` — that config is the
   * ONLY durable record of a non-English site language (ruling 10) — and clears
   * to `null` when it is `'en'` (English = platform default; null keeps the
   * legacy zero-diff contract).
   */
  removeLocale: (code: string) => void;
  /**
   * Published-switcher widget style (publish layer only). NO-OP when there is no
   * `localeConfig` — materializing one would break zero-diff for a monolingual
   * project.
   */
  setSwitcherStyle: (style: 'dropdown' | 'none' | undefined) => void;

  // ===== CMS COLLECTIONS (cms-collections phase 3) =====
  // Implemented in `src/hooks/editStore/cmsActions.ts`. Declared HERE rather than
  // on LayoutActions because `createLayoutActions` is annotated `: LayoutActions`
  // and is implemented in a file this phase must not touch — adding members there
  // would break its return type. MetaActions is the store's cross-cutting bag
  // (reset/export/save/baseline) and is composed from several creators, so it
  // takes new members cleanly.
  //
  // Placement is ordinary section state (persisted via `content`); `cmsData`
  // itself is a runtime-only cache (never partialized, never published).
  /** Replace the runtime `cmsData` cache (no network). */
  setCmsData: (bundles: Record<string, import('@/modules/cms/types').CmsCollectionBundle>) => void;
  /** Fetch every collection for this token into the runtime cache. */
  refreshCmsData: () => Promise<void>;
  /**
   * Re-fetch ONE collection's bundle into the cache (item/group saves). Avoids
   * `refreshCmsData`'s list + per-collection N+1 for a single-row change; a 404
   * drops the bundle.
   */
  refreshCmsCollection: (collectionId: string) => Promise<void>;
  /**
   * Place a `cmscollection` section on the CURRENT page. Sets BOTH
   * `sectionLayouts[id]` AND the full `content[id]` entry (incl. `layout`) — the
   * publish payload carries no `sectionLayouts` map, so a half-pin renders in the
   * editor and silently VANISHES when published.
   * @returns the new section id
   */
  addCmsSection: (collectionId: string, opts?: { layoutHint?: string; position?: number }) => string;
  /** Remove one placed cms section (sections list + layout map + content entry). */
  removeCmsSection: (sectionId: string) => void;
  /**
   * Remove EVERY placed `cmscollection` section pointing at `collectionId`, across
   * the active working set and every stored page slice. Called after a collection
   * DELETE (which cascades server-side but cannot touch section content).
   * @returns how many sections were removed
   */
  removeCmsSectionsForCollection: (collectionId: string) => number;

  // Meta Data Management
  updateMeta: (meta: Partial<any>) => void;
  /**
   * The ONE writer of `themeValues.styleTokens` (section-background D3).
   *
   * Deep-merges `patch` into `themeValues.styleTokens[sectionId]`, preserving every
   * OTHER `themeValues` key and every other section's tokens, then triggers autosave.
   * The merge obligation lives here and nowhere else: `saveDraft` REPLACES the whole
   * `themeValues` column with whatever the store holds, so a shallow write at a call
   * site would silently drop sibling keys (mood/knobs/…).
   */
  setSectionStyleTokens: (
    sectionId: string,
    patch: Partial<import('@/modules/skeletons/styleTokens').SectionStyleTokens>,
  ) => void;
  loadFromOnboarding: () => void;
  updateOnboardingData: (data: any) => void;
  updatePublishingState: (state: any) => void;
  
  // Global Operations
  reset: () => void;
  export: () => object;
  loadFromDraft: (apiResponse: any, urlTokenId?: string) => Promise<void>;
  save: () => Promise<void>;

  // Baseline (edit-header Reset) — snapshot/dirty-flag lifecycle.
  captureBaseline: () => void;
  markBaselineSaved: () => void;
  /** content-baseline-split — lazy on-demand baseline fetch. Returns the
   *  baseline (resident or freshly fetched via `?part=baseline`) or `null` when
   *  the server truly has none (callers use their legacy fallbacks). Deduped
   *  per-tokenId; rejects (throws) on fetch failure without flipping
   *  `baselineAvailable` — the caller decides. */
  ensureBaseline: () => Promise<Record<string, any> | null>;

  // Legal Pages
  setLegalPage: (kind: 'privacy', entry: { content: string; metadata?: any } | undefined) => void;

  // Goal (scale-04) — Project.brief.goal mirror; GOAL_REF primaries resolve to it.
  setGoal: (goal: import('@/types/brief').Brief['goal'] | null) => void;
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
  trackAutoSaveChange: (change: any) => void;
  clearQueuedChanges: () => void;
  
  // Performance Monitoring
  getPerformanceStats: () => any; // Main store version
  resetPerformanceStats: () => void; // Main store version
}

/**
 * ===== REGENERATION ACTIONS INTERFACE =====
 */
export interface RegenerationActions {
  // Content-only regeneration (preserves design)
  regenerateContentOnly: () => Promise<void>;
  
  // Design + content regeneration (updates layouts, backgrounds, theme + copy)
  regenerateDesignAndCopy: () => Promise<void>;
  
  // Change tracking for input fields
  trackInputChange: (field: CanonicalFieldName, newValue: string) => void;
  getHasFieldChanges: () => boolean;
  resetChangeTracking: () => void;
  
  // Enhanced regeneration with input context
  regenerateWithInputs: (preserveDesign?: boolean) => Promise<void>;
}

/**
 * ===== GENERATION ACTIONS INTERFACE =====
 * Actions for AI-powered page generation and content creation
 */
export interface GenerationActions {
  // Bulk Section Initialization
  initializeSections: (sectionIds: string[], sectionLayouts: Record<string, string>) => void;
  
  // AI Response Processing
  updateFromAIResponse: (aiResponse: any, elementsMap?: any) => void;
  setAIGenerationStatus: (status: Partial<{
    isGenerating: boolean;
    lastGenerated?: number;
    success: boolean;
    isPartial: boolean;
    warnings: string[];
    errors: string[];
    sectionsGenerated: string[];
    sectionsSkipped: string[];
  }>) => void;
  clearAIErrors: () => void;
  regenerateAllContent: () => Promise<void>;

  // Work-copy-engine story interview (Sugarman) — regenerates ONLY the `about`
  // (story) section from 3 freeform answers; facts.work is resolved server-side.
  regenerateStoryFromInterview: (
    sectionId: string,
    interviewAnswers: { origin: string; moment: string; belief: string },
  ) => Promise<void>;
  
  // Element-level AI Actions
  regenerateElement: (sectionId: string, elementKey: string, variationCount?: number) => Promise<void>;
  regenerateElementWithVariations: (sectionId: string, elementKey: string, variationCount?: number) => Promise<string[]>;
  generateVariations: (sectionId: string, elementKey: string, count?: number) => Promise<string[]>;
  
  // Variations Management
  showElementVariations: (elementId: string, variations: string[]) => void;
  hideElementVariations: () => void;
  setVariationSelection: (index: number) => void;
  applyVariation: (sectionId: string, elementKey: string, variationIndex: number) => void;
  
  // Background System Integration
  updateFromBackgroundSystem: (backgroundSystem: BackgroundSystem) => void;
  
  // Font System Integration
  updateFontsFromTone: () => void;
  setCustomFonts: (headingFont: string, bodyFont: string) => void;
  
  // Color Token Generation
  getColorTokens: () => ReturnType<typeof import('@/modules/Design/ColorSystem/colorTokens').generateColorTokens>;
}