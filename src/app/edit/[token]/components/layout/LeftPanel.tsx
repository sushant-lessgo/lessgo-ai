// app/edit/[token]/components/layout/LeftPanel.tsx - Updated with Modal Integration
"use client";

import { useState, useEffect, useRef } from 'react';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import ConfirmedFieldTile from '@/app/create/[token]/components/ConfirmedFieldTile';
import TaxonomyModalManager from '../modals/TaxonomyModalManager';
import LoadingButtonBar from '@/components/shared/LoadingButtonBar';
import { FIELD_DISPLAY_NAMES, CANONICAL_FIELD_NAMES, HIDDEN_FIELD_DISPLAY_NAMES, type CanonicalFieldName, type AnyFieldName } from '@/types/core/index';

import { logger } from '@/lib/logger';
interface LeftPanelProps {
  tokenId: string;
}

export function LeftPanel({ tokenId }: LeftPanelProps) {
  // Get store context and state
  const { store } = useEditStoreContext();
  const leftPanel = useStoreState(state => state.leftPanel);
  const onboardingData = useStoreState(state => state.onboardingData);
  
  // Get store methods and state separately
  const storeState = store?.getState();
  const storeActions = store ? {
    setLeftPanelWidth: storeState?.setLeftPanelWidth,
    toggleLeftPanel: storeState?.toggleLeftPanel,
    regenerateAllContent: storeState?.regenerateAllContent,
    // regenerateDesignAndCopy: storeState?.regenerateDesignAndCopy, // ✅ CRITICAL: This is the method that does design regeneration // TEMP: commented for build
    // regenerateContentOnly: storeState?.regenerateContentOnly, // TEMP: commented for build
    updateOnboardingData: storeState?.updateOnboardingData,
    announceLiveRegion: storeState?.announceLiveRegion,
  } : {};
  
  // Debug: log available methods
  if (process.env.NODE_ENV === 'development') {
    logger.debug('🔍 LeftPanel Store Methods Available:', {
      regenerateAllContent: !!storeActions.regenerateAllContent,
      // regenerateDesignAndCopy: !!storeActions.regenerateDesignAndCopy, // TEMP: commented for build
      // regenerateContentOnly: !!storeActions.regenerateContentOnly, // TEMP: commented for build
      hasStore: !!store,
      hasStoreState: !!storeState,
      storeMethodKeys: storeState ? Object.keys(storeState).filter(key => 
        typeof (storeState as any)[key] === 'function' && key.includes('regenerate')
      ) : []
    });
  }
  const {
    setLeftPanelWidth,
    toggleLeftPanel,
    regenerateAllContent,
    // regenerateDesignAndCopy, // TEMP: commented for build
    // regenerateContentOnly, // TEMP: commented for build
    updateOnboardingData,
    announceLiveRegion,
  } = storeActions;
  const aiGeneration = storeState?.aiGeneration;

  const { 
    reopenFieldForEditing,
    setValidatedFields,
    setHiddenInferredFields,
    isFieldPendingRevalidation,
    removePendingRevalidationField,
  } = useOnboardingStore();
  
  // Get onboarding data from onboarding store (for fallback)
  const onboardingStoreState = useOnboardingStore.getState();
  
  // Hybrid data source: prefer edit store, fallback to onboarding store
  const oneLiner = onboardingData.oneLiner || onboardingStoreState.oneLiner;
  const validatedFields = {
    ...(onboardingStoreState.validatedFields || {}),
    ...(onboardingData.validatedFields || {})
  };
  const hiddenInferredFields = {
    ...(onboardingStoreState.hiddenInferredFields || {}),
    ...(onboardingData.hiddenInferredFields || {})
  };
  const confirmedFields = {
    ...(onboardingStoreState.confirmedFields || {}),
    ...(onboardingData.confirmedFields || {})
  };
  
  // Debug: Log when fields are available (only in development)
  if (process.env.NODE_ENV === 'development') {
    // console.log('🔍 LeftPanel Data Sources (Detailed):', {
    //   editStore: {
    //     oneLiner: onboardingData.oneLiner,
    //     validatedFields: onboardingData.validatedFields,
    //     hiddenInferredFields: onboardingData.hiddenInferredFields,
    //     validatedFieldsCount: Object.keys(onboardingData.validatedFields || {}).length,
    //     hiddenInferredFieldsCount: Object.keys(onboardingData.hiddenInferredFields || {}).length,
    //   },
    //   onboardingStore: {
    //     oneLiner: onboardingStoreState.oneLiner,
    //     validatedFields: onboardingStoreState.validatedFields,
    //     hiddenInferredFields: onboardingStoreState.hiddenInferredFields,
    //     validatedFieldsCount: Object.keys(onboardingStoreState.validatedFields || {}).length,
    //     hiddenInferredFieldsCount: Object.keys(onboardingStoreState.hiddenInferredFields || {}).length,
    //   },
    //   hybrid: {
    //     validatedFieldsCount: Object.keys(validatedFields || {}).length,
    //     hiddenInferredFieldsCount: Object.keys(hiddenInferredFields || {}).length,
    //     actualValidatedFields: validatedFields,
    //     actualHiddenInferredFields: hiddenInferredFields,
    //   }
    // });
  }

  const [isResizing, setIsResizing] = useState(false);
  const [hasFieldChanges, setHasFieldChanges] = useState(false);
  const [originalFields, setOriginalFields] = useState<Record<string, string>>({});
  // Use store's aiGeneration state instead of local state
  const isRegenerating = aiGeneration?.isGenerating && aiGeneration?.currentOperation === 'page';
  const [includeDesignRegeneration, setIncludeDesignRegeneration] = useState(false);
  const [showDesignWarning, setShowDesignWarning] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Track previous regeneration state for completion detection
  const prevIsRegeneratingRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Track regeneration completion for success feedback
  useEffect(() => {
    // Check if regeneration just completed
    if (prevIsRegeneratingRef.current && !isRegenerating) {
      // Regeneration just finished
      setShowCompletionMessage(true);
      
      // Hide completion message after 3 seconds
      const timer = setTimeout(() => {
        setShowCompletionMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    // Update the previous state
    prevIsRegeneratingRef.current = isRegenerating || false;
  }, [isRegenerating, announceLiveRegion]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= 250 && newWidth <= 500) {
      setLeftPanelWidth?.(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  const handleEditField = (fieldName: AnyFieldName) => {
    // Clear pending revalidation status when manually opening a field
    removePendingRevalidationField(fieldName as CanonicalFieldName);
    
    // Use global modal manager to open field modal
    const modalManager = (window as any).__taxonomyModalManager;
    if (modalManager) {
      const currentValue = (validatedFields as any)[fieldName] || (hiddenInferredFields as any)[fieldName] || '';
      modalManager.openFieldModal(fieldName, currentValue);
      // Field changes will be detected by the useEffect watching validatedFields/hiddenInferredFields
    } else {
      logger.error('Modal manager not available');
      // Fallback to existing method (only works for canonical fields)
      if (!(hiddenInferredFields as any)[fieldName]) {
        reopenFieldForEditing(fieldName as CanonicalFieldName);
      }
    }
  };

  const handleDesignRegenerationChange = (checked: boolean) => {
    if (checked) {
      // Show confirmation dialog before enabling
      setShowDesignWarning(true);
    } else {
      // Allow unchecking without confirmation
      setIncludeDesignRegeneration(false);
    }
  };

  const handleDesignWarningConfirm = () => {
    setIncludeDesignRegeneration(true);
    setShowDesignWarning(false);
  };

  const handleDesignWarningCancel = () => {
    setShowDesignWarning(false);
    // Keep includeDesignRegeneration as false
  };

  // Handle ESC key press for dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDesignWarning) {
        handleDesignWarningCancel();
      }
    };

    if (showDesignWarning) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showDesignWarning]);

  const handleRegenerateContent = async () => {
    if (!hasFieldChanges || isRegenerating) return;
    
    logger.debug('🔄 Starting page regeneration:', {
      includeDesignRegeneration,
      hasRegenerateAllContent: !!regenerateAllContent,
      // hasRegenerateDesignAndCopy: !!regenerateDesignAndCopy, // TEMP: commented for build
      // hasRegenerateContentOnly: !!regenerateContentOnly, // TEMP: commented for build
    });
    
    try {
      if (includeDesignRegeneration) {
        // Full regeneration: design + copy
        logger.debug('🎨 Starting design + content regeneration');
        // await regenerateDesignAndCopy?.(); // ✅ FIXED: Now calls the correct method with design changes // TEMP: commented for build
      } else {
        // Copy-only regeneration
        logger.debug('📝 Starting content-only regeneration');
        // await regenerateContentOnly?.(); // TEMP: commented for build
      }
      
      // Reset states after successful regeneration
      setHasFieldChanges(false);
      setIncludeDesignRegeneration(false);
      
      // Update original fields to current values after regeneration
      // This creates a new baseline for future change detection
      const currentFields = { ...validatedFields, ...hiddenInferredFields };
      setOriginalFields(currentFields);
      
      // Announce success for accessibility
      announceLiveRegion?.('Content regeneration completed successfully');
    } catch (error) {
      logger.error('Regeneration failed:', error);
      announceLiveRegion?.('Content regeneration failed. Please try again.');
    }
  };


  // Store original field values on mount
  useEffect(() => {
    const initialFields = { ...validatedFields, ...hiddenInferredFields };
    setOriginalFields(initialFields);
  }, []); // Only run once on mount
  
  // Sync data between stores - one-way sync on mount only to prevent infinite loops
  const syncRef = useRef(false);
  useEffect(() => {
    // Only sync once on mount to prevent infinite loops
    if (syncRef.current) return;
    
    const onboardingStoreHasData = Object.keys(onboardingStoreState.hiddenInferredFields || {}).length > 0 || 
                                   Object.keys(onboardingStoreState.validatedFields || {}).length > 0;
    const editStoreHasData = Object.keys(onboardingData.hiddenInferredFields || {}).length > 0 || 
                            Object.keys(onboardingData.validatedFields || {}).length > 0;
    
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🔄 Initial data sync check:', {
    //     onboardingStoreHasData,
    //     editStoreHasData,
    //     onboardingStoreHiddenFields: onboardingStoreState.hiddenInferredFields,
    //     editStoreHiddenFields: onboardingData.hiddenInferredFields,
    //   });
    // }
    
    // If onboarding store has data but edit store doesn't, sync onboarding → edit
    if (onboardingStoreHasData && !editStoreHasData) {
     // console.log('📤 Initial sync from onboarding store to edit store');
      updateOnboardingData?.({
        oneLiner: onboardingStoreState.oneLiner || onboardingData.oneLiner,
        validatedFields: { ...onboardingData.validatedFields, ...onboardingStoreState.validatedFields },
        hiddenInferredFields: { ...onboardingData.hiddenInferredFields, ...onboardingStoreState.hiddenInferredFields },
        confirmedFields: { ...onboardingData.confirmedFields, ...onboardingStoreState.confirmedFields },
        featuresFromAI: onboardingStoreState.featuresFromAI || onboardingData.featuresFromAI,
      });
      syncRef.current = true;
    }
    // If edit store has data but onboarding store doesn't, sync edit → onboarding  
    else if (editStoreHasData && !onboardingStoreHasData) {
     // console.log('📥 Initial sync from edit store to onboarding store');
      if (onboardingData.validatedFields && Object.keys(onboardingData.validatedFields).length > 0) {
        setValidatedFields(onboardingData.validatedFields);
      }
      if (onboardingData.hiddenInferredFields && Object.keys(onboardingData.hiddenInferredFields).length > 0) {
        setHiddenInferredFields(onboardingData.hiddenInferredFields);
      }
      syncRef.current = true;
    }
    // If both have data, mark as synced to prevent further syncing
    else if (onboardingStoreHasData && editStoreHasData) {
      syncRef.current = true;
    }
  }, []); // Empty dependency array - only run once on mount
  
  // Separate effect for real-time field updates from modal manager
  useEffect(() => {
    // Only sync field changes after initial mount sync is complete
    if (!syncRef.current) return;
    
    // This effect will handle updates from the modal manager
    // The modal manager updates the onboarding store, which we then sync to edit store
    const hasNewData = Object.keys(onboardingStoreState.validatedFields || {}).length > 0 ||
                      Object.keys(onboardingStoreState.hiddenInferredFields || {}).length > 0;
    
    if (hasNewData && updateOnboardingData) {
      // Debounce the update to prevent rapid fire updates
      const timeoutId = setTimeout(() => {
        updateOnboardingData({
          validatedFields: onboardingStoreState.validatedFields,
          hiddenInferredFields: onboardingStoreState.hiddenInferredFields,
          confirmedFields: onboardingStoreState.confirmedFields,
        });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [onboardingStoreState.validatedFields, onboardingStoreState.hiddenInferredFields, updateOnboardingData]);

  // Watch for actual field changes to enable regeneration
  useEffect(() => {
    // Skip if we don't have original fields yet (initial load)
    if (Object.keys(originalFields).length === 0) {
      return;
    }
    
    const currentFields = { ...validatedFields, ...hiddenInferredFields };
    
    // Check if all current field keys exist in original fields
    const currentKeys = Object.keys(currentFields).sort();
    const originalKeys = Object.keys(originalFields).sort();
    
    // Check for new or removed fields
    const keysChanged = currentKeys.length !== originalKeys.length || 
                       currentKeys.some((key, index) => key !== originalKeys[index]);
    
    // Check for value changes in existing fields
    const valuesChanged = currentKeys.some(key => {
      const currentValue = (currentFields as any)[key];
      const originalValue = (originalFields as any)[key];
      return currentValue !== originalValue;
    });
    
    const shouldHaveChanges = keysChanged || valuesChanged;
    
    // Update the state only if it actually changed to prevent unnecessary re-renders
    if (hasFieldChanges !== shouldHaveChanges) {
      setHasFieldChanges(shouldHaveChanges);
    }
  }, [validatedFields, hiddenInferredFields, originalFields, hasFieldChanges]);

  if (!mounted) return null;
  
  // Show panel even if oneLiner is not loaded yet
  const hasAnyFields = Object.keys(validatedFields).length > 0 || Object.keys(hiddenInferredFields).length > 0;

  // Prepare confirmed fields data (user-validated)
  const confirmedFieldsData = Object.entries(validatedFields).map(([canonicalField, value]) => {
    const canonicalFieldName = canonicalField as CanonicalFieldName;
    const displayName = FIELD_DISPLAY_NAMES[canonicalFieldName] || canonicalField;
    const originalFieldData = confirmedFields[canonicalFieldName];
    
    // Sanitize value - if it's an object with a 'value' property, extract it
    let sanitizedValue = value;
    if (typeof value === 'object' && value !== null && 'value' in value) {
      sanitizedValue = (value as any).value;
    }
    // Ensure value is a string
    const stringValue = typeof sanitizedValue === 'string' ? sanitizedValue : String(sanitizedValue || '');
    
    const isAutoConfirmed = originalFieldData && typeof originalFieldData === 'object' && 'confidence' in originalFieldData && originalFieldData.confidence >= 0.85;
    const confidence = (originalFieldData && typeof originalFieldData === 'object' && 'confidence' in originalFieldData) ? originalFieldData.confidence : 1.0;
    const isPendingRevalidation = isFieldPendingRevalidation(canonicalFieldName);
    
    return {
      canonicalField: canonicalFieldName,
      displayName,
      value: stringValue,
      isAutoConfirmed,
      confidence: confidence,
      fieldType: 'validated' as const,
      isPendingRevalidation,
    };
  });

  // Prepare hidden inferred fields data (AI-inferred, previously hidden)
  const hiddenFieldsData = Object.entries(hiddenInferredFields).map(([fieldName, value]) => {
    // Use HIDDEN_FIELD_DISPLAY_NAMES for proper display names
    const displayName = HIDDEN_FIELD_DISPLAY_NAMES[fieldName] || FIELD_DISPLAY_NAMES[fieldName as CanonicalFieldName] || fieldName;
    
    // Sanitize value - if it's an object with a 'value' property, extract it
    let sanitizedValue = value;
    if (typeof value === 'object' && value !== null && 'value' in value) {
      sanitizedValue = (value as any).value;
    }
    // Ensure value is a string
    const stringValue = typeof sanitizedValue === 'string' ? sanitizedValue : String(sanitizedValue || '');
    
    return {
      canonicalField: fieldName as AnyFieldName,
      displayName,
      value: stringValue,
      isAutoConfirmed: true, // AI inferred
      confidence: 0.75, // Default confidence for hidden fields
      fieldType: 'hidden' as const,
    };
  });

  // Combine and sort all fields
  const allFieldsData = [...confirmedFieldsData, ...hiddenFieldsData];
  const sortedFields = allFieldsData.sort((a, b) => {
    const indexA = CANONICAL_FIELD_NAMES.indexOf(a.canonicalField as any);
    const indexB = CANONICAL_FIELD_NAMES.indexOf(b.canonicalField as any);
    return indexA - indexB;
  });

  // Separate for visual hierarchy
  const validatedFieldsOnly = sortedFields.filter(f => f.fieldType === 'validated');
  const hiddenFieldsOnly = sortedFields.filter(f => f.fieldType === 'hidden');

  if (leftPanel.collapsed) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <button
          onClick={toggleLeftPanel}
          className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200"
          title="Show Input Variables Panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="transform -rotate-90 text-xs text-gray-400 whitespace-nowrap">
            Fields
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="flex bg-white border-r border-gray-200 transition-all duration-300"
        style={{ width: `${leftPanel.width}px` }}
      >
        <div className="flex-1 flex flex-col h-full max-h-screen">
          {/* Panel Header */}
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">Product Description and Inputs</h2>
            <button
              onClick={toggleLeftPanel}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Hide Panel"
            >
              ◀️
            </button>
          </div>

          {/* Scrollable Content */}
          <div className={`flex-1 overflow-y-auto min-h-0 ${hasFieldChanges ? 'max-h-[calc(100vh-300px)]' : ''} relative`}>
            {/* Loading overlay during regeneration */}
            {isRegenerating && (
              <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Updating content...</p>
                </div>
              </div>
            )}
            <div className="p-4 space-y-6">
              {/* Product Description Card - Read Only */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-sm text-blue-600 font-medium mb-2">Your Product Description</div>
                {oneLiner ? (
                  <>
                    <p className="text-base font-semibold text-gray-900 leading-relaxed">{oneLiner}</p>
                    <div className="text-xs text-blue-500 mt-2 opacity-75">This cannot be changed in edit mode</div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">Loading product description...</div>
                )}
              </div>

              {/* Validated Fields (User Confirmed) */}
              {validatedFieldsOnly.length === 0 ? (
                <div className="text-sm text-gray-400 italic text-center py-8">
                  No fields confirmed yet. Complete the onboarding to see your inputs here.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Your Confirmed Inputs</h3>
                    <span className="text-xs text-gray-500">
                      {validatedFieldsOnly.length} fields
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {validatedFieldsOnly.map(({ canonicalField, displayName, value, isPendingRevalidation }) => (
                      <div key={canonicalField} className={`rounded-lg p-4 hover:border-gray-300 transition-colors ${
                        isPendingRevalidation 
                          ? 'bg-amber-50 border-2 border-amber-200' 
                          : 'bg-white border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-700">{displayName}</h4>
                            {isPendingRevalidation && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                                ⚠️ Needs Update
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => handleEditField(canonicalField)}
                            disabled={isRegenerating}
                            className={`text-xs transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isPendingRevalidation
                                ? 'text-amber-600 hover:text-amber-700 font-medium'
                                : 'text-blue-600 hover:text-blue-700'
                            }`}
                            title={isRegenerating ? "Cannot edit during regeneration" : (isPendingRevalidation ? "Update this field" : "Edit this field")}
                          >
                            {isPendingRevalidation ? '🔄 Update' : '✏️ Edit'}
                          </button>
                        </div>
                        <p className={`text-sm leading-relaxed ${
                          isPendingRevalidation ? 'text-amber-800' : 'text-gray-900'
                        }`}>
                          {value}
                        </p>
                        {isPendingRevalidation && (
                          <p className="text-xs text-amber-600 mt-2 italic">
                            This field may need updating due to changes in related fields
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-Inferred Fields */}
              {hiddenFieldsOnly.length > 0 && (
                <div className="space-y-4">
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">AI-Inferred Fields</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Generated by AI - you can review and edit these
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {hiddenFieldsOnly.length} fields
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {hiddenFieldsOnly.map(({ canonicalField, displayName, value }) => (
                        <div key={canonicalField} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-gray-700">{displayName}</h4>
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">AI</span>
                            </div>
                            <button 
                              onClick={() => handleEditField(canonicalField)}
                              disabled={isRegenerating}
                              className="text-xs text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isRegenerating ? "Cannot edit during regeneration" : "Edit this field"}
                            >
                              ✏️ Edit
                            </button>
                          </div>
                          <p className="text-sm text-gray-900 leading-relaxed">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Sticky Regeneration Controls */}
          {(validatedFieldsOnly.length > 0 || hiddenFieldsOnly.length > 0) && (
            <div className={`flex-shrink-0 border-t border-gray-200 bg-white px-5 space-y-4 overflow-visible ${hasFieldChanges ? 'py-4 min-h-[220px]' : 'py-4'}`}>
              {hasFieldChanges && (
                <>
                  {/* Design Regeneration Option */}
                  <div className="bg-amber-50 border border-amber-200 p-1">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeDesignRegeneration}
                        onChange={(e) => handleDesignRegenerationChange(e.target.checked)}
                        className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-amber-800">
                          Also regenerate design
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Primary Regeneration Button */}
                  <button
                    onClick={handleRegenerateContent}
                    disabled={isRegenerating}
                    className={`w-full py-4 px-4 rounded-lg font-medium text-base transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed ${
                      isRegenerating 
                        ? 'bg-blue-500 text-white opacity-90' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isRegenerating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>
                          {aiGeneration?.status || (includeDesignRegeneration ? 'Regenerating Design + Content...' : 'Regenerating Content...')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>🔄</span>
                        <span>
                          {includeDesignRegeneration ? 'Regenerate Design + Content' : 'Regenerate Content Only'}
                        </span>
                      </div>
                    )}
                  </button>

                 
                </>
              )}
              
              {!hasFieldChanges && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 mb-1">✓ Content is up to date</p>
                  <p className="text-xs text-gray-400">
                    Edit any field above to enable regeneration
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resize Handle */}
        <div
          className="w-2 bg-gray-200 hover:bg-blue-300 cursor-ew-resize transition-colors flex items-center justify-center"
          onMouseDown={handleMouseDown}
          title="Resize panel"
        >
          <div className="w-0.5 h-8 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Design Warning Confirmation Dialog */}
      {showDesignWarning && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleDesignWarningCancel}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 text-lg">⚠️</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Regenerate Design & Content?
                </h3>
                <p className="text-sm text-gray-600">
                  This will completely regenerate the design including sections, layouts, and colors. 
                  All your current customizations will be lost.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button
                onClick={handleDesignWarningCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDesignWarningConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Bar Animation during Page Regeneration */}
      {isRegenerating && (
        <div className="fixed bottom-8 right-8 z-50 transition-all duration-200">
          <LoadingButtonBar
            label={aiGeneration?.status || (includeDesignRegeneration ? 'Regenerating design + content...' : 'Regenerating content...')}
            duration={15000} // 15 seconds estimated duration
            colorClass="bg-blue-600"
          />
        </div>
      )}

      {/* Completion Success Message */}
      {showCompletionMessage && (
        <div className="fixed bottom-8 right-8 z-50 transition-all duration-200">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <span className="text-lg">✓</span>
            <span className="font-medium">Content regeneration completed!</span>
          </div>
        </div>
      )}

      {/* Taxonomy Modal Manager */}
      <TaxonomyModalManager />
    </>
  );
}