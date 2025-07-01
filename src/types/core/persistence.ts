// types/core/persistence.ts - Persistence-Specific Type Definitions
import type { 
  InputVariables, 
  HiddenInferredFields, 
  FeatureItem,
  LandingPageContent,
  CanonicalFieldName 
} from './index';

/**
 * ===== CORE PERSISTENCE TYPES =====
 */

export interface PersistenceData {
  tokenId: string;
  projectId?: string;
  userId?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

export interface DraftData extends PersistenceData {
  // Onboarding Data
  inputText?: string;
  stepIndex?: number;
  confirmedFields?: Partial<Record<CanonicalFieldName, ConfirmedFieldData>>;
  validatedFields?: Partial<InputVariables>;
  featuresFromAI?: FeatureItem[];
  hiddenInferredFields?: HiddenInferredFields;
  
  // Project Metadata
  title?: string;
  description?: string;
  slug?: string;
  
  // Complete Page Data (from edit store)
  finalContent?: {
    layout: {
      sections: string[];
      sectionLayouts: Record<string, string>;
      theme: any;
      globalSettings: any;
    };
    content: Record<string, any>;
    meta: {
      id: string;
      title: string;
      slug: string;
      description?: string;
      lastUpdated: number;
      version: number;
      tokenId: string;
    };
    generatedAt: number;
  };
  
  // Theme Values (legacy)
  themeValues?: {
    primary: string;
    background: string;
    muted: string;
  };
}

export interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

/**
 * ===== SAVE OPERATION TYPES =====
 */

export interface SaveRequest {
  tokenId: string;
  data: Partial<DraftData>;
  options?: SaveOptions;
  metadata?: SaveMetadata;
}

export interface SaveOptions {
  type: 'manual' | 'auto' | 'background' | 'force';
  priority: number;
  retryCount?: number;
  validateData?: boolean;
  createSnapshot?: boolean;
  detectConflicts?: boolean;
  bypassConflicts?: boolean;
}

export interface SaveMetadata {
  source: 'user' | 'ai' | 'system';
  description?: string;
  changesSummary?: string[];
  triggeredBy?: 'timer' | 'user-action' | 'data-change' | 'navigation';
  sessionId?: string;
  timestamp: number;
}

export interface SaveResponse {
  success: boolean;
  timestamp: number;
  version?: number;
  savedFields?: string[];
  skippedFields?: string[];
  warnings?: string[];
  error?: {
    code: string;
    message: string;
    details?: any;
    retryable: boolean;
  };
  conflictDetected?: boolean;
  serverData?: any;
  metrics?: {
    saveTime: number;
    dataSize: number;
    compressionRatio?: number;
  };
}

/**
 * ===== LOAD OPERATION TYPES =====
 */

export interface LoadRequest {
  tokenId: string;
  options?: LoadOptions;
}

export interface LoadOptions {
  useCache?: boolean;
  cacheMaxAge?: number;
  validateData?: boolean;
  includeMetadata?: boolean;
  fields?: string[]; // Load specific fields only
}

export interface LoadResponse {
  success: boolean;
  data?: DraftData;
  fromCache?: boolean;
  timestamp: number;
  version?: number;
  warnings?: string[];
  error?: {
    code: string;
    message: string;
    details?: any;
    retryable: boolean;
  };
  metadata?: {
    loadTime: number;
    dataSize: number;
    cacheHit: boolean;
    lastModifiedBy?: string;
    syncStatus: 'synced' | 'pending' | 'conflict' | 'offline';
  };
}

/**
 * ===== VERSION CONTROL TYPES =====
 */

export interface VersionInfo {
  id: string;
  version: number;
  timestamp: number;
  description: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  changes: ChangeEntry[];
  snapshot?: any;
  tags?: string[];
  size: number;
}

export interface ChangeEntry {
  type: 'create' | 'update' | 'delete' | 'move' | 'reorder';
  path: string; // e.g., "content.hero.headline" or "layout.sections"
  oldValue?: any;
  newValue?: any;
  timestamp: number;
  source: 'user' | 'ai' | 'system';
  description?: string;
}

export interface VersionHistoryRequest {
  tokenId: string;
  limit?: number;
  offset?: number;
  since?: number;
  filter?: {
    author?: string;
    type?: ChangeEntry['type'][];
    source?: ChangeEntry['source'][];
    tags?: string[];
  };
}

export interface VersionHistoryResponse {
  success: boolean;
  versions: VersionInfo[];
  totalCount: number;
  hasMore: boolean;
  error?: string;
}

/**
 * ===== CONFLICT RESOLUTION TYPES =====
 */

export interface ConflictInfo {
  id: string;
  tokenId: string;
  timestamp: number;
  type: 'content' | 'structure' | 'theme' | 'metadata' | 'mixed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  conflictedPaths: ConflictPath[];
  localVersion: VersionInfo;
  serverVersion: VersionInfo;
  autoResolvable: boolean;
  suggestedResolution?: ResolutionStrategy;
}

export interface ConflictPath {
  path: string;
  localValue: any;
  serverValue: any;
  conflictType: 'modified' | 'deleted' | 'added' | 'moved';
  canAutoMerge: boolean;
  mergeStrategy?: 'prefer-local' | 'prefer-server' | 'concat' | 'union' | 'manual';
  importance: 'low' | 'medium' | 'high';
}

export interface ResolutionStrategy {
  strategy: 'local' | 'server' | 'merge' | 'manual';
  pathResolutions?: Record<string, {
    resolution: 'local' | 'server' | 'custom';
    customValue?: any;
  }>;
  description?: string;
}

export interface ConflictResolutionRequest {
  conflictId: string;
  resolution: ResolutionStrategy;
  createSnapshot?: boolean;
}

export interface ConflictResolutionResponse {
  success: boolean;
  mergedData?: DraftData;
  appliedResolutions: string[];
  remainingConflicts?: ConflictPath[];
  error?: string;
  metrics?: {
    resolvedPaths: number;
    manualPaths: number;
    resolutionTime: number;
  };
}

/**
 * ===== SYNC & COLLABORATION TYPES =====
 */

export interface SyncStatus {
  tokenId: string;
  localVersion: number;
  serverVersion: number;
  lastSyncAt?: number;
  status: 'synced' | 'pending' | 'conflict' | 'offline' | 'error';
  pendingChanges: number;
  conflictCount: number;
  lastError?: string;
}

export interface CollaborationInfo {
  activeUsers: CollaboratorInfo[];
  recentActivity: ActivityEntry[];
  permissions: ProjectPermissions;
}

export interface CollaboratorInfo {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'away' | 'offline';
  lastActivity: number;
  currentSection?: string;
  avatar?: string;
}

export interface ActivityEntry {
  id: string;
  userId: string;
  userDisplayName: string;
  action: 'edit' | 'save' | 'comment' | 'share' | 'publish';
  target: string; // Section ID, element key, etc.
  description: string;
  timestamp: number;
  metadata?: any;
}

export interface ProjectPermissions {
  canEdit: boolean;
  canSave: boolean;
  canPublish: boolean;
  canShare: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}

/**
 * ===== CACHE TYPES =====
 */

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
  size: number;
  tags?: string[];
  metadata?: {
    source: 'api' | 'computation' | 'user-input';
    hitCount: number;
    lastAccessed: number;
    compressionUsed?: boolean;
  };
}

export interface CacheConfig {
  maxSize: number; // Max entries
  maxMemory: number; // Max memory in bytes
  defaultTTL: number; // Default TTL in ms
  compressionThreshold: number; // Compress entries larger than X bytes
  enablePersistence: boolean; // Persist cache across sessions
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'size';
}

export interface CacheStats {
  size: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  compressionRatio: number;
  oldestEntry?: number;
  newestEntry?: number;
}

/**
 * ===== PERFORMANCE & METRICS TYPES =====
 */

export interface PerformanceMetrics {
  persistence: {
    saves: {
      total: number;
      successful: number;
      failed: number;
      averageTime: number;
      medianTime: number;
      p95Time: number;
      slowestTime: number;
      fastestTime: number;
    };
    loads: {
      total: number;
      successful: number;
      failed: number;
      cacheHits: number;
      cacheMisses: number;
      averageTime: number;
    };
    conflicts: {
      detected: number;
      autoResolved: number;
      manuallyResolved: number;
      pending: number;
    };
  };
  storage: {
    totalSize: number;
    compressedSize: number;
    compressionRatio: number;
    cacheSize: number;
    snapshotSize: number;
  };
  network: {
    requests: number;
    failures: number;
    retries: number;
    avgResponseTime: number;
    bytesTransferred: number;
    offlineTime: number;
  };
}

export interface PerformanceReport {
  timeframe: {
    start: number;
    end: number;
    duration: number;
  };
  metrics: PerformanceMetrics;
  insights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
}

export interface PerformanceInsight {
  type: 'warning' | 'info' | 'error';
  category: 'performance' | 'reliability' | 'storage' | 'network';
  message: string;
  impact: 'low' | 'medium' | 'high';
  data?: any;
}

export interface PerformanceRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  category: 'performance' | 'reliability' | 'storage' | 'network';
  actionRequired?: boolean;
  autoApplicable?: boolean;
}

/**
 * ===== ERROR TYPES =====
 */

export interface PersistenceError extends Error {
  code: string;
  category: 'network' | 'validation' | 'conflict' | 'permission' | 'storage' | 'unknown';
  retryable: boolean;
  userFriendlyMessage: string;
  technicalDetails?: any;
  timestamp: number;
  context?: {
    tokenId?: string;
    operation?: string;
    data?: any;
  };
}

export interface ErrorReport {
  id: string;
  error: PersistenceError;
  environment: {
    userAgent: string;
    url: string;
    timestamp: number;
    userId?: string;
    sessionId?: string;
  };
  stackTrace?: string;
  breadcrumbs?: BreadcrumbEntry[];
  resolved: boolean;
  resolution?: string;
}

export interface BreadcrumbEntry {
  timestamp: number;
  category: 'user' | 'system' | 'network' | 'data';
  action: string;
  data?: any;
  level: 'info' | 'warning' | 'error';
}

/**
 * ===== UTILITY TYPES =====
 */

export type PersistenceEventType = 
  | 'save-start'
  | 'save-success'
  | 'save-error'
  | 'load-start'
  | 'load-success'
  | 'load-error'
  | 'conflict-detected'
  | 'conflict-resolved'
  | 'cache-hit'
  | 'cache-miss'
  | 'offline'
  | 'online'
  | 'version-created'
  | 'data-corrupted';

export interface PersistenceEvent {
  type: PersistenceEventType;
  timestamp: number;
  data?: any;
  metadata?: {
    tokenId?: string;
    userId?: string;
    sessionId?: string;
    source?: string;
  };
}

export type PersistenceEventHandler = (event: PersistenceEvent) => void;

export interface PersistenceEventEmitter {
  on(event: PersistenceEventType, handler: PersistenceEventHandler): void;
  off(event: PersistenceEventType, handler: PersistenceEventHandler): void;
  emit(event: PersistenceEvent): void;
  removeAllListeners(): void;
}

/**
 * ===== CONFIGURATION TYPES =====
 */

export interface PersistenceConfiguration {
  // Core settings
  autoSave: {
    enabled: boolean;
    interval: number; // ms
    debounceDelay: number; // ms
    maxQueueSize: number;
  };
  
  // Background sync
  backgroundSync: {
    enabled: boolean;
    interval: number; // ms
    batchSize: number;
    retryAttempts: number;
    retryDelay: number; // ms
  };
  
  // Version control
  versionControl: {
    enabled: boolean;
    maxSnapshots: number;
    snapshotInterval: number; // changes
    compressionEnabled: boolean;
    compressionThreshold: number; // bytes
  };
  
  // Conflict detection
  conflictDetection: {
    enabled: boolean;
    checkInterval: number; // ms
    autoResolveSimple: boolean;
    notifyOnConflict: boolean;
  };
  
  // Caching
  cache: CacheConfig;
  
  // Performance
  performance: {
    enableMetrics: boolean;
    sampleRate: number; // 0-1
    reportInterval: number; // ms
    enableProfiling: boolean;
  };
  
  // Error handling
  errorHandling: {
    enableReporting: boolean;
    maxBreadcrumbs: number;
    enableStackTrace: boolean;
    enableUserFeedback: boolean;
  };
  
  // Development
  development: {
    enableDebugMode: boolean;
    enableVerboseLogging: boolean;
    enablePerformanceWarnings: boolean;
    mockNetworkDelay: number; // ms
  };
}