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
// Cache for getActiveToolbar to prevent excessive logging
const toolbarCache = new Map<string, { result: ToolbarType; timestamp: number }>();
const CACHE_TTL = 100; // 100ms cache

export function getActiveToolbar(selection: EditorSelection): ToolbarType {
  console.log('📊 getActiveToolbar called with selection:', {
    mode: selection.mode,
    isTextEditing: selection.isTextEditing,
    textEditingElement: selection.textEditingElement,
    selectedElement: selection.selectedElement,
    selectedSection: selection.selectedSection,
    toolbarType: selection.toolbarType
  });

  // Create cache key from selection state (include toolbarType)
  const cacheKey = `${selection.mode}-${selection.isTextEditing}-${selection.textEditingElement?.elementKey}-${selection.selectedElement?.elementKey}-${selection.selectedSection}-${selection.toolbarType}`;
  
  // Check cache
  const cached = toolbarCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📊 Returning cached result:', cached.result);
    return cached.result;
  }
  
  // Not in edit mode - no toolbar
  if (selection.mode !== 'edit') {
    console.log('📊 Not in edit mode, returning null');
    toolbarCache.set(cacheKey, { result: null, timestamp: Date.now() });
    return null;
  }
  
  let result: ToolbarType = null;
  
  // Priority 1: Text editing always wins
  if (selection.isTextEditing && selection.textEditingElement) {
    result = 'text';
    console.log('📊 Priority 1: Text editing active, result:', result);
  }
  // Priority 2: Check explicit toolbar type for specialized toolbars (image, form)
  else if (selection.toolbarType === 'image' || selection.toolbarType === 'form') {
    result = selection.toolbarType;
    console.log('📊 Priority 2: Explicit toolbar type found, result:', result);
  }
  // Priority 3: Element selection - generic element toolbar
  else if (selection.selectedElement) {
    result = 'element';
    console.log('📊 Priority 3: Element selection active, result:', result);
  }
  // Priority 4: Section selection
  else if (selection.selectedSection) {
    result = 'section';
    console.log('📊 Priority 4: Section selection active, result:', result);
  }
  else {
    console.log('📊 No active selection, result: null');
  }
  
  console.log('📊 Final getActiveToolbar result:', result);
  
  // Cache result
  toolbarCache.set(cacheKey, { result, timestamp: Date.now() });
  
  // Clean old cache entries periodically
  if (toolbarCache.size > 50) {
    const now = Date.now();
    for (const [key, value] of toolbarCache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 10) {
        toolbarCache.delete(key);
      }
    }
  }
  
  return result;
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
 * Helper to determine if a toolbar should be visible
 */
// Cache for shouldShowToolbar
const showCache = new Map<string, { result: boolean; timestamp: number }>();

export function shouldShowToolbar(
  targetType: ToolbarType, 
  currentSelection: EditorSelection
): boolean {
  const cacheKey = `${targetType}-${currentSelection.mode}-${currentSelection.isTextEditing}-${currentSelection.textEditingElement?.elementKey}-${currentSelection.selectedElement?.elementKey}-${currentSelection.selectedSection}-${currentSelection.toolbarType}`;
  
  // Check cache
  const cached = showCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  const activeToolbar = getActiveToolbar(currentSelection);
  const shouldShow = activeToolbar === targetType;
  
  // Cache result
  showCache.set(cacheKey, { result: shouldShow, timestamp: Date.now() });
  
  // Clean cache periodically
  if (showCache.size > 50) {
    const now = Date.now();
    for (const [key, value] of showCache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 10) {
        showCache.delete(key);
      }
    }
  }
  
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
  
  console.log('🎯 getToolbarTarget called with:', {
    toolbarType,
    selectedElement: selection.selectedElement,
    toolbarTypeFromSelection: selection.toolbarType
  });
  
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
  // if (process.env.NODE_ENV === 'development') {
  //   console.group(`🎯 Selection Debug ${context}`);
  //   console.log('Mode:', selection.mode);
  //   console.log('Text Editing:', selection.isTextEditing, selection.textEditingElement);
  //   console.log('Selected Element:', selection.selectedElement);
  //   console.log('Selected Section:', selection.selectedSection);
  //   console.log('Active Toolbar:', getActiveToolbar(selection));
  //   console.groupEnd();
  // }
}