// utils/versionManager.ts - Version Control & Conflict Resolution System
import type { ChangeEvent } from '@/middleware/autoSaveMiddleware';

import { logger } from '@/lib/logger';
/**
 * ===== VERSION MANAGEMENT TYPES =====
 */

export interface VersionSnapshot {
  id: string;
  timestamp: number;
  version: number;
  description: string;
  data: any; // The complete state at this point
  changes: ChangeEvent[];
  metadata: {
    userId?: string;
    source: 'user' | 'ai' | 'system' | 'auto-save';
    tags?: string[];
    size: number; // Snapshot size in bytes
  };
}

export interface VersionHistory {
  snapshots: VersionSnapshot[];
  currentIndex: number;
  maxSize: number;
  compressionEnabled: boolean;
  autoSnapshotInterval: number;
}

export interface ConflictResolution {
  conflictId: string;
  timestamp: number;
  localVersion: VersionSnapshot;
  serverVersion: any;
  conflictType: 'content' | 'structure' | 'theme' | 'mixed';
  conflictedFields: ConflictField[];
  resolutionStrategy?: 'local' | 'server' | 'merge' | 'manual';
  isResolved: boolean;
}

export interface ConflictField {
  path: string; // e.g., "content.hero.headline" or "theme.colors.accent"
  localValue: any;
  serverValue: any;
  conflictType: 'modified' | 'deleted' | 'added';
  canAutoMerge: boolean;
  mergeStrategy?: 'prefer-local' | 'prefer-server' | 'concat' | 'manual';
}

export interface VersionManagerConfig {
  maxSnapshots: number;
  compressionThreshold: number; // Compress snapshots older than X minutes
  autoSnapshotInterval: number; // Auto-snapshot every X changes
  conflictDetectionDepth: number; // How deep to check for conflicts
  enableCompression: boolean;
  enableIncrementalSnapshots: boolean; // Only store diffs instead of full state
}

/**
 * ===== UTILITY FUNCTIONS =====
 */

const generateId = (): string => `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const calculateSize = (data: any): number => {
  return new Blob([JSON.stringify(data)]).size;
};

const compressSnapshot = (snapshot: VersionSnapshot): VersionSnapshot => {
  // Simple compression - in production, you might use a proper compression library
  const compressedData = JSON.stringify(snapshot.data);
  return {
    ...snapshot,
    data: compressedData,
    metadata: {
      ...snapshot.metadata,
      size: compressedData.length,
    },
  };
};

const decompressSnapshot = (snapshot: VersionSnapshot): VersionSnapshot => {
  if (typeof snapshot.data === 'string') {
    try {
      return {
        ...snapshot,
        data: JSON.parse(snapshot.data),
      };
    } catch (error) {
      logger.error('Failed to decompress snapshot:', error);
      return snapshot;
    }
  }
  return snapshot;
};

/**
 * ===== DEEP OBJECT COMPARISON & CONFLICT DETECTION =====
 */

const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  }
  
  return false;
};

const detectConflicts = (localData: any, serverData: any, path: string = ''): ConflictField[] => {
  const conflicts: ConflictField[] = [];
  
  // Handle null/undefined cases
  if (localData == null && serverData == null) return conflicts;
  if (localData == null || serverData == null) {
    conflicts.push({
      path,
      localValue: localData,
      serverValue: serverData,
      conflictType: localData == null ? 'deleted' : 'added',
      canAutoMerge: false,
    });
    return conflicts;
  }
  
  // Handle primitive values
  if (typeof localData !== 'object' || typeof serverData !== 'object') {
    if (localData !== serverData) {
      conflicts.push({
        path,
        localValue: localData,
        serverValue: serverData,
        conflictType: 'modified',
        canAutoMerge: canAutoMergeValue(localData, serverData),
        mergeStrategy: suggestMergeStrategy(localData, serverData),
      });
    }
    return conflicts;
  }
  
  // Handle objects/arrays
  const allKeys = new Set([...Object.keys(localData), ...Object.keys(serverData)]);
  
  for (const key of allKeys) {
    const newPath = path ? `${path}.${key}` : key;
    const localValue = localData[key];
    const serverValue = serverData[key];
    
    if (!(key in localData)) {
      // Key added on server
      conflicts.push({
        path: newPath,
        localValue: undefined,
        serverValue: serverValue,
        conflictType: 'added',
        canAutoMerge: true,
        mergeStrategy: 'prefer-server',
      });
    } else if (!(key in serverData)) {
      // Key deleted on server
      conflicts.push({
        path: newPath,
        localValue: localValue,
        serverValue: undefined,
        conflictType: 'deleted',
        canAutoMerge: false,
      });
    } else {
      // Key exists in both, check for conflicts recursively
      conflicts.push(...detectConflicts(localValue, serverValue, newPath));
    }
  }
  
  return conflicts;
};

const canAutoMergeValue = (localValue: any, serverValue: any): boolean => {
  // Simple auto-merge rules - can be extended
  if (typeof localValue === 'string' && typeof serverValue === 'string') {
    // Can merge strings if they're similar or one is empty
    return localValue.trim() === '' || serverValue.trim() === '' || 
           localValue.includes(serverValue) || serverValue.includes(localValue);
  }
  
  if (Array.isArray(localValue) && Array.isArray(serverValue)) {
    // Can merge arrays by concatenation
    return true;
  }
  
  if (typeof localValue === 'number' && typeof serverValue === 'number') {
    // Can merge numbers if they're close
    return Math.abs(localValue - serverValue) < 0.1;
  }
  
  return false;
};

const suggestMergeStrategy = (localValue: any, serverValue: any): ConflictField['mergeStrategy'] => {
  if (typeof localValue === 'string' && typeof serverValue === 'string') {
    if (localValue.trim() === '') return 'prefer-server';
    if (serverValue.trim() === '') return 'prefer-local';
    if (localValue.length > serverValue.length) return 'prefer-local';
    return 'prefer-server';
  }
  
  if (Array.isArray(localValue) && Array.isArray(serverValue)) {
    return 'concat';
  }
  
  return 'manual';
};

/**
 * ===== CORE VERSION MANAGER CLASS =====
 */

export class VersionManager {
  private history: VersionHistory;
  private config: VersionManagerConfig;
  private changeCounter: number = 0;
  private activeConflicts: Map<string, ConflictResolution> = new Map();

  constructor(config: Partial<VersionManagerConfig> = {}) {
    this.config = {
      maxSnapshots: 50,
      compressionThreshold: 30, // 30 minutes
      autoSnapshotInterval: 5, // Every 5 changes
      conflictDetectionDepth: 5,
      enableCompression: true,
      enableIncrementalSnapshots: false,
      ...config,
    };

    this.history = {
      snapshots: [],
      currentIndex: -1,
      maxSize: this.config.maxSnapshots,
      compressionEnabled: this.config.enableCompression,
      autoSnapshotInterval: this.config.autoSnapshotInterval,
    };
  }

  /**
   * ===== SNAPSHOT MANAGEMENT =====
   */

  createSnapshot(
    data: any,
    description: string,
    source: VersionSnapshot['metadata']['source'] = 'user',
    changes: ChangeEvent[] = []
  ): string {
    const snapshot: VersionSnapshot = {
      id: generateId(),
      timestamp: Date.now(),
      version: this.history.snapshots.length + 1,
      description,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      changes: [...changes],
      metadata: {
        source,
        size: calculateSize(data),
        tags: this.generateTags(description, source),
      },
    };

    // Add snapshot to history
    this.addSnapshotToHistory(snapshot);

    // Auto-compress old snapshots
    if (this.config.enableCompression) {
      this.compressOldSnapshots();
    }

    logger.debug('📸 Version snapshot created:', {
      id: snapshot.id,
      version: snapshot.version,
      description: snapshot.description,
      size: `${(snapshot.metadata.size / 1024).toFixed(2)}KB`,
      source: snapshot.metadata.source,
    });

    return snapshot.id;
  }

  private addSnapshotToHistory(snapshot: VersionSnapshot): void {
    // If we're not at the end of history, remove future snapshots
    if (this.history.currentIndex < this.history.snapshots.length - 1) {
      this.history.snapshots = this.history.snapshots.slice(0, this.history.currentIndex + 1);
    }

    // Add new snapshot
    this.history.snapshots.push(snapshot);
    this.history.currentIndex = this.history.snapshots.length - 1;

    // Enforce maximum size
    if (this.history.snapshots.length > this.config.maxSnapshots) {
      const removed = this.history.snapshots.shift();
      this.history.currentIndex--;
      logger.debug('🗑️ Removed old snapshot:', removed?.id);
    }
  }

  private compressOldSnapshots(): void {
    const compressionAge = this.config.compressionThreshold * 60 * 1000; // Convert to ms
    const now = Date.now();

    this.history.snapshots.forEach((snapshot, index) => {
      if (now - snapshot.timestamp > compressionAge && typeof snapshot.data === 'object') {
        this.history.snapshots[index] = compressSnapshot(snapshot);
      }
    });
  }

  private generateTags(description: string, source: VersionSnapshot['metadata']['source']): string[] {
    const tags: string[] = [source];

    // Add tags based on description
    if (description.toLowerCase().includes('save')) tags.push('save');
    if (description.toLowerCase().includes('ai')) tags.push('ai-generated');
    if (description.toLowerCase().includes('theme')) tags.push('theme-change');
    if (description.toLowerCase().includes('content')) tags.push('content-change');
    if (description.toLowerCase().includes('layout')) tags.push('layout-change');

    return tags;
  }

  /**
   * ===== UNDO/REDO OPERATIONS =====
   */

  canUndo(): boolean {
    return this.history.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.history.currentIndex < this.history.snapshots.length - 1;
  }

  undo(): VersionSnapshot | null {
    if (!this.canUndo()) {
      logger.warn('⚠️ Cannot undo: already at earliest version');
      return null;
    }

    this.history.currentIndex--;
    const snapshot = this.history.snapshots[this.history.currentIndex];

    logger.debug('↶ Undo to version:', {
      version: snapshot.version,
      description: snapshot.description,
      timestamp: new Date(snapshot.timestamp).toLocaleString(),
    });

    return this.getDecompressedSnapshot(snapshot);
  }

  redo(): VersionSnapshot | null {
    if (!this.canRedo()) {
      logger.warn('⚠️ Cannot redo: already at latest version');
      return null;
    }

    this.history.currentIndex++;
    const snapshot = this.history.snapshots[this.history.currentIndex];

    logger.debug('↷ Redo to version:', {
      version: snapshot.version,
      description: snapshot.description,
      timestamp: new Date(snapshot.timestamp).toLocaleString(),
    });

    return this.getDecompressedSnapshot(snapshot);
  }

  getCurrentSnapshot(): VersionSnapshot | null {
    if (this.history.currentIndex < 0) return null;
    const snapshot = this.history.snapshots[this.history.currentIndex];
    return this.getDecompressedSnapshot(snapshot);
  }

  getSnapshot(id: string): VersionSnapshot | null {
    const snapshot = this.history.snapshots.find(s => s.id === id);
    return snapshot ? this.getDecompressedSnapshot(snapshot) : null;
  }

  private getDecompressedSnapshot(snapshot: VersionSnapshot): VersionSnapshot {
    return decompressSnapshot(snapshot);
  }

  /**
   * ===== CONFLICT RESOLUTION =====
   */

  detectConflictsWithServer(localData: any, serverData: any): ConflictResolution {
    const conflictId = generateId();
    const conflicts = detectConflicts(localData, serverData);

    const conflictResolution: ConflictResolution = {
      conflictId,
      timestamp: Date.now(),
      localVersion: {
        id: 'local-current',
        timestamp: Date.now(),
        version: this.history.snapshots.length,
        description: 'Current local state',
        data: localData,
        changes: [],
        metadata: {
          source: 'user',
          size: calculateSize(localData),
        },
      },
      serverVersion: serverData,
      conflictType: this.categorizeConflictType(conflicts),
      conflictedFields: conflicts,
      isResolved: false,
    };

    // Store active conflict
    this.activeConflicts.set(conflictId, conflictResolution);

    logger.debug('🔄 Conflict detected:', {
      conflictId,
      conflictType: conflictResolution.conflictType,
      fieldsCount: conflicts.length,
      autoMergeableFields: conflicts.filter(c => c.canAutoMerge).length,
    });

    return conflictResolution;
  }

  private categorizeConflictType(conflicts: ConflictField[]): ConflictResolution['conflictType'] {
    const hasContent = conflicts.some(c => c.path.startsWith('content.'));
    const hasTheme = conflicts.some(c => c.path.startsWith('theme.'));
    const hasStructure = conflicts.some(c => 
      c.path.startsWith('layout.') || c.path.startsWith('sections')
    );

    if (hasContent && hasTheme && hasStructure) return 'mixed';
    if (hasTheme) return 'theme';
    if (hasStructure) return 'structure';
    return 'content';
  }

  autoResolveConflicts(conflictId: string): any | null {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) return null;

    const autoMergeableFields = conflict.conflictedFields.filter(c => c.canAutoMerge);
    if (autoMergeableFields.length === 0) {
      logger.debug('❌ No auto-mergeable conflicts found');
      return null;
    }

    const mergedData = this.performAutoMerge(
      conflict.localVersion.data,
      conflict.serverVersion,
      autoMergeableFields
    );

    logger.debug('🔀 Auto-merged conflicts:', {
      conflictId,
      mergedFields: autoMergeableFields.length,
      totalFields: conflict.conflictedFields.length,
    });

    // Mark resolved fields
    conflict.conflictedFields.forEach(field => {
      if (autoMergeableFields.includes(field)) {
        field.mergeStrategy = field.mergeStrategy || 'prefer-local';
      }
    });

    // Check if all conflicts are resolved
    const unresolvedFields = conflict.conflictedFields.filter(c => !c.canAutoMerge);
    if (unresolvedFields.length === 0) {
      conflict.isResolved = true;
      this.activeConflicts.delete(conflictId);
    }

    return mergedData;
  }

  private performAutoMerge(localData: any, serverData: any, fields: ConflictField[]): any {
    const mergedData = JSON.parse(JSON.stringify(localData)); // Deep clone

    fields.forEach(field => {
      const pathParts = field.path.split('.');
      let current = mergedData;

      // Navigate to parent object
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]] === undefined) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }

      const key = pathParts[pathParts.length - 1];

      // Apply merge strategy
      switch (field.mergeStrategy) {
        case 'prefer-server':
          current[key] = field.serverValue;
          break;
        case 'prefer-local':
          current[key] = field.localValue;
          break;
        case 'concat':
          if (Array.isArray(field.localValue) && Array.isArray(field.serverValue)) {
            current[key] = [...field.localValue, ...field.serverValue];
          } else if (typeof field.localValue === 'string' && typeof field.serverValue === 'string') {
            current[key] = `${field.localValue} ${field.serverValue}`.trim();
          } else {
            current[key] = field.localValue; // Fallback
          }
          break;
        default:
          current[key] = field.localValue; // Prefer local by default
      }
    });

    return mergedData;
  }

  manualResolveConflict(conflictId: string, resolutions: Record<string, any>): any | null {
    const conflict = this.activeConflicts.get(conflictId);
    if (!conflict) return null;

    const mergedData = JSON.parse(JSON.stringify(conflict.localVersion.data));

    // Apply manual resolutions
    Object.entries(resolutions).forEach(([path, value]) => {
      const pathParts = path.split('.');
      let current = mergedData;

      for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]] === undefined) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }

      current[pathParts[pathParts.length - 1]] = value;
    });

    // Mark conflict as resolved
    conflict.isResolved = true;
    conflict.resolutionStrategy = 'manual';
    this.activeConflicts.delete(conflictId);

    logger.debug('🔧 Manual conflict resolution completed:', {
      conflictId,
      resolvedFields: Object.keys(resolutions).length,
    });

    return mergedData;
  }

  /**
   * ===== UTILITY METHODS =====
   */

  getActiveConflicts(): ConflictResolution[] {
    return Array.from(this.activeConflicts.values());
  }

  getHistorySummary(): {
    totalSnapshots: number;
    currentVersion: number;
    canUndo: boolean;
    canRedo: boolean;
    totalSize: number;
    oldestSnapshot?: Date;
    newestSnapshot?: Date;
  } {
    const totalSize = this.history.snapshots.reduce((sum, s) => sum + s.metadata.size, 0);

    return {
      totalSnapshots: this.history.snapshots.length,
      currentVersion: this.history.currentIndex + 1,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      totalSize,
      oldestSnapshot: this.history.snapshots[0] ? new Date(this.history.snapshots[0].timestamp) : undefined,
      newestSnapshot: this.history.snapshots[this.history.snapshots.length - 1] ? 
        new Date(this.history.snapshots[this.history.snapshots.length - 1].timestamp) : undefined,
    };
  }

  shouldCreateAutoSnapshot(changeCount: number): boolean {
    return changeCount > 0 && changeCount % this.config.autoSnapshotInterval === 0;
  }

  exportHistory(): any {
    return {
      history: this.history,
      config: this.config,
      exportedAt: Date.now(),
    };
  }

  importHistory(exportedData: any): boolean {
    try {
      this.history = exportedData.history;
      this.config = { ...this.config, ...exportedData.config };
      this.changeCounter = 0;
      this.activeConflicts.clear();

      logger.debug('📥 Version history imported:', {
        snapshots: this.history.snapshots.length,
        currentIndex: this.history.currentIndex,
      });

      return true;
    } catch (error) {
      logger.error('❌ Failed to import version history:', error);
      return false;
    }
  }

  clear(): void {
    this.history.snapshots = [];
    this.history.currentIndex = -1;
    this.changeCounter = 0;
    this.activeConflicts.clear();

    logger.debug('🧹 Version history cleared');
  }
}

/**
 * ===== DEVELOPMENT UTILITIES =====
 */

if (process.env.NODE_ENV === 'development') {
  // Global version manager debugging utilities
  (window as any).__versionDebug = {
    createTestConflict: (manager: VersionManager) => {
      const localData = { content: { hero: { headline: 'Local Version' } } };
      const serverData = { content: { hero: { headline: 'Server Version' } } };
      return manager.detectConflictsWithServer(localData, serverData);
    },
    getHistorySummary: (manager: VersionManager) => manager.getHistorySummary(),
    exportHistory: (manager: VersionManager) => manager.exportHistory(),
  };

  logger.debug('🔧 Version Manager debug utilities available at window.__versionDebug');
}