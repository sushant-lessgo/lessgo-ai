// hooks/useToolbarContext.ts - Context-aware toolbar management system
import { useCallback, useEffect, useState } from 'react';
import { useEditStore } from './useEditStore';
import { useToolbarPositioning } from './useToolbarPositioning';
import type { ToolbarType } from '@/types/core/ui';

export interface ToolbarContext {
  elementType: 'text' | 'image' | 'button' | 'form' | 'list' | 'section';
  toolbarType: ToolbarType;
  priority: number;
  capabilities: ToolbarCapability[];
  restrictions?: ToolbarRestriction[];
}

export interface ToolbarCapability {
  id: string;
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
}

export interface ToolbarRestriction {
  type: 'readonly' | 'limited' | 'conditional';
  reason: string;
  conditions?: string[];
}

export interface ContextualToolbarState {
  activeContext?: ToolbarContext;
  availableToolbars: ToolbarType[];
  prioritizedToolbars: ToolbarType[];
  multiToolbarMode: boolean;
  conflictResolution: 'priority' | 'merge' | 'separate';
}

export function useToolbarContext() {
  const {
    selectedSection,
    selectedElement,
    mode,
    floatingToolbars,
  } = useEditStore();

  const { showSmartToolbar, hideSmartToolbar } = useToolbarPositioning();
  
  const [contextState, setContextState] = useState<ContextualToolbarState>({
    availableToolbars: [],
    prioritizedToolbars: [],
    multiToolbarMode: false,
    conflictResolution: 'priority',
  });

  // Enhanced element type detection with context analysis
  const analyzeElementContext = useCallback((element: HTMLElement): ToolbarContext => {
    const tagName = element.tagName.toLowerCase();
    const elementKey = element.getAttribute('data-element-key') || '';
    const role = element.getAttribute('role') || '';
    const classes = element.className || '';
    const hasText = element.textContent?.trim().length > 0;
    const isInteractive = element.hasAttribute('onclick') || 
                         element.hasAttribute('href') || 
                         role === 'button';

    // Text Elements (h1, h2, p, span with text content)
    if (
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(tagName) ||
      (tagName === 'div' && hasText && elementKey.includes('text'))
    ) {
      return {
        elementType: 'text',
        toolbarType: 'text',
        priority: 2,
        capabilities: [
          { id: 'format-bold', name: 'Bold', description: 'Make text bold', icon: 'bold', enabled: true },
          { id: 'format-italic', name: 'Italic', description: 'Make text italic', icon: 'italic', enabled: true },
          { id: 'text-color', name: 'Text Color', description: 'Change text color', icon: 'palette', enabled: true },
          { id: 'font-size', name: 'Font Size', description: 'Adjust font size', icon: 'type', enabled: true },
          { id: 'text-align', name: 'Alignment', description: 'Text alignment', icon: 'align-left', enabled: true },
          { id: 'regenerate', name: 'Regenerate', description: 'AI regenerate text', icon: 'refresh', enabled: true },
        ],
      };
    }

    // Interactive Elements (buttons, links, CTAs)
    if (
      ['button', 'a'].includes(tagName) ||
      role === 'button' ||
      elementKey.includes('cta') ||
      elementKey.includes('button') ||
      classes.includes('btn')
    ) {
      return {
        elementType: 'button',
        toolbarType: 'element',
        priority: 1,
        capabilities: [
          { id: 'regenerate-copy', name: 'Regenerate Copy', description: 'AI regenerate button text', icon: 'refresh', enabled: true },
          { id: 'get-variations', name: 'Get Variations', description: '5 copy variations', icon: 'layers', enabled: true },
          { id: 'button-style', name: 'Button Style', description: 'Change button appearance', icon: 'palette', enabled: true },
          { id: 'link-target', name: 'Link Target', description: 'Edit link destination', icon: 'link', enabled: tagName === 'a' },
          { id: 'convert-form', name: 'Convert to Form', description: 'Turn CTA into form', icon: 'form-input', enabled: elementKey.includes('cta') },
          { id: 'duplicate', name: 'Duplicate', description: 'Copy this element', icon: 'copy', enabled: true },
          { id: 'delete', name: 'Delete', description: 'Remove element', icon: 'trash', enabled: true },
        ],
      };
    }

    // Image Elements
    if (
      tagName === 'img' ||
      elementKey.includes('image') ||
      elementKey.includes('photo') ||
      classes.includes('image')
    ) {
      return {
        elementType: 'image',
        toolbarType: 'image',
        priority: 3,
        capabilities: [
          { id: 'replace-image', name: 'Replace Image', description: 'Upload new image', icon: 'image', enabled: true },
          { id: 'stock-search', name: 'Stock Photos', description: 'Search stock photos', icon: 'search', enabled: true },
          { id: 'edit-image', name: 'Edit Image', description: 'Crop and resize', icon: 'edit', enabled: true },
          { id: 'alt-text', name: 'Alt Text', description: 'Edit accessibility text', icon: 'type', enabled: true },
          { id: 'image-filters', name: 'Filters', description: 'Apply image effects', icon: 'filter', enabled: true },
          { id: 'optimize', name: 'Optimize', description: 'Compress image', icon: 'zap', enabled: true },
        ],
      };
    }

    // Form Elements
    if (
      ['form', 'input', 'select', 'textarea', 'fieldset'].includes(tagName) ||
      elementKey.includes('form') ||
      element.closest('form') !== null
    ) {
      return {
        elementType: 'form',
        toolbarType: 'form',
        priority: 4,
        capabilities: [
          { id: 'add-field', name: 'Add Field', description: 'Add form field', icon: 'plus', enabled: true },
          { id: 'field-type', name: 'Field Type', description: 'Change field type', icon: 'list', enabled: ['input', 'select', 'textarea'].includes(tagName) },
          { id: 'field-required', name: 'Required', description: 'Toggle required field', icon: 'asterisk', enabled: ['input', 'select', 'textarea'].includes(tagName) },
          { id: 'form-settings', name: 'Form Settings', description: 'Configure form', icon: 'settings', enabled: true },
          { id: 'integrations', name: 'Integrations', description: 'Connect to CRM/Email', icon: 'link', enabled: true },
          { id: 'form-styling', name: 'Form Styling', description: 'Customize appearance', icon: 'palette', enabled: true },
        ],
      };
    }

    // List Elements
    if (
      ['ul', 'ol', 'li'].includes(tagName) ||
      elementKey.includes('list') ||
      classes.includes('list')
    ) {
      return {
        elementType: 'list',
        toolbarType: 'element',
        priority: 2,
        capabilities: [
          { id: 'add-item', name: 'Add Item', description: 'Add list item', icon: 'plus', enabled: true },
          { id: 'list-style', name: 'List Style', description: 'Bullets or numbers', icon: 'list', enabled: true },
          { id: 'reorder', name: 'Reorder', description: 'Drag to reorder', icon: 'move', enabled: true },
          { id: 'regenerate', name: 'Regenerate', description: 'AI regenerate list', icon: 'refresh', enabled: true },
        ],
      };
    }

    // Default: Section-level
    return {
      elementType: 'section',
      toolbarType: 'section',
      priority: 5,
      capabilities: [
        { id: 'change-layout', name: 'Change Layout', description: 'Switch section layout', icon: 'layout', enabled: true },
        { id: 'add-element', name: 'Add Element', description: 'Add new element', icon: 'plus', enabled: true },
        { id: 'section-background', name: 'Background', description: 'Change background', icon: 'image', enabled: true },
        { id: 'regenerate-section', name: 'Regenerate', description: 'AI regenerate section', icon: 'refresh', enabled: true },
        { id: 'duplicate-section', name: 'Duplicate', description: 'Copy section', icon: 'copy', enabled: true },
        { id: 'move-section', name: 'Move', description: 'Reorder section', icon: 'move', enabled: true },
      ],
    };
  }, []);

  // Determine if multiple toolbars should be shown
  const shouldShowMultipleToolbars = useCallback((
    primaryContext: ToolbarContext,
    element: HTMLElement
  ): { secondary?: ToolbarContext; mode: 'stacked' | 'merged' | 'separate' } => {
    // Interactive text elements (buttons/links with text)
    if (
      primaryContext.toolbarType === 'element' &&
      primaryContext.elementType === 'button' &&
      element.textContent?.trim().length > 0
    ) {
      const textContext = analyzeElementContext(element);
      textContext.toolbarType = 'text';
      textContext.priority = 2.5; // Between element and text priority
      
      return {
        secondary: textContext,
        mode: 'merged', // Merge text formatting into element toolbar
      };
    }

    // Form inputs with special styling
    if (
      primaryContext.toolbarType === 'form' &&
      ['input', 'button'].includes(element.tagName.toLowerCase())
    ) {
      return {
        secondary: {
          elementType: 'button',
          toolbarType: 'element',
          priority: 1.5,
          capabilities: [
            { id: 'button-style', name: 'Style', description: 'Button styling', icon: 'palette', enabled: true },
            { id: 'size', name: 'Size', description: 'Button size', icon: 'maximize', enabled: true },
          ],
        },
        mode: 'separate', // Show as separate toolbar
      };
    }

    // Clickable images
    if (
      primaryContext.toolbarType === 'image' &&
      (element.closest('a') || element.getAttribute('role') === 'button')
    ) {
      return {
        secondary: {
          elementType: 'button',
          toolbarType: 'element',
          priority: 1.5,
          capabilities: [
            { id: 'link-target', name: 'Link Target', description: 'Edit link', icon: 'link', enabled: true },
            { id: 'click-action', name: 'Click Action', description: 'Configure action', icon: 'click', enabled: true },
          ],
        },
        mode: 'stacked', // Stack below image toolbar
      };
    }

    return { mode: 'separate' };
  }, [analyzeElementContext]);

  // Show appropriate toolbar(s) based on context
  const showContextualToolbars = useCallback((
    targetElement: HTMLElement,
    targetId: string
  ) => {
    const primaryContext = analyzeElementContext(targetElement);
    const multiToolbarInfo = shouldShowMultipleToolbars(primaryContext, targetElement);

    // Update context state
    setContextState(prev => ({
      ...prev,
      activeContext: primaryContext,
      availableToolbars: [primaryContext.toolbarType],
      prioritizedToolbars: [primaryContext.toolbarType],
      multiToolbarMode: !!multiToolbarInfo.secondary,
      conflictResolution: multiToolbarInfo.mode === 'merged' ? 'merge' : 
                         multiToolbarInfo.mode === 'stacked' ? 'separate' : 'priority',
    }));

    // Hide all existing toolbars first
    ['section', 'element', 'text', 'form', 'image'].forEach(type => {
      hideSmartToolbar(type as ToolbarType);
    });

    // Show primary toolbar
    showSmartToolbar(primaryContext.toolbarType, targetId, {
      preferredPosition: 'top',
      followTarget: true,
      avoidCollisions: true,
    });

    // Handle secondary toolbar if needed
    if (multiToolbarInfo.secondary) {
      const delay = multiToolbarInfo.mode === 'merged' ? 0 : 100;
      
      setTimeout(() => {
        if (multiToolbarInfo.mode === 'merged') {
          // Merge capabilities into primary toolbar (handled by toolbar component)
          return;
        }

        // Show secondary toolbar with appropriate positioning
        const secondaryPosition = multiToolbarInfo.mode === 'stacked' ? 'bottom' : 'right';
        const offset = multiToolbarInfo.mode === 'stacked' 
          ? { x: 0, y: 60 } 
          : { x: 320, y: 0 };

        showSmartToolbar(multiToolbarInfo.secondary!.toolbarType, targetId, {
          preferredPosition: secondaryPosition,
          followTarget: true,
          avoidCollisions: true,
          offset,
        });
      }, delay);
    }
  }, [
    analyzeElementContext,
    shouldShowMultipleToolbars,
    showSmartToolbar,
    hideSmartToolbar
  ]);

  // Handle section-level toolbar
  const showSectionToolbar = useCallback((sectionId: string) => {
    const sectionContext: ToolbarContext = {
      elementType: 'section',
      toolbarType: 'section',
      priority: 5,
      capabilities: [
        { id: 'change-layout', name: 'Change Layout', description: 'Switch section layout', icon: 'layout', enabled: true },
        { id: 'add-element', name: 'Add Element', description: 'Add new element', icon: 'plus', enabled: true },
        { id: 'section-background', name: 'Background', description: 'Change background', icon: 'image', enabled: true },
        { id: 'regenerate-section', name: 'Regenerate', description: 'AI regenerate section', icon: 'refresh', enabled: true },
        { id: 'duplicate-section', name: 'Duplicate', description: 'Copy section', icon: 'copy', enabled: true },
        { id: 'move-section', name: 'Move', description: 'Reorder section', icon: 'move', enabled: true },
      ],
    };

    setContextState(prev => ({
      ...prev,
      activeContext: sectionContext,
      availableToolbars: ['section'],
      prioritizedToolbars: ['section'],
      multiToolbarMode: false,
      conflictResolution: 'priority',
    }));

    // Hide all other toolbars
    ['element', 'text', 'form', 'image'].forEach(type => {
      hideSmartToolbar(type as ToolbarType);
    });

    // Show section toolbar
    showSmartToolbar('section', sectionId, {
      preferredPosition: 'top',
      followTarget: true,
      avoidCollisions: true,
    });
  }, [showSmartToolbar, hideSmartToolbar]);

  // Enhanced click handler with full context awareness
  const handleContextualClick = useCallback((
    event: MouseEvent,
    targetElement: HTMLElement
  ) => {
    if (mode !== 'edit') return;

    event.stopPropagation();

    const sectionElement = targetElement.closest('[data-section-id]') as HTMLElement;
    if (!sectionElement) return;

    const sectionId = sectionElement.getAttribute('data-section-id')!;
    const elementKey = targetElement.getAttribute('data-element-key') || 
                      targetElement.closest('[data-element-key]')?.getAttribute('data-element-key');

    // Handle section-level clicks
    if (!elementKey || targetElement === sectionElement) {
      showSectionToolbar(sectionId);
      return;
    }

    // Handle element-level clicks with context analysis
    const elementId = `${sectionId}.${elementKey}`;
    showContextualToolbars(targetElement, elementId);

  }, [mode, showSectionToolbar, showContextualToolbars]);

  // Get available actions for current context
  const getContextualActions = useCallback((): ToolbarCapability[] => {
    if (!contextState.activeContext) return [];

    const baseActions = contextState.activeContext.capabilities;

    // Add context-specific restrictions or modifications
    return baseActions.map(action => {
      // Disable certain actions based on content state
      if (action.id === 'regenerate' || action.id === 'regenerate-section') {
        return {
          ...action,
          enabled: action.enabled && mode === 'edit', // Only in edit mode
        };
      }

      // Conditional enables based on selection
      if (action.id === 'convert-form' && selectedElement) {
        const isCtaElement = selectedElement.elementKey.includes('cta');
        return {
          ...action,
          enabled: action.enabled && isCtaElement,
        };
      }

      return action;
    });
  }, [contextState.activeContext, mode, selectedElement]);

  // Get toolbar priority for current selection
  const getCurrentPriority = useCallback((): number => {
    return contextState.activeContext?.priority || 10;
  }, [contextState.activeContext]);

  // Check if specific capability is available
  const hasCapability = useCallback((capabilityId: string): boolean => {
    const actions = getContextualActions();
    const capability = actions.find(action => action.id === capabilityId);
    return capability?.enabled || false;
  }, [getContextualActions]);

  // Get merged capabilities for multi-toolbar scenarios
  const getMergedCapabilities = useCallback((): ToolbarCapability[] => {
    if (!contextState.multiToolbarMode || contextState.conflictResolution !== 'merge') {
      return getContextualActions();
    }

    // TODO: Implement capability merging logic for complex scenarios
    // For now, return primary capabilities
    return getContextualActions();
  }, [contextState, getContextualActions]);

  // Auto-update context when selection changes
  useEffect(() => {
    if (!selectedElement && !selectedSection) {
      setContextState(prev => ({
        ...prev,
        activeContext: undefined,
        availableToolbars: [],
        prioritizedToolbars: [],
        multiToolbarMode: false,
      }));
      return;
    }

    // Context will be updated through handleContextualClick
    // This effect mainly handles cleanup and state synchronization
  }, [selectedElement, selectedSection]);

  // Cleanup on mode change
  useEffect(() => {
    if (mode !== 'edit') {
      setContextState({
        availableToolbars: [],
        prioritizedToolbars: [],
        multiToolbarMode: false,
        conflictResolution: 'priority',
      });
    }
  }, [mode]);

  return {
    // Core functions
    analyzeElementContext,
    showContextualToolbars,
    showSectionToolbar,
    handleContextualClick,

    // Context state
    contextState,
    currentContext: contextState.activeContext,
    
    // Capability queries
    getContextualActions,
    getCurrentPriority,
    hasCapability,
    getMergedCapabilities,
    
    // Utility
    isMultiToolbarMode: contextState.multiToolbarMode,
    availableToolbars: contextState.availableToolbars,
    prioritizedToolbars: contextState.prioritizedToolbars,
  };
}