// app/edit/[token]/components/toolbars/ElementToolbar.tsx - Complete Element Toolbar
import React, { useState, useRef, useEffect } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useToolbarActions } from '@/hooks/useToolbarActions';
import { calculateArrowPosition } from '@/utils/toolbarPositioning';
import { AdvancedActionsMenu } from './AdvancedActionsMenu';

interface ElementToolbarProps {
  elementSelection: any;
  position: { x: number; y: number };
  contextActions: any[];
}

export function ElementToolbar({ elementSelection, position, contextActions }: ElementToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState(0);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);
  const variationsRef = useRef<HTMLDivElement>(null);

  const {
    regenerateElement,
    showElementVariations,
    hideElementVariations,
    applySelectedVariation,
    updateElementContent,
    content,
    announceLiveRegion,
  } = useEditStore();

  const { executeAction } = useToolbarActions();

  // Calculate arrow position
  const targetSelector = `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`;
  const targetElement = document.querySelector(targetSelector);
  const arrowInfo = targetElement ? calculateArrowPosition(
    position,
    targetElement.getBoundingClientRect(),
    { width: 380, height: 48 }
  ) : null;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        advancedRef.current &&
        !advancedRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowAdvanced(false);
      }
      if (
        variationsRef.current &&
        !variationsRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowVariations(false);
      }
    };

    if (showAdvanced || showVariations) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAdvanced, showVariations]);

  // Handle regeneration with variations
  const handleRegenerateWithVariations = async () => {
    try {
      await regenerateElement(elementSelection.sectionId, elementSelection.elementKey, 5);
      
      // Mock variations for now - in production this would come from the store
      const mockVariations = [
        "Original version of the content",
        "Enhanced version with more details",
        "Shorter, more concise version",
        "More persuasive tone version",
        "Technical-focused version"
      ];
      
      setVariations(mockVariations);
      setSelectedVariation(0);
      setShowVariations(true);
      
      announceLiveRegion('Generated 5 variations');
    } catch (error) {
      console.error('Failed to generate variations:', error);
    }
  };

  // Apply selected variation
  const handleApplyVariation = () => {
    if (variations[selectedVariation]) {
      updateElementContent(
        elementSelection.sectionId,
        elementSelection.elementKey,
        variations[selectedVariation]
      );
      setShowVariations(false);
      announceLiveRegion(`Applied variation ${selectedVariation + 1}`);
    }
  };

  // Convert CTA to form
  const handleConvertToForm = () => {
    if (elementSelection.elementKey.includes('cta')) {
      executeAction('convert-cta-to-form', { 
        sectionId: elementSelection.sectionId,
        elementKey: elementSelection.elementKey 
      });
      announceLiveRegion('Converting CTA to form');
    }
  };

  // Get element type for context
  const getElementType = () => {
    const elementKey = elementSelection.elementKey;
    if (elementKey.includes('cta') || elementKey.includes('button')) return 'button';
    if (elementKey.includes('headline')) return 'headline';
    if (elementKey.includes('text')) return 'text';
    return 'element';
  };

  // Check if element can be converted to form
  const canConvertToForm = () => {
    return elementSelection.elementKey.includes('cta') || elementSelection.elementKey.includes('button');
  };

  // Primary Actions
  const primaryActions = [
    {
      id: 'regenerate-copy',
      label: 'Regenerate',
      icon: 'refresh',
      handler: () => {
        regenerateElement(elementSelection.sectionId, elementSelection.elementKey);
        announceLiveRegion(`Regenerating ${elementSelection.elementKey}`);
      },
    },
    {
      id: 'get-variations',
      label: 'Variations',
      icon: 'variations',
      handler: handleRegenerateWithVariations,
    },
    {
      id: 'element-style',
      label: 'Style',
      icon: 'palette',
      handler: () => executeAction('element-style', { elementSelection }),
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      handler: () => executeAction('duplicate-element', { elementSelection }),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      handler: () => {
        if (confirm('Are you sure you want to delete this element?')) {
          executeAction('delete-element', { elementSelection });
          announceLiveRegion(`Deleted ${elementSelection.elementKey}`);
        }
      },
    },
  ];

  // Advanced Actions - context-aware
  const advancedActions = [
    {
      id: 'element-type',
      label: `Change to ${getElementType() === 'button' ? 'Text' : 'Button'}`,
      icon: 'transform',
      handler: () => executeAction('change-element-type', { elementSelection }),
    },
    ...(canConvertToForm() ? [{
      id: 'convert-form',
      label: 'Convert to Form',
      icon: 'form',
      handler: handleConvertToForm,
    }] : []),
    {
      id: 'link-settings',
      label: 'Link Settings',
      icon: 'link',
      handler: () => executeAction('link-settings', { elementSelection }),
    },
    {
      id: 'animation-settings',
      label: 'Animation',
      icon: 'animation',
      handler: () => executeAction('animation-settings', { elementSelection }),
    },
    {
      id: 'accessibility',
      label: 'Accessibility',
      icon: 'accessibility',
      handler: () => executeAction('accessibility-settings', { elementSelection }),
    },
    {
      id: 'element-analytics',
      label: 'View Analytics',
      icon: 'chart',
      handler: () => executeAction('element-analytics', { elementSelection }),
    },
  ];

  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {/* Arrow */}
        {arrowInfo && (
          <div 
            className={`absolute w-2 h-2 bg-white border transform rotate-45 ${
              arrowInfo.direction === 'up' ? 'border-t-0 border-l-0 -bottom-1' :
              arrowInfo.direction === 'down' ? 'border-b-0 border-r-0 -top-1' :
              arrowInfo.direction === 'left' ? 'border-l-0 border-b-0 -right-1' :
              'border-r-0 border-t-0 -left-1'
            }`}
            style={{
              left: arrowInfo.direction === 'up' || arrowInfo.direction === 'down' ? arrowInfo.x - 4 : undefined,
              top: arrowInfo.direction === 'left' || arrowInfo.direction === 'right' ? arrowInfo.y - 4 : undefined,
            }}
          />
        )}
        
        <div className="flex items-center px-3 py-2">
          {/* Element Indicator */}
          <div className="flex items-center space-x-1 mr-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-700">
              {elementSelection.elementKey}
            </span>
          </div>
          
          {/* Primary Actions */}
          {primaryActions.map((action, index) => (
            <React.Fragment key={action.id}>
              {index > 0 && <div className="w-px h-6 bg-gray-200 mx-1" />}
              <button
                onClick={action.handler}
                className="flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                title={action.label}
              >
                <ElementIcon icon={action.icon} />
                <span>{action.label}</span>
              </button>
            </React.Fragment>
          ))}
          
          {/* Advanced Actions Trigger */}
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              showAdvanced 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="More options"
          >
            <span>⋯</span>
          </button>
        </div>
      </div>

      {/* Advanced Actions Menu */}
      {showAdvanced && (
        <AdvancedActionsMenu
          ref={advancedRef}
          actions={advancedActions}
          triggerElement={document.body}
          toolbarType="element"
          isVisible={showAdvanced}
          onClose={() => setShowAdvanced(false)}
        />
      )}

      {/* Variations Menu */}
      {showVariations && (
        <div
          ref={variationsRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{
            left: position.x,
            top: position.y + 60,
            width: 380,
            maxHeight: 300,
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Choose Variation</h3>
              <button
                onClick={() => setShowVariations(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {variations.map((variation, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVariation === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVariation(index)}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      selectedVariation === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedVariation === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Variation {index + 1}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {variation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowVariations(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyVariation}
                className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Variation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Element Icon Component
function ElementIcon({ icon }: { icon: string }) {
  const iconMap = {
    'refresh': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    'variations': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    'palette': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
      </svg>
    ),
    'copy': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    'trash': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    'transform': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    'form': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'link': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    'animation': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    'accessibility': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    'chart': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  };

  return iconMap[icon as keyof typeof iconMap] || <div className="w-3 h-3 bg-gray-400 rounded-sm" />;
}