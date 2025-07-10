// hooks/editStore/persistenceActions.ts - Auto-save and persistence actions
import { autoSaveDraft, completeSaveDraft, backgroundSaveDraft } from '@/utils/autoSaveDraft';
import { getPersistenceManager } from '@/utils/statePersistence';
import type { EditStore, EditHistoryEntry } from '@/types/store';
import type { PersistenceActions } from '@/types/store';
/**
 * ===== PERSISTENCE ACTIONS CREATOR =====
 */




export function createPersistenceActions(set: any, get: any): PersistenceActions {

  const serializationActions = {
    // Serialization methods
    serialize: () => {
      const state = get();
      return {
        version: 1,
        timestamp: Date.now(),
        sections: state.sections,
        sectionLayouts: state.sectionLayouts,
        content: state.content,
        theme: state.theme,
        globalSettings: state.globalSettings,
        metadata: {
          title: state.title,
          tokenId: state.tokenId,
          lastUpdated: state.lastUpdated,
        },
      };
    },

    // Deserialization methods
    deserialize: (serializedData: any) => {
      set((state: EditStore) => {
        if (serializedData.sections) state.sections = serializedData.sections;
        if (serializedData.sectionLayouts) state.sectionLayouts = serializedData.sectionLayouts;
        if (serializedData.content) state.content = serializedData.content;
        if (serializedData.theme) state.theme = serializedData.theme;
        if (serializedData.globalSettings) state.globalSettings = serializedData.globalSettings;
        
        if (serializedData.metadata) {
          if (serializedData.metadata.title) state.title = serializedData.metadata.title;
          if (serializedData.metadata.tokenId) state.tokenId = serializedData.metadata.tokenId;
          if (serializedData.metadata.lastUpdated) state.lastUpdated = serializedData.metadata.lastUpdated;
        }
        
        state.persistence.isDirty = false;
        state.persistence.isLoading = false;
        state.persistence.lastSaved = Date.now();
      });
    },

    // Validation
    validateSerializedData: (data: any) => {
      const errors: string[] = [];
      
      if (!data || typeof data !== 'object') {
        errors.push('Data must be an object');
        return { isValid: false, errors };
      }

      if (typeof data.version !== 'number') {
        errors.push('Version must be a number');
      }

      if (!Array.isArray(data.sections)) {
        errors.push('Sections must be an array');
      }

      if (!data.content || typeof data.content !== 'object') {
        errors.push('Content must be an object');
      }

      return { isValid: errors.length === 0, errors };
    },

    // Enhanced save with serialization
    saveWithSerialization: async () => {
      const state = get();
      
      try {
        set((draft: EditStore) => {
          draft.persistence.isSaving = true;
          draft.persistence.saveError = undefined;
        });

        const serializedData = get().serialize();
        
        // Validate before saving
        const validation = get().validateSerializedData(serializedData);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Save via API
        const response = await fetch('/api/saveDraft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId: state.tokenId,
            finalContent: serializedData,
            saveMetadata: {
              source: 'edit',
              description: 'Serialized save',
              timestamp: Date.now(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Save failed: ${response.status}`);
        }

        const result = await response.json();
        
        set((draft: EditStore) => {
          draft.persistence.isSaving = false;
          draft.persistence.lastSaved = Date.now();
          draft.persistence.isDirty = false;
          draft.persistence.metrics.totalSaves += 1;
          draft.persistence.metrics.successfulSaves += 1;
          draft.version = result.version || draft.version + 1;
        });

        return { success: true, version: result.version };
      } catch (error) {
        set((draft: EditStore) => {
          draft.persistence.isSaving = false;
          draft.persistence.saveError = error instanceof Error ? error.message : 'Save failed';
          draft.persistence.metrics.failedSaves += 1;
        });
        throw error;
      }
    },

    // Enhanced load with deserialization
    loadWithDeserialization: async (tokenId: string) => {
      try {
        set((state: EditStore) => {
          state.persistence.isLoading = true;
          state.persistence.loadError = undefined;
        });

        const response = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
        
        if (!response.ok) {
          throw new Error(`Load failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Check if we have serialized content
        if (data.finalContent && data.finalContent.version) {
          const validation = get().validateSerializedData(data.finalContent);
          if (!validation.isValid) {
            console.warn('Deserialization validation failed:', validation.errors);
          }
          
          get().deserialize(data.finalContent);
        } else {
          // Fallback to standard loading
          await get().loadFromDraft(data);
        }

        set((state: EditStore) => {
          state.persistence.isLoading = false;
          state.persistence.metrics.totalLoads += 1;
        });

        return { success: true, data };
      } catch (error) {
        set((state: EditStore) => {
          state.persistence.isLoading = false;
          state.persistence.loadError = error instanceof Error ? error.message : 'Load failed';
        });
        throw error;
      }
    },

    // Get serialization status
    getSerializationStatus: () => {
      const state = get();
      const serialized = state.serialize();
      const size = new Blob([JSON.stringify(serialized)]).size;
      
      return {
        canSerialize: true,
        size: size > 1024 ? `${(size / 1024).toFixed(2)}KB` : `${size}B`,
        sectionsCount: serialized.sections?.length || 0,
        contentCount: Object.keys(serialized.content || {}).length,
        hasTheme: !!(serialized.theme && Object.keys(serialized.theme).length > 0),
        lastSerialized: serialized.timestamp,
      };
    },

    // Export for external use
    exportSerialized: () => {
      const serialized = get().serialize();
      return JSON.stringify(serialized, null, 2);
    },

    // Import from external source
    importSerialized: (jsonString: string) => {
      try {
        const data = JSON.parse(jsonString);
        const validation = get().validateSerializedData(data);
        
        if (!validation.isValid) {
          throw new Error(`Import validation failed: ${validation.errors.join(', ')}`);
        }
        
        get().deserialize(data);
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Import failed' 
        };
      }
    },
  };


  return {
    /**
     * ===== PERSISTENCE INITIALIZATION =====
     */
    
    initializePersistence: (tokenId: string, config?: any) =>
      set((state: EditStore) => {
        try {
          state.persistenceManager = getPersistenceManager({
            tokenId,
            autoSaveInterval: config?.autoSaveInterval || 30000,
            enableBackgroundSync: config?.enableBackgroundSync ?? true,
            enableConflictDetection: config?.enableConflictDetection ?? true,
            ...config,
          });
          
          state.tokenId = tokenId;
          state.persistence.autoSaveEnabled = true;
          state.persistence.backgroundSaveEnabled = config?.enableBackgroundSync ?? true;
          
          console.log('✅ Persistence initialized for token:', tokenId);
          
        } catch (error) {
          console.error('❌ Failed to initialize persistence:', error);
          state.persistence.loadError = error instanceof Error ? error.message : 'Initialization failed';
        }
      }),

      // Add all serialization actions here
    ...serializationActions,

    /**
     * ===== MANUAL SAVE OPERATIONS =====
     */
    
    /**
     * ===== MANUAL SAVE OPERATIONS =====
     */
    
    saveManual: async (description?: string) => {
      const state = get();
      
      set((state: EditStore) => {
        state.persistence.isSaving = true;
        state.persistence.saveError = undefined;
      });
      
      try {
        // Try serialized save first, fallback to regular save
        try {
          const result = await get().saveWithSerialization();
          console.log('✅ Manual save with serialization successful');
          return result;
        } catch (serializationError) {
          console.warn('Serialized save failed, falling back to regular save:', serializationError);
          
          // Fallback to regular save
          const startTime = Date.now();
          const result = await completeSaveDraft(state.tokenId, {
            description: description || 'Manual save',
            createSnapshot: true,
            forceOverwrite: false,
          });
          
          const saveTime = Date.now() - startTime;
          
          set((state: EditStore) => {
            state.persistence.isSaving = false;
            state.persistence.lastSaved = result.timestamp;
            state.persistence.isDirty = false;
            state.autoSave.isDirty = false;
            state.autoSave.lastSaved = result.timestamp;
            state.version += 1;
            
            // Update metrics
            state.persistence.metrics.totalSaves += 1;
            state.persistence.metrics.successfulSaves += 1;
            state.persistence.metrics.lastSaveTime = saveTime;
            state.persistence.metrics.averageSaveTime = 
              (state.persistence.metrics.averageSaveTime * (state.persistence.metrics.totalSaves - 1) + saveTime) / 
              state.persistence.metrics.totalSaves;
            
            // Update sync status
            state.persistence.syncStatus.localVersion = state.version;
            state.persistence.syncStatus.serverVersion = state.version;
            state.persistence.syncStatus.status = 'synced';
            state.persistence.syncStatus.lastSyncAt = result.timestamp;
            state.persistence.syncStatus.pendingChanges = 0;
          });
          
          return result;
        }
        
      } catch (error) {
        set((state: EditStore) => {
          state.persistence.isSaving = false;
          state.persistence.saveError = error instanceof Error ? error.message : 'Save failed';
          state.persistence.metrics.failedSaves += 1;
        });
        
        console.error('❌ Manual save failed:', error);
        throw error;
      }
    },
    
    saveDraft: async () => {
      const state = get();
      
      if (!state.persistence.isDirty && !state.autoSave.isDirty) {
        console.log('💾 No changes to save');
        return;
      }
      
      try {
        const result = await autoSaveDraft({
          tokenId: state.tokenId,
          inputText: state.onboardingData.oneLiner,
          validatedFields: state.onboardingData.validatedFields,
          featuresFromAI: state.onboardingData.featuresFromAI,
          hiddenInferredFields: state.onboardingData.hiddenInferredFields,
          confirmedFields: state.onboardingData.confirmedFields,
          title: state.title,
          includePageData: true,
          source: 'edit',
          localVersion: state.version,
          lastSaved: state.persistence.lastSaved,
        });
        
        if (result.success) {
          set((state: EditStore) => {
            state.persistence.lastSaved = result.timestamp;
            state.persistence.isDirty = false;
            state.autoSave.isDirty = false;
            state.autoSave.lastSaved = result.timestamp;
            state.persistence.saveError = undefined;
            
            // Update metrics
            state.persistence.metrics.totalSaves += 1;
            state.persistence.metrics.successfulSaves += 1;
            if (result.metrics) {
              state.persistence.metrics.lastSaveTime = result.metrics.saveTime;
            }
          });
        } else {
          throw new Error(result.error || 'Save failed');
        }
        
      } catch (error) {
        set((state: EditStore) => {
          state.persistence.saveError = error instanceof Error ? error.message : 'Save failed';
          state.persistence.metrics.failedSaves += 1;
        });
        throw error;
      }
    },
    
    forceSave: async (description?: string) => {
      const state = get();
      
      set((state: EditStore) => {
        state.persistence.isSaving = true;
        state.persistence.saveError = undefined;
      });
      
      try {
        const result = await completeSaveDraft(state.tokenId, {
          description: description || 'Force save',
          forceOverwrite: true,
        });
        
        set((state: EditStore) => {
          state.persistence.isSaving = false;
          state.persistence.lastSaved = result.timestamp;
          state.persistence.isDirty = false;
          state.autoSave.isDirty = false;
          state.version += 1;
          
          // Reset conflict status
          state.persistence.hasActiveConflicts = false;
          state.persistence.syncStatus.status = 'synced';
          state.persistence.syncStatus.localVersion = state.version;
          state.persistence.syncStatus.serverVersion = state.version;
        });
        
        console.log('✅ Force save successful');
        
        
      } catch (error) {
        set((state: EditStore) => {
          state.persistence.isSaving = false;
          state.persistence.saveError = error instanceof Error ? error.message : 'Force save failed';
        });
        throw error;
      }
    },

    /**
     * ===== LOAD OPERATIONS =====
     */
    
    // Enhanced load that tries deserialization first
    loadFromServer: async (useCache: boolean = true) => {
      const state = get();
      
      try {
        // Try enhanced load with deserialization first
        const result = await get().loadWithDeserialization(state.tokenId);
        console.log('✅ Loaded with deserialization successful');
        return result;
      } catch (deserializationError) {
        console.warn('Deserialized load failed, falling back to regular load:', deserializationError);
        
        // Fallback to regular load
        set((state: EditStore) => {
          state.persistence.isLoading = true;
          state.persistence.loadError = undefined;
        });
        
        try {
          const response = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(state.tokenId)}`);
          
          if (!response.ok) {
            throw new Error(`Failed to load: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Use the existing loadFromDraft method
          await get().loadFromDraft(data);
          
          set((state: EditStore) => {
            state.persistence.isLoading = false;
            state.persistence.lastLoaded = Date.now();
            state.persistence.metrics.totalLoads += 1;
            
            if (useCache) {
              state.persistence.metrics.cacheHits += 1;
            } else {
              state.persistence.metrics.cacheMisses += 1;
            }
            
            // Update sync status
            state.persistence.syncStatus.status = 'synced';
            state.persistence.syncStatus.lastSyncAt = Date.now();
          });
          
          console.log('✅ Loaded from server successfully (fallback)');
          
        } catch (error) {
          set((state: EditStore) => {
            state.persistence.isLoading = false;
            state.persistence.loadError = error instanceof Error ? error.message : 'Load failed';
          });
          
          console.error('❌ Failed to load from server:', error);
          throw error;
        }
      }
    },

    /**
     * ===== VERSION CONTROL =====
     */
    
    createSnapshot: (description: string) => {
      const state = get();
      const snapshotId = `snapshot-${Date.now()}`;
      
      const snapshot = {
        id: snapshotId,
        description,
        timestamp: Date.now(),
        version: state.version,
        data: {
          sections: [...state.sections],
          sectionLayouts: { ...state.sectionLayouts },
          content: JSON.parse(JSON.stringify(state.content)),
          theme: JSON.parse(JSON.stringify(state.theme)),
          onboardingData: JSON.parse(JSON.stringify(state.onboardingData)),
        },
      };
      
      // Store snapshot in history
      set((state: EditStore) => {
        state.history.undoStack.push({
          type: 'section',
          description: `Snapshot: ${description}`,
          timestamp: Date.now(),
          beforeState: null,
          afterState: snapshot,
        });
      });
      
      console.log('📸 Snapshot created:', description);
      return snapshotId;
    },
    
    undoToSnapshot: () => {
      // Find the last snapshot in history
      const state = get();
      const snapshots = state.history.undoStack.filter((entry: EditHistoryEntry) => 
  entry.description.startsWith('Snapshot:')
);
      
      if (snapshots.length === 0) {
        console.warn('⚠️ No snapshots available');
        return;
      }
      
      const lastSnapshot = snapshots[snapshots.length - 1];
      if (lastSnapshot.afterState && lastSnapshot.afterState.data) {
        const snapshotData = lastSnapshot.afterState.data;
        
        set((state: EditStore) => {
          state.sections = snapshotData.sections;
          state.sectionLayouts = snapshotData.sectionLayouts;
          state.content = snapshotData.content;
          state.theme = snapshotData.theme;
          state.onboardingData = snapshotData.onboardingData;
          state.version = lastSnapshot.afterState.version;
          state.autoSave.isDirty = true;
          state.persistence.isDirty = true;
        });
        
        console.log('↩️ Restored to snapshot:', lastSnapshot.afterState.description);
      }
    },
    
    redoToSnapshot: () => {
      // Implementation for redo to snapshot
      console.log('🔄 Redo to snapshot not implemented yet');
    },
    
    getVersionHistory: () => {
      const state = get();
      return state.history.undoStack
       .filter((entry: EditHistoryEntry) => entry.description.startsWith('Snapshot:'))
        .map((entry: EditHistoryEntry) => ({
  id: entry.afterState?.id,
  description: entry.afterState?.description,
  timestamp: entry.timestamp,
  version: entry.afterState?.version,
}))
    },

    /**
     * ===== CONFLICT RESOLUTION =====
     */
    
    getActiveConflicts: () => {
      const state = get();
      
      if (!state.persistence.hasActiveConflicts) {
        return [];
      }
      
      // Return mock conflicts for now - would be populated by conflict detection
      return [
        {
          id: 'conflict-1',
          type: 'content',
          sectionId: 'hero',
          elementKey: 'headline',
          localValue: 'Local headline',
          serverValue: 'Server headline',
          timestamp: Date.now(),
        },
      ];
    },
    
    resolveConflict: async (
      conflictId: string, 
      strategy: 'local' | 'server' | 'merge' | 'manual', 
      resolutions?: Record<string, any>
    ) => {
      set((state: EditStore) => {
        state.persistence.isLoading = true;
      });
      
      try {
        // Mock conflict resolution - would integrate with real conflict resolution
        switch (strategy) {
          case 'local':
            console.log('✅ Resolved conflict with local version');
            break;
          case 'server':
            console.log('✅ Resolved conflict with server version');
            break;
          case 'merge':
            console.log('✅ Resolved conflict with merge');
            break;
          case 'manual':
            console.log('✅ Resolved conflict manually');
            break;
        }
        
        set((state: EditStore) => {
          state.persistence.isLoading = false;
          state.persistence.hasActiveConflicts = false;
          state.persistence.metrics.conflictsResolved += 1;
          state.persistence.syncStatus.status = 'synced';
        });
        
      } catch (error) {
        set((state: EditStore) => {
          state.persistence.isLoading = false;
          state.persistence.saveError = error instanceof Error ? error.message : 'Conflict resolution failed';
        });
        throw error;
      }
    },

    /**
     * ===== CONFIGURATION =====
     */
    
    enableAutoSave: (enabled: boolean) =>
      set((state: EditStore) => {
        state.persistence.autoSaveEnabled = enabled;
        console.log(`${enabled ? '✅' : '❌'} Auto-save ${enabled ? 'enabled' : 'disabled'}`);
      }),
    
    enableBackgroundSync: (enabled: boolean) =>
      set((state: EditStore) => {
        state.persistence.backgroundSaveEnabled = enabled;
        console.log(`${enabled ? '✅' : '❌'} Background sync ${enabled ? 'enabled' : 'disabled'}`);
      }),
    
    setPersistenceConfig: (config: any) =>
      set((state: EditStore) => {
        if (state.persistenceManager) {
          // Update persistence manager config
          Object.assign(state.persistenceManager, config);
        }
      }),

    /**
     * ===== UTILITIES =====
     */
    
    clearPersistenceErrors: () =>
      set((state: EditStore) => {
        state.persistence.saveError = undefined;
        state.persistence.loadError = undefined;
        state.autoSave.error = undefined;
      }),
    
    exportPersistenceData: () => {
      const state = get();
      
      return {
        tokenId: state.tokenId,
        version: state.version,
        lastSaved: state.persistence.lastSaved,
        metrics: state.persistence.metrics,
        syncStatus: state.persistence.syncStatus,
        exportedAt: Date.now(),
        data: {
          sections: state.sections,
          sectionLayouts: state.sectionLayouts,
          content: state.content,
          theme: state.theme,
          onboardingData: state.onboardingData,
        },
      };
    },
    
    getPersistenceMetrics: () => {
      const state = get();
      return {
        ...state.persistence.metrics,
        syncStatus: state.persistence.syncStatus,
        isDirty: state.persistence.isDirty,
        autoSaveEnabled: state.persistence.autoSaveEnabled,
        backgroundSaveEnabled: state.persistence.backgroundSaveEnabled,
        hasActiveConflicts: state.persistence.hasActiveConflicts,
        retryCount: state.persistence.retryCount,
      };
    },
    
    validateDataIntegrity: async () => {
      const state = get();
      let isValid = true;
      const issues: string[] = [];
      
      try {
        // Check sections consistency
        state.sections.forEach((sectionId: string) => {
          if (!state.sectionLayouts[sectionId]) {
            issues.push(`Section ${sectionId} missing layout`);
            isValid = false;
          }
          if (!state.content[sectionId]) {
            issues.push(`Section ${sectionId} missing content`);
            isValid = false;
          }
        });
        
        // Check content consistency
        Object.keys(state.content).forEach(sectionId => {
          if (!state.sections.includes(sectionId)) {
            issues.push(`Content for ${sectionId} exists but section not in sections array`);
            isValid = false;
          }
        });
        
        // Check selected element consistency
        if (state.selectedElement) {
          const { sectionId, elementKey } = state.selectedElement;
          if (!state.content[sectionId]?.elements[elementKey]) {
            issues.push(`Selected element ${sectionId}.${elementKey} does not exist`);
            isValid = false;
          }
        }
        
        // Check onboarding data
        if (!state.tokenId) {
          issues.push('Missing tokenId');
          isValid = false;
        }
        
        if (issues.length > 0) {
          console.warn('🔍 Data integrity issues found:', issues);
        } else {
          console.log('✅ Data integrity validation passed');
        }
        
        return isValid;
        
      } catch (error) {
        console.error('❌ Data integrity validation failed:', error);
        return false;
      }
    },

    /**
     * ===== BACKGROUND OPERATIONS =====
     */
    
    startBackgroundSync: () => {
      const state = get();
      
      if (!state.persistence.backgroundSaveEnabled) {
        console.log('⚠️ Background sync is disabled');
        return;
      }
      
      // Start background auto-save interval
      const interval = setInterval(async () => {
        const currentState = get();
        
        if (currentState.persistence.isDirty || currentState.autoSave.isDirty) {
          try {
            await backgroundSaveDraft(currentState.tokenId);
            console.log('🔄 Background save completed');
          } catch (error) {
            console.warn('⚠️ Background save failed:', error);
          }
        }
      }, 30000); // Every 30 seconds
      
      // Store interval ID for cleanup
      (window as any).__editStoreBackgroundSync = interval;
      
      console.log('🔄 Background sync started');
    },
    
    stopBackgroundSync: () => {
      const interval = (window as any).__editStoreBackgroundSync;
      if (interval) {
        clearInterval(interval);
        delete (window as any).__editStoreBackgroundSync;
        console.log('⏹️ Background sync stopped');
      }
    },

    /**
     * ===== RETRY LOGIC =====
     */
    
    retryFailedSave: async () => {
      const state = get();
      
      if (!state.persistence.saveError) {
        console.log('💾 No failed save to retry');
        return;
      }
      
      set((state: EditStore) => {
        state.persistence.retryCount += 1;
      });
      
      try {
        console.log(`🔄 Retrying save (attempt ${state.persistence.retryCount})`);
        await get().saveDraft();
        
        set((state: EditStore) => {
          state.persistence.retryCount = 0;
        });
        
      } catch (error) {
        if (state.persistence.retryCount >= 3) {
          console.error('❌ Max retry attempts reached');
          set((state: EditStore) => {
            state.persistence.saveError = 'Max retry attempts reached. Please try manual save.';
          });
        } else {
          // Exponential backoff
          const delay = Math.pow(2, state.persistence.retryCount) * 1000;
          setTimeout(() => {
            get().retryFailedSave();
          }, delay);
        }
      }
    },


    
    /**
     * ===== CLEANUP =====
     */
    
    cleanup: () => {
      // Stop background sync
      get().stopBackgroundSync();
      
      // Clear any pending timeouts
      if ((window as any).__editStoreAutoSave) {
        clearTimeout((window as any).__editStoreAutoSave);
        delete (window as any).__editStoreAutoSave;
      }
      
      // Reset persistence state
      set((state: EditStore) => {
        state.persistence.isDirty = false;
        state.persistence.isSaving = false;
        state.persistence.isLoading = false;
        state.persistence.saveError = undefined;
        state.persistence.loadError = undefined;
        state.persistence.hasActiveConflicts = false;
        state.persistence.retryCount = 0;
      });
      
      console.log('🧹 Persistence cleanup completed');
    },

    /**
     * ===== MIGRATION HELPERS =====
     */
    
    migrateFromLegacyFormat: (legacyData: any) => {
      try {
        // Handle migration from old PageStore format
        if (legacyData.layout && legacyData.content) {
          set((state: EditStore) => {
            // Migrate layout
            if (legacyData.layout.sections) {
              state.sections = legacyData.layout.sections;
            }
            if (legacyData.layout.sectionLayouts) {
              state.sectionLayouts = legacyData.layout.sectionLayouts;
            }
            if (legacyData.layout.theme) {
              state.theme = { ...state.theme, ...legacyData.layout.theme };
            }
            
            // Migrate content
            Object.entries(legacyData.content).forEach(([sectionId, sectionData]: [string, any]) => {
              if (sectionData && typeof sectionData === 'object') {
                state.content[sectionId] = {
                  id: sectionId,
                  layout: sectionData.layout || 'default',
                  elements: {},
                  aiMetadata: {
                    aiGenerated: sectionData.aiGenerated || false,
                    lastGenerated: sectionData.lastGenerated,
                    isCustomized: sectionData.isCustomized || false,
                    aiGeneratedElements: sectionData.aiGeneratedElements || [],
                  },
                  editMetadata: {
                    isSelected: false,
                    isEditing: false,
                    isDeletable: true,
                    isMovable: true,
                    isDuplicable: true,
                    validationStatus: {
                      isValid: true,
                      errors: [],
                      warnings: [],
                      missingRequired: [],
                      lastValidated: Date.now(),
                    },
                    completionPercentage: 100,
                  },
                };
                
                // Migrate elements
                if (sectionData.elements) {
                  Object.entries(sectionData.elements).forEach(([elementKey, elementValue]: [string, any]) => {
                    state.content[sectionId].elements[elementKey] = {
                      content: elementValue,
                      type: 'text', // Will be inferred
                      isEditable: true,
                      editMode: 'inline',
                    };
                  });
                }
              }
            });
            
            // Migrate meta data
            if (legacyData.meta) {
              state.id = legacyData.meta.id || state.id;
              state.title = legacyData.meta.title || state.title;
              state.slug = legacyData.meta.slug || state.slug;
              state.description = legacyData.meta.description || state.description;
              state.version = legacyData.meta.version || state.version;
              
              if (legacyData.meta.onboardingData) {
                state.onboardingData = {
                  ...state.onboardingData,
                  ...legacyData.meta.onboardingData,
                };
              }
            }
          });
          
          console.log('✅ Legacy data migration completed');
        }
        
      } catch (error) {
        console.error('❌ Legacy data migration failed:', error);
        throw error;
      }
    },

    /**
     * ===== BATCH OPERATIONS =====
     */
    
    batchSave: async (operations: Array<{ type: string; data: any }>) => {
      const state = get();
      
      set((state: EditStore) => {
        state.persistence.isSaving = true;
      });
      
      try {
        const results = [];
        
        for (const operation of operations) {
          switch (operation.type) {
            case 'save':
              const result = await get().saveDraft();
              results.push(result);
              break;
            case 'snapshot':
              const snapshotId = get().createSnapshot(operation.data.description);
              results.push({ snapshotId });
              break;
            default:
              console.warn('Unknown batch operation:', operation.type);
          }
        }
        
        set((state: EditStore) => {
          state.persistence.isSaving = false;
        });
        
        console.log('✅ Batch operations completed:', results.length);
        return results;
        
      } catch (error) {
        set((state: EditStore) => {
          state.persistence.isSaving = false;
          state.persistence.saveError = error instanceof Error ? error.message : 'Batch operation failed';
        });
        throw error;
      }
    },
  };
}