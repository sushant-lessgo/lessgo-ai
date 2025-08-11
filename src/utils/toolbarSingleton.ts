// utils/toolbarSingleton.ts - Cross-bundle singleton guard for FloatingToolbars
// Prevents multiple instances from mounting even across HMR/bundles

const SINGLETON_KEY = '__ENHANCED_TOOLBAR_MOUNTED__';

/**
 * Ensures only one FloatingToolbars instance is mounted globally
 * Returns cleanup function to call on unmount
 */
export function assertToolbarSingleton(componentName: string = 'FloatingToolbars'): () => void {
  const g = globalThis as any;
  
  if (g[SINGLETON_KEY]) {
    console.error(`❌ Duplicate ${componentName} mounted! Another instance is already active.`);
    console.trace('Duplicate mount stack trace:');
    
    // In development, throw to make it obvious
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Multiple ${componentName} instances detected. Only one instance is allowed.`);
    }
  }
  
  g[SINGLETON_KEY] = true;
  console.log(`✅ ${componentName} singleton registered`);
  
  // Return cleanup function
  return () => {
    g[SINGLETON_KEY] = false;
    console.log(`🧹 ${componentName} singleton unregistered`);
  };
}

/**
 * Check if a toolbar instance is already mounted
 */
export function isToolbarMounted(): boolean {
  return !!(globalThis as any)[SINGLETON_KEY];
}

/**
 * Get debug info about toolbar mounting
 */
export function getToolbarMountInfo() {
  return {
    isMounted: isToolbarMounted(),
    singletonKey: SINGLETON_KEY,
  };
}