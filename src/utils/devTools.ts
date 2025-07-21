// utils/devTools.ts - Core Dev Tools Utilities for Edit Store
// Import the store hook, not the type (we'll define our own type)
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

// Define our own EditStore type to avoid circular dependency
type EditStoreType = ReturnType<typeof useEditStore.getState>;

/**
 * ===== DEV TOOLS TYPES =====
 */

interface DevToolsConfig {
  enabled: boolean;
  trackActions: boolean;
  trackPerformance: boolean;
  maxHistorySize: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface ActionHistoryEntry {
  id: string;
  actionName: string;
  payload: any;
  timestamp: number;
  stateBefore: any;
  stateAfter: any;
  duration: number;
  source: 'user' | 'system' | 'ai';
}

interface PerformanceEntry {
  id: string;
  componentName: string;
  operationType: 'render' | 'update' | 'mount' | 'unmount';
  duration: number;
  timestamp: number;
  isSlowRender: boolean;
  rerenderCount?: number;
}

interface DevToolsState {
  isEnabled: boolean;
  actionHistory: ActionHistoryEntry[];
  performanceLog: PerformanceEntry[];
  slowRenders: PerformanceEntry[];
  errorLog: Array<{
    id: string;
    error: Error;
    context: string;
    timestamp: number;
    stack?: string;
  }>;
  storeSubscriptions: Array<{
    id: string;
    selector: string;
    componentName: string;
    subscriptionCount: number;
  }>;
}

/**
 * ===== DEV TOOLS MANAGER CLASS =====
 */

class DevToolsManagerClass {
  private config: DevToolsConfig;
  private state: DevToolsState;
  private store: any; // EditStore reference
  private unsubscribe: (() => void) | null = null;

  constructor(config: Partial<DevToolsConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      trackActions: true,
      trackPerformance: true,
      maxHistorySize: 100,
      logLevel: 'info',
      ...config,
    };

    this.state = {
      isEnabled: this.config.enabled,
      actionHistory: [],
      performanceLog: [],
      slowRenders: [],
      errorLog: [],
      storeSubscriptions: [],
    };

    if (this.config.enabled) {
      this.setupGlobalDebugAccess();
      this.setupErrorHandling();
    }
  }

  /**
   * Initialize dev tools with store reference
   */
  init(store: any) {
    if (!this.config.enabled) return;

    this.store = store;
    this.setupStoreMonitoring();
    this.log('info', '🔧 Dev Tools initialized');
  }

  /**
   * Set up global debugging access
   */
  private setupGlobalDebugAccess() {
    if (typeof window === 'undefined') return;

    (window as any).__editStoreDebug = {
      getState: () => this.store?.getState?.(),
      setState: (newState: Partial<EditStoreType>) => this.store?.setState?.(newState),
      subscribe: (callback: (state: EditStoreType) => void) => this.store?.subscribe?.(callback),
      
      // Action tracking
      getActionHistory: () => this.state.actionHistory,
      clearActionHistory: () => this.clearActionHistory(),
      getLastActions: (count: number = 10) => this.state.actionHistory.slice(-count),
      
      // Performance monitoring
      getPerformanceLog: () => this.state.performanceLog,
      getSlowRenders: () => this.state.slowRenders,
      clearPerformanceLog: () => this.clearPerformanceLog(),
      
      // Error tracking
      getErrorLog: () => this.state.errorLog,
      clearErrorLog: () => this.clearErrorLog(),
      
      // Store analysis
      analyzeStore: () => this.analyzeStoreState(),
      validateStore: () => this.validateStoreState(),
      exportState: () => this.store?.getState?.()?.export?.(),
      
      // Utility functions
      triggerAutoSave: () => this.store?.getState?.()?.triggerAutoSave?.(),
      forceSave: () => this.store?.getState?.()?.forceSave?.(),
      clearHistory: () => this.store?.getState?.()?.clearHistory?.(),
      
      // Dev tools control
      enable: () => this.enable(),
      disable: () => this.disable(),
      getConfig: () => this.config,
      getDevToolsState: () => this.state,
    };

    this.log('info', '🌐 Global debug access setup at window.__editStoreDebug');
  }

  /**
   * Set up error handling
   */
  private setupErrorHandling() {
    if (typeof window === 'undefined') return;

    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.trackError(new Error(args.join(' ')), 'console.error');
      originalConsoleError(...args);
    };

    window.addEventListener('error', (event) => {
      this.trackError(event.error, 'window.error', event.filename);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), 'unhandledrejection');
    });
  }

  /**
   * Set up store monitoring
   */
  private setupStoreMonitoring() {
    if (!this.store) return;

    // Subscribe to store changes for action tracking
    this.unsubscribe = this.store.subscribe((state: EditStoreType, prevState: EditStoreType) => {
      if (this.config.trackActions) {
        this.detectStateChanges(state, prevState);
      }
    });
  }

  /**
   * Track store actions by detecting state changes
   */
  private detectStateChanges(currentState: EditStoreType, previousState: EditStoreType) {
    const changes = this.diffStates(currentState, previousState);
    
    if (changes.length > 0) {
      const actionEntry: ActionHistoryEntry = {
        id: this.generateId(),
        actionName: this.inferActionName(changes),
        payload: changes,
        timestamp: Date.now(),
        stateBefore: this.serializeState(previousState),
        stateAfter: this.serializeState(currentState),
        duration: 0, // Will be calculated by wrapper
        source: this.inferActionSource(changes),
      };

      this.addActionEntry(actionEntry);
    }
  }

  /**
   * Detect differences between states
   */
  private diffStates(current: EditStoreType, previous: EditStoreType): Array<{
    path: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'changed' | 'deleted';
  }> {
    const changes: Array<{
      path: string;
      oldValue: any;
      newValue: any;
      type: 'added' | 'changed' | 'deleted';
    }> = [];

    // Key areas to monitor for changes
    const watchPaths = [
      'sections',
      'content',
      'theme',
      'selectedSection',
      'selectedElement',
      'mode',
      'isDirty',
      'isSaving',
      'errors',
      'loadingStates',
    ];

    watchPaths.forEach(path => {
      const currentValue = this.getNestedValue(current, path);
      const previousValue = this.getNestedValue(previous, path);

      if (!this.deepEqual(currentValue, previousValue)) {
        changes.push({
          path,
          oldValue: previousValue,
          newValue: currentValue,
          type: previousValue === undefined ? 'added' : 
                currentValue === undefined ? 'deleted' : 'changed',
        });
      }
    });

    return changes;
  }

  /**
   * Infer action name from changes
   */
  private inferActionName(changes: Array<{ path: string; oldValue: any; newValue: any }>): string {
    if (changes.length === 0) return 'unknown';

    const primaryChange = changes[0];
    const path = primaryChange.path;

    if (path.startsWith('content.')) {
      return 'updateContent';
    } else if (path === 'sections') {
      return Array.isArray(primaryChange.newValue) && primaryChange.newValue.length > (primaryChange.oldValue?.length || 0)
        ? 'addSection'
        : 'removeSection';
    } else if (path.startsWith('theme.')) {
      return 'updateTheme';
    } else if (path === 'selectedSection') {
      return 'selectSection';
    } else if (path === 'selectedElement') {
      return 'selectElement';
    } else if (path === 'mode') {
      return 'setMode';
    } else if (path.includes('autoSave')) {
      return 'autoSave';
    } else if (path.includes('aiGeneration')) {
      return 'aiGeneration';
    }

    return `update_${path.replace('.', '_')}`;
  }

  /**
   * Infer action source
   */
  private inferActionSource(changes: Array<{ path: string }>): 'user' | 'system' | 'ai' {
    const hasAIPath = changes.some(c => c.path.includes('aiGeneration') || c.path.includes('aiMetadata'));
    const hasAutoSavePath = changes.some(c => c.path.includes('autoSave'));
    
    if (hasAIPath) return 'ai';
    if (hasAutoSavePath) return 'system';
    return 'user';
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    componentName: string,
    operationType: 'render' | 'update' | 'mount' | 'unmount',
    duration: number
  ) {
    if (!this.config.enabled || !this.config.trackPerformance) return;

    const isSlowRender = duration > 16; // > 1 frame at 60fps
    
    const entry: PerformanceEntry = {
      id: this.generateId(),
      componentName,
      operationType,
      duration,
      timestamp: Date.now(),
      isSlowRender,
    };

    this.state.performanceLog.push(entry);

    if (isSlowRender) {
      this.state.slowRenders.push(entry);
      this.log('warn', `🐌 Slow ${operationType}: ${componentName} took ${duration}ms`);
    }

    // Limit log size
    if (this.state.performanceLog.length > this.config.maxHistorySize) {
      this.state.performanceLog = this.state.performanceLog.slice(-this.config.maxHistorySize);
    }

    if (this.state.slowRenders.length > 50) {
      this.state.slowRenders = this.state.slowRenders.slice(-50);
    }
  }

  /**
   * Track errors
   */
  trackError(error: Error, context: string, filename?: string) {
    if (!this.config.enabled) return;

    const errorEntry = {
      id: this.generateId(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      filename,
      timestamp: Date.now(),
      stack: error.stack,
    };

    this.state.errorLog.push(errorEntry);

    // Limit error log size
    if (this.state.errorLog.length > 100) {
      this.state.errorLog = this.state.errorLog.slice(-100);
    }

    this.log('error', `❌ Error in ${context}:`, error.message);
  }

  /**
   * Analyze store state for potential issues
   */
  analyzeStoreState() {
    if (!this.store) return null;

    const state = this.store.getState();
    const analysis = {
      timestamp: Date.now(),
      sections: {
        count: state.sections?.length || 0,
        withContent: Object.keys(state.content || {}).length,
        missingContent: state.sections?.filter((id: string) => !state.content?.[id]) || [],
      },
      content: {
        totalSections: Object.keys(state.content || {}).length,
        sectionsWithElements: Object.values(state.content || {})
          .filter((section: any) => Object.keys(section.elements || {}).length > 0).length,
        aiGenerated: Object.values(state.content || {})
          .filter((section: any) => section.aiMetadata?.aiGenerated).length,
        customized: Object.values(state.content || {})
          .filter((section: any) => section.aiMetadata?.isCustomized).length,
      },
      ui: {
        mode: state.mode,
        editMode: state.editMode,
        selectedSection: state.selectedSection,
        selectedElement: state.selectedElement,
        hasErrors: Object.keys(state.errors || {}).length > 0,
        isLoading: state.isLoading,
      },
      autoSave: {
        isDirty: state.isDirty,
        isSaving: state.isSaving,
        lastSaved: state.lastSaved,
        hasError: !!state.saveError,
        queuedChanges: state.queuedChanges?.length || 0,
      },
      performance: {
        saveCount: state.performance?.saveCount || 0,
        averageSaveTime: state.performance?.averageSaveTime || 0,
        failedSaves: state.performance?.failedSaves || 0,
      },
    };

    this.log('info', '📊 Store Analysis:', analysis);
    return analysis;
  }

  /**
   * Validate store state consistency
   */
  validateStoreState() {
    if (!this.store) return [];

    const state = this.store.getState();
    const issues: string[] = [];

    // Check sections consistency
    if (state.sections && state.sectionLayouts) {
      state.sections.forEach((sectionId: string) => {
        if (!state.sectionLayouts[sectionId]) {
          issues.push(`Section ${sectionId} missing layout`);
        }
        if (!state.content?.[sectionId]) {
          issues.push(`Section ${sectionId} missing content`);
        }
      });
    }

    // Check content consistency
    if (state.content) {
      Object.keys(state.content).forEach(sectionId => {
        if (!state.sections?.includes(sectionId)) {
          issues.push(`Content for ${sectionId} exists but section not in sections array`);
        }
      });
    }

    // Check selected element consistency
    if (state.selectedElement) {
      const { sectionId, elementKey } = state.selectedElement;
      if (!state.content?.[sectionId]?.elements?.[elementKey]) {
        issues.push(`Selected element ${sectionId}.${elementKey} does not exist`);
      }
    }

    if (issues.length > 0) {
      this.log('warn', '⚠️ Store validation issues:', issues);
    } else {
      this.log('info', '✅ Store state is consistent');
    }

    return issues;
  }

  /**
   * Utility methods
   */
  private addActionEntry(entry: ActionHistoryEntry) {
    this.state.actionHistory.push(entry);
    
    if (this.state.actionHistory.length > this.config.maxHistorySize) {
      this.state.actionHistory = this.state.actionHistory.slice(-this.config.maxHistorySize);
    }
  }

  private clearActionHistory() {
    this.state.actionHistory = [];
    this.log('info', '🧹 Action history cleared');
  }

  private clearPerformanceLog() {
    this.state.performanceLog = [];
    this.state.slowRenders = [];
    this.log('info', '🧹 Performance log cleared');
  }

  private clearErrorLog() {
    this.state.errorLog = [];
    this.log('info', '🧹 Error log cleared');
  }

  private enable() {
    this.config.enabled = true;
    this.state.isEnabled = true;
    this.log('info', '✅ Dev Tools enabled');
  }

  private disable() {
    this.config.enabled = false;
    this.state.isEnabled = false;
    this.log('info', '⏸️ Dev Tools disabled');
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return a === b;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => this.deepEqual(a[key], b[key]));
  }

  private serializeState(state: any): any {
    // Simplified serialization - avoid circular references
    try {
      return JSON.parse(JSON.stringify(state, (key, value) => {
        // Skip function properties and complex objects
        if (typeof value === 'function') return '[Function]';
        if (value instanceof Error) return `[Error: ${value.message}]`;
        return value;
      }));
    } catch {
      return '[Unserializable State]';
    }
  }

  private log(level: string, message: string, ...args: any[]) {
    if (!this.config.enabled) return;

    const timestamp = new Date().toISOString();
    const prefix = `[DevTools ${timestamp}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (typeof window !== 'undefined') {
      delete (window as any).__editStoreDebug;
    }

    this.log('info', '🧹 Dev Tools destroyed');
  }
}

/**
 * ===== SINGLETON INSTANCE =====
 */

let devToolsInstance: DevToolsManagerClass | null = null;

export const getDevTools = (): DevToolsManagerClass => {
  if (!devToolsInstance) {
    devToolsInstance = new DevToolsManagerClass();
  }
  return devToolsInstance;
};

export const initDevTools = (store: any): DevToolsManagerClass => {
  const devTools = getDevTools();
  devTools.init(store);
  return devTools;
};

// Export the class as DevToolsManager for external use
export { DevToolsManagerClass as DevToolsManager };

/**
 * ===== PERFORMANCE MEASUREMENT UTILITIES =====
 */

export const measurePerformance = <T extends (...args: any[]) => any>(
  fn: T,
  componentName: string,
  operationType: 'render' | 'update' | 'mount' | 'unmount' = 'render'
): T => {
  if (process.env.NODE_ENV !== 'development') {
    return fn;
  }

  return ((...args: Parameters<T>): ReturnType<T> => {
    const startTime = performance.now();
    const result = fn(...args);
    const endTime = performance.now();
    const duration = endTime - startTime;

    const devTools = getDevTools();
    devTools.trackPerformance(componentName, operationType, duration);

    return result;
  }) as T;
};

/**
 * ===== ERROR BOUNDARY HELPER =====
 */

export const withErrorTracking = <T extends (...args: any[]) => any>(
  fn: T,
  context: string
): T => {
  if (process.env.NODE_ENV !== 'development') {
    return fn;
  }

  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error) {
      const devTools = getDevTools();
      devTools.trackError(error as Error, context);
      throw error;
    }
  }) as T;
};

/**
 * ===== EXPORTS =====
 */

export type {
  DevToolsConfig,
  ActionHistoryEntry,
  PerformanceEntry,
  DevToolsState,
};