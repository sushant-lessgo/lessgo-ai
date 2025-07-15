// hooks/useEditor.ts - Unified editor interaction system
import { useCallback, useEffect } from 'react';
import { useEditStore } from './useEditStore';

export interface ClickTarget {
  element: HTMLElement;
  sectionId: string | null;
  elementKey: string | null;
  type: 'section' | 'element' | 'background';
}

export function useEditor() {
  const {
    mode,
    selectedSection,
    selectedElement,
    showToolbar,
    hideToolbar,
    setActiveSection,
    selectElement,
    announceLiveRegion,
  } = useEditStore();

  // Determine what was clicked and its context
  const determineClickTarget = useCallback((event: MouseEvent): ClickTarget | null => {
    const target = event.target as HTMLElement;
    
    // Check if we're in a protected editing zone
    const isEditing = target.closest('[contenteditable="true"][data-editing="true"]');
    if (isEditing) {
      console.log('🛡️ Click in editing zone - ignoring');
      return null;
    }

    // Check if clicking on toolbar - prevent interference
    const isToolbarClick = target.closest('[data-toolbar-type]');
    if (isToolbarClick) {
      console.log('🛡️ Toolbar click - ignoring');
      return null;
    }

    // Find the closest element with data-element-key
    const elementWithKey = target.closest('[data-element-key]') as HTMLElement;
    
    // Find the closest section
    const sectionElement = target.closest('[data-section-id]') as HTMLElement;
    
    if (!sectionElement) {
      return {
        element: target,
        sectionId: null,
        elementKey: null,
        type: 'background'
      };
    }

    const sectionId = sectionElement.getAttribute('data-section-id');
    
    if (elementWithKey && sectionElement.contains(elementWithKey)) {
      // Clicked on an element
      const elementKey = elementWithKey.getAttribute('data-element-key');
      return {
        element: elementWithKey,
        sectionId,
        elementKey,
        type: 'element'
      };
    } else {
      // Clicked on section background
      return {
        element: sectionElement,
        sectionId,
        elementKey: null,
        type: 'section'
      };
    }
  }, []);

  // Calculate optimal toolbar position for target
  const calculateToolbarPosition = useCallback((
    targetElement: HTMLElement,
    toolbarType: string
  ): { x: number; y: number } => {
    const rect = targetElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const padding = 12;
    const toolbarHeight = 48;

    // Position at center of target element horizontally
    // The transform: translate(-50%, -100%) will center and position above
    let x = rect.left + rect.width / 2;
    let y = rect.top - padding;

    // Keep within viewport bounds (accounting for transform)
    const halfToolbarWidth = 160; // Estimated half width
    if (x - halfToolbarWidth < 10) {
      x = 10 + halfToolbarWidth;
    } else if (x + halfToolbarWidth > viewport.width - 10) {
      x = viewport.width - 10 - halfToolbarWidth;
    }

    // If too close to top, position below instead
    if (y - toolbarHeight < 10) {
      y = rect.bottom + padding + toolbarHeight; // Position below
    }

    // If still doesn't fit, position at safe distance from bottom
    if (y > viewport.height - 10) {
      y = viewport.height - toolbarHeight - 10;
    }

    return { x, y };
  }, []);

  // Determine element type for toolbar context
  const determineElementType = useCallback((element: HTMLElement): string => {
    const tagName = element.tagName.toLowerCase();
    const elementKey = element.getAttribute('data-element-key') || '';
    const role = element.getAttribute('role') || '';

    // Interactive elements get element toolbar
    if (
      ['button', 'a'].includes(tagName) ||
      role === 'button' ||
      elementKey.includes('cta') ||
      elementKey.includes('button')
    ) {
      return 'element';
    }

    // Text elements get text toolbar when being edited
    if (
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(tagName) ||
      elementKey.includes('text') ||
      elementKey.includes('headline') ||
      elementKey.includes('title')
    ) {
      return 'text';
    }

    // Images get image toolbar
    if (tagName === 'img' || elementKey.includes('image')) {
      return 'image';
    }

    // Forms get form toolbar
    if (tagName === 'form' || elementKey.includes('form')) {
      return 'form';
    }

    // Default to element toolbar
    return 'element';
  }, []);

  // Main click handler - unified entry point
  const handleEditorClick = useCallback((event: MouseEvent) => {
    if (mode !== 'edit') return;

    const clickTarget = determineClickTarget(event);
    if (!clickTarget) return;

    console.log('🎯 Editor click:', clickTarget);

    // Prevent event bubbling for our handled clicks
    event.stopPropagation();

    if (clickTarget.type === 'background') {
      // Clicked on background - hide toolbar and clear selection
      hideToolbar();
      setActiveSection(undefined);
      selectElement(null);
      announceLiveRegion('Cleared selection');
      return;
    }

    if (clickTarget.type === 'section') {
      // Clicked on section
      const position = calculateToolbarPosition(clickTarget.element, 'section');
      
      setActiveSection(clickTarget.sectionId);
      selectElement(null);
      showToolbar('section', clickTarget.sectionId!, position);
      
      announceLiveRegion(`Selected section ${clickTarget.sectionId}`);
      return;
    }

    if (clickTarget.type === 'element') {
      // Clicked on element
      const elementType = determineElementType(clickTarget.element);
      const targetId = `${clickTarget.sectionId}.${clickTarget.elementKey}`;
      const position = calculateToolbarPosition(clickTarget.element, elementType);
      
      // Update selection
      setActiveSection(clickTarget.sectionId);
      selectElement({
        sectionId: clickTarget.sectionId!,
        elementKey: clickTarget.elementKey!,
        type: elementType as any,
        editMode: 'inline',
      });
      
      // Show appropriate toolbar
      showToolbar(elementType as any, targetId, position);
      
      announceLiveRegion(`Selected ${clickTarget.elementKey} in ${clickTarget.sectionId}`);
      return;
    }
  }, [
    mode,
    determineClickTarget,
    calculateToolbarPosition,
    determineElementType,
    hideToolbar,
    setActiveSection,
    selectElement,
    showToolbar,
    announceLiveRegion,
  ]);

  // Handle keyboard navigation
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    if (mode !== 'edit') return;

    // Don't handle navigation in input fields or contenteditable
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        hideToolbar();
        setActiveSection(undefined);
        selectElement(null);
        announceLiveRegion('Cleared selection');
        break;

      case 'Tab':
        // Tab navigation between sections
        event.preventDefault();
        const allSections = Array.from(document.querySelectorAll('[data-section-id]'));
        if (allSections.length === 0) return;

        const currentIndex = selectedSection
          ? allSections.findIndex(
              (el) => el.getAttribute('data-section-id') === selectedSection
            )
          : -1;

        let nextIndex;
        if (event.shiftKey) {
          nextIndex = currentIndex <= 0 ? allSections.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= allSections.length - 1 ? 0 : currentIndex + 1;
        }

        const nextSection = allSections[nextIndex] as HTMLElement;
        const nextSectionId = nextSection.getAttribute('data-section-id')!;
        const position = calculateToolbarPosition(nextSection, 'section');

        setActiveSection(nextSectionId);
        selectElement(null);
        showToolbar('section', nextSectionId, position);

        nextSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        announceLiveRegion(`Navigated to section ${nextSectionId}`);
        break;
    }
  }, [
    mode,
    selectedSection,
    hideToolbar,
    setActiveSection,
    selectElement,
    showToolbar,
    calculateToolbarPosition,
    announceLiveRegion,
  ]);

  // Set up event listeners
  useEffect(() => {
    if (mode !== 'edit') return;

    // Use capture phase to handle events before other handlers
    document.addEventListener('click', handleEditorClick, true);
    document.addEventListener('keydown', handleKeyboardNavigation);

    return () => {
      document.removeEventListener('click', handleEditorClick, true);
      document.removeEventListener('keydown', handleKeyboardNavigation);
    };
  }, [mode, handleEditorClick, handleKeyboardNavigation]);

  // Text editing helpers
  const enterTextEditMode = useCallback((elementKey: string, sectionId: string) => {
    const selector = `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"]`;
    const element = document.querySelector(selector) as HTMLElement;
    
    if (!element) return;

    // Make element editable
    element.contentEditable = 'true';
    element.setAttribute('data-editing', 'true');
    element.classList.add('text-editing-mode');
    
    // Focus and select text
    element.focus();
    
    // Select all text
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Show text toolbar
    const position = calculateToolbarPosition(element, 'text');
    showToolbar('text', `${sectionId}.${elementKey}`, position);
    
    announceLiveRegion('Entered text editing mode');
  }, [calculateToolbarPosition, showToolbar, announceLiveRegion]);

  const exitTextEditMode = useCallback((elementKey: string, sectionId: string) => {
    const selector = `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"]`;
    const element = document.querySelector(selector) as HTMLElement;
    
    if (!element) return;

    // Make element non-editable
    element.contentEditable = 'false';
    element.removeAttribute('data-editing');
    element.classList.remove('text-editing-mode');
    
    // Clear selection
    const selection = window.getSelection();
    selection?.removeAllRanges();
    
    // Show element toolbar instead
    const position = calculateToolbarPosition(element, 'element');
    showToolbar('element', `${sectionId}.${elementKey}`, position);
    
    announceLiveRegion('Exited text editing mode');
  }, [calculateToolbarPosition, showToolbar, announceLiveRegion]);

  return {
    // Event handlers
    handleEditorClick,
    handleKeyboardNavigation,
    
    // Text editing
    enterTextEditMode,
    exitTextEditMode,
    
    // Utilities
    determineClickTarget,
    calculateToolbarPosition,
    determineElementType,
    
    // State
    selectedSection,
    selectedElement,
    mode,
  };
}