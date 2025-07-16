// app/edit/[token]/components/toolbars/TextToolbar.tsx - Complete Text Toolbar
import React, { useState, useRef, useEffect } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useEditor } from '@/hooks/useEditor';
import { useToolbarActions } from '@/hooks/useToolbarActions';
import { calculateArrowPosition } from '@/utils/toolbarPositioning';
import { AdvancedActionsMenu } from './AdvancedActionsMenu';

interface TextToolbarProps {
  elementSelection: any;
  position: { x: number; y: number };
  contextActions: any[];
}

export function TextToolbar({ elementSelection, position, contextActions }: TextToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState('16px');
  const [currentAlign, setCurrentAlign] = useState('left');
  
  // Component lifecycle tracking (removed console logs for production)
  React.useEffect(() => {
    // Component mounted with new selection
  }, [elementSelection, position, contextActions]);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);

  const {
    updateElementContent,
    regenerateElement,
    announceLiveRegion,
  } = useEditStore();

  const { executeAction } = useToolbarActions();
  const { exitTextEditMode } = useEditor();

  // Early return if elementSelection is invalid
  if (!elementSelection || !elementSelection.sectionId || !elementSelection.elementKey) {
    console.warn('TextToolbar: Invalid elementSelection', elementSelection);
    return null;
  }

  // Calculate arrow position
  const targetSelector = `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`;
  const targetElement = document.querySelector(targetSelector);
  const arrowInfo = targetElement ? calculateArrowPosition(
    position,
    targetElement.getBoundingClientRect(),
    { width: 400, height: 48 }
  ) : null;

  // Detect current formatting state - enhanced for dual mode
  useEffect(() => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) return;
    
    if (USE_PARTIAL_SELECTION) {
      const selectionInfo = getSelectionInfo();
      if (selectionInfo?.hasSelection) {
        // Update format state based on selection
        updateFormatStateFromSelection();
      } else {
        // Fallback to element-level detection
        detectCurrentFormatsElementLevel();
      }
    } else {
      // Original element-level detection
      detectCurrentFormatsElementLevel();
    }
    
    // Always update other properties from element
    const computedStyle = window.getComputedStyle(targetElement);
    setCurrentColor(computedStyle.color);
    setCurrentSize(computedStyle.fontSize);
    setCurrentAlign(computedStyle.textAlign);
  }, [targetSelector]);

  // Close advanced menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        advancedRef.current &&
        !advancedRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowAdvanced(false);
      }
    };

    if (showAdvanced) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAdvanced]);

  // Feature flag for partial selection formatting
  const USE_PARTIAL_SELECTION = true;

  // Get selection information
  const getSelectionInfo = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const isTextSelected = !range.collapsed && range.toString().length > 0;
    
    return {
      hasSelection: isTextSelected,
      range: range,
      selectedText: range.toString(),
      isElementLevel: !isTextSelected
    };
  };

  // Apply formatting to selected text range
  const applyFormatToSelection = (format: string, range: Range, container: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection || !range) return;
    
    // Save current selection
    const savedRange = range.cloneRange();
    
    try {
      // Apply formatting using document.execCommand (simple, reliable)
      document.execCommand('styleWithCSS', false, 'true');
      
      switch (format) {
        case 'bold':
          document.execCommand('bold', false, '');
          break;
        case 'italic':
          document.execCommand('italic', false, '');
          break;
        case 'underline':
          document.execCommand('underline', false, '');
          break;
      }
      
      // Restore selection
      selection.removeAllRanges();
      selection.addRange(savedRange);
      
      // Update format state based on new selection
      updateFormatStateFromSelection();
      
    } catch (error) {
      console.error('Selection formatting failed:', error);
      // Fallback to element-level formatting
      toggleFormatElementLevel(format);
    }
  };

  // Update format state from current selection (non-destructive)
  const updateFormatStateFromSelection = () => {
    const selectionInfo = getSelectionInfo();
    if (!selectionInfo?.hasSelection) return;
    
    try {
      const range = selectionInfo.range;
      const currentFormats = new Set<string>();
      
      // Check if selection contains formatted elements
      const commonAncestor = range.commonAncestorContainer;
      const parentElement = commonAncestor.nodeType === Node.TEXT_NODE 
        ? commonAncestor.parentElement 
        : commonAncestor as HTMLElement;
      
      if (parentElement) {
        const computedStyle = window.getComputedStyle(parentElement);
        
        // Check for bold
        if (computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 600) {
          currentFormats.add('bold');
        }
        
        // Check for italic
        if (computedStyle.fontStyle === 'italic') {
          currentFormats.add('italic');
        }
        
        // Check for underline
        if (computedStyle.textDecoration.includes('underline')) {
          currentFormats.add('underline');
        }
        
        // Check for strong/em tags within selection
        const strongTags = parentElement.querySelectorAll('strong, b');
        const emTags = parentElement.querySelectorAll('em, i');
        const uTags = parentElement.querySelectorAll('u');
        
        if (strongTags.length > 0) currentFormats.add('bold');
        if (emTags.length > 0) currentFormats.add('italic');
        if (uTags.length > 0) currentFormats.add('underline');
      }
      
      setActiveFormats(currentFormats);
    } catch (e) {
      // Fallback to element-level detection
      detectCurrentFormatsElementLevel();
    }
  };

  // Element-level format detection (extracted from existing logic)
  const detectCurrentFormatsElementLevel = () => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) return;
    
    const currentFormats = new Set<string>();
    const computedStyle = window.getComputedStyle(targetElement);
    
    if (computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 600) {
      currentFormats.add('bold');
    }
    if (computedStyle.fontStyle === 'italic') {
      currentFormats.add('italic');
    }
    if (computedStyle.textDecoration.includes('underline')) {
      currentFormats.add('underline');
    }
    
    setActiveFormats(currentFormats);
  };

  // Element-level formatting (original logic extracted)
  const toggleFormatElementLevel = (format: string) => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) return;

    const newActiveFormats = new Set(activeFormats);
    const isActive = newActiveFormats.has(format);
    
    if (isActive) {
      newActiveFormats.delete(format);
    } else {
      newActiveFormats.add(format);
    }
    setActiveFormats(newActiveFormats);
    
    // Apply formatting directly to the element
    switch (format) {
      case 'bold':
        targetElement.style.fontWeight = isActive ? 'normal' : 'bold';
        break;
      case 'italic':
        targetElement.style.fontStyle = isActive ? 'normal' : 'italic';
        break;
      case 'underline':
        targetElement.style.textDecoration = isActive ? 'none' : 'underline';
        break;
    }
    
    // Save content to store
    updateElementContent(
      elementSelection.sectionId,
      elementSelection.elementKey,
      targetElement.textContent || ''
    );
    
    announceLiveRegion(`${format} ${!isActive ? 'applied' : 'removed'}`);
  };

  // Safe partial formatting with fallback
  const safeApplyPartialFormatting = (format: string) => {
    try {
      const selectionInfo = getSelectionInfo();
      const targetElement = document.querySelector(targetSelector) as HTMLElement;
      
      if (selectionInfo?.hasSelection && targetElement) {
        applyFormatToSelection(format, selectionInfo.range, targetElement);
        
        // Save content to store after partial formatting
        updateElementContent(
          elementSelection.sectionId,
          elementSelection.elementKey,
          targetElement.textContent || ''
        );
        
        announceLiveRegion(`${format} applied to selected text`);
      } else {
        // Fallback to existing element-level formatting
        toggleFormatElementLevel(format);
      }
    } catch (error) {
      console.error('Partial formatting failed, using element-level:', error);
      // Fallback to existing element-level formatting
      toggleFormatElementLevel(format);
    }
  };

  // Main format function - dual mode
  const toggleFormat = (format: string) => {
    if (USE_PARTIAL_SELECTION) {
      safeApplyPartialFormatting(format);
    } else {
      // Original behavior for fallback
      toggleFormatElementLevel(format);
    }
  };

  const changeTextColor = (color: string) => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) return;
    
    setCurrentColor(color);
    
    if (USE_PARTIAL_SELECTION) {
      const selectionInfo = getSelectionInfo();
      if (selectionInfo?.hasSelection) {
        // Apply color to selected text
        try {
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('foreColor', false, color);
          announceLiveRegion(`Text color changed to ${color} for selected text`);
        } catch (error) {
          // Fallback to element-level
          targetElement.style.color = color;
          announceLiveRegion(`Text color changed to ${color}`);
        }
      } else {
        // Element-level color change
        targetElement.style.color = color;
        announceLiveRegion(`Text color changed to ${color}`);
      }
    } else {
      // Original element-level behavior
      targetElement.style.color = color;
      announceLiveRegion(`Text color changed to ${color}`);
    }
    
    // Save content to store
    updateElementContent(
      elementSelection.sectionId,
      elementSelection.elementKey,
      targetElement.textContent || ''
    );
  };

  const changeFontSize = (size: string) => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) return;
    
    setCurrentSize(size);
    
    if (USE_PARTIAL_SELECTION) {
      const selectionInfo = getSelectionInfo();
      if (selectionInfo?.hasSelection) {
        // Apply font size to selected text
        try {
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('fontSize', false, '7'); // Reset to default
          // Apply custom font size via CSS
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.fontSize = size;
            try {
              range.surroundContents(span);
              announceLiveRegion(`Font size changed to ${size} for selected text`);
            } catch (e) {
              // Fallback to element-level
              targetElement.style.fontSize = size;
              announceLiveRegion(`Font size changed to ${size}`);
            }
          }
        } catch (error) {
          // Fallback to element-level
          targetElement.style.fontSize = size;
          announceLiveRegion(`Font size changed to ${size}`);
        }
      } else {
        // Element-level font size change
        targetElement.style.fontSize = size;
        announceLiveRegion(`Font size changed to ${size}`);
      }
    } else {
      // Original element-level behavior
      targetElement.style.fontSize = size;
      announceLiveRegion(`Font size changed to ${size}`);
    }
    
    // Save content to store
    updateElementContent(
      elementSelection.sectionId,
      elementSelection.elementKey,
      targetElement.textContent || ''
    );
  };

  const changeTextAlign = (align: string) => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) return;
    
    setCurrentAlign(align);
    targetElement.style.textAlign = align;
    
    // Save content to store
    updateElementContent(
      elementSelection.sectionId,
      elementSelection.elementKey,
      targetElement.textContent || ''
    );
    
    announceLiveRegion(`Text aligned ${align}`);
  };

  // Handle list formatting
  const handleListFormat = (listType: string) => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) return;
    
    const parent = targetElement.parentElement;
    if (!parent) return;
    
    switch (listType) {
      case 'bullet':
        if (parent.tagName.toLowerCase() !== 'ul') {
          const ul = document.createElement('ul');
          ul.className = 'list-disc pl-6';
          const li = document.createElement('li');
          li.appendChild(targetElement.cloneNode(true));
          ul.appendChild(li);
          parent.replaceChild(ul, targetElement);
        }
        break;
      case 'numbered':
        if (parent.tagName.toLowerCase() !== 'ol') {
          const ol = document.createElement('ol');
          ol.className = 'list-decimal pl-6';
          const li = document.createElement('li');
          li.appendChild(targetElement.cloneNode(true));
          ol.appendChild(li);
          parent.replaceChild(ol, targetElement);
        }
        break;
      case 'none':
        if (parent.tagName.toLowerCase() === 'ul' || parent.tagName.toLowerCase() === 'ol') {
          const text = targetElement.textContent || '';
          const newElement = document.createElement('p');
          newElement.textContent = text;
          newElement.setAttribute('data-section-id', elementSelection.sectionId);
          newElement.setAttribute('data-element-key', elementSelection.elementKey);
          parent.parentElement?.replaceChild(newElement, parent);
        }
        break;
    }
    
    announceLiveRegion(`List format changed to ${listType}`);
  };

  // Clear all formatting
  const clearFormatting = () => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) return;
    
    // Reset all formatting
    targetElement.style.fontWeight = 'normal';
    targetElement.style.fontStyle = 'normal';
    targetElement.style.textDecoration = 'none';
    targetElement.style.color = '';
    targetElement.style.fontSize = '';
    targetElement.style.textAlign = '';
    
    // Reset state
    setActiveFormats(new Set());
    setCurrentColor('#000000');
    setCurrentSize('16px');
    setCurrentAlign('left');
    
    // Save content to store
    updateElementContent(
      elementSelection.sectionId,
      elementSelection.elementKey,
      targetElement.textContent || ''
    );
    
    announceLiveRegion('All formatting cleared');
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetElement = document.querySelector(targetSelector) as HTMLElement;
      if (!targetElement || !targetElement.isContentEditable) return;
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (cmdKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            toggleFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            toggleFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            toggleFormat('underline');
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [targetSelector, toggleFormat]);

  // Enhanced selection handling - update format state on selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const targetElement = document.querySelector(targetSelector) as HTMLElement;
      if (!targetElement || !targetElement.isContentEditable) return;
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Check if selection is within our target element
        if (range.commonAncestorContainer === targetElement || 
            targetElement.contains(range.commonAncestorContainer)) {
          
          if (USE_PARTIAL_SELECTION) {
            const selectionInfo = getSelectionInfo();
            if (selectionInfo?.hasSelection) {
              // Update format state based on selection
              updateFormatStateFromSelection();
            } else {
              // No selection, use element-level detection
              detectCurrentFormatsElementLevel();
            }
          }
        }
      }
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [targetSelector]);

  // Primary Actions
  const primaryActions = [
    {
      id: 'bold',
      label: 'Bold',
      icon: 'bold',
      isActive: activeFormats.has('bold'),
      handler: () => toggleFormat('bold'),
    },
    {
      id: 'italic',
      label: 'Italic',
      icon: 'italic',
      isActive: activeFormats.has('italic'),
      handler: () => toggleFormat('italic'),
    },
    {
      id: 'underline',
      label: 'Underline',
      icon: 'underline',
      isActive: activeFormats.has('underline'),
      handler: () => toggleFormat('underline'),
    },
    {
      id: 'color',
      label: 'Color',
      icon: 'color',
      isDropdown: true,
      currentValue: currentColor,
      handler: () => {}, // Handled by dropdown
    },
    {
      id: 'size',
      label: 'Size',
      icon: 'size',
      isDropdown: true,
      currentValue: currentSize,
      handler: () => {}, // Handled by dropdown
    },
    {
      id: 'align',
      label: 'Align',
      icon: 'align',
      isDropdown: true,
      currentValue: currentAlign,
      handler: () => {}, // Handled by dropdown
    },
    {
      id: 'list',
      label: 'List',
      icon: 'list',
      isDropdown: true,
      handler: () => {}, // Handled by dropdown
    },
    {
      id: 'regenerate',
      label: 'Regenerate',
      icon: 'refresh',
      handler: () => {
        regenerateElement(elementSelection.sectionId, elementSelection.elementKey);
        announceLiveRegion(`Regenerating ${elementSelection.elementKey}`);
      },
    },
    {
      id: 'done',
      label: 'Done',
      icon: 'check',
      handler: () => {
        exitTextEditMode(elementSelection.elementKey, elementSelection.sectionId);
      },
    },
  ];

  // Advanced Actions
  const advancedActions = [
    {
      id: 'font-family',
      label: 'Font Family',
      icon: 'font',
      handler: () => executeAction('change-font-family', { elementSelection }),
    },
    {
      id: 'line-height',
      label: 'Line Height',
      icon: 'line-height',
      handler: () => executeAction('change-line-height', { elementSelection }),
    },
    {
      id: 'letter-spacing',
      label: 'Letter Spacing',
      icon: 'letter-spacing',
      handler: () => executeAction('change-letter-spacing', { elementSelection }),
    },
    {
      id: 'text-transform',
      label: 'Text Transform',
      icon: 'transform',
      handler: () => executeAction('change-text-transform', { elementSelection }),
    },
    {
      id: 'clear-formatting',
      label: 'Clear Formatting',
      icon: 'clear',
      handler: clearFormatting,
    },
    {
      id: 'text-variations',
      label: 'Get Variations',
      icon: 'variations',
      handler: () => {
        regenerateElement(elementSelection.sectionId, elementSelection.elementKey, 5);
        announceLiveRegion('Generating text variations');
      },
    },
  ];

  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed z-50 bg-white border-2 border-blue-500 rounded-lg shadow-xl transition-all duration-200"
        style={{
          left: position.x,
          top: position.y,
        }}
        data-toolbar-type="text"
        onMouseDown={(e) => {
          // Prevent toolbar clicks from blurring the text element
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          // Prevent toolbar clicks from affecting text selection
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Arrow */}
        {arrowInfo && (
          <div 
            className={`absolute w-2 h-2 bg-white border transform rotate-45 ${
              arrowInfo.direction === 'up' ? 'border-t-0 border-l-0 -bottom-1' :
              arrowInfo.direction === 'down' ? 'border-b-0 border-r-0 -top-1' :
              arrowInfo.direction === 'left' ? 'border-l-0 border-b-0 -right-1' :
              'border-r-0 border-t-0 -left-1'
            }`}
            style={{
              left: arrowInfo.direction === 'up' || arrowInfo.direction === 'down' ? arrowInfo.x - 4 : undefined,
              top: arrowInfo.direction === 'left' || arrowInfo.direction === 'right' ? arrowInfo.y - 4 : undefined,
            }}
          />
        )}
        
        <div className="flex items-center px-3 py-2">
          {/* Text Indicator */}
          <div className="flex items-center space-x-1 mr-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-700">Editing Text</span>
          </div>
          
          {/* Primary Actions */}
          {primaryActions.map((action, index) => (
            <React.Fragment key={action.id}>
              {index > 0 && <div className="w-px h-6 bg-gray-200 mx-1" />}
              
              {action.isDropdown ? (
                <TextDropdown
                  action={action}
                  elementSelection={elementSelection}
                  onValueChange={(value) => {
                    if (action.id === 'color') changeTextColor(value);
                    else if (action.id === 'size') changeFontSize(value);
                    else if (action.id === 'align') changeTextAlign(value);
                    else if (action.id === 'list') handleListFormat(value);
                  }}
                />
              ) : (
                <button
                  onClick={action.handler}
                  className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                    action.isActive 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={action.label}
                >
                  <TextIcon icon={action.icon} />
                  <span>{action.label}</span>
                </button>
              )}
            </React.Fragment>
          ))}
          
          {/* Advanced Actions Trigger */}
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              showAdvanced 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="More text options"
          >
            <span>⋯</span>
          </button>
        </div>
      </div>

      {/* Advanced Actions Menu */}
      {showAdvanced && (
        <AdvancedActionsMenu
          ref={advancedRef}
          actions={advancedActions}
          triggerElement={document.body}
          toolbarType="text"
          isVisible={showAdvanced}
          onClose={() => setShowAdvanced(false)}
        />
      )}
    </>
  );
}

// Text Dropdown Component
function TextDropdown({ action, elementSelection, onValueChange }: {
  action: any;
  elementSelection: any;
  onValueChange: (value: string) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const getDropdownOptions = () => {
    switch (action.id) {
      case 'color':
        return [
          { value: '#000000', label: 'Black' },
          { value: '#374151', label: 'Gray' },
          { value: '#1f2937', label: 'Dark Gray' },
          { value: '#dc2626', label: 'Red' },
          { value: '#ea580c', label: 'Orange' },
          { value: '#ca8a04', label: 'Yellow' },
          { value: '#16a34a', label: 'Green' },
          { value: '#2563eb', label: 'Blue' },
          { value: '#9333ea', label: 'Purple' },
        ];
      case 'size':
        return [
          { value: '12px', label: 'Small (12px)' },
          { value: '14px', label: 'Default (14px)' },
          { value: '16px', label: 'Medium (16px)' },
          { value: '18px', label: 'Large (18px)' },
          { value: '20px', label: 'X-Large (20px)' },
          { value: '24px', label: 'XX-Large (24px)' },
        ];
      case 'align':
        return [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
          { value: 'justify', label: 'Justify' },
        ];
      case 'list':
        return [
          { value: 'bullet', label: 'Bullet List' },
          { value: 'numbered', label: 'Numbered List' },
          { value: 'none', label: 'Remove List' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        title={action.label}
      >
        <TextIcon icon={action.icon} />
        <span>{action.label}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
          {getDropdownOptions().map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onValueChange(option.value);
                setShowDropdown(false);
              }}
              className={`flex items-center w-full px-3 py-2 text-xs text-left hover:bg-gray-50 ${
                action.currentValue === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              {action.id === 'color' && (
                <div 
                  className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                  style={{ backgroundColor: option.value }}
                />
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Text Icon Component
function TextIcon({ icon }: { icon: string }) {
  const iconMap = {
    'bold': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
      </svg>
    ),
    'italic': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 4l-2 16M18 4l-2 16" />
      </svg>
    ),
    'underline': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 20h12M8 4v8a4 4 0 008 0V4" />
      </svg>
    ),
    'color': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
      </svg>
    ),
    'size': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    'align': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    'list': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    'refresh': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    'check': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
    'font': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    'line-height': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8m-8 6h8m-8-12h8" />
      </svg>
    ),
    'letter-spacing': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3" />
      </svg>
    ),
    'transform': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    'clear': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    'variations': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  };

  return iconMap[icon as keyof typeof iconMap] || <div className="w-3 h-3 bg-gray-400 rounded-sm" />;
}