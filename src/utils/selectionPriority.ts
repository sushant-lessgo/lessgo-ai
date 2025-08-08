// src/utils/selectionPriority.ts - Selection Priority Resolver
// Implements Step 1 from selection.md

import type { ElementSelection } from '@/types/store';

export interface EditorSelection {
  // Text editing state (highest priority)
  isTextEditing: boolean;
  textEditingElement?: {
    sectionId: string;
    elementKey: string;
  };
  
  // Element selection state
  selectedElement?: ElementSelection;
  
  // Section selection state  
  selectedSection?: string;
  
  // Mode context
  mode: 'edit' | 'preview';
}

export type ToolbarType = 'text' | 'element' | 'section' | 'image' | 'form' | null;

/**
 * Step 1: Priority Resolver - Single source of truth for which toolbar should be active
 * 
 * Priority Order (highest to lowest):
 * 1. Text editing (when user is actively editing text)
 * 2. Element selection (when specific element is selected) - includes image/form detection
 * 3. Section selection (when section is selected)
 * 4. None (fallback)
 */
export function getActiveToolbar(selection: EditorSelection): ToolbarType {
  // Not in edit mode - no toolbar
  if (selection.mode !== 'edit') {
    return null;
  }
  
  // Priority 1: Text editing always wins
  if (selection.isTextEditing && selection.textEditingElement) {
    console.log('🎯 Priority resolver: TEXT EDITING wins', selection.textEditingElement);
    return 'text';
  }
  
  // Priority 2: Element selection - detect element type
  if (selection.selectedElement) {
    // For now, assume all element selections are 'element' type
    // TODO: Add image/form detection logic here based on element type
    console.log('🎯 Priority resolver: ELEMENT selection', selection.selectedElement);
    return 'element';
  }
  
  // Priority 3: Section selection
  if (selection.selectedSection) {
    console.log('🎯 Priority resolver: SECTION selection', selection.selectedSection);
    return 'section';
  }
  
  // Priority 4: Nothing selected
  console.log('🎯 Priority resolver: NO SELECTION');
  return null;
}

/**
 * Helper to create EditorSelection from store state
 */
export function createEditorSelection(storeState: {
  mode: 'edit' | 'preview';
  isTextEditing: boolean;
  textEditingElement?: { sectionId: string; elementKey: string };
  selectedElement?: ElementSelection;
  selectedSection?: string;
}): EditorSelection {
  return {
    mode: storeState.mode,
    isTextEditing: storeState.isTextEditing,
    textEditingElement: storeState.textEditingElement,
    selectedElement: storeState.selectedElement,
    selectedSection: storeState.selectedSection,
  };
}

/**
 * Helper to determine if a toolbar should be visible
 */
export function shouldShowToolbar(
  targetType: ToolbarType, 
  currentSelection: EditorSelection
): boolean {
  const activeToolbar = getActiveToolbar(currentSelection);
  const shouldShow = activeToolbar === targetType;
  
  console.log(`🔍 shouldShowToolbar(${targetType}):`, {
    activeToolbar,
    shouldShow,
    selectionState: {
      isTextEditing: currentSelection.isTextEditing,
      hasElement: !!currentSelection.selectedElement,
      hasSection: !!currentSelection.selectedSection,
    }
  });
  
  return shouldShow;
}

/**
 * Helper to get toolbar target info for positioning
 */
export function getToolbarTarget(selection: EditorSelection): {
  type: ToolbarType;
  targetId: string | null;
  sectionId: string | null;
  elementKey: string | null;
} {
  const toolbarType = getActiveToolbar(selection);
  
  switch (toolbarType) {
    case 'text':
      return {
        type: 'text',
        targetId: selection.textEditingElement ? 
          `${selection.textEditingElement.sectionId}.${selection.textEditingElement.elementKey}` : null,
        sectionId: selection.textEditingElement?.sectionId || null,
        elementKey: selection.textEditingElement?.elementKey || null,
      };
      
    case 'element':
      return {
        type: 'element',
        targetId: selection.selectedElement ? 
          `${selection.selectedElement.sectionId}.${selection.selectedElement.elementKey}` : null,
        sectionId: selection.selectedElement?.sectionId || null,
        elementKey: selection.selectedElement?.elementKey || null,
      };
      
    case 'section':
      return {
        type: 'section',
        targetId: selection.selectedSection || null,
        sectionId: selection.selectedSection || null,
        elementKey: null,
      };
      
    default:
      return {
        type: null,
        targetId: null,
        sectionId: null,
        elementKey: null,
      };
  }
}

/**
 * Debug helper to log current selection state
 */
export function debugSelection(selection: EditorSelection, context: string = '') {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🎯 Selection Debug ${context}`);
    console.log('Mode:', selection.mode);
    console.log('Text Editing:', selection.isTextEditing, selection.textEditingElement);
    console.log('Selected Element:', selection.selectedElement);
    console.log('Selected Section:', selection.selectedSection);
    console.log('Active Toolbar:', getActiveToolbar(selection));
    console.groupEnd();
  }
}