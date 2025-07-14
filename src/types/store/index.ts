// types/store/index.ts - Clean re-exports for centralized store types

// types/store/index.ts - Clean re-exports for centralized store types

/**
 * ===== ACTION INTERFACES =====
 */

import type { 
  MiddlewareFactory,
  ActionHistoryEntry,
  PerformanceMetric,
  MemorySnapshot
} from './middleware';

import type {
  ValidationResult
} from './state';

export type {
  LayoutActions,
  ContentActions,
  UIActions,
  PersistenceActions, // Keep original name - no conflict here
  FormsImageActions,
  ValidationActions,
  MetaActions,
  AutoSaveActions,
  GenerationActions,
} from './actions';

/**
 * ===== STATE INTERFACES =====
 */
export type {
  // Core Interfaces
  ConfirmedFieldData,
  ElementSelection,
  ToolbarState,
  ToolbarAction,
  ChangeEvent as StoreChangeEvent, // Renamed to avoid conflict
  EditHistoryEntry,
  APIRequest,
  
  // Slice Interfaces
  LayoutSlice,
  ContentSlice,
  UISlice,
  MetaSlice,
  PersistenceSlice,
  FormsSlice,
  ImagesSlice,
  ValidationSlice,
  StoreState,
  
  // Form Types
  FormData,
  FormField,
  FormFieldType,
  FormSettings,
  FormStyling,
  IntegrationConfig,
  FormAnalytics,
  
  // Image Types
  ImageAsset,
  StockPhotoResult,
  SearchFilters,
  UploadProgress,
  
  // Validation Types
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './state';

/**
 * ===== MIDDLEWARE TYPES =====
 */
export type {
  // Auto-Save Middleware
  AutoSaveState,
  AutoSaveMiddlewareActions,
  AutoSaveConfig,
  AutoSaveMiddlewareState,
  
  // Dev Tools Middleware
  DevToolsState,
  DevToolsActions,
  DevToolsConfig,
  DevToolsMiddlewareState,
  ActionHistoryEntry,
  PerformanceMetric,
  StoreSnapshot,
  
  // Persistence Middleware
  PersistenceState,
  PersistenceActions as MiddlewarePersistenceActions, // Only rename the middleware version
  PersistenceConfig,
  PersistenceMiddlewareState,
  SaveOperation,
  SaveResult,
  LoadResult,
  PersistenceMetrics,
  CacheEntry,
  
  // Version Control Middleware
  VersionState,
  VersionActions,
  VersionConfig,
  VersionMiddlewareState,
  VersionSnapshot,
  ConflictResolution,
  ConflictDetail,
  
  // Analytics Middleware
  AnalyticsState,
  AnalyticsActions,
  AnalyticsConfig,
  AnalyticsMiddlewareState,
  AnalyticsEvent,
  AnalyticsMetrics,
  UserBehaviorData,
  PerformanceData,
  
  // Combined Types
  AllMiddlewareState,
  MiddlewareFactory, // Now properly defined
  MiddlewareConfig,
  MiddlewareContext,
  MiddlewareEnhancer, // Now properly defined  
  StoreWithMiddleware, // Now properly defined
  MiddlewareMeta,
  
  // Common Event Types (renamed to avoid conflicts)
  ChangeEvent as MiddlewareChangeEvent,
  HeatmapPoint,
  InteractionPattern,
  DropoffPoint,
  FunnelStep,
  MemorySnapshot as AnalyticsMemorySnapshot, // Renamed to avoid conflict
  SlowOperation,
} from './middleware';

/**
 * ===== COMBINED STORE TYPE =====
 */

import type {
  LayoutActions,
  ContentActions,
  UIActions,
  PersistenceActions, // Use original name
  FormsImageActions,
  ValidationActions,
  MetaActions,
  AutoSaveActions,
  GenerationActions,
} from './actions';

import type {
  StoreState,
} from './state';

import type {
  AutoSaveMiddlewareState,
} from './middleware';

// Complete EditStore interface combining all slices and actions
export interface EditStore extends 
  StoreState,
  LayoutActions,
  ContentActions,
  UIActions,
  PersistenceActions, // Use original name
  FormsImageActions,
  ValidationActions,
  MetaActions,
  GenerationActions,
  AutoSaveMiddlewareState {
  
  // Any additional store-specific properties can be added here
  // For now, everything is defined in the individual slices and actions
}

/**
 * ===== STORE FACTORY TYPES =====
 */

export interface StoreConfig {
  middleware?: {
    autoSave?: boolean;
    devTools?: boolean;
    persistence?: boolean;
    version?: boolean;
    analytics?: boolean;
  };
  initialState?: Partial<EditStore>;
  onStateChange?: (state: EditStore) => void;
  debug?: boolean;
}

export type StoreCreator<T> = (
  set: (updater: (state: T) => void) => void,
  get: () => T,
  api: any
) => T;

export type EnhancedStoreCreator<T> = StoreCreator<T> & {
  middleware: string[];
  config: StoreConfig;
};

/**
 * ===== ACTION CREATOR TYPES =====
 */

export type ActionCreator<T> = (
  set: (updater: (state: EditStore) => void) => void,
  get: () => EditStore
) => T;

export type LayoutActionCreator = ActionCreator<LayoutActions>;
export type ContentActionCreator = ActionCreator<ContentActions>;
export type UIActionCreator = ActionCreator<UIActions>;
export type PersistenceActionCreator = ActionCreator<PersistenceActions>; // Use original name
export type FormsImageActionCreator = ActionCreator<FormsImageActions>;
export type ValidationActionCreator = ActionCreator<ValidationActions>;
export type MetaActionCreator = ActionCreator<MetaActions>;
export type AutoSaveActionCreator = ActionCreator<AutoSaveActions>;
export type GenerationActionCreator = ActionCreator<GenerationActions>;

/**
 * ===== HOOK TYPES =====
 */

export type StoreSelector<T> = (state: EditStore) => T;
export type StoreSubscriber = (state: EditStore) => void;
export type StoreUnsubscribe = () => void;

export interface UseStoreHook {
  <T>(selector: StoreSelector<T>): T;
  (): EditStore;
  subscribe: (subscriber: StoreSubscriber) => StoreUnsubscribe;
  getState: () => EditStore;
  setState: (updater: Partial<EditStore> | ((state: EditStore) => Partial<EditStore>)) => void;
  destroy: () => void;
}

/**
 * ===== STORE INTEGRATION TYPES =====
 */

export interface StoreIntegration {
  name: string;
  version: string;
  actions: Record<string, any>;
  selectors: Record<string, StoreSelector<any>>;
  middleware?: MiddlewareFactory[];
  dependencies?: string[];
}

export interface StoreRegistry {
  integrations: Map<string, StoreIntegration>;
  register: (integration: StoreIntegration) => void;
  unregister: (name: string) => void;
  get: (name: string) => StoreIntegration | undefined;
  list: () => StoreIntegration[];
}

/**
 * ===== UTILITY TYPES =====
 */

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type StoreSlice<T> = T & {
  name: string;
  version: string;
  dependencies: string[];
};

export type ActionResult<T = void> = Promise<T> | T;

export type AsyncAction<P = void, R = void> = (payload: P) => Promise<R>;
export type SyncAction<P = void, R = void> = (payload: P) => R;

export type StoreAction<P = void, R = void> = AsyncAction<P, R> | SyncAction<P, R>;

/**
 * ===== DEBUGGING TYPES =====
 */

export interface StoreDebugInfo {
  currentState: EditStore;
  actionHistory: ActionHistoryEntry[];
  performanceMetrics: PerformanceMetric[];
  memoryUsage: MemorySnapshot[];
  storeConfig: StoreConfig;
  middlewareStatus: Record<string, boolean>;
  validationResults: ValidationResult[];
}

export interface DebugActions {
  getStoreInfo: () => StoreDebugInfo;
  exportState: () => string;
  importState: (state: string) => boolean;
  validateStore: () => ValidationResult;
  resetStore: () => void;
  enableDebugMode: (enabled: boolean) => void;
}

/**
 * ===== STORE EVENTS =====
 */

export type StoreEventType = 
  | 'state-change'
  | 'action-dispatched' 
  | 'error-occurred'
  | 'middleware-loaded'
  | 'store-initialized'
  | 'store-destroyed';

export interface StoreEvent<T = any> {
  type: StoreEventType;
  timestamp: number;
  payload: T;
  source: string;
}

export type StoreEventHandler<T = any> = (event: StoreEvent<T>) => void;

export interface StoreEventEmitter {
  on: <T>(eventType: StoreEventType, handler: StoreEventHandler<T>) => () => void;
  emit: <T>(eventType: StoreEventType, payload: T) => void;
  off: (eventType: StoreEventType, handler: StoreEventHandler) => void;
  once: <T>(eventType: StoreEventType, handler: StoreEventHandler<T>) => () => void;
}

/**
 * ===== RE-EXPORT CORE TYPES =====
 */

// Re-export commonly used core types for convenience
export type {
  InputVariables,
  HiddenInferredFields,
  FeatureItem,
  SectionData,
  Theme,
  BackgroundType,
  ElementType,
  ElementEditMode,
  CanonicalFieldName,
} from '@/types/core/index';

// Re-export middleware types that might be used elsewhere
// export type { AutoSaveMiddlewareState } from '@/middleware/autoSaveMiddleware';
export type { StatePersistenceManager } from '@/utils/statePersistence';