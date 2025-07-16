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
    setTextEditingMode,
    isTextEditing,
    textEditingElement,
    toolbar,
  } = useEditStore();

  // Determine what was clicked and its context
  const determineClickTarget = useCallback((event: MouseEvent): ClickTarget | null => {
    const target = event.target as HTMLElement;
    
    // Check if we're in text editing mode using store state
    // Double validation: Check both text editing state AND toolbar type
    if ((isTextEditing && textEditingElement) || toolbar.type === 'text') {
      // Check if clicking on the element being edited
      const elementWithKey = target.closest('[data-element-key]') as HTMLElement;
      const sectionElement = target.closest('[data-section-id]') as HTMLElement;
      
      if (elementWithKey && sectionElement) {
        const elementKey = elementWithKey.getAttribute('data-element-key');
        const sectionId = sectionElement.getAttribute('data-section-id');
        
        // If clicking on the same element that's being edited, ignore the click
        if (textEditingElement && 
            elementKey === textEditingElement.elementKey && 
            sectionId === textEditingElement.sectionId) {
          console.log('🛡️ Click on text editing element - ignoring', { 
            target, 
            textEditingElement,
            clickedElement: { sectionId, elementKey },
            isTextEditing,
            toolbarType: toolbar.type
          });
          return null;
        }
        
        // Also ignore if toolbar is text type and clicking on the toolbar target
        if (toolbar.type === 'text' && toolbar.targetId) {
          const [toolbarSectionId, toolbarElementKey] = toolbar.targetId.split('.');
          if (elementKey === toolbarElementKey && sectionId === toolbarSectionId) {
            console.log('🛡️ Click on text toolbar target element - ignoring', { 
              target, 
              toolbarTarget: toolbar.targetId,
              clickedElement: { sectionId, elementKey }
            });
            return null;
          }
        }
      }
    }
    
    // Debug: Check what we're clicking on
    console.log('🎯 Click target debug:', {
      tagName: target.tagName,
      className: target.className,
      hasDataElementKey: target.hasAttribute('data-element-key'),
      hasDataSectionId: target.hasAttribute('data-section-id'),
      closestElementKey: target.closest('[data-element-key]')?.getAttribute('data-element-key'),
      closestSectionId: target.closest('[data-section-id]')?.getAttribute('data-section-id'),
      isContentEditable: target.contentEditable,
      isTextEditing,
      textEditingElement,
      toolbarType: toolbar.type,
      toolbarTargetId: toolbar.targetId
    });

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
  }, [isTextEditing, textEditingElement, toolbar]);

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
    if (!clickTarget) {
      console.log('🎯 Editor click ignored - no target or in text editing mode');
      return;
    }

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
      
      // Stop propagation since we handled this element click
      event.stopPropagation();
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
    const wrapper = document.querySelector(selector) as HTMLElement;
    
    if (!wrapper) {
      console.log('❌ Wrapper not found for text editing:', selector);
      return;
    }

    // Find the actual text element inside the wrapper, prioritizing text elements and InlineTextEditor
    const textElement = wrapper.querySelector('.inline-text-editor, h1, h2, h3, h4, h5, h6, p, span, div:not(.element-drag-handle):not(.drag-handle-icon)') as HTMLElement;
    const element = textElement || wrapper;
    
    console.log('✏️ Entering text edit mode for:', { 
      elementKey, 
      sectionId, 
      wrapper: { 
        tagName: wrapper.tagName, 
        className: wrapper.className,
        innerHTML: wrapper.innerHTML.substring(0, 200) + '...' 
      }, 
      element: { 
        tagName: element.tagName, 
        className: element.className,
        contentEditable: element.contentEditable,
        hasDataEditing: element.hasAttribute('data-editing'),
        currentContent: element.textContent
      }
    });
    
    // Make element editable
    element.contentEditable = 'true';
    element.setAttribute('data-editing', 'true');
    element.classList.add('text-editing-mode');
    
    // Debug: Verify the class was added
    console.log('✏️ After adding text-editing-mode class:', {
      hasClass: element.classList.contains('text-editing-mode'),
      classList: element.classList.toString(),
      hasDataEditing: element.hasAttribute('data-editing'),
      dataEditingValue: element.getAttribute('data-editing'),
      elementReference: element
    });
    
    // Check if the class is still there after a short delay
    setTimeout(() => {
      console.log('✏️ Class status after 100ms:', {
        hasClass: element.classList.contains('text-editing-mode'),
        classList: element.classList.toString(),
        hasDataEditing: element.hasAttribute('data-editing'),
        dataEditingValue: element.getAttribute('data-editing')
      });
    }, 100);
    
    // Force text cursor and override any conflicting styles
    element.style.cssText += `
      cursor: text !important;
      user-select: text !important;
      pointer-events: auto !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    `;
    
    // Debug: Check if properties were set correctly
    console.log('✏️ After setting properties:', {
      contentEditable: element.contentEditable,
      hasDataEditing: element.hasAttribute('data-editing'),
      hasTextEditingMode: element.classList.contains('text-editing-mode'),
      computedStyle: {
        cursor: window.getComputedStyle(element).cursor,
        userSelect: window.getComputedStyle(element).userSelect,
        pointerEvents: window.getComputedStyle(element).pointerEvents
      },
      parentStyles: {
        cursor: window.getComputedStyle(element.parentElement!).cursor,
        pointerEvents: window.getComputedStyle(element.parentElement!).pointerEvents
      },
      elementPosition: element.getBoundingClientRect(),
      zIndex: window.getComputedStyle(element).zIndex
    });
    
    // Debug: Check what element is actually at the cursor position
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const elementAtPoint = document.elementFromPoint(centerX, centerY);
      
      console.log('🎯 Element at cursor position:', {
        expectedElement: element,
        actualElement: elementAtPoint,
        isSameElement: element === elementAtPoint,
        actualElementInfo: elementAtPoint ? {
          tagName: elementAtPoint.tagName,
          className: elementAtPoint.className,
          cursor: window.getComputedStyle(elementAtPoint).cursor
        } : null
      });
    }, 100);
    
    // Instead of disabling pointer events, we need to make the wrapper have text cursor too
    const selectableWrapper = element.closest('.selectable-element');
    if (selectableWrapper) {
      // Don't disable pointer events - we need them for text selection
      // selectableWrapper.style.pointerEvents = 'none';
      selectableWrapper.classList.add('force-text-cursor');
      
      // Create a very high specificity style override
      const styleId = 'text-cursor-override';
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = `
        .force-text-cursor,
        .force-text-cursor *,
        .force-text-cursor .selectable-element,
        .force-text-cursor .inline-text-editor {
          cursor: text !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
      `;
    }
    
    // Disable InlineTextEditor's event handlers temporarily
    const originalOnInput = element.oninput;
    const originalOnFocus = element.onfocus;
    const originalOnBlur = element.onblur;
    const originalOnKeyDown = element.onkeydown;
    
    // Remove InlineTextEditor event handlers
    element.oninput = null;
    element.onfocus = null;
    element.onblur = null;
    element.onkeydown = null;
    
    // Store original handlers for restoration
    element.dataset.originalHandlers = JSON.stringify({
      oninput: !!originalOnInput,
      onfocus: !!originalOnFocus,
      onblur: !!originalOnBlur,
      onkeydown: !!originalOnKeyDown
    });
    
    // Focus and select text
    element.focus();
    
    // Select all text after a short delay to ensure focus is set
    setTimeout(() => {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      console.log('✏️ Text selection attempted:', {
        rangeStartOffset: range.startOffset,
        rangeEndOffset: range.endOffset,
        selectionText: selection?.toString(),
        selectionRangeCount: selection?.rangeCount
      });
    }, 50);

    // Show text toolbar positioned away from the text element
    const rect = element.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top - 80  // Position toolbar further away from text
    };
    
    const elementId = `${sectionId}.${elementKey}`;
    console.log('✏️ About to show text toolbar:', { 
      elementId, 
      position, 
      sectionId, 
      elementKey, 
      calculatedId: `${sectionId}.${elementKey}` 
    });
    
    // Set text editing state in store
    setTextEditingMode(true, { sectionId, elementKey });
    
    showToolbar('text', elementId, position);
    console.log('✏️ Text toolbar shown');
    
    announceLiveRegion('Entered text editing mode');
  }, [calculateToolbarPosition, showToolbar, announceLiveRegion, setTextEditingMode]);

  const exitTextEditMode = useCallback((elementKey: string, sectionId: string) => {
    const selector = `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"]`;
    const wrapper = document.querySelector(selector) as HTMLElement;
    
    if (!wrapper) return;

    // Find the actual text element inside the wrapper (same as enterTextEditMode)
    const textElement = wrapper.querySelector('.inline-text-editor, h1, h2, h3, h4, h5, h6, p, span, div:not(.element-drag-handle):not(.drag-handle-icon)') as HTMLElement;
    const element = textElement || wrapper;

    console.log('✏️ Exiting text edit mode for:', { elementKey, sectionId, wrapper, element });

    // Make element non-editable
    element.contentEditable = 'false';
    element.removeAttribute('data-editing');
    element.classList.remove('text-editing-mode');
    
    // Restore element styles
    element.style.cursor = '';
    element.style.userSelect = '';
    element.style.pointerEvents = '';
    
    // Restore InlineTextEditor event handlers
    if (element.dataset.originalHandlers) {
      const handlers = JSON.parse(element.dataset.originalHandlers);
      // Note: We can't fully restore the original handlers, but we can remove our interference
      // The InlineTextEditor will re-attach its handlers on next render
      delete element.dataset.originalHandlers;
    }
    
    // Restore wrapper styles
    const selectableWrapper = element.closest('.selectable-element');
    if (selectableWrapper) {
      selectableWrapper.classList.remove('force-text-cursor');
      
      // Remove the style override
      const styleElement = document.getElementById('text-cursor-override');
      if (styleElement) {
        styleElement.remove();
      }
    }
    
    // Clear selection
    const selection = window.getSelection();
    selection?.removeAllRanges();
    
    // Clear text editing state in store
    setTextEditingMode(false);
    
    // Show element toolbar instead
    const position = calculateToolbarPosition(element, 'element');
    showToolbar('element', `${sectionId}.${elementKey}`, position);
    
    announceLiveRegion('Exited text editing mode');
  }, [calculateToolbarPosition, showToolbar, announceLiveRegion, setTextEditingMode]);

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