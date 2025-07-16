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
    updateElementContent,
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
    
    // Entering text edit mode
    
    // Make element editable
    element.contentEditable = 'true';
    element.setAttribute('data-editing', 'true');
    element.classList.add('text-editing-mode');
    
    // Text editing mode class and attributes set
    
    // Force text cursor and override any conflicting styles
    element.style.cssText += `
      cursor: text !important;
      user-select: text !important;
      pointer-events: auto !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    `;
    
    // Properties set correctly
    
    // Element positioning verified
    
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
    const originalOnMouseUp = element.onmouseup;
    const originalOnKeyUp = element.onkeyup;
    
    // Store original handlers for restoration
    element.dataset.originalHandlers = JSON.stringify({
      oninput: !!originalOnInput,
      onfocus: !!originalOnFocus,
      onblur: !!originalOnBlur,
      onkeydown: !!originalOnKeyDown,
      onmouseup: !!originalOnMouseUp,
      onkeyup: !!originalOnKeyUp
    });

    // Completely disable InlineTextEditor's selection handlers
    element.onmouseup = null;
    element.onkeyup = null;
    
    console.log('🔍 Disabled InlineTextEditor handlers:', {
      onmouseup: !!originalOnMouseUp,
      onkeyup: !!originalOnKeyUp,
      element: element.className
    });

    // Store the content update function for later use
    element.dataset.pendingContent = element.textContent || '';
    
    // Set up proper input event handlers for text editing mode
    element.oninput = (e) => {
      console.log('🔍 INPUT EVENT - Natural typing (no store updates during typing):', {
        selection: window.getSelection()?.toString(),
        rangeCount: window.getSelection()?.rangeCount,
        cursorPosition: window.getSelection()?.getRangeAt(0)?.startOffset,
        elementContent: element.textContent,
        contentLength: element.textContent?.length
      });
      
      // Just store the content for later - don't update store during typing
      element.dataset.pendingContent = element.textContent || '';
      console.log('🔍 Content stored for later update:', { content: element.dataset.pendingContent });
      
      // Mark that user has started typing - prevents cursor repositioning
      element.dataset.userHasTyped = 'true';
    };
    
    element.onfocus = (e) => {
      // Maintain focus without resetting cursor position
      if (originalOnFocus) {
        originalOnFocus.call(element, e);
      }
    };
    
    element.onblur = (e) => {
      // Save pending content immediately on blur to prevent text loss
      if (element.dataset.pendingContent) {
        const finalContent = element.dataset.pendingContent;
        console.log('🔍 Saving content on blur:', { finalContent, length: finalContent.length });
        updateElementContent(sectionId, elementKey, finalContent);
      }
      
      // Handle blur event properly
      if (originalOnBlur) {
        originalOnBlur.call(element, e);
      }
    };
    
    element.onkeydown = (e) => {
      // Handle keyboard events properly
      if (originalOnKeyDown) {
        originalOnKeyDown.call(element, e);
      }
      
      // Save content on Enter or Escape to prevent loss
      if (e.key === 'Enter' || e.key === 'Escape') {
        if (element.dataset.pendingContent) {
          const finalContent = element.dataset.pendingContent;
          console.log('🔍 Saving content on key:', { key: e.key, finalContent });
          updateElementContent(sectionId, elementKey, finalContent);
        }
      }
    };
    
    // Focus and position cursor at the end of text
    element.focus();
    
    // Position cursor at the end of text instead of selecting all
    // Only set cursor position initially, don't interfere with typing
    if (!element.dataset.userHasTyped) {
      setTimeout(() => {
        // Check again to make sure user hasn't started typing
        if (element.dataset.userHasTyped) {
          console.log('🔍 User has started typing - skipping cursor positioning');
          return;
        }
        
        const range = document.createRange();
        const selection = window.getSelection();
        
        // Get the last text node in the element
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let lastTextNode = null;
        let currentNode = walker.nextNode();
        while (currentNode) {
          lastTextNode = currentNode;
          currentNode = walker.nextNode();
        }
        
        if (lastTextNode) {
          // Position cursor at the end of the last text node
          range.setStart(lastTextNode, lastTextNode.textContent?.length || 0);
          range.collapse(true);
        } else {
          // If no text nodes exist, position cursor at the end of the element
          range.selectNodeContents(element);
          range.collapse(false);
        }
        
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        console.log('🔍 Initial cursor positioned at end');
      }, 50);
    }

    // Show text toolbar positioned away from the text element
    const rect = element.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    
    // Calculate optimal position with better spacing
    let x = rect.left + rect.width / 2;
    let y = rect.top - 100; // Position toolbar further away from text
    
    // Keep toolbar within viewport bounds
    const toolbarWidth = 400; // Estimated toolbar width
    const toolbarHeight = 60; // Estimated toolbar height
    
    // Adjust horizontal position if needed
    if (x - toolbarWidth / 2 < 10) {
      x = 10 + toolbarWidth / 2;
    } else if (x + toolbarWidth / 2 > viewport.width - 10) {
      x = viewport.width - 10 - toolbarWidth / 2;
    }
    
    // Adjust vertical position if toolbar would be cut off at top
    if (y - toolbarHeight < 10) {
      y = rect.bottom + 20; // Position below element instead
    }
    
    // Ensure toolbar doesn't go off bottom of viewport
    if (y + toolbarHeight > viewport.height - 10) {
      y = viewport.height - toolbarHeight - 10;
    }
    
    const position = { x, y };
    
    const elementId = `${sectionId}.${elementKey}`;
    
    // Set text editing state in store
    setTextEditingMode(true, { sectionId, elementKey });
    
    showToolbar('text', elementId, position);
    
    announceLiveRegion('Entered text editing mode');
  }, [calculateToolbarPosition, showToolbar, announceLiveRegion, setTextEditingMode]);

  const exitTextEditMode = useCallback((elementKey: string, sectionId: string) => {
    const selector = `[data-section-id="${sectionId}"] [data-element-key="${elementKey}"]`;
    const wrapper = document.querySelector(selector) as HTMLElement;
    
    if (!wrapper) return;

    // Find the actual text element inside the wrapper (same as enterTextEditMode)
    const textElement = wrapper.querySelector('.inline-text-editor, h1, h2, h3, h4, h5, h6, p, span, div:not(.element-drag-handle):not(.drag-handle-icon)') as HTMLElement;
    const element = textElement || wrapper;

    // Exiting text edit mode

    // Save any pending content changes before exiting
    if (element.dataset.pendingContent) {
      const finalContent = element.dataset.pendingContent;
      console.log('🔍 Saving pending content on exit:', { finalContent, length: finalContent.length });
      updateElementContent(sectionId, elementKey, finalContent);
      delete element.dataset.pendingContent;
    }
    
    // Reset the user typing flag
    delete element.dataset.userHasTyped;

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
      
      // Restore the selection handlers we disabled
      element.onmouseup = handlers.onmouseup ? 'restored' : null;
      element.onkeyup = handlers.onkeyup ? 'restored' : null;
      
      console.log('🔍 Restored InlineTextEditor handlers:', {
        onmouseup: handlers.onmouseup,
        onkeyup: handlers.onkeyup
      });
      
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