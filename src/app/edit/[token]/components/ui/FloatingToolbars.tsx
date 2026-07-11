// app/edit/[token]/components/ui/FloatingToolbars.tsx - Priority-Resolved Toolbar System
import React from 'react';
import { useStoreState } from '@/components/EditProvider';
import { useSelectionPriority } from '@/hooks/useSelectionPriority';

// Import action handlers
import { SectionToolbar } from '../toolbars/SectionToolbar';
import { TextToolbarMVP } from '../toolbars/TextToolbarMVP'; // Step 4: MVP Implementation
import { ElementToolbar } from '../toolbars/ElementToolbar';
import { ImageToolbar } from '../toolbars/ImageToolbar';

export function FloatingToolbars() {
  // STEP 3: Use Priority Resolver with Global Anchor Management
  const {
    activeToolbar,
    toolbarTarget,
    editorSelection,
    shouldShowToolbar,
    hasActiveToolbar,
  } = useSelectionPriority();
  
  // Keep legacy toolbar state for fallback compatibility
  const toolbar = useStoreState((state) => state.toolbar);
  

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
          elementSelection={editorSelection.textEditingElement || editorSelection.selectedElement}
          position={position}
          contextActions={contextActions}
        />
      )}

      {(() => {
        const shouldShow = shouldShowToolbar('image');
        const hasTargetId = !!toolbarTarget.targetId;
        const isImageActive = activeToolbar === 'image';
        const allConditions = shouldShow && hasTargetId && isImageActive;
        
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
          <ImageToolbar
            targetId={toolbarTarget.targetId || ''}
            position={position}
            contextActions={contextActions}
          />
        </>
      )}

    </>
  );
}