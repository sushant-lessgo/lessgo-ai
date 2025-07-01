// utils/statePersistence.ts - Main State Persistence Manager
import { debounce } from 'lodash';
import { autoSaveDraft } from '@/utils/autoSaveDraft';
import { VersionManager, type VersionSnapshot, type ConflictResolution } from '@/utils/versionManager';
import { TypeGuards } from '@/utils/typeGuards';
import type { 
  InputVariables, 
  HiddenInferredFields, 
  FeatureItem,
  LandingPageContent 
} from '@/types/core/index';

/**
 * ===== PERSISTENCE MANAGER TYPES =====
 */

export interface PersistenceConfig {
  autoSaveInterval: number; // Background save interval in ms (default: 30000 = 30s)
  debounceDelay: number; // Debounce delay for user actions (default: 500ms)
  maxRetries: number; // Max retry attempts for failed saves
  retryDelay: number; // Delay between retries
  enableVersionControl: boolean; // Enable version snapshots
  enableConflictDetection: boolean; // Enable conflict detection with server
  compressionThreshold: number; // Compress data larger than X bytes
}

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
  loadCache: Map<string, { data: any; timestamp: number; ttl: number }>;
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

/**
 * ===== STATE PERSISTENCE MANAGER CLASS =====
 */

export class StatePersistenceManager {
  private config: PersistenceConfig;
  private state: PersistenceState;
  private versionManager: VersionManager;
  private metrics: PersistenceMetrics;
  private debouncedSave: ReturnType<typeof debounce>;

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = {
      autoSaveInterval: 30000, // 30 seconds
      debounceDelay: 500,
      maxRetries: 3,
      retryDelay: 1000,
      enableVersionControl: true,
      enableConflictDetection: true,
      compressionThreshold: 1024 * 100, // 100KB
      ...config,
    };

    this.state = {
      isDirty: false,
      isSaving: false,
      isLoading: false,
      retryCount: 0,
      saveQueue: [],
      loadCache: new Map(),
      localVersion: 1,
    };

    this.versionManager = new VersionManager({
      maxSnapshots: 25,
      enableCompression: true,
      autoSnapshotInterval: 5,
    });

    this.metrics = {
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
    };

    // Create debounced save function
    this.debouncedSave = debounce(
      this.performSave.bind(this),
      this.config.debounceDelay
    );

    this.startBackgroundSave();
  }

  /**
   * ===== PUBLIC SAVE METHODS =====
   */

  // Manual save triggered by user action
  async saveManual(data: any, description?: string): Promise<SaveResult> {
    console.log('💾 Manual save triggered:', { description });
    
    // Cancel debounced save
    this.debouncedSave.cancel();
    
    // Create version snapshot if enabled
    if (this.config.enableVersionControl) {
      this.versionManager.createSnapshot(
        data,
        description || 'Manual save',
        'user'
      );
    }

    return this.performSave(data, 'manual', 1);
  }

  // Auto save triggered by data changes (debounced)
  saveAuto(data: any): void {
    if (this.state.isSaving) {
      console.log('💾 Save in progress, queueing auto-save');
      this.queueSave(data, 'auto', 2);
      return;
    }

    console.log('💾 Auto save triggered (debounced)');
    this.state.isDirty = true;
    this.debouncedSave(data, 'auto', 2);
  }

  // Background save (periodic)
  private async saveBackground(data: any): Promise<void> {
    if (!this.state.isDirty || this.state.isSaving) {
      return;
    }

    console.log('💾 Background save triggered');
    await this.performSave(data, 'background', 3);
  }

  // Force save (bypasses all queuing)
  async forceSave(data: any, description?: string): Promise<SaveResult> {
    console.log('💾 Force save triggered:', { description });
    
    // Cancel any pending saves
    this.debouncedSave.cancel();
    this.clearSaveQueue();
    
    // Create version snapshot
    if (this.config.enableVersionControl) {
      this.versionManager.createSnapshot(
        data,
        description || 'Force save',
        'user'
      );
    }

    return this.performSave(data, 'manual', 0); // Highest priority
  }

  /**
   * ===== CORE SAVE IMPLEMENTATION =====
   */

  private async performSave(
    data: any, 
    type: SaveOperation['type'] = 'auto', 
    priority: number = 2
  ): Promise<SaveResult> {
    const saveStartTime = Date.now();
    const saveId = `save-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Update state
      this.state.isSaving = true;
      this.state.saveError = undefined;
      this.metrics.totalSaves++;

      // Validate data before saving
      const validation = this.validateSaveData(data);
      if (!validation.isValid) {
        throw new Error(`Save validation failed: ${validation.errors.join(', ')}`);
      }

      // Detect conflicts if enabled
      if (this.config.enableConflictDetection && this.state.serverVersion) {
        const conflictResult = await this.detectConflicts(data);
        if (conflictResult.hasConflict) {
          console.warn('🔄 Save conflict detected');
          this.metrics.conflictsDetected++;
          
          return {
            success: false,
            timestamp: Date.now(),
            error: 'Conflict detected',
            conflictDetected: true,
            serverData: conflictResult.serverData,
          };
        }
      }

      // Prepare save payload
      const savePayload = this.prepareSavePayload(data);
      
      // Compress if necessary
      if (this.shouldCompressData(savePayload)) {
        savePayload._compressed = true;
        console.log('📦 Compressing save data');
      }

      // Execute save operation
      const result = await autoSaveDraft(savePayload);

      // Update state on success
      const saveEndTime = Date.now();
      const saveTime = saveEndTime - saveStartTime;

      this.state.isSaving = false;
      this.state.isDirty = false;
      this.state.lastSaved = saveEndTime;
      this.state.retryCount = 0;
      this.state.localVersion++;

      // Update metrics
      this.metrics.successfulSaves++;
      this.metrics.lastSaveTime = saveTime;
      this.metrics.averageSaveTime = this.calculateAverageSaveTime(saveTime);

      // Process queued saves
      this.processNextQueuedSave();

      // Create auto-snapshot if configured
      if (this.config.enableVersionControl && 
          this.versionManager.shouldCreateAutoSnapshot(this.metrics.successfulSaves)) {
        this.versionManager.createSnapshot(
          data,
          `Auto-snapshot after ${this.metrics.successfulSaves} saves`,
          'auto-save'
        );
      }

      console.log('✅ Save successful:', {
        saveId,
        type,
        saveTime: `${saveTime}ms`,
        version: this.state.localVersion,
        compressed: !!savePayload._compressed,
      });

      return {
        success: true,
        timestamp: saveEndTime,
        version: this.state.localVersion,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      
      this.state.isSaving = false;
      this.state.saveError = errorMessage;
      this.state.retryCount++;
      this.metrics.failedSaves++;

      console.error('❌ Save failed:', {
        saveId,
        type,
        error: errorMessage,
        retryCount: this.state.retryCount,
      });

      // Retry logic
      if (this.state.retryCount < this.config.maxRetries) {
        console.log(`🔄 Retrying save in ${this.config.retryDelay}ms (attempt ${this.state.retryCount + 1}/${this.config.maxRetries})`);
        
        setTimeout(() => {
          this.performSave(data, type, priority);
        }, this.config.retryDelay * this.state.retryCount);
      }

      return {
        success: false,
        timestamp: Date.now(),
        error: errorMessage,
      };
    }
  }

  /**
   * ===== PUBLIC LOAD METHODS =====
   */

  async loadFromServer(tokenId: string, useCache: boolean = true): Promise<LoadResult> {
    const loadStartTime = Date.now();
    
    try {
      this.state.isLoading = true;
      this.state.loadError = undefined;
      this.metrics.totalLoads++;

      // Check cache first
      if (useCache) {
        const cached = this.getFromCache(tokenId);
        if (cached) {
          console.log('📋 Loading from cache:', { tokenId, age: Date.now() - cached.timestamp });
          this.metrics.cacheHits++;
          
          this.state.isLoading = false;
          this.state.lastLoaded = Date.now();
          
          return {
            success: true,
            data: cached.data,
            fromCache: true,
            timestamp: cached.timestamp,
          };
        }
      }

      this.metrics.cacheMisses++;

      // Load from server
      console.log('🌐 Loading from server:', { tokenId });
      
      const response = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const serverData = await response.json();
      
      // Validate loaded data
      const validation = this.validateLoadData(serverData);
      if (!validation.isValid) {
        console.warn('⚠️ Loaded data validation failed:', validation.errors);
      }

      // Store server version for conflict detection
      this.state.serverVersion = serverData;
      
      // Cache the result
      this.addToCache(tokenId, serverData);

      const loadEndTime = Date.now();
      this.state.isLoading = false;
      this.state.lastLoaded = loadEndTime;

      console.log('✅ Load successful:', {
        tokenId,
        loadTime: `${loadEndTime - loadStartTime}ms`,
        hasContent: !!serverData.finalContent,
        hasDraft: !!serverData.inputText,
      });

      return {
        success: true,
        data: serverData,
        fromCache: false,
        timestamp: loadEndTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Load failed';
      
      this.state.isLoading = false;
      this.state.loadError = errorMessage;

      console.error('❌ Load failed:', {
        tokenId,
        error: errorMessage,
      });

      return {
        success: false,
        timestamp: Date.now(),
        error: errorMessage,
      };
    }
  }

  /**
   * ===== CONFLICT DETECTION & RESOLUTION =====
   */

  private async detectConflicts(localData: any): Promise<{
    hasConflict: boolean;
    serverData?: any;
    conflicts?: ConflictResolution;
  }> {
    try {
      // Get current server version for comparison
      const serverResponse = await fetch(`/api/loadDraft?tokenId=${localData.tokenId}`);
      if (!serverResponse.ok) {
        console.warn('⚠️ Could not fetch server version for conflict detection');
        return { hasConflict: false };
      }

      const serverData = await serverResponse.json();
      const serverModified = new Date(serverData.lastUpdated || 0).getTime();
      const localModified = this.state.lastSaved || 0;

      // Simple conflict detection: server modified after our last save
      if (serverModified > localModified) {
        console.log('🔄 Potential conflict detected:', {
          serverModified: new Date(serverModified).toISOString(),
          localLastSaved: new Date(localModified).toISOString(),
        });

        // Use version manager for detailed conflict analysis
        const conflicts = this.versionManager.detectConflictsWithServer(localData, serverData);
        
        return {
          hasConflict: true,
          serverData,
          conflicts,
        };
      }

      return { hasConflict: false };

    } catch (error) {
      console.warn('⚠️ Conflict detection failed:', error);
      return { hasConflict: false };
    }
  }

  async resolveConflict(
    conflictId: string, 
    strategy: 'local' | 'server' | 'merge' | 'manual',
    manualResolutions?: Record<string, any>
  ): Promise<{ success: boolean; mergedData?: any; error?: string }> {
    try {
      console.log('🔧 Resolving conflict:', { conflictId, strategy });

      let mergedData: any;

      switch (strategy) {
        case 'local':
          // Keep local version, ignore server
          this.versionManager.getActiveConflicts()
            .find(c => c.conflictId === conflictId)
            ?.localVersion.data;
          break;

        case 'server':
          // Use server version
          mergedData = this.versionManager.getActiveConflicts()
            .find(c => c.conflictId === conflictId)
            ?.serverVersion;
          break;

        case 'merge':
          // Auto-merge compatible changes
          mergedData = this.versionManager.autoResolveConflicts(conflictId);
          break;

        case 'manual':
          // Apply manual resolutions
          if (manualResolutions) {
            mergedData = this.versionManager.manualResolveConflict(conflictId, manualResolutions);
          }
          break;
      }

      if (mergedData) {
        this.metrics.conflictsResolved++;
        
        return {
          success: true,
          mergedData,
        };
      } else {
        return {
          success: false,
          error: 'Could not resolve conflict',
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conflict resolution failed',
      };
    }
  }

  /**
   * ===== UTILITY METHODS =====
   */

  private prepareSavePayload(data: any): any {
    // Extract relevant data for saving
    return {
      tokenId: data.tokenId || data.meta?.tokenId || '',
      inputText: data.onboardingData?.oneLiner || data.inputText || '',
      validatedFields: data.onboardingData?.validatedFields || {},
      featuresFromAI: data.onboardingData?.featuresFromAI || [],
      hiddenInferredFields: data.onboardingData?.hiddenInferredFields || {},
      confirmedFields: data.onboardingData?.confirmedFields || {},
      title: data.title || data.meta?.title || 'Untitled Project',
      includePageData: true,
      // Include version for conflict detection
      localVersion: this.state.localVersion,
      lastSaved: this.state.lastSaved,
    };
  }

  private validateSaveData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.tokenId && !data.meta?.tokenId) {
      errors.push('Token ID is required');
    }

    // Validate onboarding data if present
    if (data.onboardingData?.validatedFields) {
      const validation = TypeGuards.validateCompleteInputData({
        inputVariables: data.onboardingData.validatedFields,
        hiddenInferredFields: data.onboardingData.hiddenInferredFields,
        features: data.onboardingData.featuresFromAI,
      });

      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateLoadData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.tokenId) {
      errors.push('Loaded data missing token ID');
    }

    // Validate content structure if present
    if (data.finalContent) {
      if (!data.finalContent.layout) {
        errors.push('Final content missing layout data');
      }
      if (!data.finalContent.content) {
        errors.push('Final content missing content data');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private shouldCompressData(data: any): boolean {
    const size = new Blob([JSON.stringify(data)]).size;
    return size > this.config.compressionThreshold;
  }

  private calculateAverageSaveTime(newTime: number): number {
    const count = this.metrics.successfulSaves;
    return (this.metrics.averageSaveTime * (count - 1) + newTime) / count;
  }

  private queueSave(data: any, type: SaveOperation['type'], priority: number): void {
    const operation: SaveOperation = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      priority,
      retries: 0,
    };

    this.state.saveQueue.push(operation);
    this.state.saveQueue.sort((a, b) => a.priority - b.priority); // Lower priority number = higher priority
  }

  private processNextQueuedSave(): void {
    if (this.state.saveQueue.length === 0 || this.state.isSaving) {
      return;
    }

    const nextSave = this.state.saveQueue.shift();
    if (nextSave) {
      console.log('📤 Processing queued save:', { id: nextSave.id, type: nextSave.type });
      this.performSave(nextSave.data, nextSave.type, nextSave.priority);
    }
  }

  private clearSaveQueue(): void {
    this.state.saveQueue = [];
  }

  private addToCache(key: string, data: any, ttl: number = 300000): void { // 5 min TTL
    this.state.loadCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Clean up expired cache entries
    this.cleanCache();
  }

  private getFromCache(key: string): { data: any; timestamp: number } | null {
    const cached = this.state.loadCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.state.loadCache.delete(key);
      return null;
    }

    return cached;
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.state.loadCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.state.loadCache.delete(key);
      }
    }
  }

  private startBackgroundSave(): void {
    if (this.state.backgroundSaveTimer) {
      clearInterval(this.state.backgroundSaveTimer);
    }

    this.state.backgroundSaveTimer = setInterval(() => {
      // Background save will be triggered by the hook that uses this manager
    }, this.config.autoSaveInterval);
  }

  /**
   * ===== PUBLIC GETTERS =====
   */

  getState(): PersistenceState {
    return { ...this.state };
  }

  getMetrics(): PersistenceMetrics {
    return { ...this.metrics };
  }

  getVersionManager(): VersionManager {
    return this.versionManager;
  }

  getActiveConflicts(): ConflictResolution[] {
    return this.versionManager.getActiveConflicts();
  }

  canUndo(): boolean {
    return this.versionManager.canUndo();
  }

  canRedo(): boolean {
    return this.versionManager.canRedo();
  }

  undo(): VersionSnapshot | null {
    return this.versionManager.undo();
  }

  redo(): VersionSnapshot | null {
    return this.versionManager.redo();
  }

  /**
   * ===== CLEANUP =====
   */

  destroy(): void {
    if (this.state.backgroundSaveTimer) {
      clearInterval(this.state.backgroundSaveTimer);
    }
    
    this.debouncedSave.cancel();
    this.clearSaveQueue();
    this.state.loadCache.clear();
    
    console.log('🧹 State persistence manager destroyed');
  }
}

/**
 * ===== SINGLETON INSTANCE =====
 */

let globalPersistenceManager: StatePersistenceManager | null = null;

export function getPersistenceManager(config?: Partial<PersistenceConfig>): StatePersistenceManager {
  if (!globalPersistenceManager) {
    globalPersistenceManager = new StatePersistenceManager(config);
  }
  return globalPersistenceManager;
}

export function resetPersistenceManager(): void {
  if (globalPersistenceManager) {
    globalPersistenceManager.destroy();
    globalPersistenceManager = null;
  }
}

/**
 * ===== DEVELOPMENT UTILITIES =====
 */

if (process.env.NODE_ENV === 'development') {
  (window as any).__persistenceDebug = {
    getManager: () => globalPersistenceManager,
    getState: () => globalPersistenceManager?.getState(),
    getMetrics: () => globalPersistenceManager?.getMetrics(),
    getActiveConflicts: () => globalPersistenceManager?.getActiveConflicts(),
    forceSave: (data: any) => globalPersistenceManager?.forceSave(data, 'Debug force save'),
    simulateConflict: () => {
      if (globalPersistenceManager) {
        const state = globalPersistenceManager.getState();
        state.serverVersion = { lastUpdated: Date.now() + 1000 };
        console.log('🔄 Simulated conflict condition');
      }
    },
    clearCache: () => {
      if (globalPersistenceManager) {
        (globalPersistenceManager as any).state.loadCache.clear();
        console.log('🧹 Cache cleared');
      }
    },
  };

  console.log('🔧 Persistence Manager debug utilities available at window.__persistenceDebug');
}