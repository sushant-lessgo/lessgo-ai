// hooks/useAutoSave.ts - React Hook for Auto-Save Integration
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useEditStoreLegacy as useEditStore } from './useEditStoreLegacy';
import { VersionManager, type ConflictResolution } from '@/utils/versionManager';
import type { AutoSaveState } from '@/middleware/autoSaveMiddleware';
import type { ChangeEvent } from '@/middleware/autoSaveMiddleware';

/**
 * ===== HOOK TYPES =====
 */
// NOTE: the content-serialization layer (SerializationConfig/Status/Actions,
// useContentSerializer) was deleted — its serialize() path dropped pages/chrome
// (multi-page-UNSAFE per docs/task/edit-guide-and-verify.audit.md) and was never
// invoked. Saves go through store.forceSave()/triggerAutoSave() only.
export interface AutoSaveHookConfig {
  enableAutoSave: boolean;
  enableVersioning: boolean;
  snapshotInterval: number; // Create snapshot every N changes
  conflictResolution: 'auto' | 'manual' | 'prompt';
  onSaveSuccess?: (duration: number) => void;
  onSaveError?: (error: string) => void;
  onConflictDetected?: (conflict: ConflictResolution) => void;
  onVersionCreated?: (versionId: string) => void;
}

export interface AutoSaveStatus {
  // Save State
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: Date;
  saveError?: string;
  
  // Performance
  saveCount: number;
  averageSaveTime: number;
  lastSaveTime: number;
  
  // Version Control
  canUndo: boolean;
  canRedo: boolean;
  currentVersion: number;
  totalVersions: number;
  
  // Conflicts
  hasActiveConflicts: boolean;
  conflictCount: number;
  
  // Queue Status
  queuedChanges: number;
  isOnline: boolean;
}
export interface AutoSaveActions {
  // Save Operations
  triggerSave: () => void;
  forceSave: () => Promise<void>;
  
  // Version Control
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  createSnapshot: (description: string) => string;
  
  // Conflict Resolution
  resolveConflict: (conflictId: string, strategy: 'local' | 'server' | 'merge', resolutions?: Record<string, any>) => void;
  getActiveConflicts: () => ConflictResolution[];
  
  // Manual Controls
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  clearSaveError: () => void;
  
  // Development/Debug
  getPerformanceStats: () => AutoSaveState['performance'];
  exportHistory: () => any;
}

export interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  actions: AutoSaveActions;
  
  // Convenience functions for common operations
  saveNow: () => Promise<void>;
  undoLastChange: () => Promise<boolean>;
  redoLastUndo: () => Promise<boolean>;
  
  // Component helpers
  getSaveStatusMessage: () => string;
  getSaveStatusColor: () => 'green' | 'yellow' | 'red' | 'gray';
  getConflictSummary: () => string;
}

/**
 * ===== MAIN HOOK IMPLEMENTATION =====
 */

export const useAutoSave = (config: Partial<AutoSaveHookConfig> = {}): UseAutoSaveReturn => {
  // Configuration with defaults
  const finalConfig: AutoSaveHookConfig = {
  enableAutoSave: true,
  enableVersioning: true,
  snapshotInterval: 5,
  conflictResolution: 'prompt',
  ...config,
};
  // Store integration
  const store = useEditStore();
  
  // Version manager instance (persists across renders)
  const versionManagerRef = useRef<VersionManager | null>(null);
  
  // Initialize version manager
  if (!versionManagerRef.current && finalConfig.enableVersioning) {
    versionManagerRef.current = new VersionManager({
      maxSnapshots: 50,
      autoSnapshotInterval: finalConfig.snapshotInterval,
      enableCompression: true,
    });
  }

  // Track change count for auto-snapshots
  const changeCountRef = useRef(0);
  const isOnlineRef = useRef(navigator.onLine);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      // Trigger save when coming back online if there are changes
      if (store.persistence.isDirty && finalConfig.enableAutoSave) {
        store.triggerAutoSave();
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [store, finalConfig.enableAutoSave]);

  // Auto-save enablement effect
  useEffect(() => {
    if (finalConfig.enableAutoSave && isOnlineRef.current) {
      // Enable auto-save when conditions are met
      const interval = setInterval(() => {
        if (store.persistence.isDirty && !store.persistence.isSaving) {
          store.triggerAutoSave();
        }
      }, 1000); // Check every second

      return () => clearInterval(interval);
    }
  }, [finalConfig.enableAutoSave, store]);

  // Version snapshot creation effect
  useEffect(() => {
    if (!finalConfig.enableVersioning || !versionManagerRef.current) return;

    // Create snapshot when significant changes accumulate
    if ((store.queuedChanges || []).length > 0) {
      changeCountRef.current += 1;
      
      if (versionManagerRef.current.shouldCreateAutoSnapshot(changeCountRef.current)) {
        const snapshot = versionManagerRef.current.createSnapshot(
          store.export(),
          `Auto-snapshot after ${changeCountRef.current} changes`,
          'auto-save',
          store.queuedChanges || []
        );
        
        changeCountRef.current = 0; // Reset counter
        finalConfig.onVersionCreated?.(snapshot);
      }
    }
  }, [store.queuedChanges || [], finalConfig, store]);

  // Save success/error callbacks
  useEffect(() => {
    if (store.persistence.lastSaved && finalConfig.onSaveSuccess) {
      finalConfig.onSaveSuccess(store.getPerformanceStats().lastSaveTime);
    }
  }, [store.persistence.lastSaved, finalConfig]);

 useEffect(() => {
    if (store.persistence.saveError && finalConfig.onSaveError) {
      finalConfig.onSaveError(store.persistence.saveError);
    }
  }, [store.persistence.saveError, finalConfig]);

  /**
   * ===== STATUS COMPUTATION =====
   */
  const status: AutoSaveStatus = useMemo(() => {
    const versionManager = versionManagerRef.current;
    const conflicts = versionManager?.getActiveConflicts() || [];
    const historySummary = versionManager?.getHistorySummary();

    return {
      // Save State
      isDirty: store.persistence.isDirty,
      isSaving: store.persistence.isSaving,
      lastSaved: store.persistence.lastSaved ? new Date(store.persistence.lastSaved) : undefined,
      saveError: store.persistence.saveError,
      
      // Performance
      saveCount: store.getPerformanceStats().saveCount,
      averageSaveTime: store.getPerformanceStats().averageSaveTime,
      lastSaveTime: store.getPerformanceStats().lastSaveTime,
      
      // Version Control
      canUndo: historySummary?.canUndo || false,
      canRedo: historySummary?.canRedo || false,
      currentVersion: historySummary?.currentVersion || 0,
      totalVersions: historySummary?.totalSnapshots || 0,
      
      // Conflicts
      hasActiveConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
      
      // Queue Status
      queuedChanges: (store.queuedChanges || []).length,
      isOnline: isOnlineRef.current,
    };
  }, [
    store.persistence.isDirty,
    store.persistence.isSaving,
    store.persistence.lastSaved,
    store.persistence.saveError,
    store.getPerformanceStats(),
    (store.queuedChanges || []).length,
    versionManagerRef.current,
  ]);

  /**
   * ===== ACTION IMPLEMENTATIONS =====
   */
  
  const triggerSave = useCallback(() => {
    if (finalConfig.enableAutoSave && isOnlineRef.current) {
      store.triggerAutoSave();
    }
  }, [store, finalConfig.enableAutoSave]);

  // Enhanced forceSave implementation to replace existing:
const forceSave = useCallback(async () => {
  if (!isOnlineRef.current) {
    throw new Error('Cannot save while offline');
  }

  try {
    await store.forceSave();

    // Create version snapshot on manual save
    if (finalConfig.enableVersioning && versionManagerRef.current) {
      const snapshot = versionManagerRef.current.createSnapshot(
        store.export(),
        'Manual save',
        'user'
      );
      finalConfig.onVersionCreated?.(snapshot);
    }
  } catch (error) {
    throw error;
  }
}, [store, finalConfig]);

  const undo = useCallback(async (): Promise<boolean> => {
    if (!finalConfig.enableVersioning || !versionManagerRef.current) {
      return false;
    }

    const snapshot = versionManagerRef.current.undo();
    if (!snapshot) {
      return false;
    }

    try {
      // Apply the snapshot to the store
      await store.loadFromDraft({
        finalContent: snapshot.data,
        tokenId: store.tokenId,
        title: store.title,
      });

      // Create a snapshot of the current state before undo for redo
      changeCountRef.current = 0; // Reset change counter
      
      return true;
    } catch (error) {
      // Revert the undo in version manager
      versionManagerRef.current.redo();
      return false;
    }
  }, [store, finalConfig.enableVersioning]);

  const redo = useCallback(async (): Promise<boolean> => {
    if (!finalConfig.enableVersioning || !versionManagerRef.current) {
      return false;
    }

    const snapshot = versionManagerRef.current.redo();
    if (!snapshot) {
      return false;
    }

    try {
      // Apply the snapshot to the store
      await store.loadFromDraft({
        finalContent: snapshot.data,
        tokenId: store.tokenId,
        title: store.title,
      });

      changeCountRef.current = 0; // Reset change counter
      
      return true;
    } catch (error) {
      // Revert the redo in version manager
      versionManagerRef.current.undo();
      return false;
    }
  }, [store, finalConfig.enableVersioning]);

  const createSnapshot = useCallback((description: string): string => {
    if (!finalConfig.enableVersioning || !versionManagerRef.current) {
      return '';
    }

    const snapshot = versionManagerRef.current.createSnapshot(
      store.export(),
      description,
      'user',
      store.queuedChanges
    );

    finalConfig.onVersionCreated?.(snapshot);
    return snapshot;
  }, [store, finalConfig, versionManagerRef.current]);

  const resolveConflict = useCallback((
    conflictId: string,
    strategy: 'local' | 'server' | 'merge',
    resolutions?: Record<string, any>
  ) => {
    if (!versionManagerRef.current) return;

    let resolvedData;

    switch (strategy) {
      case 'local':
        store.resolveConflict('latest-wins', 'local');
        break;
      case 'server':
        store.resolveConflict('auto-merge', 'server');
        break;
      case 'merge':
        if (resolutions) {
          resolvedData = versionManagerRef.current.manualResolveConflict(conflictId, resolutions);
        } else {
          resolvedData = versionManagerRef.current.autoResolveConflicts(conflictId);
        }
        
        if (resolvedData) {
          // Apply merged data to store
          store.loadFromDraft({
            finalContent: resolvedData,
            tokenId: store.tokenId,
            title: store.title,
          });
        }
        break;
    }

  }, [store, versionManagerRef.current]);

  const getActiveConflicts = useCallback((): ConflictResolution[] => {
    return versionManagerRef.current?.getActiveConflicts() || [];
  }, [versionManagerRef.current]);

  const enableAutoSave = useCallback(() => {
    // This would update the config - simplified implementation
  }, []);

  const disableAutoSave = useCallback(() => {
    // This would update the config - simplified implementation
  }, []);

  const clearSaveError = useCallback(() => {
    store.clearAutoSaveError();
  }, [store]);

  const getPerformanceStats = useCallback(() => {
    return store.getPerformanceStats();
  }, [store]);

  const exportHistory = useCallback(() => {
    return versionManagerRef.current?.exportHistory() || null;
  }, [versionManagerRef.current]);

  /**
   * ===== CONVENIENCE FUNCTIONS =====
   */

  const saveNow = useCallback(async () => {
    await forceSave();
  }, [forceSave]);

  const undoLastChange = useCallback(async () => {
    return await undo();
  }, [undo]);

  const redoLastUndo = useCallback(async () => {
    return await redo();
  }, [redo]);

  const getSaveStatusMessage = useCallback((): string => {
    if (status.saveError) {
      return `Save failed: ${status.saveError}`;
    }
    
    if (status.isSaving) {
      return 'Saving...';
    }
    
    if (!status.isOnline) {
      return 'Offline - changes will save when online';
    }
    
    if (status.isDirty) {
      return 'Unsaved changes';
    }
    
    if (status.lastSaved) {
      const now = Date.now();
      const diff = now - status.lastSaved.getTime();
      
      if (diff < 60000) { // Less than 1 minute
        return 'Saved just now';
      } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `Saved ${minutes}m ago`;
      } else {
        return `Saved at ${status.lastSaved.toLocaleTimeString()}`;
      }
    }
    
    return 'No changes yet';
  }, [status]);

  const getSaveStatusColor = useCallback((): 'green' | 'yellow' | 'red' | 'gray' => {
    if (status.saveError) return 'red';
    if (status.isSaving) return 'yellow';
    if (!status.isOnline) return 'gray';
    if (status.isDirty) return 'yellow';
    return 'green';
  }, [status]);

  const getConflictSummary = useCallback((): string => {
    if (!status.hasActiveConflicts) {
      return '';
    }
    
    const conflicts = getActiveConflicts();
    const conflictTypes = conflicts.map(c => c.conflictType);
    const uniqueTypes = [...new Set(conflictTypes)];

 
    
    return `${status.conflictCount} conflict(s): ${uniqueTypes.join(', ')}`;
  }, [status, getActiveConflicts]);

  /**
   * ===== RETURN OBJECT =====
   */
  const actions: AutoSaveActions = {
    triggerSave,
    forceSave,
    undo,
    redo,
    createSnapshot,
    resolveConflict,
    getActiveConflicts,
    enableAutoSave,
    disableAutoSave,
    clearSaveError,
    getPerformanceStats,
    exportHistory,
  };

  return {
    status,
    actions,
    saveNow,
    undoLastChange,
    redoLastUndo,
    getSaveStatusMessage,
    getSaveStatusColor,
    getConflictSummary,
  };
};

/**
 * ===== SPECIALIZED HOOKS =====
 */

// Hook for just save status (lighter weight)
export const useSaveStatus = () => {
  const { status, getSaveStatusMessage, getSaveStatusColor } = useAutoSave({
    enableVersioning: false,
  });

  return {
    isDirty: status.isDirty,
    isSaving: status.isSaving,
    saveError: status.saveError,
    lastSaved: status.lastSaved,
    isOnline: status.isOnline,
    message: getSaveStatusMessage(),
    color: getSaveStatusColor(),
  };
};

// Hook for version control only
export const useVersionControl = () => {
  const { status, actions } = useAutoSave({
    enableAutoSave: false,
    enableVersioning: true,
  });

  return {
    canUndo: status.canUndo,
    canRedo: status.canRedo,
    currentVersion: status.currentVersion,
    totalVersions: status.totalVersions,
    undo: actions.undo,
    redo: actions.redo,
    createSnapshot: actions.createSnapshot,
  };
};

// Hook for conflict management
export const useConflictResolution = () => {
  const { status, actions, getConflictSummary } = useAutoSave({
    enableAutoSave: false,
    enableVersioning: true,
    conflictResolution: 'manual',
  });

  return {
    hasConflicts: status.hasActiveConflicts,
    conflictCount: status.conflictCount,
    getActiveConflicts: actions.getActiveConflicts,
    resolveConflict: actions.resolveConflict,
    conflictSummary: getConflictSummary(),
  };
};

/**
 * ===== DEVELOPMENT UTILITIES =====
 */

if (process.env.NODE_ENV === 'development') {
  (window as any).__autoSaveHookDebug = {
    getHookInstance: () => {
      // This would need to be set up with React DevTools or similar
    },
  };
}