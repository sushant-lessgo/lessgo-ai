// app/edit/[token]/components/toolbars/SectionToolbar.tsx - Complete Section Toolbar
import React, { useState, useRef, useEffect } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useToolbarActions } from '@/hooks/useToolbarActions';
import { calculateArrowPosition } from '@/utils/toolbarPositioning';
import { AdvancedActionsMenu } from './AdvancedActionsMenu';

interface SectionToolbarProps {
  sectionId: string;
  position: { x: number; y: number };
  contextActions: any[];
}

export function SectionToolbar({ sectionId, position, contextActions }: SectionToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);

  const {
    duplicateSection,
    removeSection,
    moveSection,
    regenerateSection,
    updateSectionBackground,
    addElementToSection,
    reorderSections,
    announceLiveRegion,
  } = useEditStore();

  const { executeAction } = useToolbarActions();

  // Calculate arrow position
  const targetElement = document.querySelector(`[data-section-id="${sectionId}"]`);
  const arrowInfo = targetElement ? calculateArrowPosition(
    position,
    targetElement.getBoundingClientRect(),
    { width: 320, height: 48 }
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

  // Primary Actions
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
      handler: () => executeAction('add-element', { sectionId }),
    },
    {
      id: 'move-up',
      label: 'Move Up',
      icon: 'arrow-up',
      handler: () => executeAction('move-section', { sectionId, direction: 'up' }),
    },
    {
      id: 'move-down',
      label: 'Move Down',
      icon: 'arrow-down',
      handler: () => executeAction('move-section', { sectionId, direction: 'down' }),
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      handler: () => {
        duplicateSection(sectionId);
        announceLiveRegion(`Duplicated section ${sectionId}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      handler: () => {
        if (confirm('Are you sure you want to delete this section?')) {
          removeSection(sectionId);
          announceLiveRegion(`Deleted section ${sectionId}`);
        }
      },
    },
  ];

  // Advanced Actions
  const advancedActions = [
    {
      id: 'background-settings',
      label: 'Background Settings',
      icon: 'palette',
      handler: () => executeAction('background-settings', { sectionId }),
    },
    {
      id: 'regenerate-section',
      label: 'Regenerate Section',
      icon: 'refresh',
      handler: () => {
        regenerateSection(sectionId);
        announceLiveRegion(`Regenerating section ${sectionId}`);
      },
    },
    {
      id: 'section-settings',
      label: 'Section Settings',
      icon: 'settings',
      handler: () => executeAction('section-settings', { sectionId }),
    },
    {
      id: 'export-section',
      label: 'Export Section',
      icon: 'download',
      handler: () => executeAction('export-section', { sectionId }),
    },
    {
      id: 'section-analytics',
      label: 'View Analytics',
      icon: 'chart',
      handler: () => executeAction('section-analytics', { sectionId }),
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
          {/* Section Indicator */}
          <div className="flex items-center space-x-1 mr-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-700">Section</span>
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
                <ActionIcon icon={action.icon} />
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
            title="More actions"
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
          position={{
            x: position.x + 320,
            y: position.y,
          }}
          onClose={() => setShowAdvanced(false)}
        />
      )}
    </>
  );
}

// Action Icon Component
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
    'settings': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    'download': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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