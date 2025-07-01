// types/store/middleware.ts - Middleware-related types

/**
 * ===== AUTO-SAVE MIDDLEWARE TYPES =====
 */

export interface AutoSaveState {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: number;
  saveError?: string;
  queuedChanges: ChangeEvent[];
  conflictResolution: {
    hasConflict: boolean;
    conflictData?: any;
    resolveStrategy: 'manual' | 'auto-merge' | 'latest-wins';
  };
  performance: {
    saveCount: number;
    averageSaveTime: number;
    lastSaveTime: number;
    failedSaves: number;
  };
}

export interface ChangeEvent {
  id: string;
  type: 'content' | 'layout' | 'theme' | 'meta';
  sectionId?: string;
  elementKey?: string;
  field?: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
  userId?: string;
  source: 'user' | 'ai' | 'system';
}

export interface AutoSaveMiddlewareActions {
  // Core auto-save actions
  triggerAutoSave: () => void;
  autoSaveForceSave: () => Promise<void>; // Renamed to avoid conflict
  clearAutoSaveError: () => void;
  
  // Change tracking
  trackChange: (change: Omit<ChangeEvent, 'id' | 'timestamp'>) => void;
  clearQueuedChanges: () => void;
  
  // Conflict resolution
  autoSaveResolveConflict: (strategy: 'manual' | 'auto-merge' | 'latest-wins', data?: any) => void; // Renamed to avoid conflict
  
  // Performance monitoring
  getAutoSavePerformanceStats: () => AutoSaveState['performance']; // Renamed to avoid conflict
  resetAutoSavePerformanceStats: () => void; // Renamed to avoid conflict
}

export interface AutoSaveConfig {
  debounceMs: number;
  maxQueueSize: number;
  saveTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  conflictDetection: boolean;
  enableOptimisticUpdates: boolean;
  performanceTracking: boolean;
}

export interface AutoSaveMiddlewareState extends AutoSaveState, AutoSaveMiddlewareActions {}

/**
 * ===== DEV TOOLS MIDDLEWARE TYPES =====
 */

export interface DevToolsState {
  isEnabled: boolean;
  trackingActions: boolean;
  trackingPerformance: boolean;
  actionHistory: ActionHistoryEntry[];
  performanceMetrics: PerformanceMetric[];
  validationResults: ValidationResult[];
  storeSnapshots: StoreSnapshot[];
}

export interface ActionHistoryEntry {
  id: string;
  actionName: string;
  payload: any;
  timestamp: number;
  source: 'user' | 'system' | 'ai';
  duration?: number;
  stateBefore?: any;
  stateAfter?: any;
}

export interface PerformanceMetric {
  id: string;
  operation: string;
  duration: number;
  timestamp: number;
  componentName?: string;
  isSlowRender: boolean;
  memoryUsage?: number;
}

export interface ValidationResult {
  id: string;
  timestamp: number;
  validationType: 'store' | 'data' | 'schema';
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface StoreSnapshot {
  id: string;
  timestamp: number;
  description: string;
  state: any;
  version: number;
  size: number;
}

export interface DevToolsActions {
  enableDevTools: (enabled: boolean) => void;
  trackAction: (actionName: string, payload: any, source: 'user' | 'system' | 'ai') => void;
  trackDevToolsPerformance: (operation: string, duration: number, componentName?: string) => void; // Renamed to avoid conflict
  validateStore: () => ValidationResult;
  createDevToolsSnapshot: (description: string) => string; // Renamed to avoid conflict
  clearDevToolsHistory: () => void; // Renamed to avoid conflict
  exportDebugData: () => any;
}

export interface DevToolsConfig {
  maxActionHistory: number;
  maxPerformanceMetrics: number;
  maxSnapshots: number;
  trackSlowRenders: boolean;
  trackMemoryUsage: boolean;
  enableStoreValidation: boolean;
  performanceThreshold: number;
}

export interface DevToolsMiddlewareState extends DevToolsState, DevToolsActions {}

/**
 * ===== PERSISTENCE MIDDLEWARE TYPES =====
 */

export interface PersistenceState {
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  lastSaved?: number;
  lastLoaded?: number;
  saveError?: string;
  loadError?: string;
  retryCount: number;
  backgroundSaveTimer?: NodeJS.Timeout;
  saveQueue: SaveOperation[];
  loadCache: Map<string, CacheEntry>;
  serverVersion?: any;
  localVersion: number;
}

export interface SaveOperation {
  id: string;
  type: 'manual' | 'auto' | 'background';
  data: any;
  timestamp: number;
  priority: number;
  retries: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export interface SaveResult {
  success: boolean;
  timestamp: number;
  version?: number;
  error?: string;
  conflictDetected?: boolean;
  serverData?: any;
}

export interface LoadResult {
  success: boolean;
  data?: any;
  fromCache?: boolean;
  timestamp: number;
  error?: string;
  requiresUpdate?: boolean;
}

export interface PersistenceMetrics {
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
}

export interface PersistenceConfig {
  autoSaveInterval: number;
  debounceDelay: number;
  maxRetries: number;
  retryDelay: number;
  enableVersionControl: boolean;
  enableConflictDetection: boolean;
  compressionThreshold: number;
}

export interface PersistenceActions {
  persistenceSaveManual: (data: any, description?: string) => Promise<SaveResult>; // Renamed to avoid conflict
  saveAuto: (data: any) => void;
  persistenceForceSave: (data: any, description?: string) => Promise<SaveResult>; // Renamed to avoid conflict
  loadFromServer: (tokenId: string, useCache?: boolean) => Promise<LoadResult>;
  clearPersistenceErrors: () => void;
  getPersistenceMetrics: () => PersistenceMetrics;
  validateDataIntegrity: () => Promise<boolean>;
}

export interface PersistenceMiddlewareState extends PersistenceState, PersistenceActions {}

/**
 * ===== VERSION CONTROL MIDDLEWARE TYPES =====
 */

export interface VersionState {
  currentVersion: number;
  snapshots: VersionSnapshot[];
  undoStack: VersionSnapshot[];
  redoStack: VersionSnapshot[];
  maxSnapshots: number;
  maxUndoSize: number;
  activeConflicts: ConflictResolution[];
}

export interface VersionSnapshot {
  id: string;
  version: number;
  timestamp: number;
  description: string;
  author: 'user' | 'system' | 'ai';
  data: any;
  checksum: string;
  compressed: boolean;
  size: number;
}

export interface ConflictResolution {
  conflictId: string;
  timestamp: number;
  conflictType: 'content' | 'schema' | 'metadata';
  localVersion: VersionSnapshot;
  serverVersion: any;
  conflicts: ConflictDetail[];
  resolution?: 'local' | 'server' | 'merge' | 'manual';
  resolved: boolean;
}

export interface ConflictDetail {
  path: string;
  localValue: any;
  serverValue: any;
  conflictType: 'modification' | 'deletion' | 'addition';
  canAutoResolve: boolean;
  resolution?: any;
}

export interface VersionActions {
  createVersionSnapshot: (data: any, description: string, author: 'user' | 'system' | 'ai') => string; // Renamed to avoid conflict
  restoreSnapshot: (snapshotId: string) => boolean;
  versionUndo: () => VersionSnapshot | null; // Renamed to avoid conflict
  versionRedo: () => VersionSnapshot | null; // Renamed to avoid conflict
  canVersionUndo: () => boolean; // Renamed to avoid conflict
  canVersionRedo: () => boolean; // Renamed to avoid conflict
  getVersionHistory: () => VersionSnapshot[];
  compareVersions: (version1: string, version2: string) => any;
  detectConflicts: (localData: any, serverData: any) => ConflictResolution[];
  versionResolveConflict: (conflictId: string, resolution: ConflictResolution) => boolean; // Renamed to avoid conflict
  clearVersionHistory: () => void; // Renamed to avoid conflict
  compressSnapshots: () => void;
}

export interface VersionConfig {
  maxSnapshots: number;
  maxUndoSize: number;
  autoSnapshotInterval: number;
  enableCompression: boolean;
  enableConflictDetection: boolean;
  compressionThreshold: number;
}

export interface VersionMiddlewareState extends VersionState, VersionActions {}

/**
 * ===== ANALYTICS MIDDLEWARE TYPES =====
 */

export interface AnalyticsState {
  isEnabled: boolean;
  sessionId: string;
  userId?: string;
  events: AnalyticsEvent[];
  metrics: AnalyticsMetrics;
  userBehavior: UserBehaviorData;
  performanceData: PerformanceData;
}

export interface AnalyticsEvent {
  id: string;
  type: 'action' | 'page_view' | 'interaction' | 'error' | 'performance';
  name: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface AnalyticsMetrics {
  totalEvents: number;
  sessionDuration: number;
  actionsPerSession: number;
  errorsEncountered: number;
  featuresUsed: string[];
  conversionFunnelData: FunnelStep[];
}

export interface UserBehaviorData {
  clickHeatmap: HeatmapPoint[];
  scrollDepth: number[];
  timeOnSections: Record<string, number>;
  interactionPatterns: InteractionPattern[];
  dropoffPoints: DropoffPoint[];
}

export interface PerformanceData {
  pageLoadTime: number;
  renderTimes: Record<string, number>;
  apiResponseTimes: Record<string, number>;
  memoryUsage: MemorySnapshot[];
  slowOperations: SlowOperation[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  timestamp: number;
}

export interface InteractionPattern {
  sequence: string[];
  frequency: number;
  averageDuration: number;
  completionRate: number;
}

export interface DropoffPoint {
  step: string;
  dropoffRate: number;
  reasons: string[];
}

export interface FunnelStep {
  step: string;
  users: number;
  conversionRate: number;
  averageTime: number;
}

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface SlowOperation {
  operation: string;
  duration: number;
  timestamp: number;
  stackTrace?: string;
}

export interface AnalyticsActions {
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>) => void;
  trackUserAction: (actionName: string, properties?: Record<string, any>) => void;
  trackPageView: (pageName: string, properties?: Record<string, any>) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackAnalyticsPerformance: (metric: string, value: number, context?: Record<string, any>) => void; // Renamed to avoid conflict
  setUserId: (userId: string) => void;
  flushEvents: () => Promise<void>;
  getSessionData: () => any;
  exportAnalyticsData: () => any;
}

export interface AnalyticsConfig {
  enabled: boolean;
  endpoint?: string;
  flushInterval: number;
  maxEvents: number;
  enableHeatmap: boolean;
  enablePerformanceTracking: boolean;
  enableUserBehaviorTracking: boolean;
  samplingRate: number;
}

export interface AnalyticsMiddlewareState extends AnalyticsState, AnalyticsActions {}

/**
 * ===== COMBINED MIDDLEWARE TYPES =====
 */

// Instead of extending conflicting interfaces, compose them selectively
export interface AllMiddlewareState {
  // Auto-Save Middleware (primary)
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: number;
  saveError?: string;
  queuedChanges: ChangeEvent[];
  conflictResolution: AutoSaveState['conflictResolution'];
  performance: AutoSaveState['performance'];
  
  // Auto-Save Actions
  triggerAutoSave: () => void;
  autoSaveForceSave: () => Promise<void>;
  clearAutoSaveError: () => void;
  trackChange: (change: Omit<ChangeEvent, 'id' | 'timestamp'>) => void;
  clearQueuedChanges: () => void;
  autoSaveResolveConflict: (strategy: 'manual' | 'auto-merge' | 'latest-wins', data?: any) => void;
  getAutoSavePerformanceStats: () => AutoSaveState['performance'];
  resetAutoSavePerformanceStats: () => void;
  
  // Dev Tools State & Actions (when enabled)
  devTools?: {
    isEnabled: boolean;
    trackingActions: boolean;
    trackingPerformance: boolean;
    actionHistory: ActionHistoryEntry[];
    performanceMetrics: PerformanceMetric[];
    validationResults: ValidationResult[];
    storeSnapshots: StoreSnapshot[];
  };
  
  // Dev Tools Actions (optional)
  enableDevTools?: (enabled: boolean) => void;
  trackAction?: (actionName: string, payload: any, source: 'user' | 'system' | 'ai') => void;
  trackDevToolsPerformance?: (operation: string, duration: number, componentName?: string) => void;
  validateStore?: () => ValidationResult;
  createDevToolsSnapshot?: (description: string) => string;
  clearDevToolsHistory?: () => void;
  exportDebugData?: () => any;
  
  // Persistence State & Actions (selective)
  persistence?: {
    isDirty: boolean;
    isSaving: boolean;
    isLoading: boolean;
    lastSaved?: number;
    lastLoaded?: number;
    saveError?: string;
    loadError?: string;
    retryCount: number;
    saveQueue: SaveOperation[];
    loadCache: Map<string, CacheEntry>;
    serverVersion?: any;
    localVersion: number;
  };
  
  // Persistence Actions (optional)
  persistenceSaveManual?: (data: any, description?: string) => Promise<SaveResult>;
  saveAuto?: (data: any) => void;
  persistenceForceSave?: (data: any, description?: string) => Promise<SaveResult>;
  loadFromServer?: (tokenId: string, useCache?: boolean) => Promise<LoadResult>;
  clearPersistenceErrors?: () => void;
  getPersistenceMetrics?: () => PersistenceMetrics;
  validateDataIntegrity?: () => Promise<boolean>;
  
  // Version Control State & Actions (optional)
  version?: {
    currentVersion: number;
    snapshots: VersionSnapshot[];
    undoStack: VersionSnapshot[];
    redoStack: VersionSnapshot[];
    maxSnapshots: number;
    maxUndoSize: number;
    activeConflicts: ConflictResolution[];
  };
  
  // Version Actions (optional)
  createVersionSnapshot?: (data: any, description: string, author: 'user' | 'system' | 'ai') => string;
  restoreSnapshot?: (snapshotId: string) => boolean;
  versionUndo?: () => VersionSnapshot | null;
  versionRedo?: () => VersionSnapshot | null;
  canVersionUndo?: () => boolean;
  canVersionRedo?: () => boolean;
  getVersionHistory?: () => VersionSnapshot[];
  compareVersions?: (version1: string, version2: string) => any;
  detectConflicts?: (localData: any, serverData: any) => ConflictResolution[];
  versionResolveConflict?: (conflictId: string, resolution: ConflictResolution) => boolean;
  clearVersionHistory?: () => void;
  compressSnapshots?: () => void;
  
  // Analytics State & Actions (optional)
  analytics?: {
    isEnabled: boolean;
    sessionId: string;
    userId?: string;
    events: AnalyticsEvent[];
    metrics: AnalyticsMetrics;
    userBehavior: UserBehaviorData;
    performanceData: PerformanceData;
  };
  
  // Analytics Actions (optional)
  trackEvent?: (event: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'>) => void;
  trackUserAction?: (actionName: string, properties?: Record<string, any>) => void;
  trackPageView?: (pageName: string, properties?: Record<string, any>) => void;
  trackError?: (error: Error, context?: Record<string, any>) => void;
  trackAnalyticsPerformance?: (metric: string, value: number, context?: Record<string, any>) => void;
  setUserId?: (userId: string) => void;
  flushEvents?: () => Promise<void>;
  getSessionData?: () => any;
  exportAnalyticsData?: () => any;
}

/**
 * ===== MIDDLEWARE FACTORY TYPES =====
 */

export type MiddlewareFactory<T = any> = (config?: any) => (
  stateCreator: any
) => any;

export interface MiddlewareConfig {
  autoSave?: AutoSaveConfig;
  devTools?: DevToolsConfig;
  persistence?: PersistenceConfig;
  version?: VersionConfig;
  analytics?: AnalyticsConfig;
}

export interface MiddlewareContext {
  get: () => any;
  set: (updater: any) => void;
  api: any;
  config: MiddlewareConfig;
}

/**
 * ===== UTILITY TYPES =====
 */

export type MiddlewareEnhancer<T> = T & AllMiddlewareState;

export type StoreWithMiddleware<T> = T & {
  middleware: {
    autoSave: AutoSaveMiddlewareState;
    devTools: DevToolsMiddlewareState;
    persistence: PersistenceMiddlewareState;
    version: VersionMiddlewareState;
    analytics: AnalyticsMiddlewareState;
  };
};

export interface MiddlewareMeta {
  name: string;
  version: string;
  enabled: boolean;
  initialized: boolean;
  config: any;
  dependencies: string[];
}