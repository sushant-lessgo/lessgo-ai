import { logger } from '@/lib/logger';

/**
 * Storage utilities for multi-project token-scoped persistence
 * Handles localStorage management for isolated project stores
 */

// Storage configuration constants
export const STORAGE_CONFIG = {
  MAX_STORED_PROJECTS: 10,
  METADATA_KEY: 'edit-store-metadata',
  PROJECT_KEY_PREFIX: 'edit-store-',
  CLEANUP_INTERVAL_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Metadata structure for tracking stored projects
export interface ProjectMetadata {
  tokenId: string;
  lastAccessed: number;
  createdAt: number;
  version: number;
  dataSize?: number; // Optional size tracking
}

export interface StorageMetadata {
  projects: ProjectMetadata[];
  lastCleanup: number;
  totalProjects: number;
}

/**
 * Generate storage key for a specific token
 */
export function getStorageKey(tokenId: string): string {
  if (!tokenId || typeof tokenId !== 'string') {
    throw new Error('Invalid tokenId provided to getStorageKey');
  }
  return `${STORAGE_CONFIG.PROJECT_KEY_PREFIX}${tokenId}`;
}

/**
 * Check if localStorage is available (SSR-safe)
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    logger.warn('localStorage not available:', error);
    return false;
  }
}

/**
 * Get storage metadata with fallback
 */
export function getStorageMetadata(): StorageMetadata {
  if (!isStorageAvailable()) {
    return {
      projects: [],
      lastCleanup: Date.now(),
      totalProjects: 0,
    };
  }

  try {
    const metadataStr = localStorage.getItem(STORAGE_CONFIG.METADATA_KEY);
    if (!metadataStr) {
      return {
        projects: [],
        lastCleanup: Date.now(),
        totalProjects: 0,
      };
    }

    const metadata = JSON.parse(metadataStr) as StorageMetadata;
    
    // Validate metadata structure
    if (!metadata.projects || !Array.isArray(metadata.projects)) {
      logger.warn('Invalid metadata structure, resetting');
      return {
        projects: [],
        lastCleanup: Date.now(),
        totalProjects: 0,
      };
    }

    return metadata;
  } catch (error) {
    logger.error('Failed to parse storage metadata:', error);
    return {
      projects: [],
      lastCleanup: Date.now(),
      totalProjects: 0,
    };
  }
}

/**
 * Update storage metadata
 */
export function updateStorageMetadata(metadata: StorageMetadata): void {
  if (!isStorageAvailable()) return;

  try {
    localStorage.setItem(STORAGE_CONFIG.METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    logger.error('Failed to update storage metadata:', error);
  }
}

/**
 * Track project access for cleanup purposes
 */
export function trackProjectAccess(tokenId: string): void {
  if (!isStorageAvailable()) return;

  const metadata = getStorageMetadata();
  const now = Date.now();
  
  // Find existing project or create new entry
  const existingIndex = metadata.projects.findIndex(p => p.tokenId === tokenId);
  
  if (existingIndex >= 0) {
    // Update existing project
    metadata.projects[existingIndex].lastAccessed = now;
  } else {
    // Add new project
    metadata.projects.push({
      tokenId,
      lastAccessed: now,
      createdAt: now,
      version: 1,
    });
    metadata.totalProjects++;
  }

  updateStorageMetadata(metadata);
}

/**
 * Get list of stored project tokens
 */
export function getStoredProjectTokens(): string[] {
  const metadata = getStorageMetadata();
  return metadata.projects.map(p => p.tokenId);
}

/**
 * Check if a project exists in storage
 */
export function hasStoredProject(tokenId: string): boolean {
  if (!isStorageAvailable()) return false;
  
  const storageKey = getStorageKey(tokenId);
  return localStorage.getItem(storageKey) !== null;
}

/**
 * Remove a specific project from storage
 */
export function removeStoredProject(tokenId: string): boolean {
  if (!isStorageAvailable()) return false;

  try {
    const storageKey = getStorageKey(tokenId);
    localStorage.removeItem(storageKey);

    // Update metadata
    const metadata = getStorageMetadata();
    metadata.projects = metadata.projects.filter(p => p.tokenId !== tokenId);
    metadata.totalProjects = Math.max(0, metadata.totalProjects - 1);
    updateStorageMetadata(metadata);

    logger.debug(`🗑️ Removed project: ${tokenId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to remove project ${tokenId}:`, error);
    return false;
  }
}

/**
 * Clean up old projects to stay within storage limits
 */
export function cleanupOldProjects(currentTokenId: string, force: boolean = false): void {
  if (!isStorageAvailable()) return;

  const metadata = getStorageMetadata();
  const now = Date.now();

  // Check if cleanup is needed
  const timeSinceLastCleanup = now - metadata.lastCleanup;
  const needsCleanup = force || 
    metadata.projects.length > STORAGE_CONFIG.MAX_STORED_PROJECTS ||
    timeSinceLastCleanup > STORAGE_CONFIG.CLEANUP_INTERVAL_MS;

  if (!needsCleanup) return;

  logger.debug(`🧹 Starting storage cleanup (${metadata.projects.length} projects)`);

  try {
    // Sort projects by last accessed time (oldest first)
    const sortedProjects = [...metadata.projects].sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // Determine which projects to remove
    const projectsToKeep = STORAGE_CONFIG.MAX_STORED_PROJECTS - 1; // Reserve space for current
    const projectsToRemove = sortedProjects.slice(0, -projectsToKeep);

    // Don't remove the current project
    const filteredRemoveList = projectsToRemove.filter(p => p.tokenId !== currentTokenId);

    // Remove old projects
    for (const project of filteredRemoveList) {
      removeStoredProject(project.tokenId);
    }

    // Clean up orphaned keys (keys that exist in localStorage but not in metadata)
    const storedTokens = getStoredProjectTokens();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_CONFIG.PROJECT_KEY_PREFIX)) {
        const tokenId = key.replace(STORAGE_CONFIG.PROJECT_KEY_PREFIX, '');
        if (!storedTokens.includes(tokenId) && tokenId !== currentTokenId) {
          logger.debug(`🧹 Removing orphaned key: ${key}`);
          localStorage.removeItem(key);
        }
      }
    }

    // Update cleanup timestamp
    const updatedMetadata = getStorageMetadata();
    updatedMetadata.lastCleanup = now;
    updateStorageMetadata(updatedMetadata);

    logger.debug(`✅ Cleanup complete. Removed ${filteredRemoveList.length} old projects`);

  } catch (error) {
    logger.error('Storage cleanup failed:', error);
  }
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  totalProjects: number;
  currentSizeKB: number;
  availableSlots: number;
  oldestProject?: string;
  newestProject?: string;
} {
  if (!isStorageAvailable()) {
    return {
      totalProjects: 0,
      currentSizeKB: 0,
      availableSlots: STORAGE_CONFIG.MAX_STORED_PROJECTS,
    };
  }

  const metadata = getStorageMetadata();
  
  // Calculate approximate size
  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_CONFIG.PROJECT_KEY_PREFIX)) {
      const value = localStorage.getItem(key);
      totalSize += (key.length + (value?.length || 0)) * 2; // Rough bytes estimate
    }
  }

  // Find oldest and newest projects
  const sortedByAccess = [...metadata.projects].sort((a, b) => a.lastAccessed - b.lastAccessed);
  
  return {
    totalProjects: metadata.projects.length,
    currentSizeKB: Math.round(totalSize / 1024),
    availableSlots: Math.max(0, STORAGE_CONFIG.MAX_STORED_PROJECTS - metadata.projects.length),
    oldestProject: sortedByAccess[0]?.tokenId,
    newestProject: sortedByAccess[sortedByAccess.length - 1]?.tokenId,
  };
}

/**
 * Switch to a new token - handles cleanup and tracking
 */
export function switchToken(newTokenId: string, oldTokenId?: string): void {
  if (!isStorageAvailable()) return;

  logger.debug(`🔄 Switching token: ${oldTokenId || 'none'} → ${newTokenId}`);

  // Track access to new token
  trackProjectAccess(newTokenId);
  
  // Trigger cleanup if needed
  cleanupOldProjects(newTokenId);
}

/**
 * Clear all project data (use with caution)
 */
export function clearAllProjects(): void {
  if (!isStorageAvailable()) return;

  logger.warn('🚨 Clearing all project data');

  try {
    // Remove all project keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_CONFIG.PROJECT_KEY_PREFIX) || key === STORAGE_CONFIG.METADATA_KEY) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    logger.debug(`✅ Cleared ${keysToRemove.length} project keys`);
  } catch (error) {
    logger.error('Failed to clear all projects:', error);
  }
}

// Development utilities (only available in development mode)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).__storageDebug = {
    getStorageMetadata,
    getStorageStats,
    cleanupOldProjects: (tokenId: string) => cleanupOldProjects(tokenId, true),
    clearAllProjects,
    getStoredProjectTokens,
    trackProjectAccess,
    removeStoredProject,
    hasStoredProject,
  };
  
}