// hooks/useSelection.ts - Enhanced selection system with keyboard navigation and multi-selection
import { useCallback, useEffect, useRef } from 'react';
import { useEditStore } from './useEditStore';
import type { ElementSelection } from '@/types/store';
import type { ToolbarType } from '@/types/core';


export interface SelectableElement {
  id: string;
  sectionId: string;
  elementKey: string;
  type: 'section' | 'element';
  bounds: DOMRect;
  element: HTMLElement;
}

export interface ElementBoundary {
  id: string;
  bounds: DOMRect;
  type: 'text' | 'image' | 'button' | 'form' | 'list';
  isSelectable: boolean;
}

export interface ElementHierarchy {
  target: HTMLElement;
  sectionId: string;
  elementKey: string;
  depth: number;
  parent?: ElementHierarchy;
}

export function useSelection() {
  const {
    mode,
    selectedSection,
    selectedElement,
    multiSelection,
    selectElement,
    setActiveSection,
    setMultiSelection,
    showSectionToolbar,
    showElementToolbar,
    hideElementToolbar,
    hideSectionToolbar,
    announceLiveRegion,
  } = useEditStore();

  const selectionCacheRef = useRef<Map<string, SelectableElement>>(new Map());
  const lastSelectionRef = useRef<ElementSelection | null>(null);

  // Clear selection cache when sections change
  const clearSelectionCache = useCallback(() => {
    selectionCacheRef.current.clear();
  }, []);

  // Detect element boundaries within a section
  const detectElementBoundaries = useCallback((sectionElement: HTMLElement): ElementBoundary[] => {
    const boundaries: ElementBoundary[] = [];
    
    // Look for elements with data-element-key attributes
    const elements = sectionElement.querySelectorAll('[data-element-key]');
    
    elements.forEach((el) => {
      const elementKey = el.getAttribute('data-element-key');
      if (!elementKey) return;
      
      const bounds = el.getBoundingClientRect();
      const elementType = determineElementType(el as HTMLElement);
      
      boundaries.push({
        id: `${sectionElement.dataset.sectionId}.${elementKey}`,
        bounds,
        type: elementType,
        isSelectable: !el.hasAttribute('data-non-selectable'),
      });
    });
    
    return boundaries;
  }, []);

  // Determine element type from DOM structure
  const determineElementType = useCallback((element: HTMLElement): ElementBoundary['type'] => {
    const tagName = element.tagName.toLowerCase();
    const classNames = element.className;
    const elementKey = element.getAttribute('data-element-key') || '';
    
    if (tagName === 'button' || elementKey.includes('cta') || elementKey.includes('button')) {
      return 'button';
    }
    if (tagName === 'img' || elementKey.includes('image')) {
      return 'image';
    }
    if (tagName === 'form' || elementKey.includes('form')) {
      return 'form';
    }
    if (tagName === 'ul' || tagName === 'ol' || elementKey.includes('list')) {
      return 'list';
    }
    return 'text';
  }, []);

  // Resolve element hierarchy from click target
  const resolveElementHierarchy = useCallback((clickTarget: HTMLElement): ElementHierarchy | null => {
    let current = clickTarget;
    let depth = 0;
    
    // Walk up the DOM to find the closest selectable element
    while (current && depth < 10) {
      const elementKey = current.getAttribute('data-element-key');
      const sectionElement = current.closest('[data-section-id]');
      
      if (elementKey && sectionElement) {
        const sectionId = sectionElement.getAttribute('data-section-id');
        if (sectionId) {
          return {
            target: current,
            sectionId,
            elementKey,
            depth,
          };
        }
      }
      
      // Check if this is a section
      if (current.hasAttribute('data-section-id')) {
        const sectionId = current.getAttribute('data-section-id');
        if (sectionId) {
          return {
            target: current,
            sectionId,
            elementKey: 'section',
            depth,
          };
        }
      }
      
      current = current.parentElement as HTMLElement;
      depth++;
    }
    
    return null;
  }, []);

  // Get all selectable elements within a section
  const getSelectableElements = useCallback((sectionId: string): SelectableElement[] => {
    const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`) as HTMLElement;
    if (!sectionElement) return [];
    
    const cacheKey = `section-${sectionId}`;
    const cached = selectionCacheRef.current.get(cacheKey);
    
    if (cached) {
      // Validate cache - check if element still exists
      if (document.contains(cached.element)) {
        return [cached];
      } else {
        selectionCacheRef.current.delete(cacheKey);
      }
    }
    
    const selectableElements: SelectableElement[] = [];
    
    // Add section itself
    selectableElements.push({
      id: sectionId,
      sectionId,
      elementKey: 'section',
      type: 'section',
      bounds: sectionElement.getBoundingClientRect(),
      element: sectionElement,
    });
    
    // Add elements within section
    const elementBoundaries = detectElementBoundaries(sectionElement);
    elementBoundaries.forEach((boundary) => {
      if (boundary.isSelectable) {
        const element = sectionElement.querySelector(`[data-element-key="${boundary.id.split('.')[1]}"]`) as HTMLElement;
        if (element) {
          selectableElements.push({
            id: boundary.id,
            sectionId,
            elementKey: boundary.id.split('.')[1],
            type: 'element',
            bounds: boundary.bounds,
            element,
          });
        }
      }
    });
    
    // Cache results
    selectableElements.forEach((el) => {
      selectionCacheRef.current.set(el.id, el);
    });
    
    return selectableElements;
  }, [detectElementBoundaries]);

  // Enhanced click handler with hierarchy resolution
  const handleEnhancedClick = useCallback((event: MouseEvent) => {
    if (mode !== 'edit') return;
    
    const target = event.target as HTMLElement;
    const hierarchy = resolveElementHierarchy(target);
    
    if (!hierarchy) return;
    
    event.stopPropagation();
    
    const isCtrlClick = event.ctrlKey || event.metaKey;
    const isShiftClick = event.shiftKey;
    
    if (hierarchy.elementKey === 'section') {
      // Section selection
      if (isCtrlClick) {
        // Multi-select sections
        const currentMulti = multiSelection.includes(hierarchy.sectionId) 
          ? multiSelection.filter(id => id !== hierarchy.sectionId)
          : [...multiSelection, hierarchy.sectionId];
        setMultiSelection(currentMulti);
      } else if (isShiftClick && selectedSection) {
        // Range select sections
        const allSections = Array.from(document.querySelectorAll('[data-section-id]'))
          .map(el => el.getAttribute('data-section-id'))
          .filter(Boolean) as string[];
        
        const startIndex = allSections.indexOf(selectedSection);
        const endIndex = allSections.indexOf(hierarchy.sectionId);
        
        if (startIndex !== -1 && endIndex !== -1) {
          const rangeStart = Math.min(startIndex, endIndex);
          const rangeEnd = Math.max(startIndex, endIndex);
          const rangeSelection = allSections.slice(rangeStart, rangeEnd + 1);
          setMultiSelection(rangeSelection);
        }
      } else {
        // Single section selection
        setActiveSection(hierarchy.sectionId);
        setMultiSelection([]);
        
        // Show section toolbar
        const rect = hierarchy.target.getBoundingClientRect();
        showSectionToolbar(hierarchy.sectionId, {
          x: rect.right - 200,
          y: rect.top + 10,
        });
      }
      
      announceLiveRegion(`Selected section ${hierarchy.sectionId}`);
    } else {
      // Element selection
      const elementSelection: ElementSelection = {
        sectionId: hierarchy.sectionId,
        elementKey: hierarchy.elementKey,
        type: determineElementType(hierarchy.target) as any,
        editMode: 'inline',
      };
      
      selectElement(elementSelection);
      setActiveSection(hierarchy.sectionId);
      setMultiSelection([]);
      
      // Show element toolbar
      const rect = hierarchy.target.getBoundingClientRect();
      showElementToolbar(`${hierarchy.sectionId}.${hierarchy.elementKey}`, {
        x: rect.left,
        y: rect.top - 50,
      });
      
      announceLiveRegion(`Selected ${hierarchy.elementKey} in ${hierarchy.sectionId}`);
    }
    
    lastSelectionRef.current = selectedElement;
  }, [
    mode, multiSelection, selectedSection, selectedElement,
    resolveElementHierarchy, determineElementType,
    setActiveSection, selectElement, setMultiSelection,
    showSectionToolbar, showElementToolbar, announceLiveRegion
  ]);

  // Keyboard navigation
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    if (mode !== 'edit') return;
    
    // Don't handle navigation in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    
    const allSections = Array.from(document.querySelectorAll('[data-section-id]'))
      .map(el => ({
        id: el.getAttribute('data-section-id')!,
        element: el as HTMLElement,
      }))
      .filter(s => s.id);
    
    if (allSections.length === 0) return;
    
    let currentIndex = selectedSection ? allSections.findIndex(s => s.id === selectedSection) : -1;
    
    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          // Shift+Tab - previous element/section
          currentIndex = currentIndex <= 0 ? allSections.length - 1 : currentIndex - 1;
        } else {
          // Tab - next element/section
          currentIndex = currentIndex >= allSections.length - 1 ? 0 : currentIndex + 1;
        }
        
        const targetSection = allSections[currentIndex];
        setActiveSection(targetSection.id);
        setMultiSelection([]);
        
        // Scroll into view
        targetSection.element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        announceLiveRegion(`Navigated to section ${targetSection.id}`);
        break;
        
      case 'ArrowUp':
        if (selectedSection && currentIndex > 0) {
          event.preventDefault();
          const prevSection = allSections[currentIndex - 1];
          setActiveSection(prevSection.id);
          prevSection.element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          announceLiveRegion(`Moved to previous section ${prevSection.id}`);
        }
        break;
        
      case 'ArrowDown':
        if (selectedSection && currentIndex < allSections.length - 1) {
          event.preventDefault();
          const nextSection = allSections[currentIndex + 1];
          setActiveSection(nextSection.id);
          nextSection.element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          announceLiveRegion(`Moved to next section ${nextSection.id}`);
        }
        break;
        
      case 'Enter':
        if (selectedSection && !selectedElement) {
          event.preventDefault();
          // Enter section edit mode - select first element
          const selectableElements = getSelectableElements(selectedSection);
          const firstElement = selectableElements.find(el => el.type === 'element');
          
          if (firstElement) {
            const elementSelection: ElementSelection = {
              sectionId: firstElement.sectionId,
              elementKey: firstElement.elementKey,
              type: determineElementType(firstElement.element) as any,
              editMode: 'inline',
            };
            
            selectElement(elementSelection);
            announceLiveRegion(`Entered edit mode for ${firstElement.elementKey}`);
          }
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        clearSelection();
        announceLiveRegion('Cleared selection');
        break;
        
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Select all sections
          const allSectionIds = allSections.map(s => s.id);
          setMultiSelection(allSectionIds);
          announceLiveRegion(`Selected all ${allSectionIds.length} sections`);
        }
        break;
    }
  }, [
    mode, selectedSection, selectedElement,
    setActiveSection, selectElement, setMultiSelection,
    getSelectableElements, determineElementType, announceLiveRegion
  ]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setActiveSection(undefined);
    selectElement(null);
    setMultiSelection([]);
    hideSectionToolbar();
    hideElementToolbar();
  }, [setActiveSection, selectElement, setMultiSelection, hideSectionToolbar, hideElementToolbar]);

  // Navigate to next/previous selectable element
  const navigateToElement = useCallback((direction: 'next' | 'previous') => {
    if (!selectedSection) return;
    
    const selectableElements = getSelectableElements(selectedSection);
    const elementElements = selectableElements.filter(el => el.type === 'element');
    
    if (elementElements.length === 0) return;
    
    let currentIndex = -1;
    if (selectedElement) {
      currentIndex = elementElements.findIndex(
        el => el.elementKey === selectedElement.elementKey
      );
    }
    
    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = currentIndex >= elementElements.length - 1 ? 0 : currentIndex + 1;
    } else {
      nextIndex = currentIndex <= 0 ? elementElements.length - 1 : currentIndex - 1;
    }
    
    const targetElement = elementElements[nextIndex];
    const elementSelection: ElementSelection = {
      sectionId: targetElement.sectionId,
      elementKey: targetElement.elementKey,
      type: determineElementType(targetElement.element) as any,
      editMode: 'inline',
    };
    
    selectElement(elementSelection);
    
    // Scroll into view
    targetElement.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    announceLiveRegion(`Selected ${targetElement.elementKey}`);
  }, [selectedSection, selectedElement, getSelectableElements, selectElement, determineElementType, announceLiveRegion]);

  // Setup event listeners
  useEffect(() => {
    if (mode !== 'edit') return;
    
    document.addEventListener('click', handleEnhancedClick, true);
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    return () => {
      document.removeEventListener('click', handleEnhancedClick, true);
      document.removeEventListener('keydown', handleKeyboardNavigation);
    };
  }, [mode, handleEnhancedClick, handleKeyboardNavigation]);

  // Clear cache when sections change
  useEffect(() => {
    clearSelectionCache();
  }, [clearSelectionCache]);

  // Multi-selection utilities
  const addToSelection = useCallback((elementId: string) => {
    if (!multiSelection.includes(elementId)) {
      setMultiSelection([...multiSelection, elementId]);
    }
  }, [multiSelection, setMultiSelection]);

  const removeFromSelection = useCallback((elementId: string) => {
    setMultiSelection(multiSelection.filter(id => id !== elementId));
  }, [multiSelection, setMultiSelection]);

  const toggleSelection = useCallback((elementId: string) => {
    if (multiSelection.includes(elementId)) {
      removeFromSelection(elementId);
    } else {
      addToSelection(elementId);
    }
  }, [multiSelection, addToSelection, removeFromSelection]);

  const selectRange = useCallback((startId: string, endId: string) => {
    const allSections = Array.from(document.querySelectorAll('[data-section-id]'))
      .map(el => el.getAttribute('data-section-id'))
      .filter(Boolean) as string[];
    
    const startIndex = allSections.indexOf(startId);
    const endIndex = allSections.indexOf(endId);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const rangeStart = Math.min(startIndex, endIndex);
      const rangeEnd = Math.max(startIndex, endIndex);
      const rangeSelection = allSections.slice(rangeStart, rangeEnd + 1);
      setMultiSelection(rangeSelection);
    }
  }, [setMultiSelection]);

  const selectAll = useCallback(() => {
    const allSections = Array.from(document.querySelectorAll('[data-section-id]'))
      .map(el => el.getAttribute('data-section-id'))
      .filter(Boolean) as string[];
    setMultiSelection(allSections);
  }, [setMultiSelection]);

  // Focus management
  const focusSelectedElement = useCallback(() => {
    if (selectedElement) {
      const element = document.querySelector(
        `[data-section-id="${selectedElement.sectionId}"] [data-element-key="${selectedElement.elementKey}"]`
      ) as HTMLElement;
      
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (selectedSection) {
      const section = document.querySelector(`[data-section-id="${selectedSection}"]`) as HTMLElement;
      if (section) {
        section.focus();
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedElement, selectedSection]);

  const determineElementTypeEnhanced = useCallback((element: HTMLElement): {
  elementType: ElementBoundary['type'];
  toolbarType: ToolbarType;
  priority: number;
} => {
  const tagName = element.tagName.toLowerCase();
  const classNames = element.className || '';
  const elementKey = element.getAttribute('data-element-key') || '';
  const role = element.getAttribute('role') || '';
  const type = element.getAttribute('type') || '';
  
  // Priority 1: ElementToolbar (Interactive Elements)
  if (
    tagName === 'button' ||
    tagName === 'a' ||
    tagName === 'input' ||
    tagName === 'select' ||
    tagName === 'textarea' ||
    role === 'button' ||
    elementKey.includes('cta') ||
    elementKey.includes('button') ||
    elementKey.includes('link') ||
    classNames.includes('btn') ||
    classNames.includes('button') ||
    classNames.includes('cta')
  ) {
    return {
      elementType: 'button',
      toolbarType: 'element',
      priority: 1,
    };
  }
  
  // Priority 2: TextToolbar (Text Elements)
  if (
    tagName === 'h1' ||
    tagName === 'h2' ||
    tagName === 'h3' ||
    tagName === 'h4' ||
    tagName === 'h5' ||
    tagName === 'h6' ||
    tagName === 'p' ||
    tagName === 'span' ||
    tagName === 'div' && (
      elementKey.includes('headline') ||
      elementKey.includes('title') ||
      elementKey.includes('text') ||
      elementKey.includes('description') ||
      elementKey.includes('content') ||
      element.textContent?.trim().length > 0
    )
  ) {
    return {
      elementType: 'text',
      toolbarType: 'text',
      priority: 2,
    };
  }
  
  // Priority 3: ImageToolbar (Image Elements)
  if (
    tagName === 'img' ||
    elementKey.includes('image') ||
    elementKey.includes('photo') ||
    elementKey.includes('picture') ||
    element.dataset.elementType === 'image' ||
    classNames.includes('image') ||
    classNames.includes('img')
  ) {
    return {
      elementType: 'image',
      toolbarType: 'image',
      priority: 3,
    };
  }
  
  // Priority 4: FormToolbar (Form Elements)
  if (
    tagName === 'form' ||
    tagName === 'fieldset' ||
    elementKey.includes('form') ||
    element.dataset.elementType === 'form' ||
    element.closest('form') !== null ||
    classNames.includes('form')
  ) {
    return {
      elementType: 'form',
      toolbarType: 'form',
      priority: 4,
    };
  }
  
  // Priority 5: SectionToolbar (Default fallback)
  return {
    elementType: 'text', // Default to text for unknown elements
    toolbarType: 'section',
    priority: 5,
  };
}, []);

// Context-aware toolbar selection with multiple toolbar scenarios
const selectAppropriateToolbars = useCallback((
  clickTarget: HTMLElement,
  sectionElement: HTMLElement
): {
  primary: ToolbarType;
  secondary?: ToolbarType;
  elementInfo: ReturnType<typeof determineElementTypeEnhanced>;
  shouldShowMultiple: boolean;
} => {
  const hierarchy = resolveElementHierarchy(clickTarget);
  
  if (!hierarchy || hierarchy.elementKey === 'section') {
    // Section-level selection
    return {
      primary: 'section',
      elementInfo: {
        elementType: 'text',
        toolbarType: 'section',
        priority: 5,
      },
      shouldShowMultiple: false,
    };
  }
  
  // Element-level selection - determine appropriate toolbar
  const elementInfo = determineElementTypeEnhanced(hierarchy.target);
  
  // Check for special multi-toolbar scenarios
  const shouldShowMultiple = shouldShowMultipleToolbars(hierarchy.target, elementInfo);
  
  if (shouldShowMultiple) {
    const secondary = getSecondaryToolbar(hierarchy.target, elementInfo);
    return {
      primary: elementInfo.toolbarType,
      secondary,
      elementInfo,
      shouldShowMultiple: true,
    };
  }
  
  return {
    primary: elementInfo.toolbarType,
    elementInfo,
    shouldShowMultiple: false,
  };
}, [resolveElementHierarchy, determineElementTypeEnhanced]);

// Determine if multiple toolbars should be shown
const shouldShowMultipleToolbars = useCallback((
  element: HTMLElement,
  elementInfo: ReturnType<typeof determineElementTypeEnhanced>
): boolean => {
  // Show both ElementToolbar and TextToolbar for rich text buttons/links
  if (
    elementInfo.toolbarType === 'element' &&
    element.textContent?.trim().length > 0 &&
    (element.tagName.toLowerCase() === 'a' || 
     element.getAttribute('data-element-key')?.includes('cta'))
  ) {
    return true;
  }
  
  // Show both FormToolbar and ElementToolbar for form inputs with special styling
  if (
    elementInfo.toolbarType === 'form' &&
    (element.tagName.toLowerCase() === 'input' || 
     element.tagName.toLowerCase() === 'button') &&
    element.closest('form')
  ) {
    return true;
  }
  
  // Show both ImageToolbar and ElementToolbar for clickable images
  if (
    elementInfo.toolbarType === 'image' &&
    (element.closest('a') || element.getAttribute('role') === 'button')
  ) {
    return true;
  }
  
  return false;
}, []);

// Get secondary toolbar for multi-toolbar scenarios
const getSecondaryToolbar = useCallback((
  element: HTMLElement,
  primaryInfo: ReturnType<typeof determineElementTypeEnhanced>
): ToolbarType | undefined => {
  if (primaryInfo.toolbarType === 'element') {
    // Element + Text for rich text buttons/links
    if (element.textContent?.trim().length > 0) {
      return 'text';
    }
  }
  
  if (primaryInfo.toolbarType === 'form') {
    // Form + Element for interactive form controls
    if (element.tagName.toLowerCase() === 'input' || 
        element.tagName.toLowerCase() === 'button') {
      return 'element';
    }
  }
  
  if (primaryInfo.toolbarType === 'image') {
    // Image + Element for clickable images
    if (element.closest('a') || element.getAttribute('role') === 'button') {
      return 'element';
    }
  }
  
  return undefined;
}, []);

// Get toolbar priority for conflict resolution
const getToolbarPriority = useCallback((toolbarType: ToolbarType): number => {
  const priorities: Record<ToolbarType, number> = {
    'element': 1,
    'text': 2,
    'image': 3,
    'form': 4,
    'section': 5,
    'ai': 6,
    'context': 7,
    'floating': 8,
    'inline': 9,
  };
  
  return priorities[toolbarType] || 10;
}, []);

// Prioritize toolbars when multiple are applicable
const prioritizeToolbars = useCallback((
  toolbars: ToolbarType[]
): ToolbarType[] => {
  return toolbars.sort((a, b) => {
    const priorityA = getToolbarPriority(a);
    const priorityB = getToolbarPriority(b);
    return priorityA - priorityB;
  });
}, [getToolbarPriority]);

// Enhanced click handler with context-aware toolbar selection
const handleEnhancedClickWithContext = useCallback((event: MouseEvent) => {
  if (mode !== 'edit') return;
  
  const target = event.target as HTMLElement;
  const sectionElement = target.closest('[data-section-id]') as HTMLElement;
  
  if (!sectionElement) return;
  
  event.stopPropagation();
  
  const isCtrlClick = event.ctrlKey || event.metaKey;
  const isShiftClick = event.shiftKey;
  
  // Determine appropriate toolbar(s) based on context
  const toolbarSelection = selectAppropriateToolbars(target, sectionElement);
  const sectionId = sectionElement.getAttribute('data-section-id')!;
  
  // Handle multi-selection for sections
  if (toolbarSelection.primary === 'section') {
    if (isCtrlClick) {
      const currentMulti = multiSelection.includes(sectionId) 
        ? multiSelection.filter(id => id !== sectionId)
        : [...multiSelection, sectionId];
      setMultiSelection(currentMulti);
    } else if (isShiftClick && selectedSection) {
      // Range select sections
      const allSections = Array.from(document.querySelectorAll('[data-section-id]'))
        .map(el => el.getAttribute('data-section-id'))
        .filter(Boolean) as string[];
      
      const startIndex = allSections.indexOf(selectedSection);
      const endIndex = allSections.indexOf(sectionId);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const rangeStart = Math.min(startIndex, endIndex);
        const rangeEnd = Math.max(startIndex, endIndex);
        const rangeSelection = allSections.slice(rangeStart, rangeEnd + 1);
        setMultiSelection(rangeSelection);
      }
    } else {
      // Single section selection
      setActiveSection(sectionId);
      setMultiSelection([]);
      
      // Show section toolbar with smart positioning
      const { showSmartToolbar } = useToolbarPositioning();
      showSmartToolbar('section', sectionId, {
        preferredPosition: 'top',
        followTarget: true,
        avoidCollisions: true,
      });
    }
    
    announceLiveRegion(`Selected section ${sectionId}`);
    return;
  }
  
  // Handle element-level selection
  const elementKey = target.getAttribute('data-element-key') || 
                    target.closest('[data-element-key]')?.getAttribute('data-element-key');
  
  if (!elementKey) return;
  
  const elementSelection: ElementSelection = {
    sectionId,
    elementKey,
    type: toolbarSelection.elementInfo.elementType as any,
    editMode: 'inline',
  };
  
  selectElement(elementSelection);
  setActiveSection(sectionId);
  setMultiSelection([]);
  
  // Show appropriate toolbar(s) with smart positioning
  const { showSmartToolbar, hideSmartToolbar } = useToolbarPositioning();
  const elementId = `${sectionId}.${elementKey}`;
  
  // Hide all toolbars first
  ['section', 'element', 'text', 'form', 'image'].forEach(type => {
    hideSmartToolbar(type as ToolbarType);
  });
  
  // Show primary toolbar
  showSmartToolbar(toolbarSelection.primary, elementId, {
    preferredPosition: 'top',
    followTarget: true,
    avoidCollisions: true,
  });
  
  // Show secondary toolbar if applicable
  if (toolbarSelection.shouldShowMultiple && toolbarSelection.secondary) {
    // Position secondary toolbar below primary or to the side
    setTimeout(() => {
      showSmartToolbar(toolbarSelection.secondary!, elementId, {
        preferredPosition: 'bottom', // Try below primary
        followTarget: true,
        avoidCollisions: true,
        offset: { x: 0, y: 60 }, // Offset to avoid collision with primary
      });
    }, 50); // Small delay to ensure primary toolbar is positioned first
  }
  
  // Announce selection with context
  const contextDescription = toolbarSelection.shouldShowMultiple 
    ? `${toolbarSelection.primary} and ${toolbarSelection.secondary} tools`
    : `${toolbarSelection.primary} tools`;
  
  announceLiveRegion(`Selected ${elementKey} with ${contextDescription}`);
  
}, [
  mode, multiSelection, selectedSection,
  selectAppropriateToolbars, setActiveSection, selectElement, setMultiSelection,
  announceLiveRegion
]);

// Utility function to get current toolbar context
const getCurrentToolbarContext = useCallback((): {
  selectedToolbars: ToolbarType[];
  primaryToolbar?: ToolbarType;
  elementType?: string;
  canShowMultiple: boolean;
} => {
  if (!selectedElement) {
    return {
      selectedToolbars: selectedSection ? ['section'] : [],
      primaryToolbar: selectedSection ? 'section' : undefined,
      canShowMultiple: false,
    };
  }
  
  const targetElement = document.querySelector(
    `[data-section-id="${selectedElement.sectionId}"] [data-element-key="${selectedElement.elementKey}"]`
  ) as HTMLElement;
  
  if (!targetElement) {
    return {
      selectedToolbars: [],
      canShowMultiple: false,
    };
  }
  
  const elementInfo = determineElementTypeEnhanced(targetElement);
  const shouldShowMultiple = shouldShowMultipleToolbars(targetElement, elementInfo);
  const toolbars = [elementInfo.toolbarType];
  
  if (shouldShowMultiple) {
    const secondary = getSecondaryToolbar(targetElement, elementInfo);
    if (secondary) {
      toolbars.push(secondary);
    }
  }
  
  return {
    selectedToolbars: prioritizeToolbars(toolbars),
    primaryToolbar: elementInfo.toolbarType,
    elementType: elementInfo.elementType,
    canShowMultiple: shouldShowMultiple,
  };
}, [
  selectedElement, selectedSection,
  determineElementTypeEnhanced, shouldShowMultipleToolbars,
  getSecondaryToolbar, prioritizeToolbars
]);



return {
  // State
  selectedSection,
  selectedElement,
  multiSelection,
  
  // Detection utilities
  detectElementBoundaries,
  determineElementType,
  resolveElementHierarchy,
  getSelectableElements,
  
  // Selection actions
  clearSelection,
  navigateToElement,
  focusSelectedElement,
  
  // Multi-selection
  addToSelection,
  removeFromSelection,
  toggleSelection,
  selectRange,
  selectAll,
  
  // Event handlers (for manual use)
  handleEnhancedClick,
  handleKeyboardNavigation,
  
  // Cache management
  clearSelectionCache,
  
  // NEW: Context-aware functions (ADD THESE)
  determineElementTypeEnhanced,
  selectAppropriateToolbars,
  shouldShowMultipleToolbars,
  getSecondaryToolbar,
  getToolbarPriority,
  prioritizeToolbars,
  handleEnhancedClickWithContext,
  getCurrentToolbarContext,
}