// src/utils/selectionPriority.ts - Selection Priority Resolver
// Implements Step 1 from selection.md

import type { ElementSelection } from '@/types/store';

import { logger } from '@/lib/logger';
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
  
  // Explicit toolbar type from store
  toolbarType?: ToolbarType;
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
    return 'text';
  }
  // Priority 2: Check explicit toolbar type for specialized toolbars (image, form)
  if (selection.toolbarType === 'image' || selection.toolbarType === 'form') {
    return selection.toolbarType;
  }
  // Priority 3: Element selection - generic element toolbar
  if (selection.selectedElement) {
    return 'element';
  }
  // Priority 4: Section selection
  if (selection.selectedSection) {
    return 'section';
  }

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
  toolbar?: { type?: ToolbarType };
}): EditorSelection {
  return {
    mode: storeState.mode,
    isTextEditing: storeState.isTextEditing,
    textEditingElement: storeState.textEditingElement,
    selectedElement: storeState.selectedElement,
    selectedSection: storeState.selectedSection,
    toolbarType: storeState.toolbar?.type,
  };
}

/**
 * Whether a section should show its VISUAL selection (outline/ring) for a given
 * sectionId. Mirrors the section-toolbar gate (`selectedSection && !selectedElement`):
 * once an element is selected the element wins, so the parent section must NOT also
 * render as selected (otherwise every renderer washes the section blue under a
 * floating element toolbar). Kept pure + shared so the three redundant highlight
 * systems (MainContent ring, SelectionSystem `.selected-section`, ElementDetector
 * `.section-selected`) can't drift apart.
 */
export function isSectionVisuallySelected(
  selectedSection: string | null | undefined,
  sectionId: string,
  selectedElement: ElementSelection | null | undefined
): boolean {
  return selectedSection === sectionId && !selectedElement;
}

/**
 * Helper to determine if a toolbar should be visible
 */
export function shouldShowToolbar(
  targetType: ToolbarType,
  currentSelection: EditorSelection
): boolean {
  return getActiveToolbar(currentSelection) === targetType;
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
      
    case 'image':
      return {
        type: 'image',
        targetId: selection.selectedElement ? 
          `${selection.selectedElement.sectionId}.${selection.selectedElement.elementKey}` : null,
        sectionId: selection.selectedElement?.sectionId || null,
        elementKey: selection.selectedElement?.elementKey || null,
      };
      
    case 'form':
      return {
        type: 'form',
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
  // DISABLED - This function was causing infinite render loops
}