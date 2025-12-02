// app/edit/[token]/components/toolbars/SectionToolbar.tsx - Priority-Resolved Section Toolbar
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';

import { useElementPicker } from '@/hooks/useElementPicker';
import { useSectionCRUD } from '@/hooks/useSectionCRUD';
import { useToolbarVisibility } from '@/hooks/useSelectionPriority';
import { calculateArrowPosition } from '@/utils/toolbarPositioning';
import { AdvancedActionsMenu } from './AdvancedActionsMenu';
import { AddSectionButton } from '../content/SectionCRUD';
import { showBackgroundModal } from '../ui/GlobalModals';
import LoadingButtonBar from '@/components/shared/LoadingButtonBar';
import type { SectionType } from '@/types/core/content';
import { logger } from '@/lib/logger';
import { getSectionElementRequirements, mapStoreToVariables } from '@/modules/sections/elementDetermination';
import { getSectionTypeFromLayout } from '@/utils/layoutSectionTypeMapping';

interface SectionToolbarProps {
  sectionId: string;
  position: { x: number; y: number };
  contextActions: any[];
}

export function SectionToolbar({ sectionId, position, contextActions }: SectionToolbarProps) {
  // STEP 1: Check toolbar visibility priority
  const { isVisible, reason } = useToolbarVisibility('section');
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);
  const advancedTriggerRef = useRef<HTMLButtonElement>(null);
  
  // Debug instance
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));

  // STEP 1: Priority-based early returns
  if (!isVisible) {
    return null;
  }
  
  // Debug mounting/unmounting
  useEffect(() => {
    logger.dev(`🟢 SectionToolbar[${instanceId.current}] MOUNTED for section:`, () => sectionId);
    return () => {
      logger.dev(`🔴 SectionToolbar[${instanceId.current}] UNMOUNTING for section:`, () => sectionId);
    };
  }, []);
  
  // Debug state changes
  useEffect(() => {
    logger.dev(`🔍 SectionToolbar[${instanceId.current}] - showAdvanced changed to:`, () => showAdvanced);
  }, [showAdvanced]);

  const {
    content,
    sections,
    sectionLayouts,
    announceLiveRegion,
    aiGeneration,
    showLayoutChangeModal,
  } = useEditStore();

  const onboardingStore = useOnboardingStore();

  const { showElementPicker } = useElementPicker();

  // Handle layout change action
  const handleChangeLayout = (sectionId: string) => {
    const section = content[sectionId];
    const currentLayout = sectionLayouts[sectionId];

    if (!section || !currentLayout) {
      logger.error('Section or layout not found:', { sectionId, section, currentLayout });
      return;
    }

    // Get section type from layout name
    let sectionType = getSectionTypeFromLayout(currentLayout);

    // If couldn't determine from layout, try parsing section ID
    if (sectionType === 'hero') {
      const sectionIdMatch = sectionId.match(/^(header|footer|hero|features|pricing|testimonials|faq|cta|problem|results|security|socialProof|founderNote|integrations|objectionHandling|useCases|comparisonTable|closeSection|beforeAfter|howItWorks|uniqueMechanism)-/);

      if (sectionIdMatch) {
        sectionType = sectionIdMatch[1];
      }
    }

    logger.debug('Layout change:', { sectionId, currentLayout, sectionType });

    // Show the layout change modal
    showLayoutChangeModal(sectionId, sectionType, currentLayout, section.elements);
  };

  const {
    duplicateSection,
    removeSection,
    moveSectionUp,
    moveSectionDown,
  } = useSectionCRUD();

  const section = content[sectionId];
  const sectionIndex = sections.indexOf(sectionId);

  // Calculate if section has optional elements that can be added
  const canAddElements = useMemo(() => {
    try {
      const sectionData = content[sectionId];
      const layoutType = sectionData?.layout;

      if (!layoutType) return false;

      // Map store data to variables for element determination
      const variables = mapStoreToVariables(onboardingStore, {
        layout: { sections, sectionLayouts },
        meta: { onboardingData: {
          oneLiner: onboardingStore.oneLiner,
          validatedFields: onboardingStore.validatedFields,
          featuresFromAI: onboardingStore.featuresFromAI,
        } }
      });

      // Get element requirements including excluded elements
      const requirements = getSectionElementRequirements(sectionId, layoutType, variables);

      // Filter out elements already in section
      const existingElementKeys = Object.keys(sectionData?.elements || {});
      const availableElements = requirements.excludedElements.filter(elementName =>
        !existingElementKeys.includes(elementName)
      );

      return availableElements.length > 0;
    } catch (error) {
      logger.error('Error calculating canAddElements:', error);
      return false;
    }
  }, [sectionId, content, sections, sectionLayouts, onboardingStore]);
  
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

  // Handle Add Element action - Show element picker with optional elements
  const handleAddElement = () => {
    try {
      // Get section information
      const sectionData = content[sectionId];
      const sectionType = sectionId;
      const layoutType = sectionData?.layout;

      // Calculate picker position
      const buttonElement = document.querySelector('[data-action="add-element"]');
      let pickerPosition = { x: 0, y: 0 };

      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        pickerPosition = {
          x: rect.left,
          y: rect.bottom + 8,
        };
      }

      // Map store data to variables for element determination
      const variables = mapStoreToVariables(onboardingStore, {
        layout: { sections, sectionLayouts },
        meta: {
          onboardingData: {
            oneLiner: onboardingStore.oneLiner,
            validatedFields: onboardingStore.validatedFields,
            featuresFromAI: onboardingStore.featuresFromAI,
          }
        }
      });

      // Get element requirements including excluded (optional) elements
      const requirements = getSectionElementRequirements(sectionId, layoutType, variables);

      // Filter out elements already in section (unless empty/removed)
      const existingElementKeys = Object.keys(sectionData?.elements || {});
      const availableOptionalElements = requirements.excludedElements.filter(elementName => {
        // Element not in section → can add
        if (!existingElementKeys.includes(elementName)) return true;

        // Element exists but is empty/removed → can re-add
        const elementValue = sectionData.elements[elementName];
        const isEmpty =
          !elementValue ||
          elementValue === '' ||
          elementValue === '___REMOVED___' ||
          (typeof elementValue === 'object' &&
           (!elementValue.content ||
            elementValue.content === '' ||
            elementValue.content === '___REMOVED___'));

        return isEmpty;
      });

      logger.debug('🎯 Showing element picker:', {
        sectionId,
        layoutType,
        availableOptionalElements,
        pickerPosition
      });

      // Show element picker with optional elements
      showElementPicker(sectionId, pickerPosition, {
        autoFocus: true,
        optionalElements: availableOptionalElements,
        sectionType,
        layoutType,
        sectionId,
      });
    } catch (error) {
      logger.error('Error in handleAddElement:', error);
    }
  };

  // Primary Actions with enhanced functionality
  const primaryActions = [
    {
      id: 'change-layout',
      label: 'Layout',
      icon: 'layout',
      handler: () => handleChangeLayout(sectionId),
    },
    {
      id: 'add-element',
      label: 'Add Element',
      icon: 'plus',
      handler: handleAddElement,
      disabled: !canAddElements,
      tooltip: canAddElements ? 'Add optional elements' : 'No optional elements available',
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

  // Check if this specific section is being regenerated
  const isRegenerating = aiGeneration.isGenerating && 
    aiGeneration.context?.type === 'section' && 
    aiGeneration.context?.sectionId === sectionId;

  // Check if regeneration just completed for this section
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const prevIsRegeneratingRef = useRef(false);

  // Track regeneration state changes to show completion message
  useEffect(() => {
    // Check if regeneration just completed
    if (prevIsRegeneratingRef.current && !isRegenerating) {
      // Regeneration just finished
      setShowCompletionMessage(true);
      
      // Hide completion message after 3 seconds
      const timer = setTimeout(() => {
        setShowCompletionMessage(false);
      }, 3000);
      
      // Announce completion
      announceLiveRegion('Section content regenerated successfully');
      
      // Store the timer to clear it on cleanup
      return () => {
        clearTimeout(timer);
      };
    }
    
    // Update the previous state
    prevIsRegeneratingRef.current = isRegenerating;
  }, [isRegenerating, announceLiveRegion]);

  // Enhanced Advanced Actions
  const advancedActions = [
    {
      id: 'background-settings',
      label: 'Background Settings',
      icon: 'palette',
      handler: () => {
        showBackgroundModal(sectionId);
      },
    },
    {
      id: 'regenerate-section',
      label: 'Regenerate Content',
      icon: 'refresh',
      handler: () => {
        // TODO: Implement regenerate section handler
        logger.warn('Regenerate section not yet implemented');
      },
      disabled: isRegenerating,
    },
  ];

  return (
    <>
      {/* Show loading bar when regenerating this section */}
      {isRegenerating && (
        <div 
          className="fixed bottom-8 right-8 z-50 transition-all duration-200"
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-1">
            <LoadingButtonBar
              label="🔄 Regenerating section content..."
              duration={4000}
              colorClass="bg-[#006CFF]"
            />
          </div>
        </div>
      )}
      
      {/* Show completion message */}
      {showCompletionMessage && (
        <div 
          className="fixed bottom-8 right-8 z-50 transition-all duration-300"
          style={{
            animation: 'slideInFromRight 0.3s ease-out',
          }}
        >
          <div className="bg-[#006CFF] text-white rounded-lg shadow-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium">
                Section content regenerated successfully!
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Original toolbar - only show when not regenerating */}
      {!isRegenerating && !showCompletionMessage && (
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
      )}

      {/* Advanced Actions Menu - Using the dedicated component */}
      {showAdvanced && advancedTriggerRef.current && !isRegenerating && (
        <AdvancedActionsMenu
          ref={advancedRef}
          actions={advancedActions}
          triggerElement={advancedTriggerRef.current}
          onClose={() => setShowAdvanced(false)}
          toolbarType="section"
          isVisible={showAdvanced}
        />
      )}
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