// app/edit/[token]/components/ui/FloatingToolbars.tsx - Priority-Resolved Toolbar System
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStoreState } from '@/components/EditProvider';
import { useSelectionPriority } from '@/hooks/useSelectionPriority';
// Removed complex positioning hooks - using simple React-based positioning
import { calculateArrowPosition } from '@/utils/toolbarPositioning';

// Import action handlers
import { SectionToolbar } from '../toolbars/SectionToolbar';
import { TextToolbar } from '../toolbars/TextToolbar';
import { TextToolbarMVP } from '../toolbars/TextToolbarMVP'; // Step 4: MVP Implementation
import { ElementToolbar } from '../toolbars/ElementToolbar';
import { ImageToolbar } from '../toolbars/ImageToolbar';
import { FormToolbar } from '../toolbars/FormToolbar';
import { AdvancedActionsMenu } from '../toolbars/AdvancedActionsMenu';

import { logger } from '@/lib/logger';
export function FloatingToolbars() {
  // STEP 3: Use Priority Resolver with Global Anchor Management
  const {
    activeToolbar,
    toolbarTarget,
    editorSelection,
    shouldShowToolbar,
    hasActiveToolbar,
    globalAnchor,
  } = useSelectionPriority();
  
  // Keep legacy toolbar state for fallback compatibility
  const toolbar = useStoreState((state) => state.toolbar);
  
  // Debug logging - only on actual changes
  useEffect(() => {
    // console.log('🎪🎪🎪 FloatingToolbars state changed:', {
    //   activeToolbar,
    //   hasActiveToolbar,
    //   toolbarTarget,
    //   editorSelection,
    //   toolbar
    // });
    // Preserve function calls but remove logging
    shouldShowToolbar('section');
    shouldShowToolbar('element'); 
    shouldShowToolbar('text');
    shouldShowToolbar('image');
    shouldShowToolbar('form');
    // console.log('🎪 shouldShowToolbar results preserved but not logged');
  }, [activeToolbar, hasActiveToolbar, toolbar, toolbarTarget, editorSelection, shouldShowToolbar]);


  // No longer need these hooks - they were removed

  // React-only positioning - no DOM manipulation
  // Position is calculated when toolbar is shown and stored in state


  // STEP 1: Use priority resolver instead of manual checks
  if (editorSelection.mode !== 'edit' || !hasActiveToolbar) {
    return null;
  }
  
  // Use priority-resolved toolbar visibility instead of legacy state
  // Keep toolbar.position for backward compatibility until Step 3
  const position = toolbar.position || { x: 0, y: 0 };
  const contextActions = toolbar.actions?.map((actionId: any) => ({ 
    id: actionId, 
    label: actionId, 
    icon: 'icon', 
    type: 'button' 
  })) || [];

  return (
    <>
      {/* STEP 1: Priority-resolved toolbar rendering */}
      {shouldShowToolbar('section') && editorSelection.selectedSection && (
        <SectionToolbar
          sectionId={editorSelection.selectedSection}
          position={position}
          contextActions={contextActions}
        />
      )}

      {shouldShowToolbar('element') && editorSelection.selectedElement && (
        <ElementToolbar
          elementSelection={editorSelection.selectedElement}
          position={position}
          contextActions={contextActions}
        />
      )}

      {shouldShowToolbar('text') && editorSelection.textEditingElement && editorSelection.selectedElement && (
        <TextToolbarMVP
          elementSelection={editorSelection.selectedElement}
          position={position}
          contextActions={contextActions}
        />
      )}

      {(() => {
        const shouldShow = shouldShowToolbar('image');
        const hasTargetId = !!toolbarTarget.targetId;
        const isImageActive = activeToolbar === 'image';
        const allConditions = shouldShow && hasTargetId && isImageActive;
        
        // console.log('🖼️ ImageToolbar render check:', {
        //   shouldShow,
        //   hasTargetId,
        //   targetId: toolbarTarget.targetId,
        //   isImageActive,
        //   activeToolbar,
        //   allConditions,
        //   toolbarTarget: toolbarTarget
        // });
        
        return allConditions;
      })() && (
        <>
          {/* console.log('🖼️ ImageToolbar rendering with:', {
            shouldShowImage: shouldShowToolbar('image'),
            targetId: toolbarTarget.targetId, 
            activeToolbar,
            position,
            contextActions
          }); */}
          <ImageToolbar
            targetId={toolbarTarget.targetId || ''}
            position={position}
            contextActions={contextActions}
          />
        </>
      )}

      {shouldShowToolbar('form') && toolbarTarget.targetId && activeToolbar === 'form' && (
        <FormToolbar
          targetId={toolbarTarget.targetId}
          position={position}
          contextActions={contextActions}
        />
      )}

    </>
  );
}