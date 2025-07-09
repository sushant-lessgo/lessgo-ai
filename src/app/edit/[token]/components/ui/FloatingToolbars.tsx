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
    ui: { floatingToolbars },
    selectedSection,
    selectedElement,
    mode,
  } = useEditStore();

  const { updateAllPositions } = useToolbarPositioning();
  const { currentContext, isMultiToolbarMode } = useToolbarContext();

  // Update positions when toolbars become visible or selections change
  useEffect(() => {
    const hasVisibleToolbars = Object.values(floatingToolbars).some(toolbar => toolbar.visible);
    if (hasVisibleToolbars) {
      const timeoutId = setTimeout(updateAllPositions, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedSection, selectedElement, updateAllPositions]);

  // Only render toolbars in edit mode
  if (mode !== 'edit') return null;

  return (
    <div className="floating-toolbars-container">
      {/* Section Toolbar */}
      {floatingToolbars.section.visible && selectedSection && (
        <SectionToolbar
          sectionId={selectedSection}
          position={floatingToolbars.section.position}
          contextActions={floatingToolbars.section.contextActions}
        />
      )}

      {/* Element Toolbar */}
      {floatingToolbars.element.visible && selectedElement && (
        <ElementToolbar
          elementSelection={selectedElement}
          position={floatingToolbars.element.position}
          contextActions={floatingToolbars.element.contextActions}
        />
      )}

      {/* Text Toolbar */}
      {floatingToolbars.text?.visible && selectedElement && (
        <TextToolbar
          elementSelection={selectedElement}
          position={floatingToolbars.text.position}
          contextActions={floatingToolbars.text.contextActions}
        />
      )}

      {/* Image Toolbar */}
      {floatingToolbars.image.visible && (
        <ImageToolbar
          targetId={floatingToolbars.image.targetId}
          position={floatingToolbars.image.position}
          contextActions={floatingToolbars.image.contextActions}
        />
      )}

      {/* Form Toolbar */}
      {floatingToolbars.form.visible && (
        <FormToolbar
          targetId={floatingToolbars.form.targetId}
          position={floatingToolbars.form.position}
          contextActions={floatingToolbars.form.contextActions}
        />
      )}

      {/* Multi-toolbar indicator */}
      {isMultiToolbarMode && (
        <div className="fixed top-4 right-4 z-60 bg-purple-100 border border-purple-300 rounded-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-purple-800">Multi-toolbar Mode</span>
          </div>
        </div>
      )}
    </div>
  );
}