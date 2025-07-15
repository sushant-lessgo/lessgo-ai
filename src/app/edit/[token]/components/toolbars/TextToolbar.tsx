// app/edit/[token]/components/toolbars/TextToolbar.tsx - Complete Text Toolbar
import React, { useState, useRef, useEffect } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
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
  
  // Debug logging
  React.useEffect(() => {
    console.log('🎨 TextToolbar rendered with:', { elementSelection, position, contextActions });
  }, [elementSelection, position, contextActions]);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);

  const {
    updateElementContent,
    regenerateElement,
    announceLiveRegion,
  } = useEditStore();

  const { executeAction } = useToolbarActions();

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

  // Format text functions
  const toggleFormat = (format: string) => {
    const newActiveFormats = new Set(activeFormats);
    if (newActiveFormats.has(format)) {
      newActiveFormats.delete(format);
    } else {
      newActiveFormats.add(format);
    }
    setActiveFormats(newActiveFormats);
    
    // Apply formatting logic would go here
    executeAction('apply-text-format', { 
      elementSelection, 
      format, 
      active: newActiveFormats.has(format) 
    });
    
    announceLiveRegion(`${format} ${newActiveFormats.has(format) ? 'applied' : 'removed'}`);
  };

  const changeTextColor = (color: string) => {
    setCurrentColor(color);
    executeAction('change-text-color', { elementSelection, color });
    announceLiveRegion(`Text color changed to ${color}`);
  };

  const changeFontSize = (size: string) => {
    setCurrentSize(size);
    executeAction('change-font-size', { elementSelection, size });
    announceLiveRegion(`Font size changed to ${size}`);
  };

  const changeTextAlign = (align: string) => {
    setCurrentAlign(align);
    executeAction('change-text-align', { elementSelection, align });
    announceLiveRegion(`Text aligned ${align}`);
  };

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
      handler: () => {
        setActiveFormats(new Set());
        executeAction('clear-formatting', { elementSelection });
        announceLiveRegion('Formatting cleared');
      },
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
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-700">Text</span>
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