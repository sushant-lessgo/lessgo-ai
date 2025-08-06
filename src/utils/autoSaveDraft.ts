// utils/autoSaveDraft.ts - Enhanced Version with Edit Store Integration
import type { 
  FeatureItem, 
  InputVariables, 
  HiddenInferredFields,
  CanonicalFieldName 
} from '@/types/core/index';

// Enhanced interface to match what's being passed from both onboarding and edit stores
interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

interface AutoSaveDraftParams {
  tokenId: string;
  inputText?: string;
  stepIndex?: number;
  confirmedFields?: Record<string, ConfirmedFieldData>;
  validatedFields?: Record<string, string>;
  featuresFromAI?: FeatureItem[];
  hiddenInferredFields?: HiddenInferredFields;
  title?: string;
  includePageData?: boolean;
  serializationOptions?: SerializationOptions;
  // Enhanced parameters for edit store integration
  source?: 'onboarding' | 'edit' | 'persistence-manager';
  conflictResolution?: 'ignore' | 'overwrite' | 'merge';
  saveMetadata?: {
    description?: string;
    source: 'user' | 'ai' | 'system';
    triggeredBy?: 'timer' | 'user-action' | 'data-change' | 'navigation';
    sessionId?: string;
    changes?: Array<{
      type: 'content' | 'layout' | 'theme';
      sectionId?: string;
      elementKey?: string;
      field?: string;
    }>;
  };
  
  // Version information for conflict detection
  localVersion?: number;
  lastSaved?: number;
  
  // Performance options
  enableCompression?: boolean;
  compressionThreshold?: number;
  
  // Validation options
  validateBeforeSave?: boolean;
  skipValidation?: boolean;
}

interface AutoSaveDraftResult {
  success: boolean;
  timestamp: number;
  version?: number;
  savedFields?: string[];
  skippedFields?: string[];
  warnings?: string[];
  error?: string;
  conflictDetected?: boolean;
  serverData?: any;
  metrics?: {
    saveTime: number;
    dataSize: number;
    compressionRatio?: number;
  };
}

interface SerializationOptions {
  useContentSerializer?: boolean;
  validateSerialization?: boolean;
  includeContentSummary?: boolean;
}

/**
 * ===== ENHANCED AUTO-SAVE FUNCTION =====
 */

export async function autoSaveDraft(params: AutoSaveDraftParams): Promise<AutoSaveDraftResult> {
  const startTime = Date.now();
  
  const {
    tokenId,
    inputText,
    stepIndex,
    confirmedFields = {},
    validatedFields = {},
    featuresFromAI = [],
    hiddenInferredFields = {},
    title,
    includePageData = false,
    source = 'onboarding',
    conflictResolution = 'ignore',
    saveMetadata,
    localVersion,
    lastSaved,
    enableCompression = false,
    compressionThreshold = 102400, // 100KB
    validateBeforeSave = true,
    skipValidation = false,
  } = params;

  try {
    // Auto-saving draft data

    // Step 1: Validate data before saving (if enabled)
    if (validateBeforeSave && !skipValidation) {
      const validation = await validateSaveData({
        validatedFields,
        hiddenInferredFields,
        featuresFromAI,
        tokenId,
      });
      
      if (!validation.isValid) {
        console.warn('⚠️ Save validation warnings:', validation.warnings);
        // Continue with warnings, but log them
      }
    }

    // Step 2: Prepare the base payload
    const payload: any = {
      tokenId,
      inputText,
      stepIndex,
      confirmedFields,
      validatedFields,
      featuresFromAI,
      hiddenInferredFields,
      title,
      
      // Enhanced metadata
      saveMetadata: {
        source,
        timestamp: Date.now(),
        ...saveMetadata,
      },
      
      // Version information for conflict detection
      ...(localVersion && { localVersion }),
      ...(lastSaved && { lastSaved }),
    };


// Step 3: Include page data with serialization support
   let pageData: any = null;
if (includePageData) {
  try {
    const { serializationOptions = {} } = params;
    
    if (source === 'edit' || source === 'persistence-manager') {
      const { storeManager } = await import('@/stores/storeManager');
      const editStore = storeManager.getEditStore(tokenId);
      const editStoreState = editStore.getState();
      
      if (serializationOptions.useContentSerializer) {
        // Use content serializer for structured data
        const { useContentSerializer } = await import('@/hooks/useContentSerializer');
        const { serialize, validate, getSerializedSize } = useContentSerializer();
        
        const serializedContent = serialize();
        
        if (serializationOptions.validateSerialization) {
          const validation = validate(serializedContent);
          if (!validation.isValid) {
            console.warn('⚠️ Serialization validation failed:', validation.errors);
            payload.warnings = validation.errors;
          }
        }
        
        pageData = serializedContent;
        
        if (serializationOptions.includeContentSummary) {
          const { getContentSummary } = await import('@/utils/contentSerialization');
          payload.contentSummary = getContentSummary(serializedContent);
        }
        
        // Using content serializer for structured save
      } else {
        // Use standard export
        pageData = editStoreState.export();
      }
    } else {
      // Fallback to onboarding - use token-based store
      const { storeManager } = await import('@/stores/storeManager');
      const editStore = storeManager.getEditStore(tokenId);
      const editStoreState = editStore.getState();
      pageData = editStoreState.export();
    }
  } catch (error) {
    console.warn('⚠️ Could not get page data for save:', error);
  }
  
  if (pageData) {
    payload.finalContent = {
      ...pageData,
      generatedAt: Date.now(),
      source: source,
      version: localVersion || 1,
    };
    
    // Auto-saving with page data
  }
}

    // Step 4: Add theme values
    try {
      const { storeManager } = await import('@/stores/storeManager');
      const editStore = storeManager.getEditStore(tokenId);
      const editStoreState = editStore.getState();
      
      if (editStoreState.getColorTokens) {
        const colorTokens = editStoreState.getColorTokens();
        
        payload.themeValues = {
          primary: colorTokens.accent,
          background: colorTokens.bgNeutral,
          muted: colorTokens.textMuted,
        };
      }
    } catch (error) {
      console.warn('Could not get color tokens for theme values:', error);
    }

    // Step 5: Apply compression if enabled and data is large enough
    const payloadSize = new Blob([JSON.stringify(payload)]).size;
    let compressionRatio = 1;
    
    if (enableCompression && payloadSize > compressionThreshold) {
      try {
        // Simple compression flag - actual compression would be handled by the server
        payload._compressionRequested = true;
        // Compression requested for large payload
      } catch (error) {
        console.warn('⚠️ Compression failed:', error);
      }
    }

    // Step 6: Handle conflict detection
    if (conflictResolution !== 'ignore' && lastSaved) {
      try {
        const conflictCheck = await checkForConflicts(tokenId, lastSaved);
        if (conflictCheck.hasConflict) {
          console.warn('🔄 Conflict detected during save:', conflictCheck);
          
          if (conflictResolution === 'overwrite') {
            payload._forceOverwrite = true;
          } else if (conflictResolution === 'merge') {
            // Attempt simple merge
            payload._attemptMerge = true;
            payload._serverVersion = conflictCheck.serverVersion;
          } else {
            // Return conflict for manual resolution
            return {
              success: false,
              timestamp: Date.now(),
              error: 'Conflict detected',
              conflictDetected: true,
              serverData: conflictCheck.serverData,
              metrics: {
                saveTime: Date.now() - startTime,
                dataSize: payloadSize,
              },
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ Conflict detection failed, proceeding with save:', error);
      }
    }

    // Step 7: Execute the save operation
    const response = await fetch('/api/saveDraft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const endTime = Date.now();
    const saveTime = endTime - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    // Step 8: Process successful response
    // Auto-save successful
    
    return {
      success: true,
      timestamp: endTime,
      version: result.version,
      savedFields: Object.keys(payload).filter(key => !key.startsWith('_')),
      metrics: {
        saveTime,
        dataSize: payloadSize,
        compressionRatio,
      },
    };

  } catch (error) {
    const endTime = Date.now();
    const saveTime = endTime - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    console.error('❌ Auto-save failed:', {
      error: errorMessage,
      saveTime: `${saveTime}ms`,
      tokenId,
      source,
    });
    
    return {
      success: false,
      timestamp: endTime,
      error: errorMessage,
      metrics: {
        saveTime,
        dataSize: 0,
      },
    };
  }
}

/**
 * ===== VALIDATION UTILITIES =====
 */

async function validateSaveData(data: {
  validatedFields?: Record<string, string>;
  hiddenInferredFields?: HiddenInferredFields;
  featuresFromAI?: FeatureItem[];
  tokenId: string;
}): Promise<{ isValid: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  
  try {
    // Import type guards for validation
    const { TypeGuards } = await import('@/utils/typeGuards');
    
    // Validate the structure if we have onboarding data
    if (data.validatedFields && Object.keys(data.validatedFields).length > 0) {
      const validation = TypeGuards.validateCompleteInputData({
        inputVariables: data.validatedFields,
        hiddenInferredFields: data.hiddenInferredFields,
        features: data.featuresFromAI,
      });
      
      if (!validation.isValid) {
        warnings.push(...validation.errors);
      }
      
      warnings.push(...validation.warnings);
    }
    
    // Check for required fields
    if (!data.tokenId || data.tokenId.trim() === '') {
      warnings.push('Token ID is required');
    }
    
    return {
      isValid: warnings.length === 0,
      warnings,
    };
    
  } catch (error) {
    warnings.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      isValid: false,
      warnings,
    };
  }
}

/**
 * ===== CONFLICT DETECTION =====
 */

async function checkForConflicts(tokenId: string, lastSaved: number): Promise<{
  hasConflict: boolean;
  serverData?: any;
  serverVersion?: number;
}> {
  try {
    const response = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
    
    if (!response.ok) {
      console.warn('⚠️ Could not check for conflicts - load failed');
      return { hasConflict: false };
    }
    
    const serverData = await response.json();
    const serverModified = new Date(serverData.lastUpdated || 0).getTime();
    
    // Simple conflict detection: server modified after our last save
    const hasConflict = serverModified > lastSaved;
    
    if (hasConflict) {
      console.log('🔄 Conflict detected:', {
        serverModified: new Date(serverModified).toISOString(),
        localLastSaved: new Date(lastSaved).toISOString(),
        timeDiff: `${Math.round((serverModified - lastSaved) / 1000)}s`,
      });
    }
    
    return {
      hasConflict,
      serverData,
      serverVersion: serverData.version,
    };
    
  } catch (error) {
    console.warn('⚠️ Conflict detection failed:', error);
    return { hasConflict: false };
  }
}

/**
 * ===== BATCH SAVE UTILITIES =====
 */

interface BatchSaveItem {
  tokenId: string;
  data: Partial<AutoSaveDraftParams>;
  priority: number;
}

interface BatchSaveOptions {
  maxBatchSize?: number;
  batchTimeout?: number;
  retryFailedSaves?: boolean;
  enableParallelProcessing?: boolean;
}

export async function batchSaveDrafts(
  items: BatchSaveItem[],
  options: BatchSaveOptions = {}
): Promise<Array<{ tokenId: string; result: AutoSaveDraftResult }>> {
  const {
    maxBatchSize = 10,
    batchTimeout = 30000,
    retryFailedSaves = true,
    enableParallelProcessing = false,
  } = options;

  console.log('📦 Starting batch save:', {
    itemCount: items.length,
    maxBatchSize,
    enableParallelProcessing,
  });

  const results: Array<{ tokenId: string; result: AutoSaveDraftResult }> = [];
  
  // Sort by priority (lower number = higher priority)
  const sortedItems = [...items].sort((a, b) => a.priority - b.priority);
  
  // Process in batches
  for (let i = 0; i < sortedItems.length; i += maxBatchSize) {
    const batch = sortedItems.slice(i, i + maxBatchSize);
    
    try {
      const batchPromises = batch.map(async (item) => {
        try {
          // Fix #1: Ensure tokenId is required and present
          const saveParams: AutoSaveDraftParams = {
            tokenId: item.tokenId, // This is guaranteed to exist from BatchSaveItem
            ...item.data,
          };
          
          const result = await Promise.race([
            autoSaveDraft(saveParams),
            new Promise<AutoSaveDraftResult>((_, reject) => 
              setTimeout(() => reject(new Error('Batch save timeout')), batchTimeout)
            ),
          ]);
          
          return { tokenId: item.tokenId, result };
        } catch (error) {
          const errorResult: AutoSaveDraftResult = {
            success: false,
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : 'Batch save failed',
            metrics: { saveTime: 0, dataSize: 0 },
          };
          
          return { tokenId: item.tokenId, result: errorResult };
        }
      });
      
      // Fix #2: Properly handle Promise.allSettled results
      const batchResults = enableParallelProcessing 
        ? await Promise.all(batchPromises)
        : await Promise.allSettled(batchPromises).then(results => 
            results
              .filter((r): r is PromiseFulfilledResult<{ tokenId: string; result: AutoSaveDraftResult }> => 
                r.status === 'fulfilled'
              )
              .map(r => r.value)
          );
      
      results.push(...batchResults);
      
      // Brief pause between batches to avoid overwhelming the server
      if (i + maxBatchSize < sortedItems.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error('❌ Batch save failed:', error);
      
      // Add failed results for this batch
      batch.forEach(item => {
        results.push({
          tokenId: item.tokenId,
          result: {
            success: false,
            timestamp: Date.now(),
            error: 'Batch processing failed',
            metrics: { saveTime: 0, dataSize: 0 },
          },
        });
      });
    }
  }
  
  // Retry failed saves if enabled
  if (retryFailedSaves) {
    const failedItems = results
      .filter(r => !r.result.success)
      .map(r => {
        const originalItem = items.find(i => i.tokenId === r.tokenId);
        return originalItem ? {
          tokenId: r.tokenId,
          data: originalItem.data,
          priority: 1
        } : null;
      })
      .filter((item): item is BatchSaveItem => item !== null);
    
    if (failedItems.length > 0) {
      console.log('🔄 Retrying failed saves:', { count: failedItems.length });
      
      const retryResults = await batchSaveDrafts(failedItems, {
        ...options,
        retryFailedSaves: false, // Prevent infinite retry
      });
      
      // Update results with retry results
      retryResults.forEach(retryResult => {
        const originalIndex = results.findIndex(r => r.tokenId === retryResult.tokenId);
        if (originalIndex !== -1) {
          results[originalIndex] = retryResult;
        }
      });
    }
  }
  
  const successCount = results.filter(r => r.result.success).length;
  const failureCount = results.length - successCount;
  
  console.log('📦 Batch save completed:', {
    total: results.length,
    successful: successCount,
    failed: failureCount,
    successRate: `${Math.round((successCount / results.length) * 100)}%`,
  });
  
  return results;
}

/**
 * ===== SPECIALIZED SAVE FUNCTIONS =====
 */

// Quick save for minimal data (onboarding steps)
export async function quickSaveDraft(tokenId: string, data: {
  inputText?: string;
  stepIndex?: number;
  validatedFields?: Record<string, string>;
}): Promise<AutoSaveDraftResult> {
  return autoSaveDraft({
    tokenId,
    ...data,
    source: 'onboarding',
    skipValidation: true,
    includePageData: false,
  });
}

// Complete save for full edit store data
export async function completeSaveDraft(tokenId: string, options?: {
  description?: string;
  createSnapshot?: boolean;
  forceOverwrite?: boolean;
}): Promise<AutoSaveDraftResult> {
  const { description, createSnapshot, forceOverwrite } = options || {};
  
  return autoSaveDraft({
    tokenId,
    source: 'edit',
    includePageData: true,
    validateBeforeSave: true,
    conflictResolution: forceOverwrite ? 'overwrite' : 'merge',
    saveMetadata: {
      description: description || 'Complete save',
      source: 'user',
      triggeredBy: 'user-action',
      sessionId: generateSessionId(),
    },
  });
}

// Serialized complete save
export async function serializedSaveDraft(tokenId: string, options?: {
  description?: string;
  validateSerialization?: boolean;
  includeContentSummary?: boolean;
  forceOverwrite?: boolean;
}): Promise<AutoSaveDraftResult> {
  const { description, validateSerialization, includeContentSummary, forceOverwrite } = options || {};
  
  return autoSaveDraft({
    tokenId,
    source: 'edit',
    includePageData: true,
    validateBeforeSave: true,
    conflictResolution: forceOverwrite ? 'overwrite' : 'merge',
    serializationOptions: {
      useContentSerializer: true,
      validateSerialization: validateSerialization ?? true,
      includeContentSummary: includeContentSummary ?? true,
    },
    saveMetadata: {
      description: description || 'Serialized complete save',
      source: 'user',
      triggeredBy: 'user-action',
      sessionId: generateSessionId(),
    },
  });
}

// Load with deserialization support
export async function loadDraftWithDeserialization(tokenId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/loadDraft?tokenId=${encodeURIComponent(tokenId)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we have serialized content
    if (data.finalContent && data.finalContent.version) {
      const { useContentSerializer } = await import('@/hooks/useContentSerializer');
      const { deserialize, validate } = useContentSerializer();
      
      // Validate before deserializing
      const validation = validate(data.finalContent);
      if (!validation.isValid) {
        console.warn('⚠️ Deserialization validation failed:', validation.errors);
        // Continue with warnings
      }
      
      // Deserialize into edit store
      deserialize(data.finalContent);
      
      console.log('✅ Successfully loaded and deserialized content');
      return { success: true, data };
    } else {
      // Fallback to standard loading
      const { storeManager } = await import('@/stores/storeManager');
      const editStore = storeManager.getEditStore(tokenId);
      const editStoreState = editStore.getState();
      
      await editStoreState.loadFromDraft(data, tokenId);
      
      console.log('✅ Successfully loaded content (fallback method)');
      return { success: true, data };
    }
  } catch (error) {
    console.error('❌ Failed to load draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Background auto-save
export async function backgroundSaveDraft(tokenId: string): Promise<AutoSaveDraftResult> {
  return autoSaveDraft({
    tokenId,
    source: 'persistence-manager',
    includePageData: true,
    validateBeforeSave: false,
    conflictResolution: 'ignore', // Background saves shouldn't conflict
    enableCompression: true,
    saveMetadata: {
      description: 'Background auto-save',
      source: 'system',
      triggeredBy: 'timer',
      sessionId: generateSessionId(),
    },
  });
}

/**
 * ===== UTILITIES =====
 */

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Extract meaningful data summary for logging
export function getSaveDataSummary(params: AutoSaveDraftParams): {
  hasOnboardingData: boolean;
  hasPageData: boolean;
  dataSize: string;
  keyFields: string[];
} {
  const onboardingFields = [
    params.inputText && 'inputText',
    params.validatedFields && Object.keys(params.validatedFields).length > 0 && 'validatedFields',
    params.featuresFromAI && params.featuresFromAI.length > 0 && 'featuresFromAI',
    params.hiddenInferredFields && Object.keys(params.hiddenInferredFields).length > 0 && 'hiddenInferredFields',
  ].filter(Boolean) as string[];
  
  const hasOnboardingData = onboardingFields.length > 0;
  // Fix #3: Provide explicit boolean value instead of potentially undefined
  const hasPageData = Boolean(params.includePageData);
  
  const dataSize = new Blob([JSON.stringify(params)]).size;
  const dataSizeFormatted = dataSize > 1024 
    ? `${(dataSize / 1024).toFixed(2)}KB`
    : `${dataSize}B`;
  
  return {
    hasOnboardingData,
    hasPageData,
    dataSize: dataSizeFormatted,
    keyFields: onboardingFields,
  };
}

/**
 * ===== BACKWARDS COMPATIBILITY =====
 * Maintain the original autoSaveDraft function signature for existing code
 */

// Legacy function signature for backwards compatibility
interface LegacyAutoSaveDraftParams {
  tokenId: string;
  inputText?: string;
  stepIndex?: number;
  confirmedFields?: Record<string, ConfirmedFieldData>;
  validatedFields?: Record<string, string>;
  featuresFromAI?: FeatureItem[];
  hiddenInferredFields?: HiddenInferredFields;
  title?: string;
  includePageData?: boolean;
}

// Keep original function working
export async function legacyAutoSaveDraft(params: LegacyAutoSaveDraftParams) {
  // Convert to new format and call enhanced version
  return autoSaveDraft({
    ...params,
    source: 'onboarding',
    conflictResolution: 'ignore',
  });
}

/**
 * ===== DEVELOPMENT UTILITIES =====
 */

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).__autoSaveDraftDebug = {
    // Direct functions
    autoSaveDraft,
    quickSaveDraft,
    completeSaveDraft,
    backgroundSaveDraft,
    batchSaveDrafts,
    
    // Utilities
    getSaveDataSummary,
    validateSaveData,
    checkForConflicts,
    
    // Test scenarios
    testSave: async (tokenId: string) => {
      console.log('🧪 Testing auto-save...');
      return autoSaveDraft({
        tokenId,
        inputText: 'Test input',
        title: 'Test Project',
        source: 'edit',
        saveMetadata: {
          description: 'Debug test save',
          source: 'user',
          triggeredBy: 'user-action',
        },
      });
    },
    
    testBatchSave: async (tokenIds: string[]) => {
      console.log('🧪 Testing batch save...');
      const items = tokenIds.map((tokenId, index) => ({
        tokenId,
        data: {
          tokenId,
          inputText: `Test batch ${index}`,
          title: `Test Project ${index}`,
          source: 'edit' as const,
        },
        priority: index,
      }));
      
      return batchSaveDrafts(items);
    },
    
    simulateConflict: async (tokenId: string) => {
      console.log('🧪 Simulating conflict...');
      return autoSaveDraft({
        tokenId,
        lastSaved: Date.now() - 60000, // 1 minute ago
        conflictResolution: 'merge',
        source: 'edit',
        saveMetadata: {
          description: 'Conflict simulation',
          source: 'user',
        },
      });
    },

    // Serialization functions
    serializedSaveDraft,
    loadDraftWithDeserialization,
    
    // Test serialization
    testSerialization: async (tokenId: string) => {
      console.log('🧪 Testing serialization...');
      const { useContentSerializer } = await import('@/hooks/useContentSerializer');
      const { serialize, validate, getSerializedSize } = useContentSerializer();
      
      const serialized = serialize();
      const validation = validate(serialized);
      const size = getSerializedSize();
      
      console.log('📊 Serialization test results:', {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        size: `${(size / 1024).toFixed(2)}KB`,
        content: serialized,
      });
      
      return { serialized, validation, size };
    },
    
    testDeserialization: async (data: any) => {
      console.log('🧪 Testing deserialization...');
      const { useContentSerializer } = await import('@/hooks/useContentSerializer');
      const { deserialize, validate } = useContentSerializer();
      
      const validation = validate(data);
      if (validation.isValid) {
        deserialize(data);
        console.log('✅ Deserialization successful');
      } else {
        console.error('❌ Deserialization failed:', validation.errors);
      }
      
      return validation;
    },
  };
  
  console.log('🔧 Enhanced AutoSaveDraft debug utilities available at window.__autoSaveDraftDebug');

  
}