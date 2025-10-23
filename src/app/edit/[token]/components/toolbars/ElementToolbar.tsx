// app/edit/[token]/components/toolbars/ElementToolbar.tsx - Priority-Resolved Element Toolbar
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useEditor } from '@/hooks/useEditor';
import { useToolbarActions } from '@/hooks/useToolbarActions';
import { useToolbarVisibility } from '@/hooks/useSelectionPriority';
import { calculateArrowPosition } from '@/utils/toolbarPositioning';
import { useButtonConfigModal } from '@/hooks/useButtonConfigModal';

interface ElementToolbarProps {
  elementSelection: any;
  position: { x: number; y: number };
  contextActions: any[];
}

export function ElementToolbar({ elementSelection, position, contextActions }: ElementToolbarProps) {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
  
  // STEP 1: Check toolbar visibility priority
  const { isVisible, reason } = useToolbarVisibility('element');
  
  const { openModal } = useButtonConfigModal();
  
  // Get the current toolbar state to check if image/form toolbar is active
  const { toolbar } = useEditStore();
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const variationsRef = useRef<HTMLDivElement>(null);

  const {
    regenerateElementWithVariations,
    elementVariations,
    applyVariation,
    hideElementVariations,
    setVariationSelection,
    updateElementContent,
    content,
    announceLiveRegion,
  } = useEditStore();

  const { executeAction } = useToolbarActions();
  const { enterTextEditMode } = useEditor();

  // Close menus when clicking outside - MOVED UP WITH OTHER HOOKS
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        variationsRef.current &&
        !variationsRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        // Hide variations using store action
        hideElementVariations();
      }
    };

    if (elementVariations.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [elementVariations.visible, hideElementVariations]);

  // NOW WE CAN DO CONDITIONAL RETURNS AFTER ALL HOOKS ARE CALLED
  
  // STEP 1: Priority-based early returns
  //   isVisible,
  //   reason,
  //   condition: !isVisible
  // });
  
  if (!isVisible) {
    return null;
  }
  
  // Don't show element toolbar if image or form toolbar is explicitly active
  //   toolbarType: toolbar?.type,
  //   toolbarVisible: toolbar?.visible,
  //   toolbarTargetId: toolbar?.targetId,
  //   fullToolbarState: toolbar
  // });
  
  if (toolbar?.type === 'image' || toolbar?.type === 'form') {
    return null;
  }
  

  // Enter text editing mode using unified system
  const handleEditText = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    enterTextEditMode(elementSelection.elementKey, elementSelection.sectionId);
  };

  // Calculate arrow position
  const targetSelector = `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`;
  const targetElement = document.querySelector(targetSelector);
  const arrowInfo = targetElement ? calculateArrowPosition(
    position,
    targetElement.getBoundingClientRect(),
    { width: 380, height: 48 }
  ) : null;

  // Handle unified regeneration with variations
  const handleRegenerate = async () => {
    try {
      await regenerateElementWithVariations(elementSelection.sectionId, elementSelection.elementKey, 5);
      announceLiveRegion('Generated variations');
    } catch (error) {
      // console.error('Failed to generate variations:', error);
      announceLiveRegion('Failed to generate variations');
    }
  };

  // Apply selected variation
  const handleApplyVariation = () => {
    if (elementVariations.variations[elementVariations.selectedIndex]) {
      applyVariation(
        elementVariations.sectionId,
        elementVariations.elementKey,
        elementVariations.selectedIndex
      );
      announceLiveRegion(`Applied variation ${elementVariations.selectedIndex + 1}`);
    }
  };


  // Handle button configuration
  const handleButtonConfiguration = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Use global modal state that persists across component unmounts
    openModal(elementSelection);
  };



  // Check if element has text content
  const hasTextContent = () => {
    const elementKey = elementSelection.elementKey;
    return elementKey.includes('text') || elementKey.includes('headline') || 
           elementKey.includes('subhead') || elementKey.includes('cta') || 
           elementKey.includes('button') || elementKey.includes('description');
  };

  // Check if element can be converted to form
  const canConvertToForm = () => {
    return elementSelection.elementKey.includes('cta') || elementSelection.elementKey.includes('button');
  };

  // Primary Actions
  const primaryActions = [
    // Add Edit Text as first action if element has text
    ...(hasTextContent() ? [{
      id: 'edit-text',
      label: 'Edit Text',
      icon: 'edit',
      handler: handleEditText,
    }] : []),
    // Add Button Configuration for button/CTA elements
    ...(canConvertToForm() ? [{
      id: 'button-config',
      label: 'Button Settings',
      icon: 'settings',
      handler: handleButtonConfiguration,
    }] : []),
    {
      id: 'regenerate-copy',
      label: 'Regenerate',
      icon: 'refresh',
      handler: handleRegenerate,
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



  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200"
        data-toolbar-type="element"
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
                onClick={(e) => {
                  if (action.id === 'edit-text' || action.id === 'button-config') {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                  action.handler(e);
                }}
                className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                  action.id === 'edit-text' 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={action.label}
                aria-haspopup={action.id === 'button-config' ? 'dialog' : undefined}
              >
                <ElementIcon icon={action.icon} />
                <span>{action.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>


      {/* Variations Menu */}
      {elementVariations.visible && (
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
                onClick={() => hideElementVariations()}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {elementVariations.variations.map((variation: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    elementVariations.selectedIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setVariationSelection(index)}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      elementVariations.selectedIndex === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {elementVariations.selectedIndex === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {index === 0 ? 'Current' : `Variation ${index}`}
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
                onClick={() => hideElementVariations()}
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
    'edit': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
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
    'settings': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  return iconMap[icon as keyof typeof iconMap] || <div className="w-3 h-3 bg-gray-400 rounded-sm" />;
}