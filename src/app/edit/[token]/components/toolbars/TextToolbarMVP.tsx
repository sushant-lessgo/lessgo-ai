// TextToolbarMVP.tsx - Step 4: MVP Text Toolbar Implementation
// Clean, focused toolbar with only essential features + partial selection support
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useToolbarVisibility } from '@/hooks/useSelectionPriority';
import { useSelectionPreserver } from '@/hooks/useSelectionPreserver';
import { withSelectionGuard } from '@/utils/selectionGuard';
import { 
  formatSelectedText, 
  toggleFormatOnSelection, 
  getSelectionFormatting, 
  removeFormattingFromSelection,
  type PartialFormatResult 
} from '@/utils/textFormatting';
import { 
  setInteractionSource, 
  clearInteractionSource, 
  withInteractionSource,
  logInteractionTimeline 
} from '@/utils/interactionTracking';

interface TextToolbarMVPProps {
  elementSelection: any;
  position: { x: number; y: number };
  contextActions: any[];
}

// MVP Feature Set (as agreed)
interface MVPFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
  fontSize: string;
  color: string;
}

// Font size presets (5-6 options)
const FONT_SIZE_PRESETS = [
  { value: '14px', label: 'Small', shortLabel: 'S' },
  { value: '16px', label: 'Default', shortLabel: 'M' },
  { value: '18px', label: 'Medium', shortLabel: 'L' },
  { value: '24px', label: 'Large', shortLabel: 'XL' },
  { value: '32px', label: 'X-Large', shortLabel: '2XL' },
  { value: '40px', label: 'XX-Large', shortLabel: '3XL' },
];

// Basic color palette + accent colors for highlighting
const COLOR_PALETTE = [
  // Basic colors
  { value: '#000000', label: 'Black', group: 'basic' },
  { value: '#374151', label: 'Gray', group: 'basic' },
  { value: '#ffffff', label: 'White', group: 'basic' },
  
  // Accent colors for highlighting (key use case)
  { value: '#3b82f6', label: 'Blue Accent', group: 'accent' },
  { value: '#10b981', label: 'Green Accent', group: 'accent' },
  { value: '#f59e0b', label: 'Yellow Accent', group: 'accent' },
  { value: '#ef4444', label: 'Red Accent', group: 'accent' },
  { value: '#8b5cf6', label: 'Purple Accent', group: 'accent' },
  { value: '#f97316', label: 'Orange Accent', group: 'accent' },
];

let globalRenderCount = 0;

export function TextToolbarMVP({ elementSelection, position, contextActions }: TextToolbarMVPProps) {
  const currentRender = ++globalRenderCount;
  const renderTime = Date.now();
  
  // Step 3: Global anchor positioning with MVP sizing
  const { 
    isVisible, 
    reason, 
    isTransitionLocked, 
    lockReason,
    anchor,
    position: anchorPosition,
    hasValidPosition 
  } = useToolbarVisibility('text', { width: 280, height: 52 }); // Smaller MVP size

  const [formatState, setFormatState] = useState<MVPFormatState>({
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'left',
    fontSize: '16px',
    color: '#000000',
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const fontSizePickerRef = useRef<HTMLDivElement>(null);

  const { updateElementContent } = useEditStore();
  const setFormattingInProgress = useEditStore.getState().setFormattingInProgress; // Get directly, no subscription
  const { saveSelection, restoreSelection, hasSelection, cleanup: cleanupSelection } = useSelectionPreserver();

  // Track if user has text selected within the element
  const [hasTextSelection, setHasTextSelection] = useState(false);

  // Debug logging removed to prevent log spam
  
  // Track render count removed for type safety

  // Priority-based early return
  if (!isVisible) {
    return null;
  }

  if (!elementSelection || !elementSelection.sectionId || !elementSelection.elementKey) {
    console.warn('TextToolbarMVP: Invalid elementSelection', elementSelection);
    return null;
  }

  // Detect current formatting from selected element - FIXED: Only update if values actually changed
  useEffect(() => {
    if (!elementSelection) return;

    const targetElement = document.querySelector(
      `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
    ) as HTMLElement;

    if (!targetElement) return;

    const computedStyle = window.getComputedStyle(targetElement);
    
    const newFormatState = {
      bold: computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 600,
      italic: computedStyle.fontStyle === 'italic',
      underline: computedStyle.textDecoration.includes('underline'),
      textAlign: computedStyle.textAlign as 'left' | 'center' | 'right',
      fontSize: computedStyle.fontSize,
      color: computedStyle.color,
    };
    
    // Only update if format state actually changed to prevent infinite loops
    const hasChanged = 
      formatState.bold !== newFormatState.bold ||
      formatState.italic !== newFormatState.italic ||
      formatState.underline !== newFormatState.underline ||
      formatState.textAlign !== newFormatState.textAlign ||
      formatState.fontSize !== newFormatState.fontSize ||
      formatState.color !== newFormatState.color;
      
    if (hasChanged) {
      setFormatState(newFormatState);
    }
  }, [elementSelection, formatState]); // Keep formatState dependency for change detection

  // Check for active text selection within the element - DISABLED to prevent infinite loops
  // This was causing cascading selectionchange events with useSelectionPreserver
  useEffect(() => {
    const checkSelection = () => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount || selection.isCollapsed) {
        setHasTextSelection(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const targetElement = document.querySelector(
        `[data-section-id="${elementSelection?.sectionId}"] [data-element-key="${elementSelection?.elementKey}"]`
      ) as HTMLElement;

      if (targetElement && targetElement.contains(range.commonAncestorContainer)) {
        setHasTextSelection(true);
      } else {
        setHasTextSelection(false);
      }
    };

    // Check on mount only - no selectionchange listener to prevent infinite loops
    checkSelection();
    // DISABLED: document.addEventListener('selectionchange', checkSelection);
    
    // return () => {
    //   document.removeEventListener('selectionchange', checkSelection);
    // };
  }, [elementSelection]);

  // Enhanced format application with leading debounce and state management
  const applyFormatInternal = (newFormat: Partial<MVPFormatState>) => {
    if (!elementSelection) {
      return;
    }

    try {
      // Set formatting in progress flag (Fix #2: Split User Intent)
      setFormattingInProgress(true);

      // Check if user has text selected
      const selection = window.getSelection();
      const hasActiveSelection = selection && selection.rangeCount > 0 && !selection.isCollapsed;

      if (hasActiveSelection && hasTextSelection) {
        // PARTIAL SELECTION FORMATTING - Apply to selected text only
        
        // Convert MVPFormatState to TextFormatState for compatibility
        const textFormatState = {
          bold: newFormat.bold,
          italic: newFormat.italic,
          underline: newFormat.underline,
          color: newFormat.color,
          fontSize: newFormat.fontSize,
          textAlign: newFormat.textAlign,
        };

        const result = formatSelectedText(textFormatState);
        
        if (result.success && result.formattedHTML) {
          // Update store with HTML content instead of plain text
          updateElementContent(
            elementSelection.sectionId, 
            elementSelection.elementKey, 
            result.formattedHTML
          );
        }
      } else {
        // WHOLE ELEMENT FORMATTING - Apply to entire element
        
        const targetElement = document.querySelector(
          `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
        ) as HTMLElement;

        if (!targetElement) return;

        const updatedFormat = { ...formatState, ...newFormat };
        
        // Apply styles directly to DOM element
        if (newFormat.bold !== undefined) {
          targetElement.style.fontWeight = newFormat.bold ? '600' : 'normal';
        }
        if (newFormat.italic !== undefined) {
          targetElement.style.fontStyle = newFormat.italic ? 'italic' : 'normal';
        }
        if (newFormat.underline !== undefined) {
          targetElement.style.textDecoration = newFormat.underline ? 'underline' : 'none';
        }
        if (newFormat.textAlign) {
          targetElement.style.textAlign = newFormat.textAlign;
        }
        if (newFormat.fontSize) {
          targetElement.style.fontSize = newFormat.fontSize;
        }
        if (newFormat.color) {
          targetElement.style.color = newFormat.color;
        }

        setFormatState(updatedFormat);
        
        // Update store for persistence - create span with styles if element has styling applied
        const hasFormattedContent = targetElement.querySelector('span[style]');
        const elementHasDirectStyles = !!(targetElement.style.color || targetElement.style.fontSize || targetElement.style.fontWeight || targetElement.style.fontStyle || targetElement.style.textDecoration);
        
        let contentToSave: string;
        if (hasFormattedContent) {
          // Element already has formatted spans
          contentToSave = targetElement.innerHTML;
        } else if (elementHasDirectStyles) {
          // Element has direct styles - wrap content in a span to preserve them
          const textContent = targetElement.textContent || '';
          const styles: string[] = [];
          
          if (targetElement.style.color) styles.push(`color: ${targetElement.style.color}`);
          if (targetElement.style.fontSize) styles.push(`font-size: ${targetElement.style.fontSize}`);
          if (targetElement.style.fontWeight && targetElement.style.fontWeight !== 'normal') styles.push(`font-weight: ${targetElement.style.fontWeight}`);
          if (targetElement.style.fontStyle && targetElement.style.fontStyle !== 'normal') styles.push(`font-style: ${targetElement.style.fontStyle}`);
          if (targetElement.style.textDecoration && targetElement.style.textDecoration !== 'none') styles.push(`text-decoration: ${targetElement.style.textDecoration}`);
          
          if (styles.length > 0) {
            contentToSave = `<span style="${styles.join('; ')}">${textContent}</span>`;
          } else {
            contentToSave = textContent;
          }
        } else {
          // No formatting
          contentToSave = targetElement.textContent || '';
        }
        
        
        updateElementContent(
          elementSelection.sectionId, 
          elementSelection.elementKey, 
          contentToSave
        );
      }
    } catch (error) {
      throw error;
    } finally {
      // Always clear formatting flag after a delay
      setTimeout(() => {
        setFormattingInProgress(false);
      }, 50);
    }
  };

  // Leading debounce wrapper (Fix from suggestions: leading: true, trailing: false)
  const debouncedFormat = useMemo(
    () => debounce(applyFormatInternal, 100, { 
      leading: true, 
      trailing: false 
    }),
    [elementSelection, formatState, hasTextSelection, setFormattingInProgress, updateElementContent]
  );

  // Apply format with interaction tracking (for pointerDown)
  const applyFormatImmediate = (formatOptions: Partial<MVPFormatState>) => {
    logInteractionTimeline('format:start', { formatOptions });
    
    // Set formatting in progress
    setFormattingInProgress(true);
    
    // Apply format immediately
    applyFormatInternal(formatOptions);
    
    // Clear formatting flag after a delay
    setTimeout(() => {
      setFormattingInProgress(false);
      logInteractionTimeline('format:end');
    }, 100);
  };
  
  // Keep debounced version for backward compatibility
  const applyFormat = withSelectionGuard(debouncedFormat, 75);

  // Simple format functions
  const toggleBold = (e?: React.MouseEvent) => {
    if (hasTextSelection) {
      restoreSelection();
    }
    
    applyFormatImmediate({ bold: !formatState.bold });
  };
  
  const toggleItalic = (e?: React.MouseEvent) => {
    if (hasTextSelection) {
      restoreSelection();
    }
    applyFormatImmediate({ italic: !formatState.italic });
  };
  
  const toggleUnderline = (e?: React.MouseEvent) => {
    if (hasTextSelection) {
      restoreSelection();
    }
    applyFormatImmediate({ underline: !formatState.underline });
  };
  
  const setAlignment = (align: 'left' | 'center' | 'right', e?: React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    withInteractionSource('toolbar', () => {
      withSelectionGuard(() => {
        if (hasTextSelection) {
          restoreSelection();
        }
        applyFormatImmediate({ textAlign: align });
      });
    });
  };
  
  const setFontSize = (size: string, e?: React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    withInteractionSource('toolbar', () => {
      if (hasTextSelection) {
        restoreSelection();
      }
      applyFormatImmediate({ fontSize: size });
      setShowFontSizePicker(false);
    });
  };
  
  const setColor = (color: string, e?: React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    withInteractionSource('toolbar', () => {
      if (hasTextSelection) {
        restoreSelection();
      }
      applyFormatImmediate({ color });
      setShowColorPicker(false);
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
      
      if (
        fontSizePickerRef.current &&
        !fontSizePickerRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowFontSizePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup on unmount (Fix #4: Hard Cleanup)
  useEffect(() => {
    return () => {
      // Cancel any pending debounced operations
      debouncedFormat.cancel();
      // Perform hard cleanup of selection state
      cleanupSelection();
      // DISABLED to prevent log spam: console.log('🧹 TextToolbarMVP cleanup completed');
    };
  }, [debouncedFormat, cleanupSelection]);

  // Use anchor positioning or fallback
  const finalPosition = hasValidPosition && anchorPosition ? anchorPosition : position;
  const showArrow = hasValidPosition && anchorPosition?.arrow;

  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg transition-all duration-200"
        style={{
          left: finalPosition.x,
          top: finalPosition.y,
          width: '280px', // Fixed MVP width
          height: '52px', // Fixed MVP height
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
          userSelect: 'none', // Prevent text selection on toolbar
        }}
        data-toolbar-type="text-mvp"
        data-anchor-positioned={hasValidPosition}
        data-editor-id={elementSelection ? `editor-${elementSelection.sectionId}-${elementSelection.elementKey}` : ''}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Arrow */}
        {showArrow && anchorPosition.arrow && (
          <div 
            className={`absolute w-2 h-2 bg-white border border-gray-300 transform rotate-45 ${
              anchorPosition.arrow.direction === 'down' ? 'border-t-0 border-l-0 -bottom-1' :
              anchorPosition.arrow.direction === 'up' ? 'border-b-0 border-r-0 -top-1' :
              anchorPosition.arrow.direction === 'right' ? 'border-l-0 border-b-0 -right-1' :
              'border-r-0 border-t-0 -left-1'
            }`}
            style={{
              left: anchorPosition.arrow.direction === 'up' || anchorPosition.arrow.direction === 'down' ? anchorPosition.arrow.x - 4 : undefined,
              top: anchorPosition.arrow.direction === 'left' || anchorPosition.arrow.direction === 'right' ? anchorPosition.arrow.y - 4 : undefined,
            }}
          />
        )}
        
        <div className="flex items-center justify-between px-3 py-2 h-full">
          {/* Format Controls */}
          <div className="flex items-center space-x-1">
            {/* Bold, Italic, Underline */}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saveSelection();
                toggleBold(e as any);
              }}
              className={`p-1.5 rounded transition-colors select-none ${
                formatState.bold 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={`Bold${hasTextSelection ? ' (selected text)' : ' (whole element)'}`}
            >
              <BoldIcon />
            </button>
            
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saveSelection();
                toggleItalic(e as any);
              }}
              className={`p-1.5 rounded transition-colors select-none ${
                formatState.italic 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={`Italic${hasTextSelection ? ' (selected text)' : ' (whole element)'}`}
            >
              <ItalicIcon />
            </button>
            
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saveSelection();
                toggleUnderline(e as any);
              }}
              className={`p-1.5 rounded transition-colors select-none ${
                formatState.underline 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={`Underline${hasTextSelection ? ' (selected text)' : ' (whole element)'}`}
            >
              <UnderlineIcon />
            </button>
            
            <div className="w-px h-6 bg-gray-300" />
            
            {/* Text Alignment */}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onPointerDown={(e) => setAlignment('left', e)}
              className={`p-1.5 rounded transition-colors select-none ${
                formatState.textAlign === 'left' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Align Left (Note: alignment applies to whole element)"
            >
              <AlignLeftIcon />
            </button>
            
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onPointerDown={(e) => setAlignment('center', e)}
              className={`p-1.5 rounded transition-colors select-none ${
                formatState.textAlign === 'center' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Align Center (Note: alignment applies to whole element)"
            >
              <AlignCenterIcon />
            </button>
            
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onPointerDown={(e) => setAlignment('right', e)}
              className={`p-1.5 rounded transition-colors select-none ${
                formatState.textAlign === 'right' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Align Right (Note: alignment applies to whole element)"
            >
              <AlignRightIcon />
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300" />
          
          {/* Font Size & Color */}
          <div className="flex items-center space-x-1">
            {/* Font Size */}
            <div className="relative">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFontSizePicker(!showFontSizePicker);
                }}
                className="flex items-center space-x-1 px-2 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-100 transition-colors select-none"
                title={`Font Size${hasTextSelection ? ' (selected text)' : ' (whole element)'}`}
              >
                <FontSizeIcon />
                <span className="text-xs font-medium">
                  {FONT_SIZE_PRESETS.find(p => p.value === formatState.fontSize)?.shortLabel || 'M'}
                </span>
                <ChevronDownIcon />
              </button>
              
              {showFontSizePicker && (
                <div 
                  ref={fontSizePickerRef}
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-32"
                >
                  {FONT_SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                      }}
                      onPointerDown={(e) => setFontSize(preset.value, e)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors select-none ${
                        formatState.fontSize === preset.value 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-xs text-gray-500">{preset.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Color Picker */}
            <div className="relative">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                className="flex items-center space-x-1 px-2 py-1.5 text-sm rounded text-gray-600 hover:bg-gray-100 transition-colors select-none"
                title={`Text Color${hasTextSelection ? ' (selected text)' : ' (whole element)'}`}
              >
                <div className="flex items-center space-x-1">
                  <ColorIcon />
                  <div 
                    className="w-3 h-3 rounded-sm border border-gray-300"
                    style={{ backgroundColor: formatState.color }}
                  />
                </div>
                <ChevronDownIcon />
              </button>
              
              {showColorPicker && (
                <div 
                  ref={colorPickerRef}
                  className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-48 p-3"
                >
                  <div className="space-y-3">
                    {/* Selection Mode Indicator */}
                    {hasTextSelection && (
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        💡 Color will be applied to selected text only
                      </div>
                    )}
                    
                    {/* Basic Colors */}
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-2">Basic</div>
                      <div className="flex space-x-1">
                        {COLOR_PALETTE.filter(c => c.group === 'basic').map((color) => (
                          <button
                            key={color.value}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveSelection();
                            }}
                            onPointerDown={(e) => setColor(color.value, e)}
                            className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 select-none ${
                              formatState.color === color.value 
                                ? 'border-blue-500 shadow-sm' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Accent Colors for Highlighting */}
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-2">Accent Colors</div>
                      <div className="grid grid-cols-3 gap-1">
                        {COLOR_PALETTE.filter(c => c.group === 'accent').map((color) => (
                          <button
                            key={color.value}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveSelection();
                            }}
                            onPointerDown={(e) => setColor(color.value, e)}
                            className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 select-none ${
                              formatState.color === color.value 
                                ? 'border-blue-500 shadow-sm' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// MVP Icon Components (simple, clean)
function BoldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 4l4 16M14 4l4 16" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 20h12M8 4v8a4 4 0 008 0V4" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8M4 18h12" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M7 12h10M6 18h12" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M12 12h8M6 18h12" />
    </svg>
  );
}

function FontSizeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h6M4 7v10a1 1 0 001 1h4a1 1 0 001-1V7M15 12h6m0 0l-3-3m3 3l-3 3" />
    </svg>
  );
}

function ColorIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}