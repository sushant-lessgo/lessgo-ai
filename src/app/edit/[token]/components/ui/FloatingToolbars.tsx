// app/edit/[token]/components/ui/FloatingToolbars.tsx - Complete 5 Toolbar Implementation
import React, { useEffect, useRef, useState } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
// Removed complex positioning hooks - using simple React-based positioning
import { calculateArrowPosition } from '@/utils/toolbarPositioning';

// Import action handlers
import { SectionToolbar } from '../toolbars/SectionToolbar';
import { TextToolbar } from '../toolbars/TextToolbar';
import { ElementToolbar } from '../toolbars/ElementToolbar';
import { ImageToolbar } from '../toolbars/ImageToolbar';
import { FormToolbar } from '../toolbars/FormToolbar';
import { AdvancedActionsMenu } from '../toolbars/AdvancedActionsMenu';

export function FloatingToolbars() {
  const { 
    selectedSection,
    selectedElement,
    mode,
    toolbar,
  } = useEditStore();

  // Debug logging
  React.useEffect(() => {
    console.log('🎪 FloatingToolbars render state:', {
      mode,
      toolbarType: toolbar.type,
      toolbarVisible: toolbar.visible,
      toolbarPosition: toolbar.position,
      selectedElement,
      selectedSection,
    });
  }, [toolbar.visible, toolbar.type, mode, selectedElement, selectedSection]);

  // No longer need these hooks - they were removed

  // React-only positioning - no DOM manipulation
  // Position is calculated when toolbar is shown and stored in state

  // Only render toolbars in edit mode
  if (mode !== 'edit') return null;

  // Render single adaptive toolbar
  if (!toolbar.visible || !toolbar.type || !toolbar.targetId) {
    return null;
  }

  return (
    <div className="floating-toolbars-container">
      {/* Single Smart Toolbar - renders appropriate content based on type */}
      <div 
        data-toolbar-type={toolbar.type}
        className="fixed z-50 bg-white shadow-lg rounded-lg border border-gray-200 p-2 transition-all duration-200 ease-out"
        style={{
          left: `${toolbar.position.x}px`,
          top: `${toolbar.position.y}px`,
          transform: 'translate(-50%, -100%)', // Center horizontally and position above
          minWidth: '280px',
          maxWidth: '400px',
          opacity: toolbar.visible ? 1 : 0,
          pointerEvents: toolbar.visible ? 'auto' : 'none',
        }}
      >
        {toolbar.type === 'section' && selectedSection && (
          <SectionToolbar
            sectionId={selectedSection}
            position={toolbar.position}
            contextActions={toolbar.actions.map(actionId => ({ id: actionId, label: actionId, icon: 'icon', type: 'button' }))}
          />
        )}

        {toolbar.type === 'element' && selectedElement && (
          <ElementToolbar
            elementSelection={selectedElement}
            position={toolbar.position}
            contextActions={toolbar.actions.map(actionId => ({ id: actionId, label: actionId, icon: 'icon', type: 'button' }))}
          />
        )}

        {toolbar.type === 'text' && selectedElement && (
          <TextToolbar
            elementSelection={selectedElement}
            position={toolbar.position}
            contextActions={toolbar.actions.map(actionId => ({ id: actionId, label: actionId, icon: 'icon', type: 'button' }))}
          />
        )}

        {toolbar.type === 'image' && (
          <ImageToolbar
            targetId={toolbar.targetId}
            position={toolbar.position}
            contextActions={toolbar.actions.map(actionId => ({ id: actionId, label: actionId, icon: 'icon', type: 'button' }))}
          />
        )}

        {toolbar.type === 'form' && (
          <FormToolbar
            targetId={toolbar.targetId}
            position={toolbar.position}
            contextActions={toolbar.actions.map(actionId => ({ id: actionId, label: actionId, icon: 'icon', type: 'button' }))}
          />
        )}
      </div>
    </div>
  );
}