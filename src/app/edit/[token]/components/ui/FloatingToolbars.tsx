// app/edit/[token]/components/ui/FloatingToolbars.tsx - Complete 5 Toolbar Implementation
import React, { useEffect, useRef, useState } from 'react';
import { useStoreState } from '@/components/EditProvider';
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
  const selectedSection = useStoreState((state) => state.selectedSection);
  const selectedElement = useStoreState((state) => state.selectedElement);
  const mode = useStoreState((state) => state.mode);
  const toolbar = useStoreState((state) => state.toolbar);


  // No longer need these hooks - they were removed

  // React-only positioning - no DOM manipulation
  // Position is calculated when toolbar is shown and stored in state

  // Debug logging
  console.log('🎯 FloatingToolbars render check:', {
    mode,
    toolbarVisible: toolbar.visible,
    toolbarType: toolbar.type,
    toolbarTargetId: toolbar.targetId,
    fullToolbarState: toolbar
  });

  // Only render toolbars in edit mode
  if (mode !== 'edit') return null;

  // Render single adaptive toolbar
  if (!toolbar.visible || !toolbar.type || !toolbar.targetId) {
    console.log('🚫 Toolbar not rendering - missing conditions:', {
      visible: toolbar.visible,
      type: toolbar.type,
      targetId: toolbar.targetId
    });
    return null;
  }
  
  console.log('✅ Rendering toolbar of type:', toolbar.type);
  

  return (
    <>
      {toolbar.type === 'section' && selectedSection && (
        <SectionToolbar
          sectionId={selectedSection}
          position={toolbar.position}
          contextActions={toolbar.actions.map((actionId: any) => ({ id: actionId, label: actionId, icon: 'icon', type: 'button' }))}
        />
      )}

      {toolbar.type === 'element' && selectedElement && (
        <ElementToolbar
          elementSelection={selectedElement}
          position={toolbar.position}
          contextActions={toolbar.actions.map((actionId: any) => ({ id: actionId, label: actionId, icon: 'icon', type: 'button' }))}
        />
      )}

      {toolbar.type === 'text' && selectedElement && (
        <TextToolbar
          elementSelection={selectedElement}
          position={toolbar.position}
          contextActions={toolbar.actions.map((actionId: any) => ({ id: actionId, label: actionId, icon: 'icon', type: 'button' }))}
        />
      )}

      {toolbar.type === 'image' && (
        <ImageToolbar
          targetId={toolbar.targetId}
          position={toolbar.position}
          contextActions={toolbar.actions.map((actionId: any) => ({ id: actionId, label: actionId, icon: 'icon', type: 'button' }))}
        />
      )}

      {toolbar.type === 'form' && (
        <FormToolbar
          targetId={toolbar.targetId}
          position={toolbar.position}
          contextActions={toolbar.actions.map((actionId: any) => ({ id: actionId, label: actionId, icon: 'icon', type: 'button' }))}
        />
      )}
    </>
  );
}