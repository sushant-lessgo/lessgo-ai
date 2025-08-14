/**
 * Storage Manager - Automated cleanup and management for token-scoped stores
 * Handles periodic cleanup, quota management, and storage optimization
 */

import { 
  cleanupOldProjects, 
  getStorageStats, 
  isStorageAvailable, 
  STORAGE_CONFIG,
  removeStoredProject,
  getStoredProjectTokens,
  updateStorageMetadata,
  getStorageMetadata
} from './storage';

// Storage manager state
interface StorageManagerState {
  isCleanupRunning: boolean;
  lastCleanupTime: number;
  cleanupInterval: ReturnType<typeof setInterval> | null;
  quotaWarningThreshold: number; // KB
  quotaErrorThreshold: number; // KB
}

class StorageManager {
  private static instance: StorageManager;
  private state: StorageManagerState = {
    isCleanupRunning: false,
    lastCleanupTime: Date.now(),
    cleanupInterval: null,
    quotaWarningThreshold: 5 * 1024, // 5MB
    quotaErrorThreshold: 8 * 1024,   // 8MB
  };

  private constructor() {
    this.startAutomaticCleanup();
    
    // Listen for storage events (other tabs)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent.bind(this));
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Start automatic cleanup process
   */
  private startAutomaticCleanup(): void {
    if (typeof window === 'undefined') return;

    // Run cleanup every hour
    this.state.cleanupInterval = setInterval(() => {
      this.performMaintenanceCleanup();
    }, 60 * 60 * 1000);

    // Initial cleanup check
    setTimeout(() => {
      this.performMaintenanceCleanup();
    }, 5000); // Wait 5 seconds after startup
  }

  /**
   * Perform maintenance cleanup
   */
  public async performMaintenanceCleanup(force: boolean = false): Promise<void> {
    if (!isStorageAvailable()) return;
    
    if (this.state.isCleanupRunning && !force) {
      console.log('🧹 Storage cleanup already running, skipping');
      return;
    }

    this.state.isCleanupRunning = true;
    
    try {
      // console.log('🧹 Storage Manager: Starting maintenance cleanup');
      
      // Check storage quota
      const stats = getStorageStats();
      // console.log('📊 Storage stats:', stats);

      // Trigger cleanup if needed
      const needsCleanup = 
        force ||
        stats.totalProjects > STORAGE_CONFIG.MAX_STORED_PROJECTS ||
        stats.currentSizeKB > this.state.quotaWarningThreshold ||
        (Date.now() - this.state.lastCleanupTime) > STORAGE_CONFIG.CLEANUP_INTERVAL_MS;

      if (needsCleanup) {
        await this.performDeepCleanup(stats);
      }

      // Check for quota issues
      if (stats.currentSizeKB > this.state.quotaErrorThreshold) {
        console.warn('⚠️ Storage quota approaching limit, performing aggressive cleanup');
        await this.performAggressiveCleanup(stats);
      }

      this.state.lastCleanupTime = Date.now();
      // console.log('✅ Storage maintenance cleanup completed');

    } catch (error) {
      console.error('❌ Storage maintenance cleanup failed:', error);
    } finally {
      this.state.isCleanupRunning = false;
    }
  }

  /**
   * Perform deep cleanup
   */
  private async performDeepCleanup(stats: ReturnType<typeof getStorageStats>): Promise<void> {
    console.log('🔧 Performing deep storage cleanup');

    // Use the existing cleanup function with current token
    const currentTokens = getStoredProjectTokens();
    if (currentTokens.length > 0) {
      // Use the most recently accessed token as "current"
      const metadata = getStorageMetadata();
      const mostRecent = metadata.projects
        .sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
      
      if (mostRecent) {
        cleanupOldProjects(mostRecent.tokenId, true);
      } else {
        cleanupOldProjects('temp', true);
      }
    }

    // Clean up corrupted or invalid entries
    await this.cleanupCorruptedEntries();
  }

  /**
   * Perform aggressive cleanup when quota is nearly full
   */
  private async performAggressiveCleanup(stats: ReturnType<typeof getStorageStats>): Promise<void> {
    console.log('🚨 Performing aggressive storage cleanup due to quota limits');

    const metadata = getStorageMetadata();
    
    // Keep only the 3 most recent projects
    const sortedProjects = metadata.projects
      .sort((a, b) => b.lastAccessed - a.lastAccessed);
    
    const projectsToRemove = sortedProjects.slice(3); // Remove all but top 3

    for (const project of projectsToRemove) {
      console.log(`🗑️ Aggressively removing project: ${project.tokenId}`);
      removeStoredProject(project.tokenId);
    }

    // Clear any remaining orphaned keys
    if (typeof window !== 'undefined') {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_CONFIG.PROJECT_KEY_PREFIX)) {
          const tokenId = key.replace(STORAGE_CONFIG.PROJECT_KEY_PREFIX, '');
          const isKnownProject = sortedProjects.slice(0, 3).some(p => p.tokenId === tokenId);
          
          if (!isKnownProject) {
            console.log(`🧹 Removing orphaned aggressive cleanup key: ${key}`);
            localStorage.removeItem(key);
          }
        }
      }
    }
  }

  /**
   * Clean up corrupted or invalid entries
   */
  private async cleanupCorruptedEntries(): Promise<void> {
    if (!isStorageAvailable()) return;

    console.log('🔍 Checking for corrupted storage entries');
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key?.startsWith(STORAGE_CONFIG.PROJECT_KEY_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            JSON.parse(value); // Test if valid JSON
          }
        } catch (error) {
          console.warn(`🗑️ Removing corrupted storage entry: ${key}`);
          localStorage.removeItem(key);
        }
      }
    }
  }

  /**
   * Handle storage events from other tabs
   */
  private handleStorageEvent(event: StorageEvent): void {
    if (!event.key?.startsWith(STORAGE_CONFIG.PROJECT_KEY_PREFIX)) return;
    
    console.log('📡 Storage event detected from other tab:', {
      key: event.key,
      oldValue: event.oldValue ? 'exists' : 'null',
      newValue: event.newValue ? 'exists' : 'null'
    });

    // Could trigger cleanup or sync operations here
  }

  /**
   * Handle before unload to ensure cleanup
   */
  private handleBeforeUnload(): void {
    // Quick cleanup before page unload
    if (this.state.cleanupInterval) {
      clearInterval(this.state.cleanupInterval);
    }
  }

  /**
   * Force immediate cleanup
   */
  public forceCleanup(): Promise<void> {
    return this.performMaintenanceCleanup(true);
  }

  /**
   * Get cleanup status
   */
  public getCleanupStatus(): {
    isRunning: boolean;
    lastCleanupTime: number;
    timeSinceLastCleanup: number;
    nextCleanupTime: number;
  } {
    const now = Date.now();
    return {
      isRunning: this.state.isCleanupRunning,
      lastCleanupTime: this.state.lastCleanupTime,
      timeSinceLastCleanup: now - this.state.lastCleanupTime,
      nextCleanupTime: this.state.lastCleanupTime + STORAGE_CONFIG.CLEANUP_INTERVAL_MS,
    };
  }

  /**
   * Set quota thresholds
   */
  public setQuotaThresholds(warning: number, error: number): void {
    this.state.quotaWarningThreshold = warning;
    this.state.quotaErrorThreshold = error;
    console.log(`📊 Updated quota thresholds: warning=${warning}KB, error=${error}KB`);
  }

  /**
   * Get storage health report
   */
  public getHealthReport(): {
    status: 'healthy' | 'warning' | 'critical';
    stats: ReturnType<typeof getStorageStats>;
    recommendations: string[];
    cleanupStatus: ReturnType<StorageManager['getCleanupStatus']>;
  } {
    const stats = getStorageStats();
    const cleanupStatus = this.getCleanupStatus();
    const recommendations: string[] = [];
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check project count
    if (stats.totalProjects > STORAGE_CONFIG.MAX_STORED_PROJECTS) {
      status = 'warning';
      recommendations.push(`Too many projects stored (${stats.totalProjects}/${STORAGE_CONFIG.MAX_STORED_PROJECTS})`);
    }

    // Check size
    if (stats.currentSizeKB > this.state.quotaErrorThreshold) {
      status = 'critical';
      recommendations.push(`Storage size critical (${stats.currentSizeKB}KB)`);
    } else if (stats.currentSizeKB > this.state.quotaWarningThreshold) {
      status = 'warning';
      recommendations.push(`Storage size approaching limit (${stats.currentSizeKB}KB)`);
    }

    // Check cleanup frequency
    const timeSinceCleanup = Date.now() - this.state.lastCleanupTime;
    if (timeSinceCleanup > STORAGE_CONFIG.CLEANUP_INTERVAL_MS * 2) {
      if (status === 'healthy') status = 'warning';
      recommendations.push('Cleanup overdue');
    }

    return {
      status,
      stats,
      recommendations,
      cleanupStatus,
    };
  }

  /**
   * Destroy storage manager
   */
  public destroy(): void {
    if (this.state.cleanupInterval) {
      clearInterval(this.state.cleanupInterval);
      this.state.cleanupInterval = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent.bind(this));
      window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    console.log('🛑 Storage Manager destroyed');
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance();

// Export utilities
export { StorageManager };

// Development utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).__storageManagerDebug = {
    getInstance: () => StorageManager.getInstance(),
    forceCleanup: () => storageManager.forceCleanup(),
    getHealthReport: () => storageManager.getHealthReport(),
    getCleanupStatus: () => storageManager.getCleanupStatus(),
    setQuotaThresholds: (w: number, e: number) => storageManager.setQuotaThresholds(w, e),
  };
  
  // console.log('🔧 Storage Manager debug utilities available at window.__storageManagerDebug');
}