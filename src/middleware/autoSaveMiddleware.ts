// middleware/autoSaveMiddleware.ts - Core Auto-Save Middleware System
import { StateCreator } from 'zustand';
import { debounce } from 'lodash';
import { autoSaveDraft } from '@/utils/autoSaveDraft';
import { logger } from '@/lib/logger';

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

export interface AutoSaveActions {
  // Core auto-save actions
  triggerAutoSave: () => void;
  forceSave: () => Promise<void>;
  clearAutoSaveError: () => void;
  
  // Change tracking
  trackChange: (change: Omit<ChangeEvent, 'id' | 'timestamp'>) => void;
  clearQueuedChanges: () => void;
  
  // Conflict resolution
  resolveConflict: (strategy: 'manual' | 'auto-merge' | 'latest-wins', data?: any) => void;
  
  // Performance monitoring
  getPerformanceStats: () => AutoSaveState['performance'];
  resetPerformanceStats: () => void;
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

export interface AutoSaveMiddlewareState extends AutoSaveState, AutoSaveActions {}

/**
 * ===== DEFAULT CONFIGURATION =====
 */

const defaultConfig: AutoSaveConfig = {
  debounceMs: 500,
  maxQueueSize: 100,
  saveTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  conflictDetection: true,
  enableOptimisticUpdates: true,
  performanceTracking: true,
};

/**
 * ===== UTILITY FUNCTIONS =====
 */

const generateChangeId = (): string => `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const calculateAverageTime = (currentAverage: number, newTime: number, count: number): number => {
  return (currentAverage * (count - 1) + newTime) / count;
};

const isSignificantChange = (change: ChangeEvent): boolean => {
  // Skip tracking minor changes to reduce noise
  if (change.type === 'meta' && change.field === 'lastUpdated') return false;
  if (change.oldValue === change.newValue) return false;
  if (typeof change.newValue === 'string' && change.newValue.trim() === '') return false;
  
  return true;
};

const detectConflict = (localChanges: ChangeEvent[], serverVersion: any): boolean => {
  // Simplified conflict detection - in real implementation, this would be more sophisticated
  // Check if server version has changed since our last save
  const lastSaveTime = Math.max(...localChanges.map(c => c.timestamp), 0);
  const serverLastModified = new Date(serverVersion?.lastUpdated || 0).getTime();
  
  return serverLastModified > lastSaveTime;
};

/**
 * ===== CORE AUTO-SAVE MIDDLEWARE =====
 */

export const autoSaveMiddleware = <T extends Record<string, any>>(
  config: Partial<AutoSaveConfig> = {}
) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  return (
    stateCreator: StateCreator<T & AutoSaveMiddlewareState, [["zustand/immer", never]], [], T & AutoSaveMiddlewareState>
  ): StateCreator<T & AutoSaveMiddlewareState, [["zustand/immer", never]], [], T & AutoSaveMiddlewareState> => {
    
    return (set, get, api) => {
      // Create debounced save function
      const debouncedSave = debounce(async () => {
        const state = get();
        
        if (!state.isDirty || state.isSaving) {
          return;
        }
        
        await performSave(state, set, get);
      }, finalConfig.debounceMs);
      
      // Perform the actual save operation
      const performSave = async (
        state: T & AutoSaveMiddlewareState,
        setState: typeof set,
        getState: typeof get
      ) => {
        const saveStartTime = Date.now();
        let saveSuccessful = false;
        
        try {
          setState((draft) => {
            draft.isSaving = true;
            draft.saveError = undefined;
          });
          
          // Prepare save payload from state
          const savePayload = prepareSavePayload(state);
          
          // Detect conflicts if enabled
          if (finalConfig.conflictDetection && state.queuedChanges.length > 0) {
            try {
              // Check server version for conflicts
              const serverResponse = await fetch(`/api/loadDraft?tokenId=${savePayload.tokenId}`);
              if (serverResponse.ok) {
                const serverData = await serverResponse.json();
                const hasConflict = detectConflict(state.queuedChanges, serverData);
                
                if (hasConflict) {
                  setState((draft) => {
                    draft.conflictResolution.hasConflict = true;
                    draft.conflictResolution.conflictData = serverData;
                    draft.isSaving = false;
                  });
                  
                  logger.warn('🔄 Auto-save conflict detected - manual resolution required');
                  return;
                }
              }
            } catch (conflictError) {
              logger.warn('⚠️ Conflict detection failed, proceeding with save:', conflictError);
            }
          }
          
          // Perform the save operation
          await autoSaveDraft(savePayload);
          saveSuccessful = true;
          
          // Update state on successful save
          const saveEndTime = Date.now();
          const saveTime = saveEndTime - saveStartTime;
          
          setState((draft) => {
            draft.isSaving = false;
            draft.isDirty = false;
            draft.lastSaved = saveEndTime;
            draft.saveError = undefined;
            draft.queuedChanges = [];
            draft.conflictResolution.hasConflict = false;
            draft.conflictResolution.conflictData = undefined;
            
            // Update performance stats
            if (finalConfig.performanceTracking) {
              // Initialize performance object if it doesn't exist
              if (!draft.performance) {
                draft.performance = {
                  saveCount: 0,
                  averageSaveTime: 0,
                  lastSaveTime: 0,
                  failedSaves: 0,
                };
              }
              draft.performance.saveCount += 1;
              draft.performance.lastSaveTime = saveTime;
              draft.performance.averageSaveTime = calculateAverageTime(
                draft.performance.averageSaveTime,
                saveTime,
                draft.performance.saveCount
              );
            }
          });
          
          logger.dev('✅ Auto-save successful:', {
            saveTime: `${saveTime}ms`,
            changesCount: state.queuedChanges.length,
            totalSaves: (state.performance?.saveCount || 0) + 1,
          });
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Auto-save failed';
          
          setState((draft) => {
            draft.isSaving = false;
            draft.saveError = errorMessage;
            
            if (finalConfig.performanceTracking) {
              // Initialize performance object if it doesn't exist
              if (!draft.performance) {
                draft.performance = {
                  saveCount: 0,
                  averageSaveTime: 0,
                  lastSaveTime: 0,
                  failedSaves: 0,
                };
              }
              draft.performance.failedSaves += 1;
            }
          });
          
          logger.error('❌ Auto-save failed:', error);
          
          // Retry logic for failed saves
          if ((state.performance?.failedSaves || 0) < finalConfig.retryAttempts) {
            logger.dev(`🔄 Retrying auto-save in ${finalConfig.retryDelay}ms...`);
            
            setTimeout(() => {
              if (get().isDirty && !get().isSaving) {
                performSave(get(), setState, getState);
              }
            }, finalConfig.retryDelay);
          }
        }
      };
      
      // Prepare save payload from current state
      const prepareSavePayload = (state: T & AutoSaveMiddlewareState): Parameters<typeof autoSaveDraft>[0] => {
        // Extract data from state - this will be customized based on your store structure
        const basePayload: Parameters<typeof autoSaveDraft>[0] = {
          tokenId: (state as any).tokenId || (state as any).meta?.id || '',
          includePageData: true,
        };
        
        // Add onboarding data if available
        if ((state as any).onboardingData) {
          const onboarding = (state as any).onboardingData;
          Object.assign(basePayload, {
            inputText: onboarding.oneLiner,
            validatedFields: onboarding.validatedFields,
            featuresFromAI: onboarding.featuresFromAI,
            hiddenInferredFields: onboarding.hiddenInferredFields,
            confirmedFields: onboarding.confirmedFields,
          });
        }
        
        // Add title if available
        if ((state as any).title) {
          basePayload.title = (state as any).title;
        }
        
        return basePayload;
      };
      
      // Create the enhanced state with auto-save functionality
      const enhancedState = stateCreator(set, get, api);
      
      // Add auto-save state and actions
      const autoSaveState: AutoSaveMiddlewareState = {
        // Auto-save state
        isDirty: false,
        isSaving: false,
        lastSaved: undefined,
        saveError: undefined,
        queuedChanges: [],
        conflictResolution: {
          hasConflict: false,
          conflictData: undefined,
          resolveStrategy: 'manual',
        },
        performance: {
          saveCount: 0,
          averageSaveTime: 0,
          lastSaveTime: 0,
          failedSaves: 0,
        },
        
        // Auto-save actions
        triggerAutoSave: () => {
          const state = get();
          if (state.isDirty && !state.isSaving) {
            debouncedSave();
          }
        },
        
        forceSave: async () => {
          // Cancel any pending debounced save
          debouncedSave.cancel();
          
          const state = get();
          if (state.isDirty && !state.isSaving) {
            await performSave(state, set, get);
          }
        },
        
        clearAutoSaveError: () => {
          set((state) => {
            state.saveError = undefined;
          });
        },
        
        trackChange: (change: Omit<ChangeEvent, 'id' | 'timestamp'>) => {
          const fullChange: ChangeEvent = {
            ...change,
            id: generateChangeId(),
            timestamp: Date.now(),
          };
          
          // Only track significant changes
          if (!isSignificantChange(fullChange)) {
            return;
          }
          
          set((state) => {
            // Add to queue
            state.queuedChanges.push(fullChange);
            
            // Limit queue size
            if (state.queuedChanges.length > finalConfig.maxQueueSize) {
              state.queuedChanges = state.queuedChanges.slice(-finalConfig.maxQueueSize);
            }
            
            // Mark as dirty
            state.isDirty = true;
          });
          
          // Trigger auto-save
          if (finalConfig.enableOptimisticUpdates) {
            debouncedSave();
          }
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
            
            if (strategy === 'latest-wins') {
              // Keep local changes, ignore server
              state.conflictResolution.hasConflict = false;
              state.conflictResolution.conflictData = undefined;
              
              // Trigger save to overwrite server
              setTimeout(() => get().forceSave(), 100);
              
            } else if (strategy === 'auto-merge' && data) {
              // Merge server data with local changes
              // This would be implemented based on your specific merge logic
              logger.dev('🔀 Auto-merging conflicts:', { localChanges: state.queuedChanges, serverData: data });
              
              state.conflictResolution.hasConflict = false;
              state.conflictResolution.conflictData = undefined;
              
              // Trigger save after merge
              setTimeout(() => get().forceSave(), 100);
              
            } else if (strategy === 'manual') {
              // Keep conflict state for manual resolution
              logger.dev('🔧 Manual conflict resolution required');
            }
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
      
      // Merge enhanced state with auto-save functionality
      return {
        ...enhancedState,
        ...autoSaveState,
      };
    };
  };
};

/**
 * ===== ENHANCED CHANGE TRACKING UTILITIES =====
 */

export const createChangeTracker = <T extends AutoSaveMiddlewareState>(getState: () => T) => {
  return {
    // Track content changes
    trackContentChange: (sectionId: string, elementKey: string, oldValue: any, newValue: any) => {
      getState().trackChange({
        type: 'content',
        sectionId,
        elementKey,
        oldValue,
        newValue,
        source: 'user',
      });
    },
    
    // Track layout changes
    trackLayoutChange: (field: string, oldValue: any, newValue: any) => {
      getState().trackChange({
        type: 'layout',
        field,
        oldValue,
        newValue,
        source: 'user',
      });
    },
    
    // Track theme changes
    trackThemeChange: (field: string, oldValue: any, newValue: any) => {
      getState().trackChange({
        type: 'theme',
        field,
        oldValue,
        newValue,
        source: 'user',
      });
    },
    
    // Track AI-generated changes
    trackAIChange: (type: ChangeEvent['type'], sectionId?: string, data?: any) => {
      getState().trackChange({
        type,
        sectionId,
        oldValue: null,
        newValue: data,
        source: 'ai',
      });
    },
  };
};

/**
 * ===== DEVELOPMENT UTILITIES =====
 */

if (process.env.NODE_ENV === 'development') {
  // Global auto-save debugging utilities
  (window as any).__autoSaveDebug = {
    getQueuedChanges: () => (window as any).__store?.getState?.()?.queuedChanges || [],
    getPerformanceStats: () => (window as any).__store?.getState?.()?.performance || {},
    triggerSave: () => (window as any).__store?.getState?.()?.forceSave?.(),
    clearQueue: () => (window as any).__store?.getState?.()?.clearQueuedChanges?.(),
    simulateConflict: () => {
      const state = (window as any).__store?.getState?.();
      if (state?.resolveConflict) {
        state.resolveConflict('manual', { mockConflictData: true });
      }
    },
  };
  
  logger.dev('🔧 Auto-save debug utilities available at window.__autoSaveDebug');
}