// app/edit/[token]/components/toolbars/SectionToolbar.tsx - Enhanced with ElementPicker Integration
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useToolbarActions } from '@/hooks/useToolbarActions';
import { useElementPicker } from '@/hooks/useElementPicker';
import { useSectionCRUD } from '@/hooks/useSectionCRUD';
import { calculateArrowPosition } from '@/utils/toolbarPositioning';
import { AdvancedActionsMenu } from './AdvancedActionsMenu';
import { AddSectionButton } from '../content/SectionCRUD';
import { SectionBackgroundModal } from '../ui/SectionBackgroundModal';
import type { SectionType } from '@/types/core/content';
// import { getRestrictionSummary } from '@/utils/elementRestrictions'; // Preserved for future use

interface SectionToolbarProps {
  sectionId: string;
  position: { x: number; y: number };
  contextActions: any[];
}

export function SectionToolbar({ sectionId, position, contextActions }: SectionToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);
  const advancedTriggerRef = useRef<HTMLButtonElement>(null);

  const {
    content,
    sections,
    announceLiveRegion,
  } = useEditStore();

  const { executeAction } = useToolbarActions();
  const { showElementPicker } = useElementPicker();

  const {
    duplicateSection,
    removeSection,
    moveSectionUp,
    moveSectionDown,
  } = useSectionCRUD();

  const section = content[sectionId];
  const sectionIndex = sections.indexOf(sectionId);
  
  // TEMPORARY: Disable Add Element feature (coming soon)
  const canAddElements = false; // Will be enabled in future release
  
  // Preserved for future use:
  // const sectionData = content[sectionId];
  // const sectionType = sectionId || 'content';
  // const layoutType = sectionData?.layout;
  // const restrictionSummary = getRestrictionSummary(sectionType, layoutType);
  // const canAddElements = restrictionSummary.allowedCount > 0;
  
  // Get validation status from existing metadata (read-only)
  const validation = useMemo(() => {
    if (!section) return null;
    
    // Read validation from existing metadata instead of triggering validation
    const validationStatus = section.editMetadata?.validationStatus;
    if (validationStatus) {
      return {
        sectionId,
        valid: validationStatus.isValid,
        isValid: validationStatus.isValid,
        errors: validationStatus.errors?.map((e: any) => e.message) || [],
        completionPercentage: section.editMetadata?.completionPercentage || 0,
        missingElements: validationStatus.missingRequired || [],
        hasRequiredContent: validationStatus.missingRequired?.length === 0,
      };
    }
    
    // Fallback to basic validation without triggering state updates
    return {
      sectionId,
      valid: true,
      isValid: true,
      errors: [],
      completionPercentage: 100,
      missingElements: [],
      hasRequiredContent: true,
    };
  }, [sectionId, section?.editMetadata]);

  // Calculate arrow position
  const targetElement = document.querySelector(`[data-section-id="${sectionId}"]`);
  const arrowInfo = targetElement ? calculateArrowPosition(
    position,
    targetElement.getBoundingClientRect(),
    { width: 400, height: 48 }
  ) : null;

  // Close advanced menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        advancedRef.current &&
        !advancedRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowAdvanced(false);
      }
    };

    if (showAdvanced) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAdvanced]);

  // Handle Add Element action - Use the enhanced action with restrictions
  const handleAddElement = () => {
    console.log('🎯 SectionToolbar handleAddElement clicked for section:', sectionId);
    
    const buttonElement = document.querySelector('[data-action="add-element"]');
    let pickerPosition = { x: 0, y: 0 };
    
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      pickerPosition = {
        x: rect.left,
        y: rect.bottom + 8, // Position below the button
      };
      console.log('🎯 Button found, position calculated:', pickerPosition);
    } else {
      console.warn('🎯 Add element button not found!');
    }
    
    // Use the executeAction which includes restriction logic
    console.log('🎯 Calling executeAction with params:', { sectionId, position: pickerPosition });
    executeAction('add-element', { 
      sectionId, 
      position: pickerPosition 
    });
  };

  // Primary Actions with enhanced functionality
  const primaryActions = [
    {
      id: 'change-layout',
      label: 'Layout',
      icon: 'layout',
      handler: () => executeAction('change-layout', { sectionId }),
    },
    {
      id: 'add-element',
      label: 'Add Element',
      icon: 'plus',
      handler: handleAddElement,
      disabled: true, // Always disabled for now
      tooltip: 'Add custom elements - Coming soon',
    },
    {
      id: 'move-up',
      label: 'Move Up',
      icon: 'arrow-up',
      disabled: sectionIndex === 0,
      handler: () => {
        moveSectionUp(sectionId);
        announceLiveRegion(`Moved section up`);
      },
    },
    {
      id: 'move-down',
      label: 'Move Down',
      icon: 'arrow-down',
      disabled: sectionIndex === sections.length - 1,
      handler: () => {
        moveSectionDown(sectionId);
        announceLiveRegion(`Moved section down`);
      },
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      handler: async () => {
        const newSectionId = await duplicateSection(sectionId);
        announceLiveRegion(`Duplicated section as ${newSectionId}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      variant: 'danger',
      handler: async () => {
        const confirmed = await removeSection(sectionId);
        if (confirmed) {
          announceLiveRegion(`Deleted section ${sectionId}`);
        }
      },
    },
  ];

  // Enhanced Advanced Actions
  const advancedActions = [
    {
      id: 'background-settings',
      label: 'Background Settings',
      icon: 'palette',
      handler: () => {
        console.log('Background settings clicked, current state:', showBackgroundModal);
        setShowBackgroundModal(true);
        console.log('State should now be true');
      },
    },
    {
      id: 'regenerate-section',
      label: 'Regenerate Content',
      icon: 'refresh',
      handler: () => executeAction('regenerate-section', { sectionId }),
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
          {/* Section Indicator with Validation */}
          <div className="flex items-center space-x-2 mr-3">
            <div className={`w-2 h-2 rounded-full ${
              validation?.isValid ? 'bg-green-500' : 
              (validation?.completionPercentage || 0) > 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs font-medium text-gray-700">
              {sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}
            </span>
            <span className="text-xs text-gray-500">
              {validation?.completionPercentage || 0}%
            </span>
          </div>
          
          {/* Primary Actions */}
          {primaryActions.map((action, index) => (
            <React.Fragment key={action.id}>
              {index > 0 && <div className="w-px h-6 bg-gray-200 mx-1" />}
              <button
                onClick={action.handler}
                disabled={action.disabled}
                data-action={action.id}
                className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                  action.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : action.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={action.tooltip || action.label}
              >
                <ActionIcon icon={action.icon} />
                <span>{action.label}</span>
              </button>
            </React.Fragment>
          ))}
          
          {/* Advanced Actions Trigger */}
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button
            ref={advancedTriggerRef}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowAdvanced(!showAdvanced);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              showAdvanced 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="More actions"
          >
            <span>⋯</span>
          </button>
        </div>
      </div>

      {/* Advanced Actions Menu */}
      {showAdvanced && (
        <div
          ref={advancedRef}
          className="fixed z-60 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px]"
          style={{
            left: position.x,
            top: position.y + 55,
          }}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Advanced</span>
          </div>
          {advancedActions.map(action => (
            <button
              key={action.id}
              onClick={() => {
                action.handler();
                setShowAdvanced(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center space-x-2"
            >
              <ActionIcon icon={action.icon} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Debug: Simple test element */}
      {showBackgroundModal && (
        <div
          id="toolbar-test-element"
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            width: '150px',
            height: '50px',
            backgroundColor: 'purple',
            color: 'white',
            zIndex: 999999,
            padding: '5px'
          }}
        >
          TOOLBAR TEST
        </div>
      )}
      
      {/* Section Background Modal */}
      <SectionBackgroundModal
        isOpen={showBackgroundModal}
        onClose={() => setShowBackgroundModal(false)}
        sectionId={sectionId}
      />
    </>
  );
}

// Enhanced Action Icon Component
function ActionIcon({ icon }: { icon: string }) {
  const iconMap = {
    'layout': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    'plus': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    'arrow-up': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    ),
    'arrow-down': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
    'palette': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
      </svg>
    ),
    'refresh': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  };

  return iconMap[icon as keyof typeof iconMap] || <div className="w-3 h-3 bg-gray-400 rounded-sm" />;
}