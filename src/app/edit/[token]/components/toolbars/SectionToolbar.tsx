// app/edit/[token]/components/toolbars/SectionToolbar.tsx - Priority-Resolved Section Toolbar
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore } from '@/hooks/useEditStore';
import { useSectionCRUD } from '@/hooks/useSectionCRUD';
import { AddSectionButton } from '../content/SectionCRUD';
import LoadingButtonBar from '@/components/shared/LoadingButtonBar';
import type { SectionType } from '@/types/core/content';
import { logger } from '@/lib/logger';
import { getSectionTypeFromLayout } from '@/utils/layoutSectionTypeMapping';
import { ElementToggleModal } from '../ui/ElementToggleModal';
import { isChromeId } from '@/hooks/editStore/pageHelpers';
import { eligibleVariantCount } from '../ui/BlockVariantSelector';
import { usesTemplateModule } from '@/types/service';

// Shared chrome (header/footer) is site-wide: hide per-page structural actions.
const CHROME_HIDDEN_ACTIONS = ['move-up', 'move-down', 'duplicate', 'delete'];

interface SectionToolbarProps {
  sectionId: string;
}

// Phase-3: the ToolbarShell decides visibility and owns positioning. This
// component is a dumb child of the shell's floating container.
export function SectionToolbar({ sectionId }: SectionToolbarProps) {
  const [showElementToggle, setShowElementToggle] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Narrow selector: pull ONLY the fields/actions this toolbar reads. Actions are
  // stable refs; the state slices (content/sections/sectionLayouts/aiGeneration)
  // are the ones this component genuinely renders from.
  const {
    content,
    sections,
    sectionLayouts,
    announceLiveRegion,
    aiGeneration,
    showLayoutChangeModal,
    audienceType,
    templateId,
  } = useEditStore(
    useShallow((s) => ({
      content: s.content,
      sections: s.sections,
      sectionLayouts: s.sectionLayouts,
      announceLiveRegion: s.announceLiveRegion,
      aiGeneration: s.aiGeneration,
      showLayoutChangeModal: s.showLayoutChangeModal,
      audienceType: s.audienceType,
      templateId: s.templateId,
    })),
  );

  // Swap-button visibility gate (scale-09 phase 5). For template-module projects
  // the "Layout" action only makes sense when the section has >1 ELIGIBLE variant
  // (BlockVariantSelector). A section can declare >1 variant yet have only one
  // meet its `requiresAssets` needs (e.g. meridian hero without a photo) — the
  // picker would then show a single, dead one-card modal (F18), so gate on the
  // eligible count (post-asset-filter), not the declared count. Legacy (non-
  // template) projects keep the button always — they use LayoutChangeSelector's
  // full library. currentLayout drives the manifest lookup (unlike sectionType,
  // it uniquely identifies the owning variant set).
  const currentSectionLayout = sectionLayouts[sectionId];
  const isTemplateModule = usesTemplateModule(audienceType, templateId);
  const showChangeLayout = isTemplateModule
    ? eligibleVariantCount(templateId, currentSectionLayout, content[sectionId]) > 1
    : true;

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
      label: 'Elements',
      icon: 'plus',
      handler: () => setShowElementToggle(true),
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
  ]
    .filter((action) => !isChromeId(sectionId) || !CHROME_HIDDEN_ACTIONS.includes(action.id))
    .filter((action) => action.id !== 'change-layout' || showChangeLayout);

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
          className="bg-white border border-gray-200 rounded-lg shadow-lg"
        >
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
            {isChromeId(sectionId) ? (
              <span className="text-[10px] font-medium text-white bg-gray-900/80 rounded px-1.5 py-0.5 whitespace-nowrap">
                Shared · all pages
              </span>
            ) : (
              <span className="text-xs text-gray-500">
                {validation?.completionPercentage || 0}%
              </span>
            )}
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
                title={action.label}
              >
                <ActionIcon icon={action.icon} />
                <span>{action.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
      )}

      <ElementToggleModal
        sectionId={sectionId}
        open={showElementToggle}
        onOpenChange={setShowElementToggle}
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