// hooks/useStatePersistence.ts - React Hook for State Persistence
import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { 
  StatePersistenceManager, 
  getPersistenceManager,
  type PersistenceConfig,
  type SaveResult,
  type LoadResult,
  type PersistenceState,
  type PersistenceMetrics
} from '@/utils/statePersistence';

/**
 * ===== HOOK TYPES =====
 */

interface UseStatePersistenceOptions {
  tokenId: string;
  autoSaveEnabled?: boolean;
  backgroundSaveEnabled?: boolean;
  config?: Partial<PersistenceConfig>;
  onSaveSuccess?: (result: SaveResult) => void;
  onSaveError?: (error: string) => void;
  onLoadSuccess?: (result: LoadResult) => void;
  onLoadError?: (error: string) => void;
  onConflictDetected?: (conflicts: any) => void;
}

interface UseStatePersistenceReturn {
  // State
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  lastSaved?: number;
  lastLoaded?: number;
  saveError?: string;
  loadError?: string;
  metrics: PersistenceMetrics;
  hasActiveConflicts: boolean;
  
  // Actions
  saveManual: (description?: string) => Promise<SaveResult>;
  forceSave: (description?: string) => Promise<SaveResult>;
  loadFromServer: (useCache?: boolean) => Promise<LoadResult>;
  clearErrors: () => void;
  
  // Version Control
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  
  // Conflict Resolution
  getActiveConflicts: () => any[];
  resolveConflict: (conflictId: string, strategy: 'local' | 'server' | 'merge' | 'manual', resolutions?: Record<string, any>) => Promise<void>;
  
  // Utilities
  exportData: () => any;
  getVersionHistory: () => any;
}

/**
 * ===== MAIN HOOK =====
 */

export function useStatePersistence(options: UseStatePersistenceOptions): UseStatePersistenceReturn {
  const {
    tokenId,
    autoSaveEnabled = true,
    backgroundSaveEnabled = true,
    config,
    onSaveSuccess,
    onSaveError,
    onLoadSuccess,
    onLoadError,
    onConflictDetected,
  } = options;

  // Edit store integration
  const editStore = useEditStore();
  
  // Local state
  const [persistenceState, setPersistenceState] = useState<PersistenceState>({
    isDirty: false,
    isSaving: false,
    isLoading: false,
    retryCount: 0,
    saveQueue: [],
    loadCache: new Map(),
    localVersion: 1,
  });

  const [metrics, setMetrics] = useState<PersistenceMetrics>({
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
  });

  // Persistence manager instance
  const persistenceManagerRef = useRef<StatePersistenceManager | null>(null);
  
  // Background save timer
  const backgroundSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Last edit store state for change detection
  const lastEditStateRef = useRef<any>(null);

  // Initialize persistence manager
  useEffect(() => {
    if (!persistenceManagerRef.current) {
      persistenceManagerRef.current = getPersistenceManager(config);
      console.log('🔧 State persistence hook initialized');
    }

    return () => {
      // Cleanup on unmount
      if (backgroundSaveTimerRef.current) {
        clearInterval(backgroundSaveTimerRef.current);
      }
    };
  }, [config]);

  // Update local state from persistence manager
  const updateLocalState = useCallback(() => {
    if (persistenceManagerRef.current) {
      const state = persistenceManagerRef.current.getState();
      const newMetrics = persistenceManagerRef.current.getMetrics();
      
      setPersistenceState(state);
      setMetrics(newMetrics);
    }
  }, []);

  // Get current edit store data for persistence
  const getCurrentEditData = useCallback(() => {
    return {
      ...editStore.export(),
      tokenId,
      lastModified: Date.now(),
    };
  }, [editStore, tokenId]);

  // Check if edit store has changed
  const hasEditStoreChanged = useCallback(() => {
    const currentState = editStore.export();
    const hasChanged = JSON.stringify(currentState) !== JSON.stringify(lastEditStateRef.current);
    
    if (hasChanged) {
      lastEditStateRef.current = currentState;
    }
    
    return hasChanged;
  }, [editStore]);

  // Manual save action
  const saveManual = useCallback(async (description?: string): Promise<SaveResult> => {
    if (!persistenceManagerRef.current) {
      throw new Error('Persistence manager not initialized');
    }

    try {
      const data = getCurrentEditData();
      const result = await persistenceManagerRef.current.saveManual(data, description);
      
      updateLocalState();
      
      if (result.success) {
        // Update edit store auto-save state
        editStore.clearAutoSaveError();
        onSaveSuccess?.(result);
        console.log('✅ Manual save successful');
      } else {
        onSaveError?.(result.error || 'Save failed');
        
        // Handle conflicts
        if (result.conflictDetected) {
          onConflictDetected?.(result.serverData);
        }
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      onSaveError?.(errorMessage);
      throw error;
    }
  }, [getCurrentEditData, updateLocalState, editStore, onSaveSuccess, onSaveError, onConflictDetected]);

  // Force save action
  const forceSave = useCallback(async (description?: string): Promise<SaveResult> => {
    if (!persistenceManagerRef.current) {
      throw new Error('Persistence manager not initialized');
    }

    try {
      const data = getCurrentEditData();
      const result = await persistenceManagerRef.current.forceSave(data, description);
      
      updateLocalState();
      
      if (result.success) {
        editStore.clearAutoSaveError();
        onSaveSuccess?.(result);
        console.log('✅ Force save successful');
      } else {
        onSaveError?.(result.error || 'Force save failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Force save failed';
      onSaveError?.(errorMessage);
      throw error;
    }
  }, [getCurrentEditData, updateLocalState, editStore, onSaveSuccess, onSaveError]);

  // Auto save (triggered by edit store changes)
  const saveAuto = useCallback(() => {
    if (!persistenceManagerRef.current || !autoSaveEnabled) {
      return;
    }

    const data = getCurrentEditData();
    persistenceManagerRef.current.saveAuto(data);
    updateLocalState();
  }, [getCurrentEditData, updateLocalState, autoSaveEnabled]);

  // Load from server action
  const loadFromServer = useCallback(async (useCache: boolean = true): Promise<LoadResult> => {
    if (!persistenceManagerRef.current) {
      throw new Error('Persistence manager not initialized');
    }

    try {
      const result = await persistenceManagerRef.current.loadFromServer(tokenId, useCache);
      
      updateLocalState();
      
      if (result.success && result.data) {
        // Load data into edit store
        await editStore.loadFromDraft(result.data);
        
        // Update last edit state reference
        lastEditStateRef.current = editStore.export();
        
        onLoadSuccess?.(result);
        console.log('✅ Load successful:', { fromCache: result.fromCache });
      } else {
        onLoadError?.(result.error || 'Load failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Load failed';
      onLoadError?.(errorMessage);
      throw error;
    }
  }, [tokenId, updateLocalState, editStore, onLoadSuccess, onLoadError]);

  // Clear errors action
  const clearErrors = useCallback(() => {
    editStore.clearAutoSaveError();
    editStore.clearError();
    
    // Clear persistence manager errors
    if (persistenceManagerRef.current) {
      const state = persistenceManagerRef.current.getState();
      state.saveError = undefined;
      state.loadError = undefined;
      updateLocalState();
    }
  }, [editStore, updateLocalState]);

  // Version control actions
  const undo = useCallback(() => {
    if (!persistenceManagerRef.current) return;
    
    const snapshot = persistenceManagerRef.current.undo();
    if (snapshot) {
      // Apply snapshot data to edit store
      editStore.loadFromDraft(snapshot.data);
      lastEditStateRef.current = snapshot.data;
      console.log('↶ Undo applied:', snapshot.description);
    }
  }, [editStore]);

  const redo = useCallback(() => {
    if (!persistenceManagerRef.current) return;
    
    const snapshot = persistenceManagerRef.current.redo();
    if (snapshot) {
      // Apply snapshot data to edit store
      editStore.loadFromDraft(snapshot.data);
      lastEditStateRef.current = snapshot.data;
      console.log('↷ Redo applied:', snapshot.description);
    }
  }, [editStore]);

  // Conflict resolution
  const getActiveConflicts = useCallback(() => {
    return persistenceManagerRef.current?.getActiveConflicts() || [];
  }, []);

  const resolveConflict = useCallback(async (
    conflictId: string, 
    strategy: 'local' | 'server' | 'merge' | 'manual',
    resolutions?: Record<string, any>
  ) => {
    if (!persistenceManagerRef.current) return;

    try {
      const result = await persistenceManagerRef.current.resolveConflict(conflictId, strategy, resolutions);
      
      if (result.success && result.mergedData) {
        // Apply merged data to edit store
        await editStore.loadFromDraft(result.mergedData);
        lastEditStateRef.current = result.mergedData;
        
        // Trigger save with resolved data
        await saveManual(`Conflict resolved: ${strategy}`);
        
        console.log('🔧 Conflict resolved:', { conflictId, strategy });
      }
      
      updateLocalState();
    } catch (error) {
      console.error('❌ Conflict resolution failed:', error);
      onSaveError?.(error instanceof Error ? error.message : 'Conflict resolution failed');
    }
  }, [editStore, saveManual, updateLocalState, onSaveError]);

  // Utility functions
  const exportData = useCallback(() => {
    return getCurrentEditData();
  }, [getCurrentEditData]);

  const getVersionHistory = useCallback(() => {
    return persistenceManagerRef.current?.getVersionManager().getHistorySummary();
  }, []);

  // Auto-save effect (watches edit store changes)
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const hasChanged = hasEditStoreChanged();
    if (hasChanged && editStore.isDirty) {
      console.log('📝 Edit store changed, triggering auto-save');
      saveAuto();
    }
  }, [editStore.isDirty, editStore.lastUpdated, hasEditStoreChanged, saveAuto, autoSaveEnabled]);

  // Background save effect
  useEffect(() => {
    if (!backgroundSaveEnabled) return;

    backgroundSaveTimerRef.current = setInterval(() => {
      if (editStore.isDirty && !persistenceState.isSaving) {
        console.log('⏰ Background save triggered');
        const data = getCurrentEditData();
        persistenceManagerRef.current?.saveAuto(data);
        updateLocalState();
      }
    }, config?.autoSaveInterval || 30000);

    return () => {
      if (backgroundSaveTimerRef.current) {
        clearInterval(backgroundSaveTimerRef.current);
      }
    };
  }, [backgroundSaveEnabled, editStore.isDirty, persistenceState.isSaving, getCurrentEditData, updateLocalState, config?.autoSaveInterval]);

  // Subscribe to edit store changes for immediate dirty state sync
  useEffect(() => {
    // Fix #1: Use the Zustand store's subscribe method properly
    const unsubscribe = useEditStore.subscribe(
      // Fix #2: Properly type the state parameter
      (state: ReturnType<typeof useEditStore.getState>) => {
        // Update persistence state to reflect edit store dirty state
        setPersistenceState(prev => ({
          ...prev,
          isDirty: state.isDirty || state.autoSave?.isDirty || false,
          isSaving: state.isSaving || state.autoSave?.isSaving || false,
          lastSaved: state.lastSaved || state.autoSave?.lastSaved,
          saveError: state.autoSave?.error,
        }));
      }
    );

    return unsubscribe;
  }, []);

  // Initial load effect
  useEffect(() => {
    if (tokenId) {
      console.log('🔄 Initial load for token:', tokenId);
      loadFromServer(true);
    }
  }, [tokenId]); // Only run when tokenId changes

  // Return hook interface
  return {
    // State
    isDirty: persistenceState.isDirty || editStore.isDirty,
    isSaving: persistenceState.isSaving,
    isLoading: persistenceState.isLoading,
    lastSaved: persistenceState.lastSaved,
    lastLoaded: persistenceState.lastLoaded,
    saveError: persistenceState.saveError,
    loadError: persistenceState.loadError,
    metrics,
    hasActiveConflicts: getActiveConflicts().length > 0,
    
    // Actions
    saveManual,
    forceSave,
    loadFromServer,
    clearErrors,
    
    // Version Control
    canUndo: persistenceManagerRef.current?.canUndo() || false,
    canRedo: persistenceManagerRef.current?.canRedo() || false,
    undo,
    redo,
    
    // Conflict Resolution
    getActiveConflicts,
    resolveConflict,
    
    // Utilities
    exportData,
    getVersionHistory,
  };
}

/**
 * ===== SPECIALIZED HOOKS =====
 */

// Hook for auto-save only
export function useAutoSave(tokenId: string, config?: Partial<PersistenceConfig>) {
  const persistence = useStatePersistence({
    tokenId,
    autoSaveEnabled: true,
    backgroundSaveEnabled: true,
    config,
  });

  return {
    isDirty: persistence.isDirty,
    isSaving: persistence.isSaving,
    lastSaved: persistence.lastSaved,
    saveError: persistence.saveError,
    metrics: persistence.metrics,
    clearErrors: persistence.clearErrors,
  };
}

// Hook for manual saves only
export function useManualSave(tokenId: string, config?: Partial<PersistenceConfig>) {
  const persistence = useStatePersistence({
    tokenId,
    autoSaveEnabled: false,
    backgroundSaveEnabled: false,
    config,
  });

  return {
    isSaving: persistence.isSaving,
    saveError: persistence.saveError,
    saveManual: persistence.saveManual,
    forceSave: persistence.forceSave,
    clearErrors: persistence.clearErrors,
  };
}

// Hook for version control
export function useVersionControl(tokenId: string) {
  const persistence = useStatePersistence({
    tokenId,
    autoSaveEnabled: false,
    backgroundSaveEnabled: false,
  });

  return {
    canUndo: persistence.canUndo,
    canRedo: persistence.canRedo,
    undo: persistence.undo,
    redo: persistence.redo,
    getVersionHistory: persistence.getVersionHistory,
    exportData: persistence.exportData,
  };
}

// Hook for conflict resolution
export function useConflictResolution(tokenId: string) {
  const [conflicts, setConflicts] = useState<any[]>([]);

  const persistence = useStatePersistence({
    tokenId,
    autoSaveEnabled: false,
    backgroundSaveEnabled: false,
    onConflictDetected: (conflictData) => {
      console.log('🔄 Conflict detected in hook:', conflictData);
      setConflicts(persistence.getActiveConflicts());
    },
  });

  useEffect(() => {
    setConflicts(persistence.getActiveConflicts());
  }, [persistence]);

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    resolveConflict: persistence.resolveConflict,
    getActiveConflicts: persistence.getActiveConflicts,
  };
}

/**
 * ===== DEVELOPMENT UTILITIES =====
 */

if (process.env.NODE_ENV === 'development') {
  (window as any).__statePersistenceHookDebug = {
    getManagers: () => {
      return {
        persistence: getPersistenceManager(),
      };
    },
    simulateEditChange: () => {
      // Trigger a fake edit to test auto-save
      const editStore = useEditStore.getState();
      editStore.updateElementContent('test-section', 'test-element', 'Debug content change');
      console.log('🧪 Simulated edit change');
    },
    triggerManualSave: async () => {
      const manager = getPersistenceManager();
      const editStore = useEditStore.getState();
      const data = editStore.export();
      return await manager.saveManual(data, 'Debug manual save');
    },
    triggerBackgroundSave: async () => {
      const manager = getPersistenceManager();
      const editStore = useEditStore.getState();
      const data = editStore.export();
      manager.saveAuto(data);
      console.log('🧪 Triggered background save');
    },
  };

  console.log('🔧 State Persistence Hook debug utilities available at window.__statePersistenceHookDebug');
}