// app/edit/[token]/components/ui/FloatingToolbars.tsx - Complete 5 Toolbar Implementation
import React, { useEffect, useRef, useState } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useToolbarPositioning } from '@/hooks/useToolbarPositioning';
import { useToolbarContext } from '@/hooks/useToolbarContext';
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
  } = useEditStore();
  
  // Mock toolbar state for now since we consolidated toolbars
  const toolbar = {
    type: null,
    visible: false,
    position: { x: 0, y: 0 },
    targetId: null,
    actions: []
  };

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

  const { updateAllPositions } = useToolbarPositioning();
  const { currentContext, isMultiToolbarMode } = useToolbarContext();

  // Simplified position updates using direct DOM manipulation
  useEffect(() => {
    if (toolbar.visible && toolbar.targetId) {
      const timeoutId = setTimeout(() => {
        let selector = '';
        if (toolbar.type === 'section' && toolbar.targetId) {
          selector = `[data-section-id="${toolbar.targetId}"]`;
        } else if (toolbar.type === 'element' && toolbar.targetId) {
          const parts = (toolbar.targetId as string).split('.');
          selector = `[data-section-id="${parts[0]}"] [data-element-key="${parts[1]}"]`;
        } else if (toolbar.targetId) {
          selector = `[data-${toolbar.type}-id="${toolbar.targetId}"]`;
        }
        
        const targetElement = selector ? document.querySelector(selector) as HTMLElement : null;
        
        const toolbarElement = document.querySelector(`[data-toolbar-type="${toolbar.type}"]`) as HTMLElement;
        
        if (targetElement && toolbarElement) {
          const rect = targetElement.getBoundingClientRect();
          const position = {
            x: rect.left + rect.width / 2 - toolbarElement.offsetWidth / 2,
            y: rect.top - toolbarElement.offsetHeight - 12
          };
          
          // Direct DOM update - no store mutations
          toolbarElement.style.left = `${Math.max(10, position.x)}px`;
          toolbarElement.style.top = `${Math.max(10, position.y)}px`;
          toolbarElement.style.position = 'fixed';
          toolbarElement.style.zIndex = '1000';
        }
      }, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [toolbar.visible, toolbar.targetId, toolbar.type, selectedSection, selectedElement]);

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
        className="fixed z-50 bg-white shadow-lg rounded-lg border border-gray-200 p-2"
        style={{
          left: toolbar.position.x,
          top: toolbar.position.y,
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