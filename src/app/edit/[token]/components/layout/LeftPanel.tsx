// app/edit/[token]/components/layout/LeftPanel.tsx - Updated with Modal Integration
"use client";

import { useState, useEffect } from 'react';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import ConfirmedFieldTile from '@/app/create/[token]/components/ConfirmedFieldTile';
import TaxonomyModalManager from '../modals/TaxonomyModalManager';
import { FIELD_DISPLAY_NAMES, CANONICAL_FIELD_NAMES, HIDDEN_FIELD_DISPLAY_NAMES, type CanonicalFieldName, type AnyFieldName } from '@/types/core/index';

interface LeftPanelProps {
  tokenId: string;
}

export function LeftPanel({ tokenId }: LeftPanelProps) {
  // Get store context and state
  const { store } = useEditStoreContext();
  const leftPanel = useStoreState(state => state.leftPanel);
  const onboardingData = useStoreState(state => state.onboardingData);
  
  const storeState = store?.getState();
  const {
    setLeftPanelWidth,
    toggleLeftPanel,
    regenerateAllContent,
    updateOnboardingData,
  } = storeState || {};

  const { 
    reopenFieldForEditing,
    setValidatedFields,
    setHiddenInferredFields,
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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [includeDesignRegeneration, setIncludeDesignRegeneration] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= 250 && newWidth <= 500) {
      setLeftPanelWidth(newWidth);
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
    // Use global modal manager to open field modal
    const modalManager = (window as any).__taxonomyModalManager;
    if (modalManager) {
      const currentValue = (validatedFields as any)[fieldName] || (hiddenInferredFields as any)[fieldName] || '';
      modalManager.openFieldModal(fieldName, currentValue);
      // Don't set hasFieldChanges here - wait for actual changes
    } else {
      console.error('Modal manager not available');
      // Fallback to existing method (only works for canonical fields)
      if (!(hiddenInferredFields as any)[fieldName]) {
        reopenFieldForEditing(fieldName as CanonicalFieldName);
      }
    }
  };

  const handleRegenerateContent = async () => {
    if (!hasFieldChanges || isRegenerating) return;
    
    setIsRegenerating(true);
    try {
      if (includeDesignRegeneration) {
        // Full regeneration: design + copy
        await regenerateAllContent();
      } else {
        // Copy-only regeneration
        await regenerateContentOnly();
      }
      
      // Reset states after successful regeneration
      setHasFieldChanges(false);
      setIncludeDesignRegeneration(false);
      
      // Update original fields to new values to prevent immediate re-triggering
      const newFields = { ...validatedFields, ...hiddenInferredFields };
      setOriginalFields(newFields);
    } catch (error) {
      console.error('Regeneration failed:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const regenerateContentOnly = async () => {
    // Regenerate only the text content while preserving design structure
   // console.log('Regenerating content only (preserving design)');
    
    try {
      // Call the content-only regeneration endpoint
      const response = await fetch('/api/regenerate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          fields: { ...validatedFields, ...hiddenInferredFields },
          preserveDesign: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Content regeneration failed');
      }
      
      const result = await response.json();
     // console.log('Content regeneration completed:', result);
      
      // Update the content in the store
      // This should trigger a content update without changing layout/design
      
    } catch (error) {
      console.error('Content-only regeneration failed:', error);
      // Fallback to full regeneration if content-only fails
      await regenerateAllContent();
    }
  };

  // Store original field values on mount
  useEffect(() => {
    const initialFields = { ...validatedFields, ...hiddenInferredFields };
    setOriginalFields(initialFields);
  }, []); // Only run once on mount
  
  // Sync data between stores - bidirectional sync
  useEffect(() => {
    const onboardingStoreHasData = Object.keys(onboardingStoreState.hiddenInferredFields || {}).length > 0 || 
                                   Object.keys(onboardingStoreState.validatedFields || {}).length > 0;
    const editStoreHasData = Object.keys(onboardingData.hiddenInferredFields || {}).length > 0 || 
                            Object.keys(onboardingData.validatedFields || {}).length > 0;
    
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🔄 Bidirectional sync check:', {
    //     onboardingStoreHasData,
    //     editStoreHasData,
    //     onboardingStoreHiddenFields: onboardingStoreState.hiddenInferredFields,
    //     editStoreHiddenFields: onboardingData.hiddenInferredFields,
    //   });
    // }
    
    // If onboarding store has data but edit store doesn't, sync onboarding → edit
    if (onboardingStoreHasData && !editStoreHasData) {
     // console.log('📤 Syncing from onboarding store to edit store');
      updateOnboardingData({
        oneLiner: onboardingStoreState.oneLiner || onboardingData.oneLiner,
        validatedFields: { ...onboardingData.validatedFields, ...onboardingStoreState.validatedFields },
        hiddenInferredFields: { ...onboardingData.hiddenInferredFields, ...onboardingStoreState.hiddenInferredFields },
        confirmedFields: { ...onboardingData.confirmedFields, ...onboardingStoreState.confirmedFields },
        featuresFromAI: onboardingStoreState.featuresFromAI || onboardingData.featuresFromAI,
      });
    }
    // If edit store has data but onboarding store doesn't, sync edit → onboarding  
    else if (editStoreHasData && !onboardingStoreHasData) {
     // console.log('📥 Syncing from edit store to onboarding store');
      if (onboardingData.validatedFields && Object.keys(onboardingData.validatedFields).length > 0) {
        setValidatedFields(onboardingData.validatedFields);
      }
      if (onboardingData.hiddenInferredFields && Object.keys(onboardingData.hiddenInferredFields).length > 0) {
        setHiddenInferredFields(onboardingData.hiddenInferredFields);
      }
    }
  }, [onboardingData, onboardingStoreState, updateOnboardingData, setValidatedFields, setHiddenInferredFields]);

  // Watch for actual field changes to enable regeneration
  useEffect(() => {
    const checkForChanges = () => {
      const currentFields = { ...validatedFields, ...hiddenInferredFields };
      
      // Compare current fields with original fields
      const hasChanges = Object.keys(currentFields).some(key => {
        return (currentFields as any)[key] !== (originalFields as any)[key];
      });
      
      // Also check if new fields were added
      const hasNewFields = Object.keys(currentFields).length !== Object.keys(originalFields).length;
      
      setHasFieldChanges(hasChanges || hasNewFields);
    };

    // Only check if we have original fields to compare against
    if (Object.keys(originalFields).length > 0) {
      checkForChanges();
    }
  }, [validatedFields, hiddenInferredFields, originalFields]);

  if (!mounted) return null;
  
  // Show panel even if oneLiner is not loaded yet
  const hasAnyFields = Object.keys(validatedFields).length > 0 || Object.keys(hiddenInferredFields).length > 0;

  // Prepare confirmed fields data (user-validated)
  const confirmedFieldsData = Object.entries(validatedFields).map(([canonicalField, value]) => {
    const canonicalFieldName = canonicalField as CanonicalFieldName;
    const displayName = FIELD_DISPLAY_NAMES[canonicalFieldName] || canonicalField;
    const originalFieldData = confirmedFields[canonicalFieldName];
    const isAutoConfirmed = originalFieldData && originalFieldData.confidence >= 0.85;
    
    return {
      canonicalField: canonicalFieldName,
      displayName,
      value,
      isAutoConfirmed,
      confidence: originalFieldData?.confidence || 1.0,
      fieldType: 'validated' as const,
    };
  });

  // Prepare hidden inferred fields data (AI-inferred, previously hidden)
  const hiddenFieldsData = Object.entries(hiddenInferredFields).map(([fieldName, value]) => {
    // Use HIDDEN_FIELD_DISPLAY_NAMES for proper display names
    const displayName = HIDDEN_FIELD_DISPLAY_NAMES[fieldName] || FIELD_DISPLAY_NAMES[fieldName as CanonicalFieldName] || fieldName;
    
    return {
      canonicalField: fieldName as AnyFieldName,
      displayName,
      value,
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
          <div className="flex-1 overflow-y-auto min-h-0">
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
                    {validatedFieldsOnly.map(({ canonicalField, displayName, value }) => (
                      <div key={canonicalField} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">{displayName}</h4>
                          <button 
                            onClick={() => handleEditField(canonicalField)}
                            className="text-xs text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                            title="Edit this field"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                        <p className="text-sm text-gray-900 leading-relaxed">{value}</p>
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
                              className="text-xs text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                              title="Edit this field"
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
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 space-y-3">
              {hasFieldChanges && (
                <>
                  {/* Design Regeneration Option */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeDesignRegeneration}
                        onChange={(e) => setIncludeDesignRegeneration(e.target.checked)}
                        className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-amber-800">
                          Also regenerate design
                        </div>
                        <div className="text-xs text-amber-700 mt-1">
                          Changes sections, layouts & colors. Will lose customizations.
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Primary Regeneration Button */}
                  <button
                    onClick={handleRegenerateContent}
                    disabled={isRegenerating}
                    className="w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegenerating ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span>
                          {includeDesignRegeneration ? 'Regenerating Design + Content...' : 'Regenerating Content...'}
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

                  <p className="text-xs text-gray-500 text-center">
                    {includeDesignRegeneration 
                      ? 'This will completely regenerate design and content'
                      : 'This will update copy while preserving your current design'
                    }
                  </p>
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

      {/* Taxonomy Modal Manager */}
      <TaxonomyModalManager />
    </>
  );
}