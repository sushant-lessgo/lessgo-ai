// app/edit/[token]/components/layout/LeftPanel.tsx - Updated with Modal Integration
"use client";

import { useState, useEffect } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import ConfirmedFieldTile from '@/app/create/[token]/components/ConfirmedFieldTile';
import TaxonomyModalManager from '../modals/TaxonomyModalManager';
import { FIELD_DISPLAY_NAMES, CANONICAL_FIELD_NAMES, type CanonicalFieldName } from '@/types/core/index';

interface LeftPanelProps {
  tokenId: string;
}

export function LeftPanel({ tokenId }: LeftPanelProps) {
  const {
    leftPanel,
    setLeftPanelWidth,
    toggleLeftPanel,
    regenerateAllContent,
  } = useEditStore();

  const { 
    oneLiner, 
    validatedFields, 
    confirmedFields, 
    hiddenInferredFields,
    reopenFieldForEditing 
  } = useOnboardingStore();

  const [isResizing, setIsResizing] = useState(false);
  const [hasFieldChanges, setHasFieldChanges] = useState(false);
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

  const handleEditField = (canonicalField: CanonicalFieldName) => {
    console.log(`Opening modal for field: ${canonicalField}`);
    
    // Use global modal manager to open field modal
    const modalManager = (window as any).__taxonomyModalManager;
    if (modalManager) {
      const currentValue = validatedFields[canonicalField] || hiddenInferredFields[canonicalField] || '';
      modalManager.openFieldModal(canonicalField, currentValue);
      setHasFieldChanges(true);
    } else {
      console.error('Modal manager not available');
      // Fallback to existing method
      reopenFieldForEditing(canonicalField);
      setHasFieldChanges(true);
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
        // Copy-only regeneration (implement this method)
        await regenerateContentOnly();
      }
      setHasFieldChanges(false);
      setIncludeDesignRegeneration(false);
    } catch (error) {
      console.error('Regeneration failed:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const regenerateContentOnly = async () => {
    // TODO: Implement copy-only regeneration
    // This should regenerate text content while preserving design structure
    console.log('Regenerating content only (preserving design)');
    await regenerateAllContent(); // Temporary fallback
  };

  // Watch for field changes to enable regeneration
  useEffect(() => {
    const checkForChanges = () => {
      // This could be enhanced to detect actual changes from initial state
      const hasValidatedFields = Object.keys(validatedFields).length > 0;
      const hasHiddenFields = Object.keys(hiddenInferredFields).length > 0;
      
      // For now, just check if we have fields and assume changes if regeneration was enabled before
      setHasFieldChanges(hasValidatedFields || hasHiddenFields);
    };

    checkForChanges();
  }, [validatedFields, hiddenInferredFields]);

  if (!mounted || !oneLiner) return null;

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
  const hiddenFieldsData = Object.entries(hiddenInferredFields).map(([canonicalField, value]) => {
    const canonicalFieldName = canonicalField as CanonicalFieldName;
    const displayName = FIELD_DISPLAY_NAMES[canonicalFieldName] || canonicalField;
    
    return {
      canonicalField: canonicalFieldName,
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
    const indexA = CANONICAL_FIELD_NAMES.indexOf(a.canonicalField);
    const indexB = CANONICAL_FIELD_NAMES.indexOf(b.canonicalField);
    return indexA - indexB;
  });

  // Separate for visual hierarchy
  const validatedFieldsOnly = sortedFields.filter(f => f.fieldType === 'validated');
  const hiddenFieldsOnly = sortedFields.filter(f => f.fieldType === 'hidden');

  if (leftPanel.collapsed) {
    return (
      <div className="flex flex-col bg-gray-50 border-r border-gray-200">
        <button
          onClick={toggleLeftPanel}
          className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Show Input Variables"
        >
          ▶️
        </button>
      </div>
    );
  }

  return (
    <>
      <div 
        className="flex bg-white border-r border-gray-200 transition-all duration-300"
        style={{ width: `${leftPanel.width}px` }}
      >
        <div className="flex-1 flex flex-col h-full">
          {/* Panel Header */}
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
            <h2 className="text-base font-semibold text-gray-900">Product Description and Inputs</h2>
            <button
              onClick={toggleLeftPanel}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Hide Panel"
            >
              ◀️
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Product Description Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-sm text-blue-600 font-medium mb-2">Your Product Description</div>
              <p className="text-base font-semibold text-gray-900 leading-relaxed">{oneLiner}</p>
            </div>

            {/* Confirmed Fields (Primary) */}
            {validatedFieldsOnly.length === 0 ? (
              <div className="text-sm text-gray-400 italic text-center py-8">
                No fields confirmed yet. Complete the onboarding to see your inputs here.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Your Confirmed Inputs</h3>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {validatedFieldsOnly.length} confirmed
                  </span>
                </div>
                
                {validatedFieldsOnly.map(({ canonicalField, displayName, value, isAutoConfirmed, confidence }) => (
                  <ConfirmedFieldTile 
                    key={canonicalField}
                    field={displayName}
                    value={value}
                    isAutoConfirmed={isAutoConfirmed}
                    confidence={confidence}
                    onEdit={() => handleEditField(canonicalField)}
                  />
                ))}
              </div>
            )}

            {/* Hidden AI Inferences (Secondary) */}
            {hiddenFieldsOnly.length > 0 && (
              <div className="space-y-4">
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">AI Inferences</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Additional insights you can review and edit
                      </p>
                    </div>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {hiddenFieldsOnly.length} inferred
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {hiddenFieldsOnly.map(({ canonicalField, displayName, value, isAutoConfirmed, confidence }) => (
                      <div key={canonicalField} className="opacity-90">
                        <ConfirmedFieldTile 
                          field={displayName}
                          value={value}
                          isAutoConfirmed={isAutoConfirmed}
                          confidence={confidence}
                          onEdit={() => handleEditField(canonicalField)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Regeneration Controls */}
            {(validatedFieldsOnly.length > 0 || hiddenFieldsOnly.length > 0) && (
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {/* Design Regeneration Option */}
                {hasFieldChanges && (
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
                )}

                {/* Primary Regeneration Button */}
                <button
                  onClick={handleRegenerateContent}
                  disabled={!hasFieldChanges || isRegenerating}
                  className={`
                    w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200
                    ${hasFieldChanges && !isRegenerating
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isRegenerating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      <span>
                        {includeDesignRegeneration ? 'Regenerating Design + Content...' : 'Regenerating Content...'}
                      </span>
                    </div>
                  ) : hasFieldChanges ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span>🔄</span>
                      <span>
                        {includeDesignRegeneration ? 'Regenerate Design + Content' : 'Regenerate Content'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>✓</span>
                      <span>Content is up to date</span>
                    </div>
                  )}
                </button>
                
                {!hasFieldChanges && (
                  <p className="text-xs text-gray-500 text-center">
                    Edit any field above to enable regeneration
                  </p>
                )}

                {hasFieldChanges && !includeDesignRegeneration && (
                  <p className="text-xs text-gray-500 text-center">
                    This will update copy while preserving your current design
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="w-1 bg-gray-200 hover:bg-gray-300 cursor-ew-resize transition-colors"
          onMouseDown={handleMouseDown}
          title="Resize panel"
        />
      </div>

      {/* Taxonomy Modal Manager */}
      <TaxonomyModalManager />
    </>
  );
}